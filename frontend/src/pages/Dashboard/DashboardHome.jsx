import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileWarning, ImageOff, LayoutTemplate, PackageMinus, Plus } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import dashboardService from '../../services/dashboard';
import { getOrders } from '../../services/order';
import { resolveMediaUrl } from '../../config/env';
import { KpiCard, OrderStatusBadge, PageHeader, Panel, SeeAllLink, SegmentedControl, Skeleton, SkeletonRows, SkeletonList } from '../../components/admin/AdminUI';
import { buttonClass, formatCompact, formatDate, formatFCFA, td, th } from '../../components/admin/adminFormat';

const PERIODS = [
    { value: 7, label: '7 jours' },
    { value: 30, label: '30 jours' },
    { value: 365, label: '12 mois' },
];

const CHART_TITLE = {
    7: "Chiffre d'affaires par jour",
    30: "Chiffre d'affaires par semaine",
    365: "Chiffre d'affaires par mois",
};

const LOW_STOCK_THRESHOLD = 3;

/* ------------------------------------------------------------------ Graphique */

const parseDay = (value) => {
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};

const startOfWeek = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lundi
    return d;
};

/**
 * Regroupe l'évolution quotidienne renvoyée par l'API (`sales_evolution`) en
 * jours (7 j), semaines (30 j) ou mois (12 mois), périodes vides comprises.
 */
function buildBuckets(evolution, days) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = [];

    if (days === 7) {
        for (let i = 6; i >= 0; i -= 1) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            buckets.push({ start: d, label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }) });
        }
    } else if (days === 30) {
        const from = new Date(today);
        from.setDate(from.getDate() - 29);
        for (let d = startOfWeek(from); d <= today; d.setDate(d.getDate() + 7)) {
            const start = new Date(d);
            buckets.push({ start, label: start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) });
        }
    } else {
        for (let i = 11; i >= 0; i -= 1) {
            const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
            buckets.push({ start, label: start.toLocaleDateString('fr-FR', { month: 'short' }) });
        }
    }

    const rows = buckets.map((bucket) => ({ ...bucket, delivered: 0, pending: 0 }));

    (evolution ?? []).forEach((row) => {
        const day = parseDay(row.date_formatted);
        let index = -1;
        for (let i = rows.length - 1; i >= 0; i -= 1) {
            if (day >= rows[i].start) { index = i; break; }
        }
        if (index === -1) return;
        rows[index].delivered += Number(row.daily_revenue) || 0;
        rows[index].pending += Number(row.daily_pending_revenue) || 0;
    });

    return rows;
}

function RevenueChart({ rows, loading }) {
    const max = Math.max(1, ...rows.map((r) => r.delivered + r.pending));
    const BAR_AREA = 150;
    const total = rows.reduce((sum, r) => sum + r.delivered, 0);
    const pending = rows.reduce((sum, r) => sum + r.pending, 0);

    if (loading) {
        return (
            <div className="flex items-end gap-2 sm:gap-3.5 h-[200px] px-5 pt-5" aria-hidden="true">
                {[45, 70, 30, 85, 55, 65, 40].map((height, i) => (
                    <Skeleton key={i} className="flex-1 !rounded-t-[3px] !rounded-b-none" style={{ height: `${height}%` }} />
                ))}
            </div>
        );
    }

    return (
        <>
            <div
                className="flex items-end gap-2 sm:gap-3.5 h-[200px] px-5 pt-5 overflow-x-auto"
                role="img"
                aria-label={`Encaissé sur la période : ${formatFCFA(total)}. En attente : ${formatFCFA(pending)}.`}
            >
                {rows.map((row) => {
                    const sum = row.delivered + row.pending;
                    const h = (value) => (value > 0 ? Math.max(2, (value / max) * BAR_AREA) : 0);
                    return (
                        <div key={row.start.toISOString()} className="flex-1 min-w-[32px] h-full flex flex-col items-center justify-end gap-2" aria-hidden="true">
                            <span className="text-[11px] text-[#555] tabular-nums">{sum > 0 ? formatCompact(sum) : '—'}</span>
                            <span className="flex flex-col justify-end w-full max-w-[44px]" style={{ height: Math.max(2, h(sum)) }}>
                                {row.pending > 0 && <i className="block w-full rounded-t-sm bg-[#e4e4e4]" style={{ height: h(row.pending) }} />}
                                {row.delivered > 0 && <i className={`block w-full bg-[#111] ${row.pending > 0 ? '' : 'rounded-t-sm'}`} style={{ height: h(row.delivered) }} />}
                            </span>
                            <span className="text-[11.5px] text-[#767676] whitespace-nowrap">{row.label}</span>
                        </div>
                    );
                })}
            </div>
            <div className="h-[18px]" />
        </>
    );
}

/* --------------------------------------------------------------------- Page */

