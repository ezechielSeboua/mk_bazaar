import { useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { DashboardCardSkeleton } from '../../components/DashboardSkeletons';
import { resolveMediaUrl } from '../../config/env';

/* ---------- Variants d'Animation ---------- */
const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04 },
    },
};

const itemFadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// Squelette de ligne pour le tableau (Desktop)
function SkeletonRow() {
    return (
        <motion.tr
            className="border-b border-stone-100"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
            <td className="py-3.5 px-4"><div className="w-9 h-9 rounded bg-stone-100 animate-pulse" /></td>
            <td className="py-3.5 px-4"><div className="h-4 w-40 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-3.5 px-4"><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-3.5 px-4"><div className="h-4 w-20 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-3.5 px-4"><div className="h-5 w-16 bg-stone-100 rounded-full animate-pulse" /></td>
        </motion.tr>
    );
}

// Squelette de carte (Mobile)
function SkeletonCard() {
    return (
        <motion.div
            className="bg-white border border-stone-200 rounded-lg p-4 flex items-center gap-4"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
            <div className="w-12 h-12 rounded bg-stone-100 flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-stone-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-14 bg-stone-100 rounded-full animate-pulse" />
        </motion.div>
    );
}



export default function DashboardHome() {
    const { products, categories, users, orders, isLoading, isRefreshing } = useDashboardData();

    const stats = useMemo(() => ({
        products: products.length,
        categories: categories.length,
        users: users.length,
        orders: orders.length,
    }), [products, categories, users, orders]);

    const recentProducts = useMemo(() => products.slice(0, 3), [products]);
    const showInitialLoad = isLoading && products.length === 0;

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
                
                {/* Titre & Statut de Synchronisation */}
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
                </motion.div>

                {/* Grille des Statistiques */}
                {showInitialLoad ? (
                    <div className="min-h-[130px]">
                        <DashboardCardSkeleton count={4} />
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Produits" value={stats.products} icon={<PackageIcon />} color="terracotta" />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Catégories" value={stats.categories} icon={<FolderIcon />} color="sage" />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Commandes" value={stats.orders} icon={<OrdersIcon />} color="golden" />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard label="Utilisateurs" value={stats.users} icon={<UsersIcon />} color="dustyPlum" />
                        </motion.div>
                    </motion.div>
                )}

                {/* Section : Produits récents */}
                <motion.div
                    className="bg-white border border-stone-200 rounded-lg p-4 md:p-6 shadow-sm"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                            Derniers ajouts produits
                        </h2>
                        {!showInitialLoad && products.length > 0 && (
                            <a 
                                href="/products" // À adapter selon vos routes React Router
                                className="text-[11px] uppercase font-bold tracking-wider text-stone-900 hover:text-stone-600 border-b border-black hover:border-stone-400 pb-0.5 transition-all"
                            >
                                Voir tout →
                            </a>
                        )}
                    </div>

                    {/* Vue Mobile : Liste en cartes horizontales */}
                    <div className="block sm:hidden space-y-3">
                        {showInitialLoad ? (
                            <div className="space-y-3">
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        ) : recentProducts.length === 0 ? (
                            <div className="py-10 text-center text-stone-400 text-xs uppercase tracking-widest bg-stone-50/30 border border-dashed border-stone-200 rounded-lg">
                                Aucun produit enregistré
                            </div>
                        ) : (
                            recentProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    className="bg-stone-50/50 border border-stone-200 rounded-lg p-3 flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.04 * index, duration: 0.25 }}
                                >
                                    <div className="w-12 h-12 rounded bg-white border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                                        {product.image_path?.[0] ? (
                                            <img
                                                src={resolveMediaUrl(product.image_path[0])}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="text-[9px] font-bold text-stone-400 uppercase">N/A</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs text-stone-900 truncate">{product.name}</p>
                                        <p className="text-[11px] text-stone-500 mt-0.5">{product.category?.name || '—'}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className="font-semibold text-xs text-stone-900">{product.price?.toLocaleString('fr-FR')} F</p>
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                                            product.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {product.is_active ? 'Stock' : 'Rupture'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Vue Desktop : Tableau Minimaliste structuré */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-stone-200 bg-stone-50/50">
                                    <th className="py-3 px-4 font-bold uppercase text-[10px] text-stone-500 tracking-wider w-20">Visuel</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Désignation</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Catégorie</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Tarification</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[10px] text-stone-500 tracking-wider w-28">Disponibilité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {showInitialLoad ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : recentProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-stone-400 text-xs uppercase tracking-widest bg-stone-50/20">
                                            Aucune entité produit trouvée pour le moment.
                                        </td>
                                    </tr>
                                ) : (
                                    recentProducts.map((product, index) => (
                                        <motion.tr
                                            key={product.id}
                                            className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors cursor-pointer group"
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.04 * index, duration: 0.25 }}
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="w-9 h-9 rounded bg-stone-50 border border-stone-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-stone-300 transition-colors">
                                                    {product.image_path?.[0] ? (
                                                        <img
                                                            src={resolveMediaUrl(product.image_path[0])}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    ) : (
                                                        <div className="text-[9px] font-bold text-stone-400 uppercase">N/A</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-stone-900 text-xs md:text-sm">{product.name}</td>
                                            <td className="py-3.5 px-4 text-stone-500 text-xs">{product.category?.name || '—'}</td>
                                            <td className="py-3.5 px-4 font-mono font-medium text-xs text-stone-900">
                                                {product.price?.toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                                                    product.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                    {product.is_active ? 'En stock' : 'Rupture'}
                                                </span>
                                            </td>

                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Alertes stock bas */}
                {!showInitialLoad && lowStockItems.length > 0 && (
                    <motion.div
                        className="bg-white border border-amber-200 rounded-lg p-4 md:p-6 shadow-sm"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Réapprovisionnement nécessaire ({lowStockItems.length})
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {lowStockItems.map(({ product, variant }, i) => (
                                <div key={`${product.id}-${variant?.id ?? 'base'}`}
                                    className="flex items-center justify-between py-2 px-3 bg-amber-50/60 border border-amber-100 rounded-lg">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {product.image_path?.[0] && (
                                            <img src={resolveMediaUrl(product.image_path[0])} alt=""
                                                className="w-8 h-8 rounded object-cover shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-stone-800 truncate">{product.name}</p>
                                            {variant && (
                                                <p className="text-[10px] text-stone-400">
                                                    {Object.values(variant.attributes || {}).join(" · ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2">
                                        {variant ? variant.stock : product.stock} restant{(variant?.stock ?? product.stock) > 1 ? "s" : ""}
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

/* ---- Composant StatCard ---- */
function StatCard({ label, value, icon, color }) {
    const humanColors = {
        terracotta: {
            background: 'bg-[#fef4ee]',
            border: 'border-[#e6cdc0]',
            icon: 'text-[#c07b5a]',
        },
        sage: {
            background: 'bg-[#f6fbf2]',
            border: 'border-[#d2dfc4]',
            icon: 'text-[#7d8d6e]',
        },
        golden: {
            background: 'bg-[#fef9ea]',
            border: 'border-[#f0dbb0]',
            icon: 'text-[#b28b40]',
        },
        dustyPlum: {
            background: 'bg-[#fcf6f9]',
            border: 'border-[#e0cdd5]',
            icon: 'text-[#996e7e]',
        },
    };

    const palette = humanColors[color] || humanColors.terracotta;

    return (
        <motion.div
            className={`${palette.background} ${palette.border} border rounded-xl p-4 md:p-5 space-y-3 shadow-sm hover:shadow-md transition-all duration-300`}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="text-stone-500 text-[10px] uppercase tracking-wider font-bold truncate">{label}</p>
                    <motion.p
                        className="text-2xl md:text-3xl font-light mt-1 text-stone-950 tracking-tight"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        {value}
                    </motion.p>
                </div>
                <span className={`w-7 h-7 md:w-8 md:h-8 flex-shrink-0 ${palette.icon}`}>{icon}</span>
            </div>
        </motion.div>
    );
}

/* --- Icônes SVG --- */
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