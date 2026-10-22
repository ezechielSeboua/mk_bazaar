import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/env';

export default function StickyMobileBar({
  isVisible,
  product,
  selectedVariant,
  onAddToCart,
  onOpenWhatsApp,
}) {
  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.price || 0;
  const image = selectedVariant?.image_path
    ? resolveMediaUrl(selectedVariant.image_path)
    : product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;

  const variantSummary = selectedVariant?.attributes
    ? Object.values(selectedVariant.attributes).join(' · ')
    : '';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pb-safe"
        >
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            {/* Visuel et Titre */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-13 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-serif font-medium text-stone-950 truncate">
                  {product.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#c07b5a]">
                    {currentPrice.toLocaleString()} FCFA
                  </span>
                  {variantSummary && (
                    <span className="text-[10px] text-stone-400 font-light truncate">
                      ({variantSummary})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action rapides */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onAddToCart}
                aria-label="Ajouter au panier"
                className="p-3 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="py-3 px-4 rounded-xl bg-stone-950 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-stone-800 active:scale-95 transition-all shadow-md"
              >
                Commander
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

