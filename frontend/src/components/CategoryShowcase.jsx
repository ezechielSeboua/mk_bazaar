import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCatalogData } from '../contexts/CatalogContext';
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/env';

export default function CategoryShowcase() {
    const { categories, isLoading } = useCatalogData();
    
    const showcaseCategories = categories?.slice(0, 4) || [];
    const showInitialLoad = isLoading && showcaseCategories.length === 0;

    // Si le chargement est fini et qu'il n'y a aucune catégorie, on n'affiche rien (évite une section vide)
    if (!showInitialLoad && showcaseCategories.length === 0) return null;

    return (
        <section className="w-full bg-[#FAFAFA] border-t border-stone-200/80 py-12 sm:py-16 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                
                {/* En-tête unique — Évite la duplication de code structurel */}
                <div className="text-center mb-8 sm:mb-12">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-2">
                        Nos univers
                    </span>
                    <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight text-stone-950">
                        Explorez par <span className="font-normal">catégorie</span>
                    </h2>
                </div>

                {/* Grille d'affichage */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto w-full">
                    {showInitialLoad ? (
                        
                        /* Squelettes d'attente (Skeletons) alignés sur le rendu final */
                        [...Array(4)].map((_, idx) => (
                            <div key={idx} className="animate-pulse flex flex-col items-center">
                                <div className="aspect-square w-full rounded-xl bg-stone-200" />
                                <div className="h-3 bg-stone-200 rounded w-1/2 mt-3" />
                            </div>
                        ))
                    ) : (
                        
                        /* Rendu des catégories réelles */
                        showcaseCategories.map((cat, idx) => {
                            const imageUrl = cat.image_path
                                ? resolveMediaUrl(cat.image_path)
                                : cat.image || DEFAULT_PLACEHOLDER_IMAGE;

                            const slug = cat.slug || cat.id || cat.name?.toLowerCase().replace(/\s+/g, '-') || '';
                            const name = cat.name || "Catégorie";

                            return (
                                <motion.div
                                    key={cat.id || idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <Link to={`/products?category=${slug}`} className="group block text-center">
                                        {/* Conteneur Image avec bordure subtile */}
                                        <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60 relative shadow-sm group-hover:border-stone-400 transition-colors duration-300">
                                            <img
                                                src={imageUrl}
                                                alt={name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                loading="lazy"
                                            />
                                        </div>
                                        {/* Libellé Haute Lisibilité */}
                                        <p className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors duration-200">
                                            {name}
                                        </p>
                                    </Link>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}