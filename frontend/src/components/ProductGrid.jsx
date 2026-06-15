import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Check, Eye } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

/* ---------- Icônes ---------- */
const CategoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 mr-1 text-stone-500"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z"
    />
  </svg>
);

/* ---------- Squelette ---------- */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden h-[220px] sm:h-[340px] md:h-[400px] animate-pulse flex flex-col justify-between">
      <div className="w-full h-[45%] bg-stone-200" />
      <div className="p-1.5 flex-grow flex flex-col justify-center">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-2.5 bg-stone-200 rounded w-1/3" />
            <div className="h-2.5 bg-stone-200 rounded w-8" />
          </div>
          <div className="h-3.5 bg-stone-200 rounded w-3/4" />
          <div className="h-2.5 bg-stone-200 rounded w-5/6" />
          <div className="h-2.5 bg-stone-200 rounded w-1/2" />
        </div>
      </div>
      <div className="p-1 border-t border-stone-100">
        <div className="h-7 bg-stone-200 rounded-lg w-full" />
      </div>
    </div>
  );
}

/* ---------- Carte produit avec espacement uniforme ---------- */
function GridProductCard({ product, index }) {
  const [isAdded, setIsAdded] = useState(false);

  const backgroundImage = product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;

  const name = product.name || "Sans titre";
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "—";

  const description = product.description || "";
  const rating = product.rating || "4.8";
  const currentPrice = product.price || 0;
  const oldPrice = product.old_price;
  const hasDiscount = oldPrice && oldPrice > currentPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;

  const isAvailable = product.is_active !== false;

  const handleQuickAddToCart = (e) => {
    e.preventDefault();
    if (!isAvailable) return;

    const localCartRaw = localStorage.getItem("mk_bazaar_cart");
    let currentCart = localCartRaw ? JSON.parse(localCartRaw) : [];

    const targetVariant =
      product.variants && product.variants.length > 0
        ? product.variants.find((v) => v.stock > 0) || product.variants[0]
        : null;

    const variantId = targetVariant?.id || null;
    const maxAvailableStock = targetVariant ? targetVariant.stock : 99;

    const existingItemIndex = currentCart.findIndex(
      (item) => item.id === product.id && item.variant_id === variantId
    );

    if (existingItemIndex > -1) {
      const targetQty = currentCart[existingItemIndex].quantity + 1;
      currentCart[existingItemIndex].quantity = Math.min(
        targetQty,
        maxAvailableStock
      );
    } else {
      currentCart.push({
        id: product.id,
        variant_id: variantId,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        quantity: 1,
        attributes: targetVariant?.attributes || null,
        image: backgroundImage,
        category: categoryName,
      });
    }

    localStorage.setItem("mk_bazaar_cart", JSON.stringify(currentCart));
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col bg-white rounded-xl border border-stone-200/80 overflow-hidden
                 h-[220px] sm:h-[340px] md:h-[400px] transition-all duration-300 hover:border-stone-400 hover:shadow-md"
    >
      <Link
        to={`/products/${product.slug}`}
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* Image */}
        <div className="relative w-full h-[45%] bg-stone-100 overflow-hidden shrink-0">
          <img
            src={backgroundImage}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {hasDiscount && (
            <div className="absolute top-1 left-1 z-10">
              <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-black uppercase tracking-wider bg-red-600 text-white rounded shadow-sm">
                -{discountPercentage}%
              </span>
            </div>
          )}
          <div className="absolute top-1 right-1 z-10">
            <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-stone-900 text-white border border-stone-800 rounded-md shadow-sm">
              En stock
            </span>
          </div>
        </div>

        {/* Contenu texte centré verticalement */}
        <div className="flex flex-col flex-1 p-1.5 sm:p-3 bg-white text-stone-900 justify-center space-y-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-stone-500 font-medium">
            <div className="flex items-center truncate max-w-[65%]">
              <CategoryIcon />
              <span className="truncate">{categoryName}</span>
            </div>
            <div className="flex items-center gap-0.5 font-bold text-stone-800 shrink-0">
              <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
              <span className="text-[9px] sm:text-xs">{rating}</span>
            </div>
          </div>
          <h2 className="text-[10px] sm:text-sm font-bold tracking-tight text-stone-950 line-clamp-1 group-hover:text-stone-800 transition-colors">
            {name}
          </h2>
          {description && (
            <p className="text-[8px] sm:text-xs text-stone-500 leading-snug line-clamp-1 sm:line-clamp-2">
              {description}
            </p>
          )}

          {/* Prix – directement après la description, sans mt-auto */}
          <div className="pt-1 border-t border-stone-100">
            <span className="text-[7px] sm:text-[10px] text-stone-400 uppercase tracking-widest block font-medium leading-none">
              {hasDiscount ? "Promo" : "Prix"}
            </span>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-[11px] sm:text-lg font-black tracking-tight text-stone-950">
                {currentPrice.toLocaleString()} FCFA
              </span>
              {hasDiscount && (
                <span className="text-[8px] sm:text-sm text-stone-400 line-through font-medium">
                  {oldPrice.toLocaleString()} FCFA
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Double bouton */}
      <div className="p-1 sm:p-1.5 bg-white border-t border-stone-100 flex flex-col sm:flex-row items-stretch gap-1 sm:gap-1.5">
        <button
          onClick={handleQuickAddToCart}
          disabled={!isAvailable}
          className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 ${
            isAvailable
              ? isAdded
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-stone-950 text-white hover:bg-stone-900 active:bg-black shadow-sm"
              : "bg-stone-100 text-stone-400 cursor-not-allowed"
          }`}
        >
          {isAvailable ? (
            isAdded ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3px]" />
                <span className="hidden sm:inline">Ajouté</span>
                <span className="sm:hidden">OK</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Panier</span>
                <span className="sm:hidden">Ajouter</span>
              </>
            )
          ) : (
            "Épuisé"
          )}
        </button>

        <Link
          to={`/products/${product.slug}`}
          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-stone-300 text-stone-700 hover:bg-stone-100 transition-all duration-300 flex items-center justify-center gap-1"
        >
          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Voir</span>
          <span className="sm:hidden">Détails</span>
        </Link>
      </div>
    </motion.div>
  );
}

/* ---------- Grille Principale ---------- */
export default function ProductGrid({ products = [], loading = false }) {
  const inStockProducts = products.filter((product) => {
    if (!product.variants || !Array.isArray(product.variants)) {
      return product.is_active !== false;
    }
    return (
      product.is_active !== false && product.variants.some((v) => v.stock > 0)
    );
  });

  return (
    <section className="px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl mx-auto border-t border-stone-200/80 bg-[#FAFAFA]">
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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
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
          inStockProducts.map((product, index) => (
            <GridProductCard key={product.id || index} product={product} index={index} />
          ))
        )}
      </div>

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