import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Heart } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";
import VariantPickerModal from "./VariantPickerModal";
import { useWishlist } from "../contexts/WishlistContext";

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
    className="w-3 h-3 sm:w-4 sm:h-4"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function ProductCard({ product, delay = 0 }) {
  const [showVariantModal, setShowVariantModal] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const loved = isInWishlist(product.id);

  const backgroundImage = product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;
  const name = product.name || "Sans titre";
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "—";
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

  const addToCart = (variant) => {
    const localCartRaw = localStorage.getItem("mk_bazaar_cart");
    const currentCart = localCartRaw ? JSON.parse(localCartRaw) : [];
    const variantId = variant?.id || null;
    const existingIndex = currentCart.findIndex(
      (item) => item.id === product.id && item.variant_id === variantId,
    );

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        variant_id: variantId,
        name: name,
        price: variant?.price || currentPrice,
        quantity: 1,
        image: backgroundImage,
        attributes: variant?.attributes || null,
        category: categoryName,
        slug: product.slug,
      });
    }
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(currentCart));
    window.dispatchEvent(new Event("cart-updated"));
    setShowVariantModal(false);
    window.dispatchEvent(new Event("show-basket-preview"));
  };

  const handleAddToCartClick = () => {
    if (!isAvailable) return;
    if (variants.length > 1) {
      setShowVariantModal(true);
    } else {
      addToCart(variants[0] || { id: null, price: currentPrice });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay }}
      className="group relative flex flex-col h-full bg-white rounded-xl border border-stone-200/80 transition-all duration-300 hover:border-stone-400 hover:shadow-lg"
    >
      <Link
        to={`/products/${product.slug}`}
        className="block aspect-[4/5] sm:aspect-[3/4] bg-stone-100 overflow-hidden rounded-t-xl"
      >
        <img
          src={backgroundImage}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase bg-red-600 text-white rounded-md shadow-sm">
              -{discountPercentage}%
            </span>
          </div>
        )}

        {/* Bouton favori */}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:scale-110"
          aria-label={loved ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${loved ? "fill-rose-500 text-rose-500" : "text-stone-400"}`} />
        </button>
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase text-stone-600 tracking-widest">
              Épuisé
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-stone-500 font-medium">
          <div className="flex items-center">
            <CategoryIcon />{" "}
            <span className="truncate max-w-[80px]">{categoryName}</span>
          </div>
          {product.rating != null && (
            <div className="flex items-center font-bold text-stone-800">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />{" "}
              {product.rating}
            </div>
          )}
        </div>
        <h2 className="text-sm sm:text-base font-bold text-stone-950 line-clamp-2 leading-snug">
          {name}
        </h2>
        <div className="mt-auto pt-2 border-t border-stone-100 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-stone-950">
              {currentPrice.toLocaleString()} FCFA
            </span>
            {oldPrice && oldPrice > currentPrice && (
              <span className="text-[11px] text-stone-400 line-through">
                {oldPrice.toLocaleString()}
              </span>
            )}
          </div>
          {variants.length > 1 && (
            <span className="text-[10px] font-medium text-stone-400">
              +{variants.length} options
            </span>
          )}
        </div>
      </div>

      {/* Boutons ajustés pour mobile : texte réduit, icônes plus petites, padding réduit */}
      <div className="p-3 pt-0 flex flex-col gap-2">
        <button
          onClick={handleAddToCartClick}
          disabled={!isAvailable}
          className={`w-full py-2.5 sm:py-3 rounded-lg text-[7px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
            isAvailable
              ? "bg-white border border-[#c07b5a] text-[#c07b5a] hover:bg-[#a5684a] hover:text-white"
              : "bg-white text-[#a5684a] cursor-not-allowed"
          }`}
        >
          <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
          {isAvailable ? "Ajouter au panier" : "Indisponible"}
        </button>
        <Link
          to={`/products/${product.slug}`}
          className="w-full py-2.5 sm:py-3 rounded-lg border bg-emerald-600 text-white text-[7px] sm:text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2"
        >
          <WhatsAppIcon /> Commander maintenant
        </Link>
      </div>

      {showVariantModal && (
        <VariantPickerModal
          product={product}
          variants={variants}
          onSelect={addToCart}
          onClose={() => setShowVariantModal(false)}
        />
      )}
    </motion.div>
  );
}