function TodoRow({ to, icon: Icon, title, detail }) {
    return (
        <Link to={to} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors">
            <Icon className="w-[18px] h-[18px] text-[#555] shrink-0" strokeWidth={1.6} aria-hidden="true" />
            <span className="min-w-0 flex-1">
                <b className="block text-sm font-medium text-[#111]">{title}</b>
                {detail && <span className="block text-[12.5px] text-[#6b6b6b] mt-0.5 truncate">{detail}</span>}
            </span>
            <ChevronRight className="w-4 h-4 text-[#999] shrink-0" strokeWidth={1.6} aria-hidden="true" />
        </Link>
    );
}

export default function DashboardHome() {
    const { products, categories, orders, ordersMeta, metrics, heroConfig, advancedStats, isLoading } = useDashboardData();

    const [days, setDays] = useState(30);
    const [periodStats, setPeriodStats] = useState({});
    const [oldestPending, setOldestPending] = useState(null);

    // Les stats sur 30 jours viennent du contexte ; les autres périodes sont chargées à la demande.
    const stats = days === 30 ? advancedStats : periodStats[days];

    useEffect(() => {
        if (days === 30 || periodStats[days]) return;
        let cancelled = false;
        dashboardService.getAdvancedStats(days)
            .then((data) => { if (!cancelled) setPeriodStats((prev) => ({ ...prev, [days]: data })); })
            .catch(() => { if (!cancelled) setPeriodStats((prev) => ({ ...prev, [days]: { charts: { sales_evolution: [] } } })); });
        return () => { cancelled = true; };
    }, [days, periodStats]);

    // Date de la plus ancienne commande en attente (pour « À traiter »)
    const pendingCount = metrics?.pending_orders_count ?? 0;
    useEffect(() => {
        if (!pendingCount) return;
        let cancelled = false;
        getOrders({ status: 'pending', sort: 'oldest', perPage: 1 }).then((res) => {
            const first = res?.data?.orders?.data?.[0];
            if (!cancelled && first) setOldestPending(first.created_at);
        });
        return () => { cancelled = true; };
    }, [pendingCount]);

    const overview = advancedStats?.overview;
    const statsLoading = !advancedStats;
    const chartRows = useMemo(() => buildBuckets(stats?.charts?.sales_evolution, days), [stats, days]);

    const recentOrders = useMemo(
        () => [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
        [orders],
    );
    const recentProducts = useMemo(
        () => [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4),
        [products],
    );

    const todos = useMemo(() => {
        const list = [];

        if (pendingCount > 0) {
            list.push({
                key: 'pending',
                to: '/dashboard/commands?status=pending',
                icon: ClipboardList,
                title: `${pendingCount} commande${pendingCount > 1 ? 's' : ''} en attente`,
                detail: oldestPending ? `La plus ancienne date du ${formatDate(oldestPending, { day: 'numeric', month: 'long' })}` : null,
            });
        }

        let lowStock = 0;
        products.forEach((product) => {
            const units = product.variants?.length ? product.variants : [product];
            units.forEach((unit) => {
                if ((unit.stock ?? 0) > 0 && unit.stock <= LOW_STOCK_THRESHOLD) lowStock += 1;
            });
        });
        if (lowStock > 0) {
            list.push({
                key: 'stock',
                to: '/dashboard/products',
                icon: PackageMinus,
                title: `${lowStock} article${lowStock > 1 ? 's' : ''} en stock faible`,
                detail: `${LOW_STOCK_THRESHOLD} unités ou moins`,
            });
        }

        const orphanOrders = orders.filter((order) =>
            (order.items ?? []).some((item) => !item.product && !item.variant?.product),
        ).length;
        if (orphanOrders > 0) {
            list.push({
                key: 'orphans',
                to: '/dashboard/commands',
                icon: FileWarning,
                title: 'Articles sans fiche',
                detail: `Produit supprimé dans ${orphanOrders} commande${orphanOrders > 1 ? 's' : ''} récente${orphanOrders > 1 ? 's' : ''}`,
            });
        }

        const withoutImage = categories.filter((category) => !category.image_path);
        if (withoutImage.length > 0) {
            list.push({
                key: 'categories',
                to: '/dashboard/categories',
                icon: ImageOff,
                title: `${withoutImage.length} catégorie${withoutImage.length > 1 ? 's' : ''} sans visuel`,
                detail: withoutImage.map((c) => c.name).join(', '),
            });
        }

        if (!heroConfig?.title) {
            list.push({
                key: 'hero',
                to: '/dashboard/configurations',
                icon: LayoutTemplate,
                title: "Bannière d'accueil non renseignée",
                detail: 'Contenu du site',
            });
        }

        return list;
    }, [pendingCount, oldestPending, products, orders, categories, heroConfig]);

    const totalOrders = metrics?.counts?.all ?? ordersMeta?.total ?? orders.length;

    return (
        <DashboardLayout>
            <PageHeader
                title="Tableau de bord"
                subtitle="Vue d'ensemble de la boutique MK Bazaar."
                actions={
                    <>
                        <SegmentedControl label="Période du graphique" options={PERIODS} value={days} onChange={setDays} />
                        <Link to="/dashboard/products" className={buttonClass('primary')}>
                            <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                            Ajouter un produit
                        </Link>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                <KpiCard
                    label="Chiffre d'affaires encaissé"
                    value={formatFCFA(overview?.total_revenue_fcfa ?? metrics?.total_revenue_fcfa)}
                    hint="Commandes livrées"
                    loading={statsLoading && !metrics}
                />
                <KpiCard
                    label="Commandes"
                    value={totalOrders}
                    loading={isLoading}
                    hint={
                        pendingCount > 0 ? (
                            <Link to="/dashboard/commands?status=pending" className="underline hover:text-[#111]">
                                {pendingCount} en attente de traitement
                            </Link>
                        ) : 'Aucune en attente'
                    }
                />
                <KpiCard
                    label="Panier moyen"
                    value={formatFCFA(overview?.average_basket_fcfa)}
                    hint="Commandes livrées"
                    loading={statsLoading}
                />
                <KpiCard
                    label="Pertes sur annulations"
                    value={formatFCFA(overview?.lost_revenue_cancelled_fcfa ?? metrics?.lost_revenue_cancelled_fcfa)}
                    hint="Valeur marchande annulée"
                    tone="danger"
                    loading={statsLoading && !metrics}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
                <Panel
                    title={CHART_TITLE[days]}
                    action={
                        <div className="flex gap-4 text-[12.5px] text-[#555]">
                            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#111]" aria-hidden="true" />Encaissé</span>
                            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#e4e4e4]" aria-hidden="true" />En attente</span>
                        </div>
                    }
                >
                    <RevenueChart rows={chartRows} loading={!stats} />
                </Panel>

                <Panel title="À traiter">
                    {todos.length > 0 ? (
                        todos.map(({ key, ...todo }) => <TodoRow key={key} {...todo} />)
                    ) : (
                        <p className="px-5 py-8 text-sm text-[#666] text-center">Rien à traiter pour le moment.</p>
                    )}
                </Panel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 mt-5">
                <Panel title="Dernières commandes" action={<SeeAllLink to="/dashboard/commands" />}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>Commande</th>
                                    <th scope="col" className={th}>Client</th>
                                    <th scope="col" className={th}>Statut</th>
                                    <th scope="col" className={`${th} text-right`}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-[#fafafa]">
                                        <td className={`${td} font-medium whitespace-nowrap`}>
                                            <Link to={`/dashboard/commands?search=${encodeURIComponent(order.order_number)}`} className="hover:underline">
                                                {order.order_number}
                                            </Link>
                                            <small className="block text-[12.5px] font-normal text-[#767676] mt-0.5">{formatDate(order.created_at)}</small>
                                        </td>
                                        <td className={td}>{order.customer_name || order.user?.name || '—'}</td>
                                        <td className={td}><OrderStatusBadge status={order.status} /></td>
                                        <td className={`${td} text-right tabular-nums whitespace-nowrap`}>{formatFCFA(order.total_price)}</td>
                                    </tr>
                                ))}
                                {isLoading && recentOrders.length === 0 && <SkeletonRows rows={5} cols={4} />}
                                {!isLoading && recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#666]">Aucune commande pour le moment.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel title="Produits récents" action={<SeeAllLink to="/dashboard/products" />}>
                    {recentProducts.map((product) => {
                        const image = product.image_path?.[0];
                        return (
                            <div key={product.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f0f0] last:border-b-0">
                                {image ? (
                                    <img src={resolveMediaUrl(image)} alt="" className="w-10 h-10 rounded-[3px] object-cover bg-[#f1f1f1] shrink-0" loading="lazy" />
                                ) : (
                                    <span className="w-10 h-10 rounded-[3px] bg-[#f1f1f1] shrink-0" aria-hidden="true" />
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-[#111] truncate">{product.name}</span>
                                    <span className="block text-[12.5px] text-[#6b6b6b] truncate">{product.category?.name || '—'}</span>
                                </span>
                                <span className="text-sm tabular-nums whitespace-nowrap">
                                    {formatFCFA(product.pricing?.base_price ?? product.price)}
                                </span>
                            </div>
                        );
                    })}
                    {isLoading && recentProducts.length === 0 && <SkeletonList rows={5} />}
                    {!isLoading && recentProducts.length === 0 && (
                        <p className="px-5 py-8 text-sm text-[#666] text-center">Aucun produit.</p>
                    )}
                </Panel>
            </div>
        </DashboardLayout>
    );
}
