import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, MessageCircle, Phone, Search } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData, extractList, extractPaginationMeta } from '../../contexts/DashboardDataContext';
import { getOrders, updateOrder } from '../../services/order';
import { resolveMediaUrl } from '../../config/env';
import { Drawer, Notice, OrderStatusBadge, PageHeader, Pagination, Panel, Tabs, SkeletonRows } from '../../components/admin/AdminUI';
import {
    buttonClass,
    downloadCsv,
    fieldClass,
    formatDate,
    formatFCFA,
    phoneDigits,
    td,
    th,
    variantLabel,
} from '../../components/admin/adminFormat';
import {
    ORDER_NEXT_STATUSES,
    ORDER_STATUS_LABEL,
    ORDER_STATUS_TAB_LABEL,
    ORDER_STATUSES,
} from '../../constants/orderStatus';

const PER_PAGE = 25;

/** Libellé de l'action qui fait passer la commande au statut donné. */
const ACTION_LABEL = {
    confirmed: 'Valider la commande',
    shipping: 'Marquer en livraison',
    delivered: 'Marquer livrée',
    cancelled: 'Annuler la commande',
};

/** wa.me attend l'indicatif : les numéros ivoiriens à 10 chiffres reçoivent 225. */
const whatsappLink = (phone) => {
    const digits = phoneDigits(phone);
    if (!digits) return null;
    return `https://wa.me/${digits.length === 10 ? `225${digits}` : digits}`;
};

const itemCount = (order) => (order.items ?? []).reduce((sum, item) => sum + (item.quantity || 0), 0);

/** Produit d'une ligne : via la variante, sinon directement. */
const itemProduct = (item) => item.variant?.product ?? item.product ?? null;

