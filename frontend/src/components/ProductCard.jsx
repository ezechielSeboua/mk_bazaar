import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingBag, Heart, Check, Eye } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";
import QuickShopModal from "./QuickShopModal";
import { useWishlist } from "../contexts/WishlistContext";

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

export default function ProductCard({ product, delay = 0 }) {
  const [showQuickShop, setShowQuickShop] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const loved = isInWishlist(product.id);

  const primaryImage = product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;
  const secondaryImage = product.image_path?.[1]
    ? resolveMediaUrl(product.image_path[1])
    : null;

  const [activeImageOverride, setActiveImageOverride] = useState(null);
  const [activeColorName, setActiveColorName] = useState(null);

  const name = product.name || "Sans titre";
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "Collection";
  const currentPrice = product.price || 0;
  const oldPrice = product.old_price;
  const hasDiscount = oldPrice && oldPrice > currentPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const hasStock = hasVariants
    ? variants.some((v) => v.stock > 0)
    : (product.stock ?? 0) > 0;
  const isAvailable = product.is_active && hasStock;

  // Extraction des couleurs uniques
  const colors = useMemo(() => {
    const map = new Map();
    variants.forEach((v) => {
      const col = v.attributes?.couleur;
      if (col && !map.has(col)) {
        map.set(col, {
          name: col,
          image: v.image_path ? resolveMediaUrl(v.image_path) : null,
          hex: getHexColor(col),
        });
      }
    });
    return Array.from(map.values());
  }, [variants]);

  // Extraction des tailles uniques
  const sizeCount = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => {
      const s = v.attributes?.taille || v.attributes?.pointure;
      if (s) set.add(s);
    });
    return set.size;
  }, [variants]);

  const displayedImage = activeImageOverride || (isHovered && secondaryImage ? secondaryImage : primaryImage);

  const addToCart = (variant, qty = 1) => {
    try {
      const localCartRaw = localStorage.getItem("mk_bazaar_cart");
      const currentCart = localCartRaw ? JSON.parse(localCartRaw) : [];
      const variantId = variant?.id || null;
      const existingIndex = currentCart.findIndex(
        (item) => item.id === product.id && item.variant_id === variantId
      );

      const itemPrice = variant?.price || currentPrice;
      const itemImage = variant?.image_path ? resolveMediaUrl(variant.image_path) : primaryImage;

      if (existingIndex > -1) {
        currentCart[existingIndex].quantity += qty;
      } else {
        currentCart.push({
          id: product.id,
          variant_id: variantId,
          name: name,
          price: itemPrice,
          quantity: qty,
          image: itemImage,
          attributes: variant?.attributes || null,
          category: categoryName,
          slug: product.slug,
        });
      }
      localStorage.setItem("mk_bazaar_cart", JSON.stringify(currentCart));
      window.dispatchEvent(new Event("cart-updated"));
      window.dispatchEvent(new Event("show-basket-preview"));

      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
    } catch (e) {
      console.error("Erreur ajout panier:", e);
    }
    setShowQuickShop(false);
  };

  const handleQuickAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    if (variants.length > 1) {
      setShowQuickShop(true);
    } else {
      addToCart(variants[0] || { id: null, price: currentPrice }, 1);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay }}
      className="group relative flex flex-col h-full bg-white rounded-2xl border border-stone-200/80 transition-all duration-300 hover:border-stone-400 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImageOverride(null);
        setActiveColorName(null);
      }}
    >
      {/* Conteneur Image & Actions visuelles */}
      <div className="relative aspect-[3/4] bg-[#FAF9F6] overflow-hidden">
        <Link
          to={`/products/${product.slug}`}
          className="block w-full h-full"
          aria-label={`Voir la fiche détaillée de ${name}`}
        >
          {/* Image Principale ou Secondaire avec fondu fluide */}
          <img
            src={displayedImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Badge Remise */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white rounded-full shadow-md">
                -{discountPercentage}%
              </span>
            </div>
          )}
        </Link>

        {/* Bouton Favori ergonomique */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
          aria-label={loved ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              loved ? "fill-rose-500 text-rose-500" : "text-stone-400 hover:text-rose-500"
            }`}
          />
        </button>

        {/* Badge Épuisé si indisponible */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold uppercase text-white tracking-widest bg-stone-900/90 px-3.5 py-1.5 rounded-full border border-white/20">
              Épuisé
            </span>
          </div>
        )}

        {/* Bouton Ajout Rapide flottant (Desktop : glisse au hover / Mobile : visible discret) */}
        {isAvailable && (
          <div className="absolute inset-x-3 bottom-3 z-10">
            {/* Desktop Quick-Add */}
            <button
              onClick={handleQuickAction}
              className={`hidden sm:flex w-full py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider items-center justify-center gap-2 backdrop-blur-md shadow-lg transition-all duration-300 transform ${
                addedFeedback
                  ? "bg-emerald-600 text-white opacity-100 translate-y-0"
                  : "bg-stone-950/90 hover:bg-brand-terracotta text-white opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0"
              }`}
            >
              {addedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ajouté !</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{variants.length > 1 ? "Choisir une option" : "Ajout express"}</span>
                </>
              )}
            </button>

            {/* Mobile Quick-Add Button (rond au coin droit de l'image) */}
            <button
              onClick={handleQuickAction}
              className="sm:hidden absolute right-0 bottom-0 w-9 h-9 rounded-full bg-stone-950/90 text-white shadow-md flex items-center justify-center active:scale-95 transition-all"
              aria-label="Ajouter au panier"
            >
              {addedFeedback ? (
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Informations produit */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 space-y-2">
        {/* Catégorie & Note */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
          <span className="truncate max-w-[120px] uppercase tracking-wider text-brand-terracotta font-semibold">
            {categoryName}
          </span>
          {product.rating != null && (
            <div className="flex items-center font-bold text-stone-800">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
              {product.rating}
            </div>
          )}
        </div>

        {/* Titre */}
        <Link
          to={`/products/${product.slug}`}
          className="text-xs sm:text-sm font-medium text-stone-900 hover:text-brand-terracotta line-clamp-1 leading-snug transition-colors"
        >
          {name}
        </Link>

        {/* Pastilles de couleurs si le produit en a */}
        {colors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
            {colors.slice(0, 4).map((c) => {
              const isActive = activeColorName === c.name;
              return (
                <button
                  key={c.name}
                  onClick={(e) => {
                    e.preventDefault();
                    if (c.image) setActiveImageOverride(c.image);
                    setActiveColorName(c.name);
                  }}
                  onMouseEnter={() => {
                    if (c.image) setActiveImageOverride(c.image);
                    setActiveColorName(c.name);
                  }}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    isActive ? "scale-125 border-stone-900 shadow-sm" : "border-stone-300 hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={`Couleur ${c.name}`}
                />
              );
            })}
            {colors.length > 4 && (
              <span className="text-[10px] text-stone-400 font-medium">
                +{colors.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Prix et déclinaisons */}
        <div className="mt-auto pt-2 border-t border-stone-100 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-serif font-bold text-stone-950">
              {currentPrice.toLocaleString()} FCFA
            </span>
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {oldPrice.toLocaleString()}
              </span>
            )}
          </div>
          {(colors.length > 1 || sizeCount > 1) && (
            <span className="text-[10px] font-medium text-stone-400 shrink-0">
              {colors.length > 1 && `${colors.length} couleurs`}
              {colors.length > 1 && sizeCount > 1 && " · "}
              {sizeCount > 1 && `${sizeCount} tailles`}
            </span>
          )}
        </div>
      </div>

      {/* Modal de sélection rapide */}
      {showQuickShop && (
        <QuickShopModal
          product={product}
          variants={variants}
          onSelect={addToCart}
          onClose={() => setShowQuickShop(false)}
        />
      )}
    </motion.article>
  );
}
