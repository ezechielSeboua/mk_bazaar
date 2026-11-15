import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatFCFA, readCart, shopButton, writeCart } from "./shop/shopUtils";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

/**
 * Aperçu du panier, ouvert après chaque ajout (événement « show-basket-preview »).
 * Les prix sont indicatifs : le panier les relit, le serveur les recalcule.
 */
export default function BasketPreview() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const show = () => { setItems(readCart()); setOpen(true); };
    const update = () => setItems(readCart());
    window.addEventListener("show-basket-preview", show);
    window.addEventListener("cart-updated", update);
    return () => {
      window.removeEventListener("show-basket-preview", show);
      window.removeEventListener("cart-updated", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useBodyScrollLock(open);

  const same = (item, target) => item.id === target.id && (item.variant_id ?? null) === (target.variant_id ?? null);
  const setQuantity = (target, quantity) => {
    const next = quantity <= 0
      ? items.filter((item) => !same(item, target))
      : items.map((item) => (same(item, target) ? { ...item, quantity: item.stock ? Math.min(quantity, item.stock) : quantity } : item));
    setItems(next);
    writeCart(next);
  };

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] font-admin antialiased text-[#111]">
          <motion.div className="absolute inset-0 bg-[#111]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-preview-title"
            className="absolute inset-y-0 right-0 w-full max-w-md bg-white flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="flex justify-between items-center px-6 py-[18px] border-b border-[#ececec]">
              <h2 id="basket-preview-title" className="text-base font-semibold">Mon panier {count > 0 && <span className="font-normal text-[#767676]">({count})</span>}</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1 -mr-1 text-[#555] hover:text-[#111]" aria-label="Fermer le panier">
                <X className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-9 h-9 mx-auto text-[#bbb]" strokeWidth={1.2} aria-hidden="true" />
                  <p className="font-medium mt-3">Votre panier est vide</p>
                  <button type="button" onClick={() => setOpen(false)} className="mt-4 text-sm underline">Continuer mes achats</button>
                </div>
              ) : (
                <ul className="divide-y divide-[#f0f0f0]">
                  {items.map((item) => (
                    <li key={`${item.id}-${item.variant_id ?? "u"}`} className="flex gap-4 py-4">
                      <img src={item.image} alt="" className="w-[72px] h-[90px] object-cover rounded-sm bg-[#f3f3f3] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.attributes && <p className="text-[13px] text-[#666] mt-0.5">{Object.values(item.attributes).filter(Boolean).join(" · ")}</p>}
                        <p className="text-sm font-semibold tabular-nums mt-1">
                          {item.base_price > item.price && <s className="mr-1.5 font-normal text-[#767676] text-[13px]">{formatFCFA(item.base_price)}</s>}
                          {formatFCFA(item.price)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="inline-flex items-center h-8 border border-[#d9d9d9] rounded" role="group" aria-label={`Quantité de ${item.name}`}>
                            <button type="button" onClick={() => setQuantity(item, item.quantity - 1)} className="w-8 h-full grid place-items-center" aria-label="Diminuer">
                              <Minus className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                            </button>
                            <span className="w-7 text-center text-[13px] tabular-nums">{item.quantity}</span>
                            <button type="button" onClick={() => setQuantity(item, item.quantity + 1)} disabled={item.stock && item.quantity >= item.stock} className="w-8 h-full grid place-items-center disabled:opacity-40" aria-label="Augmenter">
                              <Plus className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                            </button>
                          </div>
                          <button type="button" onClick={() => setQuantity(item, 0)} className="p-1 text-[#767676] hover:text-[#b42318]" aria-label={`Retirer ${item.name}`}>
                            <Trash2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-[#ececec] space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[#555]">Sous-total</span><span className="font-semibold tabular-nums">{formatFCFA(subtotal)}</span></div>
                <p className="text-[12.5px] text-[#666]">Livraison calculée selon votre commune. Commande et paiement confirmés sur WhatsApp.</p>
                <Link to="/panier" onClick={() => setOpen(false)} className={`${shopButton("primary", "lg")} w-full`}>Voir le panier et commander</Link>
                <button type="button" onClick={() => setOpen(false)} className={`${shopButton("secondary")} w-full`}>Continuer mes achats</button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
