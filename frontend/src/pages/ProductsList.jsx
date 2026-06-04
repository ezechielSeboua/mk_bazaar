import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import ProductHeader from '../components/ProductHeader';
import FilterBar from '../components/FilterBar';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { useCatalogData, useCatalogProducts } from '../contexts/CatalogContext';
import Seo from '../components/Seo';

function SkeletonCard() {
    return (
        <motion.div className="space-y-3" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <div className="aspect-[3/4] bg-stone-200 rounded w-full" />
            <div className="h-3 bg-stone-200 rounded w-2/3" />
            <div className="h-4 bg-stone-200 rounded w-1/2" />
            <div className="h-3 bg-stone-200 rounded w-1/3" />
        </motion.div>
    );
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ProductList() {
    const { categories, isRefreshing: catalogRefreshing } = useCatalogData();
    const [searchParams, setSearchParams] = useSearchParams();

    // Lire depuis les URL params ou utiliser des valeurs par défaut
    const selectedCategorySlug = searchParams.get('category') || null;
    const sortBy = searchParams.get('sort') || 'nouveautes';
    const searchTerm = searchParams.get('search') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const showOutOfStock = searchParams.get('rupture') === 'true';

    // Trouver le nom de la catégorie à partir du slug
    const selectedCategoryName = useMemo(() => {
        if (!selectedCategorySlug) return 'Tous';
        const category = categories.find((c) => c.slug === selectedCategorySlug);
        return category?.name || 'Tous';
    }, [selectedCategorySlug, categories]);

    // Fonctions pour mettre à jour les URL params
    const updateParams = (updates) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === false) {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        // Réinitialiser à la page 1 lors de changement de filtres
        if (updates.sort !== undefined || updates.search !== undefined || updates.category !== undefined || updates.rupture !== undefined) {
            params.set('page', '1');
        }
        setSearchParams(params);
    };

    const handleCategoryChange = (categoryName) => {
        if (categoryName === 'Tous') {
            updateParams({ category: null });
        } else {
            const category = categories.find((c) => c.name === categoryName);
            if (category) {
                updateParams({ category: category.slug });
            }
        }
    };

    const handleSortChange = (newSort) => {
        updateParams({ sort: newSort === 'nouveautes' ? null : newSort });
    };

    const handleSearchChange = (term) => {
        updateParams({ search: term || null });
    };

    const handleOutOfStockChange = (checked) => {
        updateParams({ rupture: checked ? 'true' : null });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setSearchParams((params) => {
                params.set('page', String(page));
                return params;
            });
        }
    };

    // Filtre stock: null = tous, true = en stock seulement, false = rupture seulement
    const inStockFilter = showOutOfStock ? false : null;

    // Appel au hook avec les paramètres d'URL
    const {
        products,
        totalPages,
        totalItems,
        isLoading,
        isRefreshing,
    } = useCatalogProducts({
        page: currentPage,
        categorySlug: selectedCategorySlug,
        sort: sortBy,
        search: searchTerm,
        inStock: inStockFilter,
    });

    const showInitialLoad = isLoading && products.length === 0;
    const showRefreshing = isRefreshing || catalogRefreshing;

    const clearSearch = () => handleSearchChange('');
    const goToPage = (page) => handlePageChange(page);
    
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
            range.push(i);
        }
        return range;
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-black antialiased">
            <Seo
                title="Collections"
                description="Parcourez toutes les pièces MK BAZAAR : vêtements minimalistes, nouveautés et collections permanentes."
                path="/products"
            />
            <Header />
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 w-full">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <ProductHeader />
                    {showRefreshing && !showInitialLoad && (
                        <p className="text-[10px] uppercase tracking-wider text-stone-400 mt-2 animate-pulse">
                            Actualisation…
                        </p>
                    )}
                </motion.div>

                <FilterBar
                    selectedCategory={selectedCategoryName}
                    setSelectedCategory={handleCategoryChange}
                    sortBy={sortBy}
                    setSortBy={handleSortChange}
                    showOutOfStock={showOutOfStock}
                    setShowOutOfStock={handleOutOfStockChange}
                    categories={categories}
                />

                <motion.div
                    initial={{ scaleX: 0.9, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mb-8 max-w-md mx-auto md:mx-0"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-stone-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                        />
                        {searchTerm && (
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {!showInitialLoad && totalItems > 0 && (
                    <p className="text-xs text-stone-500 mb-6 uppercase tracking-wider">
                        {totalItems} produit{totalItems > 1 ? 's' : ''}
                    </p>
                )}

                {showInitialLoad ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24 text-stone-400 text-xs uppercase tracking-widest">
                        {searchTerm ? `Aucun résultat pour “${searchTerm}”.` : 'Aucune pièce disponible.'}
                    </div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            key={`${currentPage}-${selectedCategorySlug}-${sortBy}-${searchTerm}-${showOutOfStock}`}
                        >
                            <AnimatePresence mode="wait">
                                {products.map((product) => (
                                    <motion.div key={product.id} variants={itemVariants}>
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full border border-stone-200 disabled:opacity-40 hover:bg-stone-100">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {getPageNumbers().map((page) => (
                                    <button key={page} onClick={() => goToPage(page)} className={`w-8 h-8 rounded-full text-sm transition ${page === currentPage ? 'bg-black text-white' : 'hover:bg-stone-100'}`}>
                                        {page}
                                    </button>
                                ))}
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full border border-stone-200 disabled:opacity-40 hover:bg-stone-100">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}