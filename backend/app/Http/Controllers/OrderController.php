<?php

namespace App\Http\Controllers;

use App\Models\Order;
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
        $validated = $request->validate([
            'delivery_location' => 'required|string',
            'delivery_fee'      => 'required|integer|min:0',
            'detailed_address'  => 'required|string',
            'total_price'       => 'required|integer|min:0',
            
            // Validation des articles du panier
            'items'                      => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|integer|exists:product_variants,id',
            'items.*.quantity'           => 'required|integer|min:1',
        ]);

        // Utilisation d'une transaction pour sécuriser l'écriture en base de données
        try {
            $order = DB::transaction(function () use ($request, $validated) {
                
                // 1. Création de la commande principale
                $order = Order::create([
                    'user_id'           => auth('api')->id(), // Récupère l'ID si connecté, sinon null
                    'order_number'      => 'MK-' . strtoupper(Str::random(4)) . '-' . time(),
                    'delivery_location' => $validated['delivery_location'],
                    'delivery_fee'      => $validated['delivery_fee'],
                    'detailed_address'  => $validated['detailed_address'],
                    'total_price'       => $validated['total_price'],
                    'status'            => 'pending', // Commande en attente par défaut
                ]);

                // 2. Traitement de chaque article du panier
                foreach ($validated['items'] as $itemData) {
                    $variant = ProductVariant::lockForUpdate()->find($itemData['product_variant_id']);

                    // Vérification de sécurité pour le stock
                    if ($variant->stock < $itemData['quantity']) {
                        throw new \Exception("Stock insuffisant pour la variante ID: {$variant->id}");
                    }

                    // Décrémentation du stock de la variante
                    $variant->decrement('stock', $itemData['quantity']);

                    // Création de la ligne de commande (On fige le prix actuel de la variante)
                    $order->items()->create([
                        'product_variant_id' => $variant->id,
                        'quantity'           => $itemData['quantity'],
                        'price'              => $variant->price ?? $variant->product->price, 
                    ]);
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
                        $item->variant()->increment('stock', $item->quantity);
                    }
                }
                // Si une commande annulée est réactivée par l'admin, on retire à nouveau les stocks
                elseif ($validated['status'] !== 'cancelled' && $order->status === 'cancelled') {
                    foreach ($order->items as $item) {
                        if ($item->variant->stock < $item->quantity) {
                            throw new \Exception("Impossible de restaurer la commande. Stock insuffisant.");
                        }
                        $item->variant()->decrement('stock', $item->quantity);
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