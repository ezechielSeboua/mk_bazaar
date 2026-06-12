<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderReportController extends Controller
{
    /**
     * Récupère l'ensemble des statistiques du Dashboard
     */
    public function getAdvancedStats(Request $request)
    {
        // Période personnalisable via le Front (30 jours par défaut)
        $days = $request->get('days', 30);
        $startDate = Carbon::now()->subDays($days);

        // 1. Métriques Globales (Tous les temps)
        $totalRevenue = Order::where('status', 'completed')->sum('total_price');
        $pendingCount = Order::where('status', 'pending')->count();
        $completedCount = Order::where('status', 'completed')->count();
        
        // Panier moyen sur les commandes complétées
        $averageOrderValue = $completedCount > 0 ? round($totalRevenue / $completedCount) : 0;


        // 2. Évolution des ventes (Correction appliquée sur 'created_at')
        $salesEvolution = Order::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as date_formatted"),
                DB::raw('SUM(total_price) as daily_revenue'),
                DB::raw('COUNT(id) as daily_orders_count')
            )
            ->groupBy('date_formatted')
            ->orderBy('date_formatted', 'asc')
            ->get();


        // 3. Top Communes / Zones de livraison
        $topLocations = Order::select(
                'delivery_location',
                DB::raw('COUNT(id) as orders_count'),
                DB::raw('SUM(total_price) as total_generated')
            )
            ->whereNotNull('delivery_location')
            ->groupBy('delivery_location')
            ->orderBy('orders_count', 'desc')
            ->take(5)
            ->get();


        // 4. NOUVEAUTÉ : Le Top 5 des produits les plus vendus (Grâce à order_items)
        $topProducts = OrderItem::select(
                'products.name as product_name',
                DB::raw('SUM(order_items.quantity) as total_qty_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue_generated')
            )
            // On joint les items à la commande pour ne compter que les ventes validées
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            // On joint les items à la variante puis au produit parent pour récupérer le nom réel
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->where('orders.status', 'completed')
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_qty_sold', 'desc')
            ->take(5)
            ->get();


        // Réponse JSON ultra-structurée pour Recharts / Chart.js côté React
        return response()->json([
            'overview' => [
                'total_revenue_fcfa'   => $totalRevenue,
                'pending_orders_count' => $pendingCount,
                'completed_orders'     => $completedCount,
                'average_basket_fcfa'  => $averageOrderValue,
            ],
            'charts' => [
                'sales_evolution' => $salesEvolution,
            ],
            'insights' => [
                'top_zones'    => $topLocations,
                'top_products' => $topProducts // Injecté directement pour ton composant de stats
            ]
        ]);
    }
}