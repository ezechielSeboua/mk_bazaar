import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/env';

/* ---------- Icônes ---------- */
const CategoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1 text-stone-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
        <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z"/>
    </svg>
);

/* ---------- Squelette Réaligné (Anti-CLS) ---------- */
function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden h-[420px] sm:h-[460px] md:h-[480px] animate-pulse flex flex-col justify-between">
            {/* Zone Image */}
            <div className="w-full h-[52%] bg-stone-200" />
            {/* Zone Infos */}
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <div className="h-3 bg-stone-200 rounded w-1/3" />
                        <div className="h-3 bg-stone-200 rounded w-8" />
                    </div>
                    <div className="h-5 bg-stone-200 rounded w-3/4 mt-2" />
                    <div className="h-3 bg-stone-200 rounded w-5/6" />
                </div>
                <div className="mt-auto space-y-1.5 pt-2 border-t border-stone-100">
                    <div className="h-2 bg-stone-200 rounded w-12" />
                    <div className="h-5 bg-stone-200 rounded w-28" />
                </div>
            </div>
            {/* Zone Bouton */}
            <div className="p-3 border-t border-stone-100">
                <div className="h-10 bg-stone-200 rounded-lg w-full" />
            </div>
        </div>
    );
}

export default function ProductGrid({ products = [], loading = false }) {
    // Filtrer les produits actifs et en stock
    const inStockProducts = products.filter(product => {
        if (!product.variants || !Array.isArray(product.variants)) {
            return product.is_active !== false; 
        }
        return (product.is_active !== false) && product.variants.some(v => v.stock > 0);
    });

    return (
        <section className="px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl mx-auto border-t border-stone-200/80 bg-[#FAFAFA]">
            {/* En-tête de la grille */}
            <div className="flex justify-between items-baseline mb-6 sm:mb-8 md:mb-10">
                <h2 className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-stone-400 font-bold">
                    Sélection Éditoriale
                </h2>
                <Link
                    to="/products"
                    className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-stone-950 hover:text-stone-600 transition-colors border-b border-stone-950 pb-0.5"
                >
                    Voir tout
                </Link>
            </div>

            {/* Grille responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : inStockProducts.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-stone-500 text-sm font-medium">
                        Aucun produit disponible pour le moment.
                    </div>
                ) : (
                    inStockProducts.map((product, index) => {
                        const backgroundImage = product.image_path?.[0]
                            ? resolveMediaUrl(product.image_path[0])
                            : DEFAULT_PLACEHOLDER_IMAGE;

                        const name = product.name || "Sans titre";
                        const categoryName = typeof product.category === 'object'
                            ? product.category?.name
                            : product.category || "—";

                        const description = product.description || "";
                        const rating = product.rating || '4.8';
                        
                        // Traitement des prix et calcul de réduction
                        const currentPrice = product.price || 0;
                        const oldPrice = product.old_price;
                        const hasDiscount = oldPrice && oldPrice > currentPrice;
                        const discountPercentage = hasDiscount 
                            ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) 
                            : 0;

                        return (
                            <motion.div
                                key={product.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                whileHover={{ y: -6 }}
                                className="group flex flex-col justify-between bg-white rounded-xl border border-stone-200/80 overflow-hidden h-[420px] sm:h-[460px] md:h-[480px] transition-all duration-300 hover:border-stone-400 hover:shadow-md"
                            >
                                {/* Zone cliquable globale haute */}
                                <Link to={`/products/${product.slug}`} className="flex flex-col flex-grow overflow-hidden">
                                    
                                    {/* Image de fond avec badges intégrés */}
                                    <div className="relative w-full h-[52%] bg-stone-100 overflow-hidden">
                                        <img
                                            src={backgroundImage}
                                            alt={name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                                        />

                                        {/* Badge Promotion (En haut à gauche) */}
                                        {hasDiscount && (
                                            <div className="absolute top-2.5 left-2.5 z-10">
                                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-600 text-white rounded shadow-sm">
                                                    -{discountPercentage}%
                                                </span>
                                            </div>
                                        )}

                                        {/* Badge de Statut de Stock (En haut à droite) */}
                                        <div className="absolute top-2.5 right-2.5 z-10">
                                            <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white border border-stone-800 rounded-md shadow-sm">
                                                En stock
                                            </span>
                                        </div>
                                    </div>

                                    {/* Zone des Détails Textuels */}
                                    <div className="flex flex-col justify-between flex-grow p-4 bg-white text-stone-900">
                                        <div>
                                            {/* Ligne catégorie & Note */}
                                            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
                                                <div className="flex items-center truncate max-w-[70%]">
                                                    <CategoryIcon />
                                                    <span className="truncate">{categoryName}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5 font-bold text-stone-800">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span>{rating}</span>
                                                </div>
                                            </div>

                                            {/* Titre */}
                                            <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-950 line-clamp-1 group-hover:text-stone-800 transition-colors">
                                                {name}
                                            </h2>

                                            {/* Description */}
                                            {description && (
                                                <p className="text-[11px] sm:text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                                                    {description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Affichage des Prix */}
                                        <div className="mt-2 pt-2 border-t border-stone-100">
                                            <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-medium">
                                                {hasDiscount ? "En promotion" : "Prix unique"}
                                            </span>
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-base sm:text-lg font-black tracking-tight text-stone-950">
                                                    {currentPrice.toLocaleString()} FCFA
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-xs sm:text-sm text-stone-400 line-through font-medium">
                                                        {oldPrice.toLocaleString()} FCFA
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Bouton "Passer commande" sécurisé sans balise button imbriquée */}
                                <div className="p-3 bg-white border-t border-stone-100">
                                    <Link to={`/products/${product.slug}`} className="block">
                                        <motion.div
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider bg-stone-950 text-white hover:bg-green-600 shadow-sm transition-all duration-200"
                                        >
                                            <WhatsAppIcon />
                                            <span>Passer commande</span>
                                        </motion.div>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* CTA global "Voir plus" corrigé (Utilisation d'un div animé pour le Link) */}
            {!loading && inStockProducts.length > 0 && (
                <div className="flex justify-center mt-12 sm:mt-16">
                    <Link to="/products" className="block">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-stone-950 rounded-full text-xs sm:text-sm uppercase tracking-wider font-bold bg-transparent text-stone-950 hover:bg-stone-950 hover:text-white transition-all duration-300 text-center shadow-sm cursor-pointer"
                        >
                            Découvrir toute la collection
                        </motion.div>
                    </Link>
                </div>
            )}
        </section>
    );
}