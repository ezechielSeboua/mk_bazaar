import { useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { DashboardCardSkeleton } from '../../components/DashboardSkeletons';
import { resolveMediaUrl } from '../../config/env';

/* ---------- Animations variants ---------- */
const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemFadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// Squelette de ligne pour le tableau (desktop)
function SkeletonRow() {
    return (
        <motion.tr
            className="border-b border-stone-100"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
            <td className="py-3 px-4"><div className="w-10 h-10 rounded bg-stone-200" /></td>
            <td className="py-3 px-4"><div className="h-4 w-32 bg-stone-200 rounded" /></td>
            <td className="py-3 px-4"><div className="h-4 w-20 bg-stone-200 rounded" /></td>
            <td className="py-3 px-4"><div className="h-4 w-16 bg-stone-200 rounded" /></td>
            <td className="py-3 px-4"><div className="h-5 w-16 bg-stone-200 rounded-full" /></td>
        </motion.tr>
    );
}

// Squelette de carte (mobile)
function SkeletonCard() {
    return (
        <motion.div
            className="bg-white border border-stone-200 rounded-lg p-4 flex items-center gap-4"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
            <div className="w-12 h-12 rounded bg-stone-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-1/2 bg-stone-200 rounded" />
            </div>
            <div className="h-5 w-16 bg-stone-200 rounded-full" />
        </motion.div>
    );
}

export default function DashboardHome() {
    const { products, categories, users, orders, isLoading } = useDashboardData();

    const stats = useMemo(() => ({
        products: products.length,
        categories: categories.length,
        users: users.length,
        orders: orders.length,
    }), [products, categories, users, orders]);

    const recentProducts = useMemo(() => products.slice(0, 3), [products]);

    const showInitialLoad = isLoading && products.length === 0;

    return (
        <DashboardLayout>
            <div className="space-y-6 md:space-y-8 px-1 md:px-0">
                    {/* Titre */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight mb-1 md:mb-2">
                            Bienvenue au Dashboard
                        </h1>
                        <p className="text-stone-600 text-sm">Gérez votre boutique MK BAZAAR</p>
                    </motion.div>

                    {/* Statistiques */}
                    {showInitialLoad ? (
                        <DashboardCardSkeleton count={4} />
                    ) : (
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemFadeUp}>
                            <StatCard
                                label="Produits"
                                value={stats.products}
                                icon={<PackageIcon />}
                                color="terracotta"
                            />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard
                                label="Catégories"
                                value={stats.categories}
                                icon={<FolderIcon />}
                                color="sage"
                            />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard
                                label="Commandes"
                                value={stats.orders}
                                icon={<OrdersIcon />}
                                color="golden"
                            />
                        </motion.div>
                        <motion.div variants={itemFadeUp}>
                            <StatCard
                                label="Utilisateurs"
                                value={stats.users}
                                icon={<UsersIcon />}
                                color="dustyPlum"
                            />
                        </motion.div>
                    </motion.div>
                    )}

                    {/* Produits récents */}
                    <motion.div
                        className="bg-white border border-stone-200 rounded-lg p-4 md:p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h2 className="text-base md:text-lg font-medium uppercase tracking-wider mb-4">
                            Produits récents
                        </h2>

                        {/* Vue mobile : cartes */}
                        <div className="block sm:hidden space-y-3">
                            {showInitialLoad ? (
                                <>
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </>
                            ) : recentProducts.length === 0 ? (
                                <div className="py-12 text-center text-stone-400 text-sm">Aucun produit</div>
                            ) : (
                                recentProducts.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex items-center gap-4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index, duration: 0.3 }}
                                    >
                                        <div className="w-12 h-12 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {product.image_path?.[0] ? (
                                                <img
                                                    src={resolveMediaUrl(product.image_path[0])}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg className="w-5 h-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="2" y="2" width="20" height="20" rx="2" />
                                                    <circle cx="8.5" cy="10" r="2.5" />
                                                    <path d="M21 15l-4-4-8 8-3-2" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{product.name}</p>
                                            <p className="text-xs text-stone-500">{product.category?.name || '—'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">{product.price?.toLocaleString('fr-FR')} FCFA</p>
                                            <span
                                                className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {product.in_stock ? 'En stock' : 'Rupture'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Vue desktop : tableau (caché sur mobile) */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stone-200">
                                        <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Image</th>
                                        <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Produit</th>
                                        <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Catégorie</th>
                                        <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Prix</th>
                                        <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Stock</th>
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
                                            <td colSpan="5" className="py-12 text-center text-stone-400 text-sm">
                                                Aucun produit
                                            </td>
                                        </tr>
                                    ) : (
                                        recentProducts.map((product, index) => (
                                            <motion.tr
                                                key={product.id}
                                                className="border-b border-stone-100 hover:bg-stone-50"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="w-10 h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                                                        {product.image_path?.[0] ? (
                                                            <img
                                                                src={resolveMediaUrl(product.image_path[0])}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <svg className="w-5 h-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <rect x="2" y="2" width="20" height="20" rx="2" />
                                                                <circle cx="8.5" cy="10" r="2.5" />
                                                                <path d="M21 15l-4-4-8 8-3-2" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-medium">{product.name}</td>
                                                <td className="py-3 px-4 text-stone-600">{product.category?.name || '—'}</td>
                                                <td className="py-3 px-4 font-medium">
                                                    {product.price?.toLocaleString('fr-FR')} FCFA
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                                                            product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {product.in_stock ? 'En stock' : 'Rupture'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
        </DashboardLayout>
    );
}

/* ---- Nouveau composant StatCard avec couleurs humaines ---- */
function StatCard({ label, value, icon, color }) {
    // Palette organique, inspirée de matières naturelles et chaleureuses
    const humanColors = {
        terracotta: {
            background: 'bg-[#fef4ee]',  // fond crème rosé, très doux
            border: 'border-[#e6cdc0]',
            icon: 'text-[#c07b5a]',       // terre cuite subtile
        },
        sage: {
            background: 'bg-[#f6fbf2]',
            border: 'border-[#d2dfc4]',
            icon: 'text-[#7d8d6e]',       // vert sauge élégant
        },
        golden: {
            background: 'bg-[#fef9ea]',
            border: 'border-[#f0dbb0]',
            icon: 'text-[#b28b40]',       // doré épicé
        },
        dustyPlum: {
            background: 'bg-[#fcf6f9]',
            border: 'border-[#e0cdd5]',
            icon: 'text-[#996e7e]',       // prune poussiéreuse
        },
    };

    const palette = humanColors[color] || humanColors.terracotta;

    return (
        <motion.div
            className={`${palette.background} ${palette.border} border rounded-xl p-4 md:p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-300`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200 }}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-stone-600 text-[10px] uppercase tracking-wider font-bold">{label}</p>
                    <motion.p
                        className="text-2xl md:text-3xl font-light mt-1 text-stone-800"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {value}
                    </motion.p>
                </div>
                <span className={`w-7 h-7 md:w-8 md:h-8 ${palette.icon}`}>{icon}</span>
            </div>
        </motion.div>
    );
}

/* --- Icônes SVG inchangées (elles adoptent la couleur du parent) --- */
function PackageIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function OrdersIcon() {
    return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}