import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShoppingBag, Sparkles } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

const COLOR_MAP = {
  original: "#C5A880",
  indigo: "#1E3A8A",
  terre: "#9A3412",
  noir: "#18181B",
  blanc: "#FAFAFA",
  beige: "#E7E5E4",
  dore: "#D97706",
  argente: "#94A3B8",
  bordeaux: "#881337",
  vert: "#166534",
  bleu: "#2563EB",
  marron: "#78350F",
  ocre: "#B45309",
  kaki: "#3F6212",
};

function getHexColor(colorName) {
  if (!colorName) return "#E7E5E4";
  const clean = colorName.toLowerCase().trim();
  return COLOR_MAP[clean] || "#A8A29E";
}

export default function QuickShopModal({ product, variants = [], onSelect, onClose }) {
  const defaultImage = product?.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;

  // Extraction des couleurs et tailles disponibles
  const availableColors = useMemo(() => {
    const map = new Map();
    variants.forEach((v) => {
      const color = v.attributes?.couleur;
      if (color && !map.has(color)) {
        map.set(color, {
          name: color,
          image: v.image_path ? resolveMediaUrl(v.image_path) : null,
          hex: getHexColor(color),
        });
      }
    });
    return Array.from(map.values());
  }, [variants]);

  const availableSizes = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => {
      const size = v.attributes?.taille || v.attributes?.pointure;
      if (size) set.add(size);
    });
    return Array.from(set);
  }, [variants]);

  // États de sélection
  const [selectedColor, setSelectedColor] = useState(
    availableColors[0]?.name || null
  );

  // Tailles valides pour la couleur sélectionnée
  const sizesForColor = useMemo(() => {
    return availableSizes.map((size) => {
      const match = variants.find((v) => {
        const cMatch = selectedColor ? v.attributes?.couleur === selectedColor : true;
        const sMatch = (v.attributes?.taille || v.attributes?.pointure) === size;
        return cMatch && sMatch;
      });
      return {
        size,
        inStock: match ? match.stock > 0 : false,
        variant: match || null,
      };
    });
  }, [availableSizes, selectedColor, variants]);

  const firstValidSize = sizesForColor.find((s) => s.inStock)?.size || availableSizes[0] || null;
  const [selectedSize, setSelectedSize] = useState(firstValidSize);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Variante résolue
  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) => {
        const cMatch = selectedColor ? v.attributes?.couleur === selectedColor : true;
        const sMatch = selectedSize ? (v.attributes?.taille || v.attributes?.pointure) === selectedSize : true;
        return cMatch && sMatch;
      }) || variants[0]
    );
  }, [variants, selectedColor, selectedSize]);

  // Image dynamique selon la couleur
  const activeImage = useMemo(() => {
    if (currentVariant?.image_path) {
      return resolveMediaUrl(currentVariant.image_path);
    }
    const colorObj = availableColors.find((c) => c.name === selectedColor);
    if (colorObj?.image) return colorObj.image;
    return defaultImage;
  }, [currentVariant, selectedColor, availableColors, defaultImage]);

  const price = currentVariant?.price || product?.price || 0;
  const oldPrice = currentVariant?.old_price || product?.old_price;
  const hasDiscount = oldPrice && oldPrice > price;
  const isOutOfStock = currentVariant ? currentVariant.stock <= 0 : false;

  const handleAdd = () => {
    if (isOutOfStock) return;
    setIsAdded(true);
    setTimeout(() => {
      onSelect(currentVariant, quantity);
    }, 400);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec bouton fermer */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-terracotta animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-stone-500">
                Ajout Express
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Aperçu produit */}
            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80 shadow-inner">
                <img
                  src={activeImage}
                  alt={product?.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-terracotta">
                  {product?.category?.name || "Collection"}
                </span>
                <h3 className="font-serif text-base sm:text-lg text-stone-900 font-semibold line-clamp-1">
                  {product?.name}
                </h3>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-base sm:text-lg font-bold font-serif text-stone-950">
                    {price.toLocaleString()} FCFA
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-stone-400 line-through">
                      {oldPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {currentVariant && currentVariant.stock <= 3 && currentVariant.stock > 0 && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    Plus que {currentVariant.stock} pièce{currentVariant.stock > 1 ? "s" : ""} disponible{currentVariant.stock > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Sélecteur de couleurs si existant */}
            {availableColors.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-stone-700">Couleur :</span>
                  <span className="font-semibold text-stone-950 capitalize">
                    {selectedColor || "Standard"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {availableColors.map((color) => {
                    const isSelected = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all p-0.5 ${
                          isSelected
                            ? "border-stone-950 scale-110 shadow-sm"
                            : "border-transparent hover:scale-105"
                        }`}
                        title={color.name}
                      >
                        {color.image ? (
                          <img
                            src={color.image}
                            alt={color.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="w-full h-full rounded-full block border border-black/10 shadow-inner"
                            style={{ backgroundColor: color.hex }}
                          />
                        )}
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sélecteur de tailles si existant */}
            {availableSizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-stone-700">Taille :</span>
                  <span className="font-semibold text-stone-950">
                    {selectedSize || "Standard"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {sizesForColor.map(({ size, inStock }) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => inStock && setSelectedSize(size)}
                        disabled={!inStock}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center relative overflow-hidden ${
                          !inStock
                            ? "border-stone-200/60 bg-stone-50 text-stone-300 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-stone-950 text-white border-stone-950 shadow-sm"
                            : "bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantité */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-stone-700">Quantité :</span>
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors"
                >
                  -
                </button>
                <span className="w-9 text-center text-xs font-bold text-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      currentVariant?.stock ? Math.min(currentVariant.stock, q + 1) : q + 1
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Footer action */}
          <div className="p-5 sm:p-6 bg-[#FAF9F6] border-t border-stone-100">
            <button
              onClick={handleAdd}
              disabled={isOutOfStock || isAdded}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md ${
                isAdded
                  ? "bg-emerald-600 text-white"
                  : isOutOfStock
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                  : "bg-stone-950 text-white hover:bg-brand-terracotta hover:shadow-lg"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Ajouté au panier !</span>
                </>
              ) : isOutOfStock ? (
                <span>Épuisé</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Ajouter au panier • {(price * quantity).toLocaleString()} FCFA
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

