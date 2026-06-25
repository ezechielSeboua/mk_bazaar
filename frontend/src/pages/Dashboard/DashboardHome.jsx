import { useMemo } from 'react';

// S-04 : valider le format d'un numéro de téléphone avant de construire un lien tel:
const sanitizePhone = (phone) =>
    phone && /^[\d\s+().-]{6,20}$/.test(phone) ? phone : null;
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { DashboardCardSkeleton } from '../../components/DashboardSkeletons';
import { resolveMediaUrl } from '../../config/env';

/* ---------- Variants d'animation ---------- */
const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemFadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ---------- Helpers statuts ---------- */
const STATUS_BADGE = {
    pending:    'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    completed:  'bg-green-100 text-green-800',
    cancelled:  'bg-red-100 text-red-600',
};
const STATUS_LABEL = {
    pending:    'En attente',
    processing: 'En traitement',
    completed:  'Livrée',
    cancelled:  'Annulée',
};

const formatFCFA = (n) =>
    n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`
        : n >= 1_000
        ? `${(n / 1_000).toFixed(0)} k`
        : String(n);

/* ---------- Squelettes ---------- */
function SkeletonRow() {
    return (
        <motion.tr
            className="border-b border-stone-100"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
            <td className="py-3 px-4"><div className="h-4 w-28 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-3 px-4"><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-3 px-4"><div className="h-4 w-20 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-3 px-4"><div className="h-5 w-16 bg-stone-100 rounded-full animate-pulse" /></td>
        </motion.tr>
    );
}

function SkeletonProductCard() {
    return (
        <motion.div
            className="flex items-center gap-3 py-2.5"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
            <div className="w-9 h-9 rounded bg-stone-100 shrink-0 animate-pulse" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-stone-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-stone-100 rounded animate-pulse" />
            </div>
            <div className="h-3.5 w-16 bg-stone-100 rounded animate-pulse" />
        </motion.div>
    );
}

/* ---------- Page principale ---------- */
export default function DashboardHome() {
    const { products, categories, users, orders, metrics, isLoading, isRefreshing } = useDashboardData();

    const showInitialLoad = isLoading && products.length === 0;

    const stats = useMemo(() => ({
        products:    products.length,
        categories:  categories.length,
        users:       users.length,
        orders:      orders.length,
        revenue:     metrics?.total_revenue_fcfa ?? 0,
        pending:     metrics?.pending_orders_count ?? 0,
        lost:        metrics?.lost_revenue_cancelled_fcfa ?? 0,
    }), [products, categories, users, orders, metrics]);

    const avgBasket = useMemo(() => {
        const completed = orders.filter(o => o.status === 'completed');
        return completed.length > 0 ? Math.round(stats.revenue / completed.length) : 0;
    }, [orders, stats.revenue]);

    const recentOrders   = useMemo(() => [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5), [orders]);
    const recentProducts = useMemo(() => products.slice(0, 3), [products]);

    const lowStockItems = useMemo(() => {
        const items = [];
        products.forEach(product => {
            if (product.variants?.length > 0) {
                product.variants.forEach(v => {
                    if (v.stock > 0 && v.stock <= 3) items.push({ product, variant: v });
                });
            } else if ((product.stock ?? 0) > 0 && product.stock <= 3) {
                items.push({ product, variant: null });
            }
        });
        return items;
    }, [products]);

    return (
        <DashboardLayout>
            <div className="space-y-6 md:space-y-8 px-1 md:px-0 max-w-[1600px] mx-auto">

                {/* En-tête */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-5"
                >
                    <div>
                        <h1 className="text-xl md:text-2xl font-light uppercase tracking-wider text-stone-900">
                            Tableau de bord
                        </h1>
                        <div className="flex items-center gap-2 mt-1 h-4">
                            <p className="text-stone-500 text-xs">Gérez votre boutique MK BAZAAR</p>
                            {isRefreshing && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50/60 border border-amber-200/60 px-2 py-0.5 rounded-full"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Mise à jour...
                                </motion.span>
                            )}
                        </div>
                    </div>

                    {/* Raccourcis actions rapides */}
                    {!showInitialLoad && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                to="/dashboard/products"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#c07b5a] text-white rounded-lg hover:bg-[#a0523d] transition-colors shadow-sm shadow-[#c07b5a]/20"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Ajouter un produit
                            </Link>
                            <Link
                                to="/dashboard/commands"
                                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-white text-[#c07b5a] border border-[#c07b5a]/40 rounded-lg hover:bg-[#c07b5a]/10 transition-colors shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                </svg>
                                Commandes en attente
                                {stats.pending > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-black bg-amber-500 text-white rounded-full leading-none">
                                        {stats.pending > 9 ? '9+' : stats.pending}
                                    </span>
                                )}
                            </Link>
                        </div>
                    )}
                </motion.div>

                {/* ── Grille des statistiques ── */}
                {showInitialLoad ? (
                    <div className="min-h-[130px]">
                        <DashboardCardSkeleton count={5} />
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* CA — priorité visuelle maximale */}
                        <motion.div variants={itemFadeUp} className="col-span-2 lg:col-span-1">
                            <StatCard
                                label="Chiffre d'affaires"
                                value={`${formatFCFA(stats.revenue)} FCFA`}
                                subValue={avgBasket > 0 ? `Panier moyen : ${avgBasket.toLocaleString('fr-FR')} FCFA` : null}
                                icon={<RevenueIcon />}
                                color=""
                                href="/dashboard/finances"
                            />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Produits"    value={stats.products}   icon={<PackageIcon />}  color=""       href="/dashboard/products" />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Catégories"  value={stats.categories} icon={<FolderIcon />}   color=""     href="/dashboard/categories" />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard
                                label="Commandes"
                                value={stats.orders}
                                subValue={stats.pending > 0 ? `${stats.pending} en attente` : null}
                                lostValue={stats.lost > 0 ? `−${formatFCFA(stats.lost)} FCFA perdus (annulations)` : null}
                                icon={<OrdersIcon />}
                                color=""
                                href="/dashboard/commands"
                            />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Utilisateurs" value={stats.users}     icon={<UsersIcon />}    color=""       href="/dashboard/users" />
                        </motion.div>
                    </motion.div>
                )}

                {/* ── Activité récente : commandes + produits ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Commandes récentes (2/3) */}
                    <motion.div
                        className="xl:col-span-2 bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                                Dernières commandes
                            </h2>
                            {!showInitialLoad && orders.length > 0 && (
                                <Link
                                    to="/dashboard/commands"
                                    className="text-[11px] uppercase font-bold tracking-wider text-stone-900 hover:text-stone-600 border-b border-black hover:border-stone-400 pb-0.5 transition-all"
                                >
                                    Voir tout →
                                </Link>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-stone-200 bg-stone-50/50">
                                        <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Commande</th>
                                        <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Client</th>
                                        <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Montant</th>
                                        <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showInitialLoad ? (
                                        <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                                    ) : recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-10 text-center text-stone-400 text-xs uppercase tracking-widest">
                                                Aucune commande pour le moment
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order, i) => (
                                            <motion.tr
                                                key={order.id}
                                                className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors"
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.04 * i }}
                                            >
                                                <td className="py-3 px-3">
                                                    <p className="text-xs font-mono font-medium text-stone-800">{order.order_number}</p>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <p className="text-xs font-medium text-stone-800 truncate max-w-[110px]">{order.customer_name || '—'}</p>
                                                    {sanitizePhone(order.customer_phone) && (
                                                        <a href={`tel:${sanitizePhone(order.customer_phone)}`} className="text-[10px] text-[#c07b5a] hover:underline">
                                                            {order.customer_phone}
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 font-mono text-xs font-medium text-stone-900">
                                                    {order.total_price?.toLocaleString('fr-FR')} F
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-500'}`}>
                                                        {STATUS_LABEL[order.status] ?? order.status}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Produits récents (1/3) */}
                    <motion.div
                        className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                                Produits récents
                            </h2>
                            {!showInitialLoad && products.length > 0 && (
                                <Link
                                    to="/dashboard/products"
                                    className="text-[11px] uppercase font-bold tracking-wider text-stone-900 hover:text-stone-600 border-b border-black hover:border-stone-400 pb-0.5 transition-all"
                                >
                                    Voir tout →
                                </Link>
                            )}
                        </div>

                        <div className="divide-y divide-stone-100">
                            {showInitialLoad ? (
                                <><SkeletonProductCard /><SkeletonProductCard /><SkeletonProductCard /></>
                            ) : recentProducts.length === 0 ? (
                                <p className="py-10 text-center text-stone-400 text-xs uppercase tracking-widest">
                                    Aucun produit enregistré
                                </p>
                            ) : (
                                recentProducts.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        className="flex items-center gap-3 py-3"
                                        initial={{ opacity: 0, x: 4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.06 * i }}
                                    >
                                        <div className="w-9 h-9 rounded bg-stone-50 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                            {product.image_path?.[0] ? (
                                                <img
                                                    src={resolveMediaUrl(product.image_path[0])}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span className="text-[9px] font-bold text-stone-400 uppercase">N/A</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-stone-900 truncate">{product.name}</p>
                                            <p className="text-[10px] text-stone-400">{product.category?.name || '—'}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-mono font-medium text-stone-900">
                                                {product.price?.toLocaleString('fr-FR')} F
                                            </p>
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                                product.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {product.is_active ? 'Stock' : 'Rupture'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* ── Alertes stock bas ── */}
                {!showInitialLoad && lowStockItems.length > 0 && (
                    <motion.div
                        className="bg-white border border-amber-200 rounded-xl p-4 md:p-6 shadow-sm"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Réapprovisionnement nécessaire ({lowStockItems.length})
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {lowStockItems.map(({ product, variant }) => (
                                <div
                                    key={`${product.id}-${variant?.id ?? 'base'}`}
                                    className="flex items-center justify-between py-2 px-3 bg-amber-50/60 border border-amber-100 rounded-lg"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {product.image_path?.[0] && (
                                            <img
                                                src={resolveMediaUrl(product.image_path[0])}
                                                alt=""
                                                className="w-8 h-8 rounded object-cover shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-stone-800 truncate">{product.name}</p>
                                            {variant && (
                                                <p className="text-[10px] text-stone-400">
                                                    {Object.values(variant.attributes || {}).join(' · ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2">
                                        {variant ? variant.stock : product.stock} restant{(variant?.stock ?? product.stock) > 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>
        </DashboardLayout>
    );
}

/* ── Composant StatCard ── */
function StatCard({ label, value, subValue, lostValue, icon, color, href }) {
    const palette = { bg: 'bg-white', border: 'border-[#e6cdc0]', icon: 'text-[#c07b5a]' };

    const inner = (
        <motion.div
            className={`${palette.bg} ${palette.border} border rounded-xl p-4 md:p-5 space-y-2 shadow-sm hover:shadow-md transition-all duration-300 h-full ${href ? 'cursor-pointer' : ''}`}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="text-stone-500 text-[10px] uppercase tracking-wider font-bold truncate">{label}</p>
                    <motion.p
                        className="text-2xl md:text-3xl font-light mt-1 text-stone-950 tracking-tight leading-none"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        {value}
                    </motion.p>
                </div>
                <span className={`w-7 h-7 md:w-8 md:h-8 shrink-0 ${palette.icon}`}>{icon}</span>
            </div>
            {subValue && (
                <p className="text-[10px] text-stone-500 font-medium">{subValue}</p>
            )}
            {lostValue && (
                <p className="text-[10px] text-red-400 font-medium">{lostValue}</p>
            )}
        </motion.div>
    );

    if (href) return <Link to={href} className="block h-full">{inner}</Link>;
    return inner;
}

/* ── Icônes SVG ── */
function RevenueIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function PackageIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function OrdersIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}
