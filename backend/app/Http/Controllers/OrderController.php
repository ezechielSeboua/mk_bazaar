<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Services\PricingService;

class OrderController extends Controller
{
    /** Résolu à chaque appel : les instances de contrôleur peuvent être réutilisées entre requêtes. */
    private function pricing(): PricingService
    {
        return app(PricingService::class);
    }

    /**
     * Afficher la liste des commandes avec métriques (Dashboard Admin)
     */
    public function index(Request $request): JsonResponse
    {
        // On charge les lignes de commande (items) et les détails des variantes associées
        $query = Order::with(['items.variant.product', 'items.product', 'items.promotion:id,name', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Recherche : n° de commande, nom ou téléphone du client
        if ($request->filled('search')) {
            $search = '%' . substr($request->search, 0, 100) . '%';
            $query->where(fn ($q) => $q->where('order_number', 'like', $search)
                                       ->orWhere('customer_name', 'like', $search)
                                       ->orWhere('customer_phone', 'like', $search));
        }

        if ($request->filled('delivery_location')) {
            $query->where('delivery_location', $request->delivery_location);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $request->input('sort') === 'oldest' ? $query->oldest() : $query->latest();

        // Paginated to prevent full-table memory dump
        $perPage = min(max((int) $request->input('per_page', 25), 1), 100);
        $orders  = $query->paginate($perPage);

        // Compteurs par statut (onglets « Toutes (17) · En attente (6) … »)
        $counts = Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        // Calculs des revenus basés sur les statuts réels
        $totalRevenue     = Order::where('status', Order::STATUS_DELIVERED)->sum('total_price');
        $cancelledRevenue = Order::where('status', Order::STATUS_CANCELLED)->sum('total_price');

        return response()->json([
            'metrics' => [
                'total_revenue_fcfa'          => (int) $totalRevenue,
                'pending_orders_count'        => (int) ($counts[Order::STATUS_PENDING] ?? 0),
                'lost_revenue_cancelled_fcfa' => (int) $cancelledRevenue,
                'counts'                      => collect(Order::STATUSES)
                    ->mapWithKeys(fn ($status) => [$status => (int) ($counts[$status] ?? 0)])
                    ->put('all', (int) $counts->sum()),
            ],
            'orders' => $orders
        ]);
    }

    /**
     * Commandes de l'utilisateur connecté (Espace client)
     */
    public function myOrders(): JsonResponse
    {
        $orders = Order::with(['items.variant.product', 'items.product', 'items.promotion:id,name'])
            ->where('user_id', auth('api')->id())
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * Enregistrer une nouvelle commande multi-produits et décrémenter les stocks
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('api')->user();

        $rules = [
            'delivery_location'          => 'required|string',
            'detailed_address'           => 'required|string',
            'items'                      => 'required|array|min:1',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.product_id'         => 'nullable|integer|exists:products,id',
            'items.*.quantity'           => 'required|integer|min:1|max:100',
        ];

        if (!$authUser) {
            $rules['customer_name']  = 'required|string|max:255';
            $rules['customer_phone'] = 'required|string|max:20';
        } elseif (empty($authUser->phone)) {
            // Utilisateur connecté sans téléphone enregistré
            $rules['customer_phone'] = 'required|string|max:20';
        }

        $validated = $request->validate($rules);

        // Chaque item doit avoir au moins product_variant_id ou product_id
        foreach ($validated['items'] as $index => $item) {
            if (empty($item['product_variant_id']) && empty($item['product_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => "L'article à l'index {$index} doit avoir un product_variant_id ou un product_id.",
                ], 422);
            }
        }

        // Calculer delivery_fee côté serveur depuis la table settings
        $zonesSetting = Setting::where('key', 'shipping_zones')->first();
        $zones        = $zonesSetting ? ($zonesSetting->value ?? []) : [];
        $matchedZone  = collect($zones)->firstWhere('name', $validated['delivery_location']);

        if (!$matchedZone) {
            return response()->json([
                'success' => false,
                'message' => 'Zone de livraison invalide.',
            ], 422);
        }

        $deliveryFee = (int) ($matchedZone['price'] ?? 0);

        $customerName  = $authUser ? $authUser->name  : $validated['customer_name'];
        $customerPhone = $authUser
            ? ($authUser->phone ?: ($validated['customer_phone'] ?? null))
            : $validated['customer_phone'];

        try {
            $order = DB::transaction(function () use ($validated, $authUser, $customerName, $customerPhone, $deliveryFee) {

                $order = Order::create([
                    'user_id'           => $authUser?->id,
                    'customer_name'     => $customerName,
                    'customer_phone'    => $customerPhone,
                    'order_number'      => 'MK-' . strtoupper(Str::random(4)) . '-' . time(),
                    'delivery_location' => $validated['delivery_location'],
                    'delivery_fee'      => $deliveryFee,
                    'detailed_address'  => $validated['detailed_address'],
                    'total_price'       => 0,
                    'status'            => Order::STATUS_PENDING,
                ]);

                $itemsTotal    = 0;
                $discountTotal = 0;

                foreach ($validated['items'] as $itemData) {
                    $qty = $itemData['quantity'];

                    if (!empty($itemData['product_variant_id'])) {
                        // Produit avec variante
                        $variant = ProductVariant::lockForUpdate()->findOrFail($itemData['product_variant_id']);
                        $product = Product::with('category')->findOrFail($variant->product_id);

                        if (!$variant->is_active || !$product->is_active) {
                            throw new \Exception("Variante indisponible : ID {$variant->id}");
                        }
                        if ($variant->stock < $qty) {
                            throw new \Exception("Stock insuffisant pour la variante ID: {$variant->id}");
                        }

                        $variant->decrement('stock', $qty);
                    } else {
                        // Produit unique sans variante
                        $product = Product::with('category')->lockForUpdate()->findOrFail($itemData['product_id']);
                        $variant = null;

                        if (!$product->is_active) {
                            throw new \Exception("Produit indisponible : ID {$product->id}");
                        }
                        if ($product->stock < $qty) {
                            throw new \Exception("Stock insuffisant pour le produit ID: {$product->id}");
                        }

                        $product->decrement('stock', $qty);
                    }

                    // Prix et remise calculés côté serveur, puis figés sur la ligne
                    $price = $this->pricing()->priceFor($product, $variant);

                    $order->items()->create([
                        'product_id'         => $product->id,
                        'product_variant_id' => $variant?->id,
                        'promotion_id'       => $price['promotion_id'],
                        'quantity'           => $qty,
                        'price'              => $price['final_price'],
                        'discount'           => $price['discount'],
                    ]);

                    $itemsTotal    += $price['final_price'] * $qty;
                    $discountTotal += $price['discount'] * $qty;
                }

                // Total calculé côté serveur : prix des articles + frais de livraison
                $order->update([
                    'total_price'    => $itemsTotal + $deliveryFee,
                    'discount_total' => $discountTotal,
                ]);

                return $order;
            });

            return response()->json([
                'success' => true,
                'message' => 'Commande enregistrée avec succès !',
                'order'   => $order->load(['items.variant.product', 'items.product', 'items.promotion:id,name'])
            ], 201);

        } catch (\Exception $e) {
            Log::error('Order creation failed', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création de la commande.'
            ], 400);
        }
    }

    /**
     * Valid status transitions — prevents circular stock manipulation and skipped states.
     */
    private const VALID_TRANSITIONS = [
        Order::STATUS_PENDING   => [Order::STATUS_CONFIRMED, Order::STATUS_CANCELLED],
        Order::STATUS_CONFIRMED => [Order::STATUS_SHIPPING, Order::STATUS_CANCELLED],
        Order::STATUS_SHIPPING  => [Order::STATUS_DELIVERED, Order::STATUS_CANCELLED],
        Order::STATUS_DELIVERED => [],
        Order::STATUS_CANCELLED => [Order::STATUS_CONFIRMED],
    ];

    /**
     * Mettre à jour le statut d'une commande (Admin)
     * Gère la réintégration des stocks si la commande est annulée
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(Order::STATUSES)],
        ]);

        $newStatus     = $validated['status'];
        $currentStatus = $order->status;

        if ($newStatus === $currentStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Statut inchangé.',
                'order'   => $order->load('items.variant.product'),
            ]);
        }

        $allowed = self::VALID_TRANSITIONS[$currentStatus] ?? [];
        if (!in_array($newStatus, $allowed, true)) {
            return response()->json([
                'success' => false,
                'message' => "Transition invalide : {$currentStatus} → {$newStatus}.",
            ], 422);
        }

        try {
            DB::transaction(function () use ($order, $validated) {
                // Si la commande passe à "annulée" alors qu'elle ne l'était pas, on rend les stocks
                if ($validated['status'] === Order::STATUS_CANCELLED && $order->status !== Order::STATUS_CANCELLED) {
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $item->variant()->increment('stock', $item->quantity);
                        } else {
                            $item->product()->increment('stock', $item->quantity);
                        }
                    }
                }
                // Si une commande annulée est réactivée par l'admin, on retire à nouveau les stocks
                elseif ($validated['status'] !== Order::STATUS_CANCELLED && $order->status === Order::STATUS_CANCELLED) {
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $variant = ProductVariant::lockForUpdate()->findOrFail($item->product_variant_id);
                            if ($variant->stock < $item->quantity) {
                                throw new \Exception("Impossible de restaurer la commande. Stock insuffisant pour la variante ID: {$variant->id}.");
                            }
                            $variant->decrement('stock', $item->quantity);
                        } else {
                            $product = Product::lockForUpdate()->findOrFail($item->product_id);
                            if ($product->stock < $item->quantity) {
                                throw new \Exception("Impossible de restaurer la commande. Stock insuffisant pour le produit ID: {$product->id}.");
                            }
                            $product->decrement('stock', $item->quantity);
                        }
                    }
                }

                $order->update(['status' => $validated['status']]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Statut de la commande mis à jour.',
                'order'   => $order->load('items.variant.product')
            ]);

        } catch (\Exception $e) {
            Log::error('Order update failed', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la mise à jour de la commande.'
            ], 400);
        }
    }
}