import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCatalogData } from '../contexts/CatalogContext';
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/env';

export default function CategoryShowcase() {
    const { categories, isLoading } = useCatalogData();
    const showcaseCategories = categories.slice(0, 4);
    const showInitialLoad = isLoading && categories.length === 0;

    if (showInitialLoad) {
        return (
            <section className="w-full min-h-[500px] flex flex-col justify-center items-center px-4">
                <div className="max-w-7xl w-full text-center mb-10">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">Nos univers</span>
                    <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight mt-2">
                        Explorez par <span className="font-normal">catégorie</span>
                    </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto w-full">
                    {[...Array(4)].map((_, idx) => (
                        <div key={idx} className="animate-pulse">
                            <div className="aspect-square rounded-2xl bg-stone-200" />
                            <div className="h-3 bg-stone-200 rounded w-1/2 mx-auto mt-2" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (showcaseCategories.length === 0) return null;

    return (
        <section className="w-full min-h-[500px] flex flex-col justify-center items-center px-4">
            <div className="max-w-7xl w-full text-center mb-10">
                <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">Nos univers</span>
                <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight mt-2">
                    Explorez par <span className="font-normal">catégorie</span>
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto w-full">
                {showcaseCategories.map((cat, idx) => {
                    const imageUrl = cat.image_path?.[0]
                        ? resolveMediaUrl(cat.image_path[0])
                        : cat.image || DEFAULT_PLACEHOLDER_IMAGE;

                    const slug = cat.slug || cat.id || cat.name.toLowerCase().replace(/\s+/g, '-');
                    const icon = cat.icon || "🏷️";

                    return (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <Link to={`/products?category=${slug}`} className="group block">
                                <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 relative">
                                    <img
                                        src={imageUrl}
                                        alt={cat.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center">
                                        <span className="text-white text-4xl">{icon}</span>
                                    </div>
                                </div>
                                <p className="text-center mt-2 text-sm font-medium uppercase tracking-wide">{cat.name}</p>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
