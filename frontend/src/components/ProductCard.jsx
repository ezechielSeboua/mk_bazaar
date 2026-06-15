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

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
      className="group flex flex-col bg-[#FAFAFA] rounded-xl border border-stone-200/80 overflow-hidden
                 transition-all duration-300 hover:border-stone-400 hover:shadow-md
                 min-h-0 sm:h-[460px] mb-3"
    >
      <Link
        to={`/products/${product.slug}`}
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* Image */}
        <div className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[48%] bg-stone-100 overflow-hidden">
          <img
            src={backgroundImage}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {hasDiscount && (
            <div className="absolute top-1 left-1 z-10">
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-red-600 text-white rounded shadow-sm">
                -{discountPercentage}%
              </span>
            </div>
          )}

          <div className="absolute top-1 right-1 z-10">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm ${
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
        <div className="flex flex-col flex-1 p-2 sm:p-3 bg-white text-stone-900 justify-center space-y-0.5">
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-stone-500 font-medium">
            <div className="flex items-center truncate max-w-[65%]">
              <CategoryIcon />
              <span className="truncate">{categoryName}</span>
            </div>
            <div className="flex items-center gap-0.5 font-bold text-stone-800 shrink-0">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
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

      {/* Boutons : icônes agrandies, texte encore réduit */}
      <div className="p-1 sm:p-1.5 bg-white border-t border-stone-100 flex flex-col sm:flex-row items-stretch gap-1 sm:gap-1.5">
        {/* Ajouter au panier */}
        <button
          onClick={handleQuickAddToCart}
          disabled={!isAvailable}
          className={`flex-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-[6px] sm:text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 ${
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
                <Check className="w-4 h-4 stroke-[3px]" />
                <span className="hidden sm:inline">Ajouté</span>
                <span className="sm:hidden">OK</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter au panier</span>
                <span className="sm:hidden">Ajouter au panier</span>
              </>
            )
          ) : (
            "Épuisé"
          )}
        </button>

        {/* Commander WhatsApp */}
        <Link
          to={`/products/${product.slug}`}
          className="flex-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-[5px] sm:text-[8px] font-bold uppercase tracking-wider border border-[#c07b5a] text-[#c07b5a] hover:bg-[#c07b5a]/10 transition-all duration-300 flex items-center justify-center gap-1"
        >
          <WhatsAppIcon />
          <span className="hidden sm:inline">Commander sur WhatsApp</span>
          <span className="sm:hidden">Commander sur WhatsApp</span>
        </Link>
      </div>
    </motion.div>
  );
}