import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
} from "lucide-react";

const SIZES = ["S", "M", "L", "XL"];

const PRICE_RANGES = [
  { label: "Moins de 20 000 FCFA", min: null, max: 20000 },
  { label: "20 000 à 35 000 FCFA", min: 20000, max: 35000 },
  { label: "Plus de 35 000 FCFA", min: 35000, max: null },
];

export default function CatalogFilters({
  categories = [],
  selectedCategory,
  onSelectCategory,
  totalItems = 0,
  selectedSize,
  onSelectSize,
  selectedPriceRange,
  onSelectPriceRange,
  inStockOnly,
  onToggleInStock,
  onResetFilters,
  activeFilterCount = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mb-8 space-y-4">
      {/* 1. Barre de Catégories avec Compteurs de produits */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        <button
          onClick={() => onSelectCategory("Tous")}
          className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
            selectedCategory === "Tous"
              ? "bg-stone-950 text-white shadow-sm"
              : "bg-white text-stone-600 hover:text-stone-950 border border-stone-200 hover:border-stone-400"
          }`}
        >
          <span>Toutes les pièces</span>
          {totalItems > 0 && selectedCategory === "Tous" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
              {totalItems}
            </span>
          )}
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = cat.products_count;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                isSelected
                  ? "bg-brand-terracotta text-white shadow-sm shadow-brand-terracotta/20"
                  : "bg-white text-stone-600 hover:text-stone-950 border border-stone-200 hover:border-stone-400"
              }`}
            >
              <span>{cat.name}</span>
              {count != null && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Bouton d'ouverture des filtres avancés & statut */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            isOpen || activeFilterCount > 0
              ? "bg-stone-950 text-white border-stone-950 shadow-sm"
              : "bg-white text-stone-800 border-stone-200 hover:border-stone-400"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtres avancés</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand-terracotta text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Bouton de réinitialisation rapide si des filtres sont actifs */}
        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-xs font-medium text-stone-500 hover:text-brand-terracotta flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer les filtres</span>
          </button>
        )}
      </div>

      {/* 3. Tiroir / Accordéon dépliable des Filtres Avancés */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Filtre par Taille */}
                <div className="space-y-2.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-700 block">
                    Taille / Coupe
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {SIZES.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => onSelectSize(isSelected ? null : size)}
                          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? "bg-stone-950 text-white border-stone-950 shadow-sm"
                              : "bg-[#FAF9F6] text-stone-700 border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtre par Tranche de Prix */}
                <div className="space-y-2.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-700 block">
                    Budget (FCFA)
                  </label>
                  <div className="space-y-1.5">
                    {PRICE_RANGES.map((range, idx) => {
                      const isSelected =
                        selectedPriceRange?.min === range.min &&
                        selectedPriceRange?.max === range.max;
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            onSelectPriceRange(isSelected ? null : range)
                          }
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                            isSelected
                              ? "bg-stone-950 text-white border-stone-950"
                              : "bg-[#FAF9F6] text-stone-700 border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <span>{range.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtre Disponibilité */}
                <div className="space-y-2.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-700 block">
                    Disponibilité
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6] cursor-pointer hover:border-stone-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => onToggleInStock(e.target.checked)}
                      className="w-4 h-4 rounded text-stone-950 focus:ring-0 border-stone-300"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-stone-900 block">
                        En stock uniquement
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Masquer les pièces en rupture
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Badges de filtres actifs (dismissable chips) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-stone-400 font-medium">Filtres actifs :</span>

          {selectedSize && (
            <button
              onClick={() => onSelectSize(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm"
            >
              <span>Taille : {selectedSize}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedPriceRange && (
            <button
              onClick={() => onSelectPriceRange(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm"
            >
              <span>{selectedPriceRange.label}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {inStockOnly && (
            <button
              onClick={() => onToggleInStock(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm"
            >
              <span>En stock</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onResetFilters}
            className="text-xs text-brand-terracotta hover:underline font-semibold ml-2"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}

