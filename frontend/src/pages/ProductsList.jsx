import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import Header from "../components/Header";
import ProductHeader from "../components/ProductHeader";
import CatalogFilters from "../components/CatalogFilters";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { useCatalogData, useCatalogProducts } from "../contexts/CatalogContext";
import Seo from "../components/Seo";

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="aspect-[3/4] bg-stone-200 rounded-2xl w-full relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent" />
      <div className="h-3.5 bg-stone-200 rounded-md w-2/3" />
      <div className="h-4 bg-stone-200 rounded-md w-1/2" />
      <div className="h-3 bg-stone-200 rounded-md w-1/3" />
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function ProductList() {
  const { categories, isRefreshing: catalogRefreshing } = useCatalogData();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategorySlug = searchParams.get("category") || null;
  const sortBy = searchParams.get("sort") || "nouveautes";
  const searchTerm = searchParams.get("search") || "";
  const sizeParam = searchParams.get("size") || null;
  const minPriceParam = searchParams.get("min_price")
    ? parseInt(searchParams.get("min_price"), 10)
    : null;
  const maxPriceParam = searchParams.get("max_price")
    ? parseInt(searchParams.get("max_price"), 10)
    : null;
  const inStockParam = searchParams.get("in_stock") === "1";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategorySlug) return "Tous";
    const category = categories.find((c) => c.slug === selectedCategorySlug);
    return category?.name || "Tous";
  }, [selectedCategorySlug, categories]);

  const selectedPriceRange = useMemo(() => {
    if (!minPriceParam && !maxPriceParam) return null;
    let label = "";
    if (minPriceParam && maxPriceParam) {
      label = `${minPriceParam.toLocaleString()} à ${maxPriceParam.toLocaleString()} FCFA`;
    } else if (minPriceParam) {
      label = `Plus de ${minPriceParam.toLocaleString()} FCFA`;
    } else {
      label = `Moins de ${maxPriceParam.toLocaleString()} FCFA`;
    }
    return {
      label,
      min: minPriceParam,
      max: maxPriceParam,
    };
  }, [minPriceParam, maxPriceParam]);

  const activeFilterCount =
    (sizeParam ? 1 : 0) +
    (selectedPriceRange ? 1 : 0) +
    (inStockParam ? 1 : 0);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    // Réinitialiser la pagination lors du changement de filtres
    if (
      updates.sort !== undefined ||
      updates.search !== undefined ||
      updates.category !== undefined ||
      updates.size !== undefined ||
      updates.min_price !== undefined ||
      updates.max_price !== undefined ||
      updates.in_stock !== undefined
    ) {
      params.set("page", "1");
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (categoryName) => {
    if (categoryName === "Tous") {
      updateParams({ category: null });
    } else {
      const category = categories.find((c) => c.name === categoryName);
      if (category) updateParams({ category: category.slug });
    }
  };

  const handleSizeChange = (size) => updateParams({ size: size || null });

  const handlePriceRangeChange = (range) => {
    if (!range) {
      updateParams({ min_price: null, max_price: null });
    } else {
      updateParams({ min_price: range.min, max_price: range.max });
    }
  };

  const handleToggleInStock = (checked) =>
    updateParams({ in_stock: checked ? "1" : null });

  const handleResetFilters = () => {
    updateParams({
      size: null,
      min_price: null,
      max_price: null,
      in_stock: null,
    });
  };

  const handleResetAll = () => {
    updateParams({
      size: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      category: null,
      search: null,
      sort: null,
    });
  };

  const handleSortChange = (newSort) =>
    updateParams({ sort: newSort === "nouveautes" ? null : newSort });

  const handleSearchChange = (term) => updateParams({ search: term || null });

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams((prev) => {
        prev.set("page", String(page));
        return new URLSearchParams(prev);
      });
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  const { products, totalPages, totalItems, isLoading, isRefreshing } =
    useCatalogProducts({
      page: currentPage,
      categorySlug: selectedCategorySlug,
      sort: sortBy,
      search: searchTerm,
      inStock: inStockParam ? true : null,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      size: sizeParam,
    });

  const showInitialLoad = isLoading && products.length === 0;
  const displayLoader =
    (isLoading || isRefreshing || catalogRefreshing) && !showInitialLoad;

  return (
    <div className="min-h-screen flex flex-col bg-brand-sand text-black antialiased selection:bg-black selection:text-brand-sand">
      <Seo
        title="Collections – MK BAZAAR"
        description="Parcourez l'ensemble des créations et pièces d'exception MK BAZAAR."
        path="/products"
      />
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-14 w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProductHeader />
        </motion.div>

        {/* 1. Filtres par catégorie avec compteurs & Panneau de filtres avancés */}
        <CatalogFilters
          categories={categories}
          selectedCategory={selectedCategoryName}
          onSelectCategory={handleCategoryChange}
          totalItems={totalItems}
          selectedSize={sizeParam}
          onSelectSize={handleSizeChange}
          selectedPriceRange={selectedPriceRange}
          onSelectPriceRange={handlePriceRangeChange}
          inStockOnly={inStockParam}
          onToggleInStock={handleToggleInStock}
          onResetFilters={handleResetFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* 2. Barre de recherche + Tri harmonisés */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 md:mb-10">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher une pièce, tissu, modèle..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 h-11 sm:h-12 border border-stone-200 rounded-xl bg-white text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tri */}
          <div className="relative shrink-0">
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3.5 h-11 sm:h-12 text-stone-700 shadow-sm hover:border-stone-400 transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-brand-terracotta shrink-0" />
              <label htmlFor="sort-select" className="text-xs font-medium text-stone-500 whitespace-nowrap">
                Trier :
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-transparent border-none p-0 text-xs sm:text-sm font-semibold cursor-pointer focus:ring-0 text-stone-900 pr-5 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c07b5a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right center",
                }}
              >
                <option value="nouveautes">Nouveautés</option>
                <option value="prix-croissant">Prix croissant</option>
                <option value="prix-decroissant">Prix décroissant</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Affichage des produits / skeletons / empty state */}
        {showInitialLoad ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-6 sm:gap-y-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayLoader ? (
          <div className="min-h-[260px] sm:min-h-[340px] flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-2 border-stone-200 border-t-brand-terracotta rounded-full animate-spin" />
            <p className="text-xs uppercase tracking-widest text-stone-400 font-medium">
              Mise à jour des pièces...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-24 px-4 bg-white/60 border border-stone-200/70 rounded-3xl max-w-md mx-auto my-6">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-4">
              <Search className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl text-stone-900 mb-2">Aucun résultat trouvé</h3>
            <p className="text-xs text-stone-500 mb-6 font-light leading-relaxed">
              Aucune création ne correspond à vos filtres actuels. Modifiez vos critères ou réinitialisez la sélection.
            </p>
            <button
              onClick={handleResetAll}
              className="px-6 py-3 rounded-xl bg-stone-950 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-all shadow-sm active:scale-[0.98]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {totalItems > 0 && (
              <div className="flex items-center justify-between text-xs text-stone-500 mb-4 sm:mb-6 font-light">
                <span>
                  Affichage de <strong className="text-stone-900 font-semibold">{products.length}</strong> sur{" "}
                  <strong className="text-stone-900 font-semibold">{totalItems}</strong> pièce{totalItems > 1 ? "s" : ""}
                </span>
                {selectedCategoryName !== "Tous" && (
                  <span className="text-brand-terracotta font-medium">
                    Catégorie : {selectedCategoryName}
                  </span>
                )}
              </div>
            )}

            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-6 sm:gap-y-10"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={`${currentPage}-${selectedCategorySlug}-${sortBy}-${searchTerm}-${sizeParam}-${minPriceParam}-${maxPriceParam}-${inStockParam}`}
            >
              <AnimatePresence mode="wait">
                {products.map((p) => (
                  <motion.div key={p.id} variants={itemVariants}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination ergonomique */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-12 sm:mt-16 pt-6 border-t border-stone-200/60">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-stone-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-stone-950 text-white shadow-sm"
                            : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80"
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-stone-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Page suivante"
                >
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
