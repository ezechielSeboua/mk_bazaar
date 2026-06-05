<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Afficher le suivi de l'activité (Dashboard / Liste)
     */
    public function index(Request $request)
    {
        $query = Order::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('date', 'desc')->get();

        // Remplacement de 'total' par 'total_price' pour les calculs de revenus
        $totalRevenue = Order::where('status', 'completed')->sum('total_price');
        $pendingCount = Order::where('status', 'pending')->count();
        $cancelledRevenue = Order::where('status', 'cancelled')->sum('total_price');

        return response()->json([
            'metrics' => [
                'total_revenue_fcfa' => $totalRevenue,
                'pending_orders_count' => $pendingCount,
                'lost_revenue_cancelled_fcfa' => $cancelledRevenue,
            ],
            'orders' => $orders
        ]);
    }

    /**
     * Enregistrer une nouvelle commande (provenance Front-end)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_number'      => 'required|string|unique:orders,order_number',
            'date'              => 'required|date',
            'delivery_location' => 'required|string',
            'delivery_fee'      => 'required|integer',
            'detailed_address'  => 'nullable|string',
            'total_price'       => 'required|integer',
            'status'            => 'required|string|in:pending,completed,cancelled',
            
            // Validation du tableau de produits imbriqué
            'products'              => 'required|array|min:1',
            'products.*.product_id' => 'required|integer',
            'products.*.name'       => 'required|string',
            'products.*.quantity'   => 'required|integer|min:1',
            'products.*.unit_price' => 'required|integer',
            'products.*.image_path' => 'nullable|string',
        ]);

        // Création directe via les données validées de l'objet
        $order = Order::create($validated);

        return response()->json([
            'message' => 'Order successfully recorded!',
            'order' => $order
        ], 201);
    }

    /**
     * Mettre à jour l'état ou les informations d'une commande
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'order_number'      => 'sometimes|required|string|unique:orders,order_number,' . $order->id,
            'date'              => 'sometimes|required|date',
            'delivery_location' => 'sometimes|required|string',
            'delivery_fee'      => 'sometimes|required|integer',
            'detailed_address'  => 'nullable|string',
            'total_price'       => 'sometimes|required|integer',
            'status'            => 'sometimes|required|string|in:pending,completed,cancelled',
            
            'products'              => 'sometimes|required|array|min:1',
            'products.*.product_id' => 'required|integer',
            'products.*.name'       => 'required|string',
            'products.*.quantity'   => 'required|integer|min:1',
            'products.*.unit_price' => 'required|integer',
            'products.*.image_path' => 'nullable|string',
        ]);

        // Mise à jour de l'instance avec les attributs modifiés reçus
        $order->update($validated);

        return response()->json([
            'message' => 'Order successfully updated!',
            'order' => $order
        ]);
    }
}