import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { createPortal } from "react-dom";
import { resolveMediaUrl } from "../config/env";

export default function BasketPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    try {
      const raw = localStorage.getItem("mk_bazaar_cart");
      setCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      setCartItems([]);
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      loadCart();
      setIsOpen(true);
    };
    const handleUpdate = () => {
      loadCart();
    };

    window.addEventListener("show-basket-preview", handleOpen);
    window.addEventListener("cart-updated", handleUpdate);
    return () => {
      window.removeEventListener("show-basket-preview", handleOpen);
      window.removeEventListener("cart-updated", handleUpdate);
    };
  }, []);

  // Fermeture avec touche Echap et blocage du scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const updateQuantity = (id, variantId, delta) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id && (item.variant_id ?? null) === (variantId ?? null)) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    setCartItems(updated);
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const removeItem = (id, variantId) => {
    const updated = cartItems.filter(
      (item) => !(item.id === id && (item.variant_id ?? null) === (variantId ?? null))
    );
    setCartItems(updated);
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay d'arrière-plan */}
          <motion.div
            key="basket-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer latéral */}
          <motion.aside
            key="basket-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[121] bg-white shadow-2xl flex flex-col focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Mon panier"
          >
            {/* Header du drawer */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-brand-sand">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white shadow-sm border border-stone-200/60">
                  <ShoppingBag className="w-4 h-4 text-brand-terracotta" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900 leading-none">
                    Mon Panier
                  </h2>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {totalItems} article{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
                aria-label="Fermer le panier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps défilable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stone-100">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="font-serif text-lg text-stone-800 mb-1">Votre panier est vide</p>
                  <p className="text-xs text-stone-400 max-w-xs mb-6">
                    Découvrez nos collections pour ajouter vos pièces favorites.
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 rounded-xl bg-stone-950 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-all"
                  >
                    Découvrir les pièces
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.variant_id ?? "base"}`}
                    className="py-4 flex gap-4 items-start"
                  >
                    <img
                      src={resolveMediaUrl(item.image)}
                      alt={item.name}
                      className="w-18 h-22 sm:w-20 sm:h-24 object-cover rounded-xl bg-stone-100 shrink-0 border border-stone-200/60"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                        {item.name}
                      </h3>
                      {item.attributes && (
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {Object.entries(item.attributes)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-xs font-bold text-stone-950 mt-1">
                        {item.price?.toLocaleString()} FCFA
                      </p>

                      {/* Contrôles quantité & suppression */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.variant_id, -1)}
                            className="px-2.5 py-1 text-stone-600 hover:bg-stone-200/60 text-xs font-semibold"
                            aria-label="Diminuer"
                          >
                            −
                          </button>
                          <span className="px-2.5 py-1 text-xs font-semibold min-w-[24px] text-center bg-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.variant_id, 1)}
                            className="px-2.5 py-1 text-stone-600 hover:bg-stone-200/60 text-xs font-semibold"
                            aria-label="Augmenter"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.variant_id)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors"
                          aria-label="Supprimer cet article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer avec sous-total et CTA */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-stone-100 bg-brand-sand space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600 font-medium">Sous-total</span>
                  <span className="font-serif text-lg font-bold text-stone-950">
                    {subtotal.toLocaleString()} FCFA
                  </span>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/panier"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4 px-6 rounded-xl bg-stone-950 text-white text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-md active:scale-[0.99]"
                  >
                    <span>Finaliser la commande</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 text-center text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                    <span>Livraison sécurisée</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                    <span>Paiement à réception</span>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
