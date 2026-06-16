import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

export default function VariantPickerModal({ product, variants, onSelect, onClose }) {
  const productImage = product?.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-[#FAFAF9] w-full sm:max-w-2xl md:max-w-3xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-stone-100 flex-shrink-0">
            <img src={productImage} alt={product?.name} className="w-12 h-12 object-cover rounded-lg bg-stone-100" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">Choisir une option</p>
              <h3 className="text-sm font-bold text-stone-900 truncate">{product?.name}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>

          {/* Grid responsive : 2 colonnes mobile, 3 colonnes desktop */}
          <div className="overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {variants.map((v) => {
              const isOutOfStock = v.stock === 0;
              const attrText = v.attributes ? Object.values(v.attributes).join(" · ") : "Standard";
              const variantImg = v.image_path ? resolveMediaUrl(v.image_path) : productImage;

              return (
                <button
                  key={v.id}
                  onClick={() => !isOutOfStock && onSelect(v)}
                  disabled={isOutOfStock}
                  className={`group relative flex flex-col text-left rounded-xl border transition-all bg-white ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed border-stone-100" : "hover:border-stone-900 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="relative w-full aspect-square bg-stone-100 overflow-hidden rounded-t-xl">
                    <img src={variantImg} alt={attrText} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase text-stone-600">Épuisé</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-1">
                    <p className="text-[11px] font-bold text-stone-800 truncate">{attrText}</p>
                    <p className="text-xs font-black text-stone-950">{v.price.toLocaleString()} <span className="text-[9px] font-medium text-stone-400">FCFA</span></p>
                    <p className={`text-[9px] font-bold ${isOutOfStock ? "text-red-500" : "text-emerald-600"}`}>
                      {isOutOfStock ? "Rupture" : `${v.stock} en stock`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-stone-100 flex-shrink-0">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-stone-900 text-white text-[11px] uppercase tracking-widest font-bold">
              Annuler
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}