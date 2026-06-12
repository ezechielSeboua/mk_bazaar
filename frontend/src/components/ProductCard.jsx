import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Check } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

/* ---------- Icônes ---------- */
const CategoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-2.5 h-2.5 mr-0.5 text-stone-500"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z"
    />
  </svg>
);

export default function ProductCard({ product, delay = 0 }) {
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

  const hasStock = product.variants?.some((v) => v.stock > 0) ?? true;
  const isAvailable = product.is_active && hasStock;

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
      (item) => item.id === product.id && item.variant_id === variantId,
    );

    if (existingItemIndex > -1) {
      const targetQty = currentCart[existingItemIndex].quantity + 1;
      currentCart[existingItemIndex].quantity = Math.min(
        targetQty,
        maxAvailableStock,
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
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -6 }}
      className="group flex flex-col justify-between bg-[#FAFAFA] rounded-xl border border-stone-200/80 overflow-hidden
                 h-[220px] sm:h-[400px] md:h-[460px]
                 transition-all duration-300 hover:border-stone-400 hover:shadow-md"
    >
      <Link
        to={`/products/${product.slug}`}
        className="flex flex-col flex-grow overflow-hidden"
      >
        {/* Image */}
        <div className="relative w-full h-[48%] bg-stone-100 overflow-hidden">
          <img
            src={backgroundImage}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
          />

          {hasDiscount && (
            <div className="absolute top-1 left-1 z-10">
              <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-black uppercase tracking-wider bg-red-600 text-white rounded shadow-sm">
                -{discountPercentage}%
              </span>
            </div>
          )}

          <div className="absolute top-1 right-1 z-10">
            <span
              className={`inline-flex items-center px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md shadow-sm ${
                isAvailable
                  ? "bg-stone-900 text-white border border-stone-800"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {isAvailable ? "En stock" : "Rupture"}
            </span>
          </div>
        </div>

        {/* Contenu texte */}
        <div className="flex flex-col justify-between flex-grow p-1.5 sm:p-4 bg-white text-stone-900">
          <div>
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-stone-500 font-medium mb-0.5">
              <div className="flex items-center truncate max-w-[70%]">
                <CategoryIcon />
                <span className="truncate">{categoryName}</span>
              </div>
              <div className="flex items-center gap-0.5 font-bold text-stone-800">
                <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                <span className="text-[9px] sm:text-xs">{rating}</span>
              </div>
            </div>

            <h2 className="text-[10px] sm:text-sm font-bold tracking-tight text-stone-950 line-clamp-1 group-hover:text-stone-800 transition-colors">
              {name}
            </h2>

            {description && (
              <p className="text-[8px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <div className="mt-0.5 sm:mt-2 pt-0.5 sm:pt-2 border-t border-stone-100">
            <span className="text-[7px] sm:text-[10px] text-stone-400 uppercase tracking-widest block font-medium">
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

      {/* Bouton ultra compact */}
      {/* <div className="p-1 sm:p-3 bg-white border-t border-stone-100">
        <button
          onClick={handleQuickAddToCart}
          disabled={!isAvailable}
          className={`w-full py-0.5 sm:py-2.5 rounded flex items-center justify-center gap-0.5 text-[8px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 min-h-[44px] ${
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
                <Check className="w-2 h-2 sm:w-3.5 sm:h-3.5 stroke-[3px]" />
                Ajouté !
              </>
            ) : (
              <>
                <ShoppingBag className="w-2 h-2 sm:w-3.5 sm:h-3.5" />
                Ajouter
              </>
            )
          ) : (
            "Épuisé"
          )}
        </button>
      </div> */}

      {/* Bouton modifié pour mobile */}
      <div className="p-1 sm:p-3 bg-white border-t border-stone-100 flex justify-center">
        <button
          onClick={handleQuickAddToCart}
          disabled={!isAvailable}
          className={`px-4 py-2 sm:w-full rounded flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
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
                <Check className="w-3 h-3 stroke-[3px]" />
                Ajouté !
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3" />
                <span className="hidden sm:inline">Ajouter au panier</span>
                <span className="sm:hidden">Ajouter</span>
              </>
            )
          ) : (
            "Épuisé"
          )}
        </button>
      </div>
    </motion.div>
  );
}