function OrderDetail({ order, onStatusChange, updating, error }) {
    const items = order.items ?? [];
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const phone = phoneDigits(order.customer_phone);
    const whatsapp = whatsappLink(order.customer_phone);

    return (
        <div className="space-y-6 text-sm">
            <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <span className="text-[#666]">Passée le {formatDate(order.created_at, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#767676] mb-2">Client</h3>
                    <p className="font-medium text-[#111]">{order.customer_name || order.user?.name || '—'}</p>
                    {order.user ? <p className="text-[#666]">Compte client</p> : <p className="text-[#666]">Commande sans compte</p>}
                    {phone && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                            <a href={`tel:+${phone.length === 10 ? `225${phone}` : phone}`} className={buttonClass('secondary', 'sm')}>
                                <Phone className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                                {order.customer_phone}
                            </a>
                            {whatsapp && (
                                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm')}>
                                    <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                                    WhatsApp
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#767676] mb-2">Livraison</h3>
                    <p className="font-medium text-[#111]">{order.delivery_location || '—'}</p>
                    <p className="text-[#666] whitespace-pre-line">{order.detailed_address || 'Aucune précision'}</p>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#767676] mb-2">
                    Articles ({itemCount(order)})
                </h3>
                <ul className="border border-[#ececec] rounded divide-y divide-[#f0f0f0]">
                    {items.map((item, index) => {
                        const product = itemProduct(item);
                        const image = item.variant?.image_path || product?.image_path?.[0];
                        const options = variantLabel(item.variant?.attributes);
                        return (
                            <li key={item.id ?? index} className="flex gap-3 p-3">
                                {image ? (
                                    <img src={resolveMediaUrl(image)} alt="" className="w-12 h-14 object-cover rounded-sm bg-[#f1f1f1] shrink-0" />
                                ) : (
                                    <span className="w-12 h-14 rounded-sm bg-[#f1f1f1] shrink-0" aria-hidden="true" />
                                )}
                                <div className="min-w-0 flex-1">
                                    {product ? (
                                        <p className="font-medium text-[#111]">{product.name}</p>
                                    ) : (
                                        <p className="font-medium text-[#8a4b00]">Article indisponible <span className="font-normal text-[#666]">· plus au catalogue</span></p>
                                    )}
                                    {options && <p className="text-[12.5px] text-[#666]">{options}</p>}
                                    {item.discount > 0 && (
                                        <p className="text-[12.5px] text-[#166534]">
                                            Remise −{formatFCFA(item.discount)} / unité{item.promotion?.name ? ` · ${item.promotion.name}` : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0 tabular-nums">
                                    <p className="font-medium text-[#111]">{formatFCFA(item.price * item.quantity)}</p>
                                    <p className="text-[12.5px] text-[#666]">{item.quantity} × {formatFCFA(item.price)}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <dl className="mt-4 space-y-1.5 tabular-nums">
                    <div className="flex justify-between text-[#444]"><dt>Articles</dt><dd>{formatFCFA(itemsTotal)}</dd></div>
                    {order.discount_total > 0 && (
                        <div className="flex justify-between text-[#166534]"><dt>Dont remises accordées</dt><dd>−{formatFCFA(order.discount_total)}</dd></div>
                    )}
                    <div className="flex justify-between text-[#444]"><dt>Livraison</dt><dd>{formatFCFA(order.delivery_fee)}</dd></div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-[#ececec] text-base font-semibold text-[#111]">
                        <dt>Total</dt><dd>{formatFCFA(order.total_price)}</dd>
                    </div>
                </dl>
            </div>

            <Notice>{error}</Notice>

            {(ORDER_NEXT_STATUSES[order.status] ?? []).length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#767676] mb-2">Faire avancer la commande</h3>
                    <div className="flex flex-wrap gap-2">
                        {ORDER_NEXT_STATUSES[order.status].map((next) => (
                            <button
                                key={next}
                                type="button"
                                disabled={updating}
                                onClick={() => onStatusChange(next)}
                                className={next === 'cancelled'
                                    ? `${buttonClass('secondary')} text-[#b42318] border-[#f5c2c0] hover:bg-[#fdeaea]`
                                    : buttonClass('primary')}
                            >
                                {order.status === 'cancelled' ? 'Réactiver la commande' : ACTION_LABEL[next]}
                            </button>
                        ))}
                    </div>
                    {order.status !== 'cancelled' && (
                        <p className="mt-2 text-[12.5px] text-[#666]">Annuler remet les articles en stock.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function OrdersPage() {
    const { setOrders, setMetrics, shippingZones } = useDashboardData();
    const [searchParams, setSearchParams] = useSearchParams();

    const [status, setStatus] = useState(searchParams.get('status') ?? 'all');
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [location, setLocation] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);

    const [reloadToken, setReloadToken] = useState(0);
    const [result, setResult] = useState({ key: null, orders: [], meta: null, counts: null, error: null });
    const [exporting, setExporting] = useState(false);

    const [selected, setSelected] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    // La recherche de la barre du haut met à jour l'URL : on la suit.
    const urlSearch = searchParams.get('search') ?? '';
    const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
    if (prevUrlSearch !== urlSearch) {
        setPrevUrlSearch(urlSearch);
        setSearchInput(urlSearch);
        setSearch(urlSearch);
        setPage(1);
    }

    // Recherche différée pendant la frappe
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput.trim() !== search) {
                setSearch(searchInput.trim());
                setPage(1);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput, search]);

    const filters = useMemo(() => ({
        status: status === 'all' ? null : status,
        search: search || null,
        deliveryLocation: location || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        sort: sort === 'oldest' ? 'oldest' : null,
    }), [status, search, location, dateFrom, dateTo, sort]);

    // Une requête par combinaison filtres + page ; « loading » se déduit de la clé.
    const requestKey = JSON.stringify({ filters, page, reloadToken });
    const loading = result.key !== requestKey;

    useEffect(() => {
        let cancelled = false;
        getOrders({ ...filters, page, perPage: PER_PAGE }).then((res) => {
            if (cancelled) return;
            if (res?.success) {
                if (res.data?.metrics) setMetrics(res.data.metrics);
                setResult({
                    key: requestKey,
                    orders: extractList(res, 'orders'),
                    meta: extractPaginationMeta(res, 'orders'),
                    counts: res.data?.metrics?.counts ?? null,
                    error: null,
                });
            } else {
                setResult((prev) => ({ ...prev, key: requestKey, error: res?.error || 'Impossible de charger les commandes.' }));
            }
        });
        return () => { cancelled = true; };
    }, [requestKey, filters, page, setMetrics]);

    const { orders, meta, counts, error: loadError } = result;

    const changeFilter = (setter) => (value) => { setter(value); setPage(1); };

    const changeStatus = (value) => {
        setStatus(value);
        setPage(1);
        const next = new URLSearchParams(searchParams);
        if (value === 'all') next.delete('status'); else next.set('status', value);
        setSearchParams(next, { replace: true });
    };

    const handleStatusChange = async (nextStatus) => {
        if (!selected) return;
        setUpdating(true);
        setUpdateError(null);
        const res = await updateOrder(selected.id, { status: nextStatus });
        if (res?.success) {
            // On garde les lignes déjà chargées (avec produits et promotions), seul le statut change.
            const updated = { ...selected, status: res.data?.order?.status ?? nextStatus };
            setSelected(updated);
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
            setReloadToken((t) => t + 1); // compteurs et liste à jour
        } else {
            setUpdateError(res?.error || 'La mise à jour du statut a échoué.');
        }
        setUpdating(false);
    };

    const exportCsv = async () => {
        setExporting(true);
        const rows = [];
        for (let p = 1; p <= 40; p += 1) {
            const res = await getOrders({ ...filters, page: p, perPage: 100 });
            if (!res?.success) break;
            extractList(res, 'orders').forEach((o) => rows.push([
                o.order_number,
                formatDate(o.created_at),
                o.customer_name || o.user?.name || '',
                o.customer_phone || '',
                o.delivery_location || '',
                o.detailed_address || '',
                itemCount(o),
                o.discount_total ?? 0,
                o.delivery_fee ?? 0,
                o.total_price ?? 0,
                ORDER_STATUS_LABEL[o.status] ?? o.status,
            ]));
            const pageMeta = extractPaginationMeta(res, 'orders');
            if (!pageMeta || p >= pageMeta.lastPage) break;
        }
        downloadCsv(
            `commandes-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Commande', 'Date', 'Client', 'Téléphone', 'Commune', 'Adresse', 'Articles', 'Remises (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)', 'Statut'],
            rows,
        );
        setExporting(false);
    };

    const tabs = [
        { value: 'all', label: 'Toutes', count: counts?.all },
        ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_TAB_LABEL[s], count: counts?.[s] })),
    ];

    const zoneNames = (shippingZones ?? []).map((zone) => zone.name).filter(Boolean);
    const hasFilters = search || location || dateFrom || dateTo;

    return (
        <DashboardLayout>
            <PageHeader
                title="Commandes"
                subtitle={counts ? `${counts.all} commande${counts.all > 1 ? 's' : ''} au total · ${counts.pending ?? 0} en attente` : ' '}
                actions={
                    <button type="button" onClick={exportCsv} disabled={exporting || !meta?.total} className={buttonClass('secondary')}>
                        <Download className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                        {exporting ? 'Export…' : 'Exporter'}
                    </button>
                }
            />

            <Panel>
                <Tabs label="Filtrer par statut" items={tabs} value={status} onChange={changeStatus} />

                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-[#ececec]">
                    <label className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676] w-full sm:w-[300px] focus-within:border-[#111] focus-within:bg-white">
                        <Search className="w-4 h-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                        <span className="sr-only">Rechercher</span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="N° de commande, client, téléphone…"
                            className="w-full bg-transparent text-[13.5px] text-[#111] placeholder:text-[#767676] outline-none"
                        />
                    </label>

                    <select aria-label="Commune" value={location} onChange={(e) => changeFilter(setLocation)(e.target.value)} className={`${fieldClass} pr-8`}>
                        <option value="">Toutes les communes</option>
                        {zoneNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>

                    <div className="flex items-center gap-2 text-[13px] text-[#666]">
                        <label htmlFor="orders-from" className="sr-only">Du</label>
                        <input id="orders-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => changeFilter(setDateFrom)(e.target.value)} className={fieldClass} />
                        <span aria-hidden="true">–</span>
                        <label htmlFor="orders-to" className="sr-only">Au</label>
                        <input id="orders-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => changeFilter(setDateTo)(e.target.value)} className={fieldClass} />
                    </div>

                    <select aria-label="Tri" value={sort} onChange={(e) => changeFilter(setSort)(e.target.value)} className={`${fieldClass} pr-8`}>
                        <option value="newest">Plus récentes d'abord</option>
                        <option value="oldest">Plus anciennes d'abord</option>
                    </select>

                    {hasFilters && (
                        <button
                            type="button"
                            className={buttonClass('ghost', 'sm')}
                            onClick={() => {
                                setSearchInput(''); setSearch(''); setLocation(''); setDateFrom(''); setDateTo(''); setPage(1);
                                const next = new URLSearchParams(searchParams); next.delete('search'); setSearchParams(next, { replace: true });
                            }}
                        >
                            Effacer les filtres
                        </button>
                    )}
                </div>

                {loadError && <div className="px-5 pt-4"><Notice>{loadError}</Notice></div>}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th scope="col" className={th}>Commande</th>
                                <th scope="col" className={th}>Client</th>
                                <th scope="col" className={th}>Date</th>
                                <th scope="col" className={th}>Livraison</th>
                                <th scope="col" className={`${th} text-right`}>Articles</th>
                                <th scope="col" className={`${th} text-right`}>Total</th>
                                <th scope="col" className={th}>Statut</th>
                                <th scope="col" className={th}><span className="sr-only">Détail</span></th>
                            </tr>
                        </thead>
                        <tbody className={loading ? 'opacity-60' : ''}>
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-[#fafafa] cursor-pointer" onClick={() => { setSelected(order); setUpdateError(null); }}>
                                    <td className={`${td} font-medium whitespace-nowrap`}>{order.order_number}</td>
                                    <td className={td}>
                                        {order.customer_name || order.user?.name || '—'}
                                        {order.customer_phone && <small className="block text-[12.5px] text-[#767676] mt-0.5">{order.customer_phone}</small>}
                                    </td>
                                    <td className={`${td} text-[#6b6b6b] whitespace-nowrap`}>{formatDate(order.created_at)}</td>
                                    <td className={`${td} max-w-[220px]`}>
                                        <span className="block truncate">{order.delivery_location || '—'}</span>
                                        {order.detailed_address && <small className="block text-[12.5px] text-[#767676] mt-0.5 truncate">{order.detailed_address}</small>}
                                    </td>
                                    <td className={`${td} text-right tabular-nums`}>{itemCount(order)}</td>
                                    <td className={`${td} text-right tabular-nums whitespace-nowrap`}>{formatFCFA(order.total_price)}</td>
                                    <td className={td}><OrderStatusBadge status={order.status} /></td>
                                    <td className={td}>
                                        <button
                                            type="button"
                                            onClick={(event) => { event.stopPropagation(); setSelected(order); setUpdateError(null); }}
                                            className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]"
                                            aria-label={`Voir la commande ${order.order_number}`}
                                        >
                                            <Eye className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && orders.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#666]">
                                        {hasFilters || status !== 'all' ? 'Aucune commande ne correspond à ces filtres.' : 'Aucune commande pour le moment.'}
                                    </td>
                                </tr>
                            )}
                            {loading && orders.length === 0 && (
                                <SkeletonRows rows={8} cols={8} />
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && (
                    <Pagination
                        page={meta.currentPage}
                        lastPage={meta.lastPage}
                        total={meta.total}
                        perPage={meta.perPage}
                        onChange={setPage}
                        disabled={loading}
                        noun={meta.total > 1 ? 'commandes' : 'commande'}
                    />
                )}
            </Panel>

            <Drawer
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title={selected ? `Commande ${selected.order_number}` : ''}
            >
                {selected && (
                    <OrderDetail order={selected} onStatusChange={handleStatusChange} updating={updating} error={updateError} />
                )}
            </Drawer>
        </DashboardLayout>
    );
}
