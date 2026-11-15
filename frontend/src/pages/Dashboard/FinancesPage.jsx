import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData, extractList, extractPaginationMeta } from '../../contexts/DashboardDataContext';
import dashboardService from '../../services/dashboard';
import { getOrders } from '../../services/order';
import { getPromotions } from '../../services/catalog';
import { Badge, KpiCard, Notice, OrderStatusBadge, PageHeader, Pagination, Panel, SkeletonRows } from '../../components/admin/AdminUI';
import { buttonClass, downloadCsv, fieldClass, formatDate, formatFCFA, td, th } from '../../components/admin/adminFormat';
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from '../../constants/orderStatus';

const PER_PAGE = 25;

const PROMO_STATUS = {
    active: { tone: 'success', label: 'Active' },
    scheduled: { tone: 'info', label: 'Programmée' },
    ended: { tone: 'neutral', label: 'Terminée' },
    inactive: { tone: 'warning', label: 'Désactivée' },
};

export default function FinancesPage() {
    const { advancedStats } = useDashboardData();
    const [stats, setStats] = useState(advancedStats);
    const [promoStatus, setPromoStatus] = useState({});

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ key: null, orders: [], meta: null, error: null });
    const [exporting, setExporting] = useState(false);

    // Statistiques à jour à l'ouverture de la page
    useEffect(() => {
        let cancelled = false;
        dashboardService.getAdvancedStats(30).then((data) => { if (!cancelled && data) setStats(data); }).catch(() => {});
        getPromotions().then((res) => {
            if (cancelled || !res?.success) return;
            setPromoStatus(Object.fromEntries((res.data?.promotions ?? []).map((p) => [p.id, p.status])));
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput.trim() !== search) { setSearch(searchInput.trim()); setPage(1); }
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput, search]);

    const filters = useMemo(() => ({
        status: status || null,
        search: search || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        sort: sort === 'oldest' ? 'oldest' : null,
    }), [status, search, dateFrom, dateTo, sort]);

    const requestKey = JSON.stringify({ filters, page });
    const loading = result.key !== requestKey;

    useEffect(() => {
        let cancelled = false;
        getOrders({ ...filters, page, perPage: PER_PAGE }).then((res) => {
            if (cancelled) return;
            setResult(res?.success
                ? { key: requestKey, orders: extractList(res, 'orders'), meta: extractPaginationMeta(res, 'orders'), error: null }
                : { key: requestKey, orders: [], meta: null, error: res?.error || 'Impossible de charger les transactions.' });
        });
        return () => { cancelled = true; };
    }, [requestKey, filters, page]);

    const overview = stats?.overview ?? {};
    const byPromotion = stats?.insights?.by_promotion ?? [];
    const changeFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };

    const exportCsv = async () => {
        setExporting(true);
        const rows = [];
        for (let p = 1; p <= 40; p += 1) {
            const res = await getOrders({ ...filters, page: p, perPage: 100 });
            if (!res?.success) break;
            extractList(res, 'orders').forEach((o) => rows.push([
                o.order_number,
                formatDate(o.created_at),
                ORDER_STATUS_LABEL[o.status] ?? o.status,
                (o.total_price ?? 0) - (o.delivery_fee ?? 0),
                o.discount_total ?? 0,
                o.delivery_fee ?? 0,
                o.total_price ?? 0,
            ]));
            const meta = extractPaginationMeta(res, 'orders');
            if (!meta || p >= meta.lastPage) break;
        }
        downloadCsv(
            `finances-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Commande', 'Date', 'Statut', 'Montant articles (FCFA)', 'Remises (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)'],
            rows,
        );
        setExporting(false);
    };

    const { orders, meta, error } = result;

    return (
        <DashboardLayout>
            <PageHeader
                title="Finances"
                subtitle="Revenus encaissés, montants en attente, frais de livraison et pertes."
                actions={
                    <button type="button" onClick={exportCsv} disabled={exporting || !meta?.total} className={buttonClass('secondary')}>
                        <Download className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                        {exporting ? 'Export…' : 'Exporter'}
                    </button>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                <KpiCard loading={!stats} label="Revenus encaissés" value={formatFCFA(overview.total_revenue_fcfa)} hint={`dont ${formatFCFA(overview.delivered_items_fcfa)} d'articles`} />
                <KpiCard loading={!stats} label="En attente de livraison" value={formatFCFA(overview.pending_revenue_fcfa)} hint={`dont ${formatFCFA(overview.pending_items_fcfa)} d'articles`} />
                <KpiCard loading={!stats} label="Pertes sur annulations" tone="danger" value={formatFCFA(overview.lost_revenue_cancelled_fcfa)} hint="Valeur marchande perdue" />
                <KpiCard loading={!stats} label="Volume d'affaires global" value={formatFCFA(overview.gross_volume_fcfa)} hint={`Encaissé et en attente · remises : ${formatFCFA(overview.discounts_granted_fcfa)}`} />
            </div>

            <Panel title="Chiffre d'affaires par promotion" className="mb-5">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th scope="col" className={th}>Promotion</th>
                                <th scope="col" className={th}>Statut</th>
                                <th scope="col" className={`${th} text-right`}>Commandes</th>
                                <th scope="col" className={`${th} text-right`}>Chiffre d'affaires</th>
                                <th scope="col" className={`${th} text-right`}>Remises accordées</th>
                            </tr>
                        </thead>
                        <tbody>
                            {byPromotion.map((row) => {
                                const s = PROMO_STATUS[promoStatus[row.id]];
                                return (
                                    <tr key={row.id}>
                                        <td className={`${td} font-medium`}>{row.name}</td>
                                        <td className={td}>{s ? <Badge tone={s.tone} dot>{s.label}</Badge> : <span className="text-[#767676]">—</span>}</td>
                                        <td className={`${td} text-right tabular-nums`}>{row.orders_count}</td>
                                        <td className={`${td} text-right tabular-nums whitespace-nowrap`}>{formatFCFA(row.revenue_fcfa)}</td>
                                        <td className={`${td} text-right tabular-nums whitespace-nowrap text-[#b42318]`}>−{formatFCFA(row.discounts_fcfa)}</td>
                                    </tr>
                                );
                            })}
                            {!stats && <SkeletonRows rows={3} cols={5} />}
                            {stats && byPromotion.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-[#666]">Aucune vente remisée pour le moment.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="px-5 py-3 text-[12.5px] text-[#666]">Commandes non annulées. Chiffre d'affaires des articles remisés, hors livraison.</p>
            </Panel>

            <Panel title="Flux de trésorerie et commandes" action={meta && <span className="text-[13px] text-[#6b6b6b]">{meta.total} transaction{meta.total > 1 ? 's' : ''}</span>}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-[#ececec]">
                    <label className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676] w-full sm:w-[240px] focus-within:border-[#111] focus-within:bg-white">
                        <Search className="w-4 h-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                        <span className="sr-only">Rechercher une commande</span>
                        <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="N° de commande…" className="w-full bg-transparent text-[13.5px] text-[#111] placeholder:text-[#767676] outline-none" />
                    </label>
                    <select aria-label="Statut" value={status} onChange={changeFilter(setStatus)} className={`${fieldClass} pr-8`}>
                        <option value="">Tous les statuts</option>
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                    </select>
                    <div className="flex items-center gap-2 text-[13px] text-[#666]">
                        <label htmlFor="fin-from" className="sr-only">Du</label>
                        <input id="fin-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={changeFilter(setDateFrom)} className={fieldClass} />
                        <span aria-hidden="true">–</span>
                        <label htmlFor="fin-to" className="sr-only">Au</label>
                        <input id="fin-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={changeFilter(setDateTo)} className={fieldClass} />
                    </div>
                    <select aria-label="Tri" value={sort} onChange={changeFilter(setSort)} className={`${fieldClass} pr-8`}>
                        <option value="newest">Plus récentes d'abord</option>
                        <option value="oldest">Plus anciennes d'abord</option>
                    </select>
                </div>

                {error && <div className="px-5 pt-4"><Notice>{error}</Notice></div>}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th scope="col" className={th}>Commande</th>
                                <th scope="col" className={th}>Date</th>
                                <th scope="col" className={th}>Statut</th>
                                <th scope="col" className={`${th} text-right`}>Montant articles</th>
                                <th scope="col" className={`${th} text-right`}>Remises</th>
                                <th scope="col" className={`${th} text-right`}>Livraison</th>
                                <th scope="col" className={`${th} text-right`}>Total</th>
                            </tr>
                        </thead>
                        <tbody className={loading ? 'opacity-60' : ''}>
                            {orders.map((o) => (
                                <tr key={o.id} className="hover:bg-[#fafafa]">
                                    <td className={`${td} font-medium whitespace-nowrap`}>{o.order_number}</td>
                                    <td className={`${td} text-[#6b6b6b] whitespace-nowrap`}>{formatDate(o.created_at)}</td>
                                    <td className={td}><OrderStatusBadge status={o.status} /></td>
                                    <td className={`${td} text-right tabular-nums whitespace-nowrap`}>{formatFCFA((o.total_price ?? 0) - (o.delivery_fee ?? 0))}</td>
                                    <td className={`${td} text-right tabular-nums whitespace-nowrap ${o.discount_total ? 'text-[#166534]' : 'text-[#767676]'}`}>{o.discount_total ? `−${formatFCFA(o.discount_total)}` : '—'}</td>
                                    <td className={`${td} text-right tabular-nums whitespace-nowrap`}>{formatFCFA(o.delivery_fee)}</td>
                                    <td className={`${td} text-right tabular-nums whitespace-nowrap font-medium ${o.status === 'cancelled' ? 'line-through text-[#767676]' : ''}`}>{formatFCFA(o.total_price)}</td>
                                </tr>
                            ))}
                            {!loading && orders.length === 0 && (
                                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#666]">Aucune transaction ne correspond.</td></tr>
                            )}
                            {loading && orders.length === 0 && (
                                <SkeletonRows rows={8} cols={7} />
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && (
                    <Pagination page={meta.currentPage} lastPage={meta.lastPage} total={meta.total} perPage={meta.perPage} onChange={setPage} disabled={loading} noun={meta.total > 1 ? 'transactions' : 'transaction'} />
                )}
            </Panel>
        </DashboardLayout>
    );
}
