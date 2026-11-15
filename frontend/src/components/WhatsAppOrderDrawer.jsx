import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Minus, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { resolveMediaUrl } from '../config/env';
import { formatVariantLabel } from '../utils/whatsappMessage';
import DeliveryFields from './shop/DeliveryFields';
import { submitOrder, validateCheckout } from './shop/checkout';
import { formatFCFA, getPricing, productImage, shopButton, showStrikethrough } from './shop/shopUtils';

/**
 * Commande express d'un article depuis la fiche produit : coordonnées de
 * livraison, enregistrement de la commande puis envoi sur WhatsApp.
 * Le total définitif (remises, livraison) est calculé par le serveur.
 */
export default function WhatsAppOrderDrawer({ isOpen, onClose, product, selectedVariant, quantity, setQuantity, shippingZones = [] }) {
  const { user } = useAuth();
  const { contactInfo } = useSiteSettings();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', phone: '', zoneId: null, address: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!product) return null;

  const pricing = getPricing(product, selectedVariant);
  const zone = shippingZones.find((z) => z.id === values.zoneId) ?? null;
  const subtotal = pricing.final_price * quantity;
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const image = selectedVariant?.image_path ? resolveMediaUrl(selectedVariant.image_path) : productImage(product);
  const options = formatVariantLabel(selectedVariant?.attributes).replace(/ - /g, ' · ');

  const confirm = async () => {
    const found = validateCheckout({ user, name: values.name, phone: values.phone, zone, address: values.address });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { order, whatsappLink } = await submitOrder({
        items: [{ product_id: product.id, variant_id: selectedVariant?.id ?? null, quantity, name: product.name, attributes: selectedVariant?.attributes }],
        user,
        name: values.name,
        phone: values.phone,
        zone,
        address: values.address,
        whatsappNumber: contactInfo?.whatsapp,
        title: 'ACHAT EXPRESS — MK BAZAAR',
      });
      onClose();
      navigate('/commande-envoyee', { state: { order, whatsappLink, guest: !user } });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 font-admin antialiased text-[#111]">
          <motion.div className="absolute inset-0 bg-[#111]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="express-title"
            className="absolute inset-y-0 right-0 w-full max-w-md bg-white flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex justify-between items-center px-6 py-[18px] border-b border-[#ececec]">
              <h2 id="express-title" className="text-base font-semibold">Commander sur WhatsApp</h2>
              <button type="button" onClick={onClose} className="p-1 -mr-1 text-[#555] hover:text-[#111]" aria-label="Fermer">
                <X className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="flex gap-4">
                <img src={image} alt="" className="w-[72px] h-[92px] object-cover rounded-sm bg-[#f3f3f3]" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product.name}</p>
                  {options && <p className="text-[13px] text-[#666] mt-0.5">{options}</p>}
                  <p className="text-sm font-semibold tabular-nums mt-1.5">
                    {showStrikethrough(pricing) && <s className="mr-2 font-normal text-[#767676]">{formatFCFA(pricing.base_price)}</s>}
                    {formatFCFA(pricing.final_price)}
                  </p>
                  <div className="inline-flex items-center h-9 mt-2.5 border border-[#d9d9d9] rounded" role="group" aria-label="Quantité">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-9 h-full grid place-items-center disabled:opacity-40" aria-label="Diminuer la quantité">
                      <Minus className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                    </button>
                    <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">{quantity}</span>
                    <button type="button" onClick={() => setQuantity(Math.min(stock || 1, quantity + 1))} disabled={quantity >= (stock || 1)} className="w-9 h-full grid place-items-center disabled:opacity-40" aria-label="Augmenter la quantité">
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <DeliveryFields user={user} values={values} onChange={setValues} errors={errors} zones={shippingZones} idPrefix="express" />

              <dl className="space-y-1.5 text-sm tabular-nums border-t border-[#ececec] pt-4">
                <div className="flex justify-between"><dt className="text-[#555]">Articles</dt><dd>{formatFCFA(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#555]">Livraison</dt><dd>{zone ? formatFCFA(zone.price) : 'Selon la commune'}</dd></div>
                <div className="flex justify-between text-base font-semibold pt-2"><dt>Total estimé</dt><dd>{formatFCFA(subtotal + (zone?.price ?? 0))}</dd></div>
              </dl>
              <p className="text-[12.5px] text-[#666]">Le montant final vous est confirmé sur WhatsApp. Aucun paiement n'est demandé sur le site.</p>
              {submitError && <p role="alert" className="text-[13px] text-[#b42318] bg-[#fdeaea] rounded px-3 py-2">{submitError}</p>}
            </div>

            <div className="px-6 py-4 border-t border-[#ececec]">
              <button type="button" onClick={confirm} disabled={submitting} className={`${shopButton('whatsapp', 'lg')} w-full`}>
                <MessageCircle className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                {submitting ? 'Envoi…' : 'Envoyer ma commande sur WhatsApp'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
