import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/env';

// Icônes (inchangées)
const CategoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
        <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z"/>
    </svg>
);

// Squelette responsive
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] animate-pulse relative">
            <div className="absolute inset-0 bg-stone-200" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="h-4 sm:h-5 bg-stone-300 rounded w-3/4" />
                <div className="h-3 sm:h-4 bg-stone-300 rounded w-2/3" />
                <div className="flex justify-around py-2 sm:py-3 my-1 sm:my-2">
                    <div className="h-6 w-12 sm:h-8 sm:w-16 bg-stone-300 rounded" />
                    <div className="h-6 w-12 sm:h-8 sm:w-16 bg-stone-300 rounded" />
                </div>
                <div className="h-3 sm:h-4 bg-stone-300 rounded w-1/2" />
                <div className="h-8 sm:h-10 bg-stone-300 rounded-full w-full" />
            </div>
        </div>
    );
}

export default function ProductGrid({ products = [], loading = false }) {
    return (
        <section className="px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl mx-auto border-t border-stone-200/60 bg-gray-100">
            <div className="flex justify-between items-baseline mb-6 sm:mb-8 md:mb-12">
                <h2 className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-stone-400 font-bold">
                    Sélection Éditoriale
                </h2>
                <Link
                    to="/products"
                    className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold hover:text-stone-500 transition-colors border-b border-black pb-0.5"
                >
                    Voir tout
                </Link>
            </div>

            {/* Grille responsive : 2 colonnes sur mobile, 3 sur tablette, 4 sur desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    products.map((product, index) => {
                        const backgroundImage = product.image_path?.[0]
                            ? resolveMediaUrl(product.image_path[0])
                            : DEFAULT_PLACEHOLDER_IMAGE;

                        const name = product.name || 'Natasha Romanoff';
                        const categoryName = typeof product.category === 'object'
                            ? product.category?.name
                            : product.category || 'Brand Designer';

                        const description = product.description || "Description par défaut";
                        const rating = product.rating || '4.8';
                        const price = `${product.price || 50} FCFA`;

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px]"
                            >
                                {/* Image de fond */}
                                <div className="absolute inset-0 w-full h-full">
                                    <img
                                        src={backgroundImage}
                                        alt={name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                </div>

                                {/* Contenu en bas - padding et tailles de texte adaptatives */}
                                <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 md:p-5 lg:p-6 text-white">
                                    <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight line-clamp-1">
                                        {name}
                                    </h2>
                                    <p className="text-xs sm:text-sm mt-1 leading-relaxed text-white/90 line-clamp-2 sm:line-clamp-3">
                                        {description}
                                    </p>

                                    {/* Indicateurs */}
                                    <div className="flex justify-around items-center border-y border-white/20 py-2 sm:py-3 my-2 sm:my-3">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-bold text-xs sm:text-sm">{rating}</span>
                                            </div>
                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wider text-white/70 font-medium">
                                                Note
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-xs sm:text-sm">{price}</div>
                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wider text-white/70 font-medium">
                                                Prix
                                            </span>
                                        </div>
                                    </div>

                                    {/* Catégorie avec icône */}
                                    <div className="flex items-center mt-1 sm:mt-2">
                                        <CategoryIcon />
                                        <p className="text-xs sm:text-sm font-medium line-clamp-1">{categoryName}</p>
                                    </div>

                                    {/* Bouton passer commande */}
                                    <Link to={`/products/${product.slug}`}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-2 sm:py-2.5 md:py-3 rounded-full bg-white text-black text-[10px] sm:text-xs md:text-sm font-medium uppercase tracking-wider hover:bg-green-500 hover:text-white transition-colors duration-300 shadow-md mt-2 sm:mt-3 md:mt-4 flex items-center justify-center gap-1 sm:gap-2"
                                        >
                                            <WhatsAppIcon />
                                            passer commande
                                        </motion.button>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* CTA "Voir plus" centré - visible seulement si non chargement et produits existent */}
            {!loading && products.length > 0 && (
                <div className="flex justify-center mt-12 sm:mt-16">
                    <Link to="/products">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-black rounded-full text-xs sm:text-sm uppercase tracking-wider font-semibold bg-transparent text-black hover:bg-black hover:text-white transition-all duration-300 shadow-md"
                        >
                            Découvrir toute la collection
                        </motion.button>
                    </Link>
                </div>
            )}
        </section>
    );
}