import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingBag,
  Check,
  X,
  AlertTriangle,
  Package,
} from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";
import { createPortal } from "react-dom";

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
  const [showVariantModal, setShowVariantModal] = useState(false);

  const backgroundImage = product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;
  const name = product.name || "Sans titre";
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "—";
  const rating = product.rating || "4.8";
  const currentPrice = product.price || 0;
  const oldPrice = product.old_price;
  const hasDiscount = oldPrice && oldPrice > currentPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;
  const hasStock = product.variants?.some((v) => v.stock > 0) ?? true;
  const isAvailable = product.is_active && hasStock;
  const variants = product.variants || [];

  // Ajout au panier (fusionne si déjà présent)
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
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  // Gestion du clic sur "Ajouter au panier"
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
      whileHover={{ y: -4 }}
      className="group relative flex flex-col bg-white rounded-xl border border-stone-200/80 overflow-hidden transition-all duration-300 hover:border-stone-400 hover:shadow-lg"
    >
      {/* Image + lien fiche produit */}
      <Link
        to={`/products/${product.slug}`}
        className="block aspect-[3/4] bg-stone-100 overflow-hidden"
      >
        <img
          src={backgroundImage}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-full">
              -{discountPercentage}%
            </span>
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold uppercase text-stone-600">
              Épuisé
            </span>
          </div>
        )}
      </Link>

      {/* Contenu textuel */}
      <div className="flex flex-col flex-1 p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] text-stone-500 font-medium">
          <div className="flex items-center">
            <CategoryIcon />
            {categoryName}
          </div>
          <div className="flex items-center font-bold text-stone-800">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" />
            {rating}
          </div>
        </div>
        <h2 className="text-xs sm:text-sm font-bold text-stone-950 line-clamp-2 leading-tight">
          {name}
        </h2>
        <div className="pt-1 border-t border-stone-100 flex items-end justify-between">
          <div>
            <span className="text-sm font-black text-stone-950">
              {currentPrice.toLocaleString()} FCFA
            </span>
            {oldPrice && oldPrice > currentPrice && (
              <span className="ml-1 text-[10px] text-stone-400 line-through">
                {oldPrice.toLocaleString()}
              </span>
            )}
          </div>
          {variants.length > 1 && (
            <span className="text-[9px] text-stone-400">
              +{variants.length} options
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 pt-0 flex flex-col gap-1.5">
        <button
          onClick={handleAddToCartClick}
          disabled={!isAvailable}
          className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
            isAvailable
              ? "bg-[#c07b5a] text-white hover:bg-[#a5684a]"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {isAvailable ? "Ajouter au panier" : "Indisponible"}
        </button>

        {/* Bouton "Commander maintenant" → redirige vers la page produit */}
        <Link
          to={`/products/${product.slug}`}
          className="w-full py-2.5 rounded-lg border border-emerald-700 text-emerald-700 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" />
          Commander maintenant
        </Link>
      </div>

      {/* --------------- POP-UP AJOUT AU PANIER (local sur la carte) --------------- */}
      <AnimatePresence>
        {isAdded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-[2px]"
          >
            <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-xl w-full max-w-[240px] text-center relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsAdded(false);
                }}
                className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 rounded-full p-2">
                  <Check className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">
                    Produit ajouté au panier !
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {name} a été ajouté à votre panier.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------- MODALE DE SÉLECTION DES VARIANTES (ENRICHIE) --------------- */}
      {showVariantModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowVariantModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Tout le contenu de la modale reste identique */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">
                    Choisir une option
                  </h3>
                  <button
                    onClick={() => setShowVariantModal(false)}
                    className="text-stone-400 hover:text-stone-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {variants.map((v) => {
                    const isOutOfStock = v.stock === 0;
                    const lowStock = v.stock > 0 && v.stock <= 3;
                    const attrText = v.attributes
                      ? Object.values(v.attributes).join(" - ")
                      : "Standard";
                    const variantDiscount =
                      v.old_price && v.old_price > v.price
                        ? Math.round(
                            ((v.old_price - v.price) / v.old_price) * 100,
                          )
                        : null;
                    return (
                      <button
                        key={v.id}
                        onClick={() => addToCart(v)}
                        disabled={isOutOfStock}
                        className={`w-full p-4 rounded-xl border text-left text-xs transition-all ${
                          isOutOfStock
                            ? "border-stone-100 bg-stone-50 text-stone-400 cursor-not-allowed"
                            : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-stone-900">
                            {attrText}
                          </span>
                          {variantDiscount && !isOutOfStock && (
                            <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              -{variantDiscount}%
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="font-bold text-stone-950">
                              {v.price.toLocaleString()} FCFA
                            </span>
                            {v.old_price && v.old_price > v.price && (
                              <span className="ml-1.5 text-[10px] text-stone-400 line-through">
                                {v.old_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isOutOfStock ? (
                              <span className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Rupture
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-medium flex items-center gap-0.5 ${
                                  lowStock
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                <Package className="w-3 h-3" />
                                {v.stock} en stock
                                {lowStock && " (dernières pièces)"}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isOutOfStock && (
                          <div className="mt-2 w-full bg-stone-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${lowStock ? "bg-amber-400" : "bg-emerald-400"}`}
                              style={{
                                width: `${Math.min(100, (v.stock / 10) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="w-full py-3 rounded-xl border border-stone-200 text-xs uppercase tracking-wider font-bold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Annuler
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </motion.div>
  );
}
