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
     * Récupère l'ensemble des statistiques du Dashboard et de l'écran Finances.
     *
     * Encaissé = commandes livrées. En attente = envoyées, validées ou en livraison.
     */
    public function getAdvancedStats(Request $request)
    {
        // Période personnalisable via le Front (30 jours par défaut, max 365)
        $days = min(max((int) $request->input('days', 30), 1), 365);
        $startDate = Carbon::now()->subDays($days);

        // 1. Métriques Globales (Tous les temps)
        $delivered = Order::where('status', Order::STATUS_DELIVERED);
        $totalRevenue   = (int) (clone $delivered)->sum('total_price');
        $completedCount = (int) (clone $delivered)->count();
        $pendingCount   = (int) Order::where('status', Order::STATUS_PENDING)->count();

        $inProgress        = Order::whereIn('status', Order::IN_PROGRESS_STATUSES);
        $inProgressRevenue = (int) (clone $inProgress)->sum('total_price');
        $inProgressItems   = (int) (clone $inProgress)->sum(DB::raw('total_price - delivery_fee'));
        $deliveredItems    = (int) (clone $delivered)->sum(DB::raw('total_price - delivery_fee'));
        $cancelledRevenue  = (int) Order::where('status', Order::STATUS_CANCELLED)->sum('total_price');
        $discountsGranted  = (int) Order::where('status', '!=', Order::STATUS_CANCELLED)->sum('discount_total');

        // Panier moyen sur les commandes livrées
        $averageOrderValue = $completedCount > 0 ? round($totalRevenue / $completedCount) : 0;


        // 2. Évolution des ventes : encaissé (livré) et en attente, par jour
        $salesEvolution = Order::whereIn('status', [Order::STATUS_DELIVERED, ...Order::IN_PROGRESS_STATUSES])
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw("CAST(created_at AS DATE) as date_formatted"),
                DB::raw("SUM(CASE WHEN status = '" . Order::STATUS_DELIVERED . "' THEN total_price ELSE 0 END) as daily_revenue"),
                DB::raw("SUM(CASE WHEN status <> '" . Order::STATUS_DELIVERED . "' THEN total_price ELSE 0 END) as daily_pending_revenue"),
                DB::raw("SUM(CASE WHEN status = '" . Order::STATUS_DELIVERED . "' THEN 1 ELSE 0 END) as daily_orders_count")
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


        // 4. Top 5 des produits les plus vendus (avec ou sans variante)
        $topProducts = OrderItem::select(
                'products.name as product_name',
                DB::raw('SUM(order_items.quantity) as total_qty_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue_generated')
            )
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', Order::STATUS_DELIVERED)
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_qty_sold', 'desc')
            ->take(5)
            ->get();


        // 5. Chiffre d'affaires par promotion (commandes non annulées)
        $byPromotion = OrderItem::select(
                'promotions.id',
                'promotions.name',
                DB::raw('COUNT(DISTINCT orders.id) as orders_count'),
                DB::raw('SUM(order_items.quantity * order_items.price) as revenue_fcfa'),
                DB::raw('SUM(order_items.quantity * order_items.discount) as discounts_fcfa')
            )
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('promotions', 'order_items.promotion_id', '=', 'promotions.id')
            ->where('orders.status', '!=', Order::STATUS_CANCELLED)
            ->groupBy('promotions.id', 'promotions.name')
            ->orderByDesc('revenue_fcfa')
            ->get()
            ->map(fn ($row) => [
                'id'             => (int) $row->id,
                'name'           => $row->name,
                'orders_count'   => (int) $row->orders_count,
                'revenue_fcfa'   => (int) $row->revenue_fcfa,
                'discounts_fcfa' => (int) $row->discounts_fcfa,
            ]);


        // Réponse JSON ultra-structurée pour Recharts / Chart.js côté React
        return response()->json([
            'overview' => [
                'total_revenue_fcfa'          => $totalRevenue,
                'delivered_items_fcfa'        => $deliveredItems,
                'pending_revenue_fcfa'        => $inProgressRevenue,
                'pending_items_fcfa'          => $inProgressItems,
                'lost_revenue_cancelled_fcfa' => $cancelledRevenue,
                'gross_volume_fcfa'           => $totalRevenue + $inProgressRevenue,
                'discounts_granted_fcfa'      => $discountsGranted,
                'pending_orders_count'        => $pendingCount,
                'completed_orders'            => $completedCount,
                'average_basket_fcfa'         => $averageOrderValue,
            ],
            'charts' => [
                'sales_evolution' => $salesEvolution,
            ],
            'insights' => [
                'top_zones'     => $topLocations,
                'top_products'  => $topProducts, // Injecté directement pour ton composant de stats
                'by_promotion'  => $byPromotion,
            ]
        ]);
    }
}
