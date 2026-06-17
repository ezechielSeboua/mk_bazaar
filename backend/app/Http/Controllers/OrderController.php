<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Afficher la liste des commandes avec métriques (Dashboard Admin)
     */
    public function index(Request $request): JsonResponse
    {
        // On charge les lignes de commande (items) et les détails des variantes associées
        $query = Order::with(['items.variant.product', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Tri par date de création (Remplacement de la colonne 'date' supprimée)
        $orders = $query->latest()->get();

        // Calculs des revenus basés sur les statuts réels
        $totalRevenue = Order::where('status', 'completed')->sum('total_price');
        $pendingCount = Order::where('status', 'pending')->count();
        $cancelledRevenue = Order::where('status', 'cancelled')->sum('total_price');

        return response()->json([
            'metrics' => [
                'total_revenue_fcfa' => (int) $totalRevenue,
                'pending_orders_count' => $pendingCount,
                'lost_revenue_cancelled_fcfa' => (int) $cancelledRevenue,
            ],
            'orders' => $orders
        ]);
    }

    /**
     * Enregistrer une nouvelle commande multi-produits et décrémenter les stocks
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('api')->user();

        $rules = [
            'delivery_location'          => 'required|string',
            'delivery_fee'               => 'required|integer|min:0',
            'detailed_address'           => 'required|string',
            'total_price'                => 'required|integer|min:0',
            'items'                      => 'required|array|min:1',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.product_id'         => 'nullable|integer|exists:products,id',
            'items.*.quantity'           => 'required|integer|min:1',
        ];

        if (!$authUser) {
            $rules['customer_name']  = 'required|string|max:255';
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

        $customerName  = $authUser ? $authUser->name  : $validated['customer_name'];
        $customerPhone = $authUser ? $authUser->phone : $validated['customer_phone'];

        try {
            $order = DB::transaction(function () use ($validated, $authUser, $customerName, $customerPhone) {

                $order = Order::create([
                    'user_id'           => $authUser?->id,
                    'customer_name'     => $customerName,
                    'customer_phone'    => $customerPhone,
                    'order_number'      => 'MK-' . strtoupper(Str::random(4)) . '-' . time(),
                    'delivery_location' => $validated['delivery_location'],
                    'delivery_fee'      => $validated['delivery_fee'],
                    'detailed_address'  => $validated['detailed_address'],
                    'total_price'       => $validated['total_price'],
                    'status'            => 'pending',
                ]);

                foreach ($validated['items'] as $itemData) {
                    $qty = $itemData['quantity'];

                    if (!empty($itemData['product_variant_id'])) {
                        // Produit avec variante
                        $variant = ProductVariant::lockForUpdate()->findOrFail($itemData['product_variant_id']);

                        if ($variant->stock < $qty) {
                            throw new \Exception("Stock insuffisant pour la variante ID: {$variant->id}");
                        }

                        $variant->decrement('stock', $qty);

                        $order->items()->create([
                            'product_id'         => $variant->product_id,
                            'product_variant_id' => $variant->id,
                            'quantity'           => $qty,
                            'price'              => $variant->price ?? $variant->product->price,
                        ]);
                    } else {
                        // Produit unique sans variante
                        $product = Product::lockForUpdate()->findOrFail($itemData['product_id']);

                        if ($product->stock < $qty) {
                            throw new \Exception("Stock insuffisant pour le produit ID: {$product->id}");
                        }

                        $product->decrement('stock', $qty);

                        $order->items()->create([
                            'product_id'         => $product->id,
                            'product_variant_id' => null,
                            'quantity'           => $qty,
                            'price'              => $product->price,
                        ]);
                    }
                }

                return $order;
            });

            return response()->json([
                'success' => true,
                'message' => 'Commande enregistrée avec succès !',
                'order'   => $order->load('items.variant.product')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la commande : ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Mettre à jour le statut d'une commande (Admin)
     * Gère la réintégration des stocks si la commande est annulée
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,processing,completed,cancelled',
        ]);

        try {
            DB::transaction(function () use ($order, $validated) {
                // Si la commande passe à "annulée" alors qu'elle ne l'était pas, on rend les stocks
                if ($validated['status'] === 'cancelled' && $order->status !== 'cancelled') {
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $item->variant()->increment('stock', $item->quantity);
                        } else {
                            $item->product()->increment('stock', $item->quantity);
                        }
                    }
                }
                // Si une commande annulée est réactivée par l'admin, on retire à nouveau les stocks
                elseif ($validated['status'] !== 'cancelled' && $order->status === 'cancelled') {
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
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}