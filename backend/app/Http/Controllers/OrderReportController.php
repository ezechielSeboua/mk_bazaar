<?php

namespace App\Http\Controllers;

use App\Models\Order;
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
        // Période par défaut : 30 derniers jours
        $days = $request->get('days', 30);
        $startDate = Carbon::now()->subDays($days);

        // 1. Métriques Globales (Tous les temps)
        $totalRevenue = Order::where('status', 'completed')->sum('total_price');
        $pendingCount = Order::where('status', 'pending')->count();
        $completedCount = Order::where('status', 'completed')->count();
        
        // Panier moyen sur les commandes livrées
        $averageOrderValue = $completedCount > 0 ? round($totalRevenue / $completedCount) : 0;

        // 2. Évolution des ventes (Pour afficher un graphique Line/Bar dans ton Front)
        $salesEvolution = Order::where('status', 'completed')
            ->where('date', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(date, '%Y-%m-%d') as date_formatted"),
                DB::raw('SUM(total_price) as daily_revenue'),
                DB::raw('COUNT(id) as daily_orders_count')
            )
            ->groupBy('date_formatted')
            ->orderBy('date_formatted', 'asc')
            ->get();

        // 3. Top Communes / Zones de livraison (Pour savoir où cibler ton marketing)
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
                'top_zones' => $topLocations
            ]
        ]);
    }
}