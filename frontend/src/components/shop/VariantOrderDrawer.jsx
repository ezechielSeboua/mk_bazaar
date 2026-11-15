import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import { resolveMediaUrl } from '../../config/env';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { useCatalogData } from '../../contexts/CatalogContext';
import useMultiVariantOrder, { variantLineLabel } from './useMultiVariantOrder';
import { MultiVariantActions, MultiVariantPicker } from './MultiVariantPicker';
import DeliveryFields from './DeliveryFields';
import { submitOrder, validateCheckout } from './checkout';
import { formatFCFA, productImage, shopButton } from './shopUtils';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

/**
 * Panneau « variantes et quantités » (cartes produit, fiche produit) puis,
 * pour WhatsApp, étape coordonnées de livraison dans le même panneau.
 *
 * `order` (facultatif) : commande déjà commencée ailleurs (fiche produit).
 * Sinon le panneau gère sa propre sélection.
 */
export default function VariantOrderDrawer({ product, onClose, order: sharedOrder = null, initialSelection = null, initialStep = 'select' }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { contactInfo } = useSiteSettings();
    const { shippingZones } = useCatalogData();
    const ownOrder = useMultiVariantOrder(product, initialSelection);
    const order = sharedOrder ?? ownOrder;

    const [step, setStep] = useState(initialStep);
    const [delivery, setDelivery] = useState({ name: '', phone: '', zoneId: null, address: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    useBodyScrollLock(true);

    const zone = shippingZones.find((z) => z.id === delivery.zoneId) ?? null;
    const headerImage = order.groupImage ? resolveMediaUrl(order.groupImage) : productImage(product);

    const addToCart = () => { order.addAllToCart(); onClose(); };

    const sendOrder = async () => {
        const found = validateCheckout({ user, name: delivery.name, phone: delivery.phone, zone, address: delivery.address });
        setErrors(found);
        if (Object.keys(found).length) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const { order: created, whatsappLink } = await submitOrder({
                items: order.lines.map((l) => ({ product_id: product.id, variant_id: l.variant?.id ?? null, quantity: l.quantity, name: product.name, attributes: l.variant?.attributes })),
                user,
                name: delivery.name,
                phone: delivery.phone,
                zone,
                address: delivery.address,
                whatsappNumber: contactInfo?.whatsapp,
                title: 'ACHAT EXPRESS — MK BAZAAR',
            });
            order.reset();
            onClose();
            navigate('/commande-envoyee', { state: { order: created, whatsappLink, guest: !user } });
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 font-admin antialiased text-[#111]">
                <motion.div className="absolute inset-0 bg-[#111]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                <motion.aside
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="variant-order-title"
                    className="absolute inset-y-0 right-0 w-full max-w-[560px] bg-white flex flex-col"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.25 }}
                >
                    <div className="flex justify-between items-center gap-4 px-6 sm:px-8 pt-7 pb-5">
                        <div className="flex items-center gap-3 min-w-0">
                            {step === 'checkout' && (
                                <button type="button" onClick={() => setStep('select')} className="p-1 -ml-1 text-[#555] hover:text-[#111]" aria-label="Revenir aux quantités">
                                    <ArrowLeft className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
                                </button>
                            )}
                            <h2 id="variant-order-title" className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.01em] truncate">
                                {step === 'select' ? 'Choisir les variantes et quantités' : 'Commander sur WhatsApp'}
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="p-1 -mr-1 text-[#555] hover:text-[#111] shrink-0" aria-label="Fermer">
                            <X className="w-6 h-6" strokeWidth={1.6} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6">
                        {step === 'select' ? (
                            <>
                                <div className="flex gap-3 items-center pb-5 mb-5 border-b border-[#ececec]">
                                    <img src={headerImage} alt="" className="w-14 h-[70px] object-cover rounded-sm bg-[#f3f3f3]" />
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{product.name}</p>
                                        <Link to={`/products/${product.slug}`} onClick={onClose} className="text-[13px] underline text-[#555]">Voir la fiche produit</Link>
                                    </div>
                                </div>
                                <MultiVariantPicker order={order} />
                            </>
                        ) : (
                            <div className="space-y-6">
                                <ul className="divide-y divide-[#f0f0f0] border border-[#ececec] rounded">
                                    {order.lines.map((l) => (
                                        <li key={l.key} className="flex justify-between gap-4 px-4 py-3 text-sm">
                                            <span>{product.name}<span className="block text-[13px] text-[#666]">{variantLineLabel(l.variant)} · ×{l.quantity}</span></span>
                                            <span className="tabular-nums font-medium whitespace-nowrap">{formatFCFA(l.pricing.final_price * l.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <DeliveryFields user={user} values={delivery} onChange={setDelivery} errors={errors} zones={shippingZones} idPrefix="multi" />
                                <dl className="space-y-1.5 text-sm tabular-nums border-t border-[#ececec] pt-4">
                                    <div className="flex justify-between"><dt className="text-[#555]">Articles ({order.totalQuantity})</dt><dd>{formatFCFA(order.subtotal)}</dd></div>
                                    <div className="flex justify-between"><dt className="text-[#555]">Livraison</dt><dd>{zone ? formatFCFA(zone.price) : 'Selon la commune'}</dd></div>
                                    <div className="flex justify-between text-base font-semibold pt-2"><dt>Total estimé</dt><dd>{formatFCFA(order.subtotal + (zone?.price ?? 0))}</dd></div>
                                </dl>
                                <p className="text-[12.5px] text-[#666]">Le montant final vous est confirmé sur WhatsApp. Aucun paiement n'est demandé sur le site.</p>
                                {submitError && <p role="alert" className="text-[13px] text-[#b42318] bg-[#fdeaea] rounded px-3 py-2">{submitError}</p>}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#ececec] px-6 sm:px-8 pt-4 pb-6 bg-white">
                        {step === 'select' ? (
                            <MultiVariantActions order={order} onAddToCart={addToCart} onWhatsApp={() => setStep('checkout')} />
                        ) : (
                            <button type="button" onClick={sendOrder} disabled={submitting || !order.totalQuantity} className={`${shopButton('whatsapp', 'lg')} w-full h-14 rounded-full text-[15px]`}>
                                <MessageCircle className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                                {submitting ? 'Envoi…' : `Envoyer ma commande (${order.totalQuantity} article${order.totalQuantity > 1 ? 's' : ''})`}
                            </button>
                        )}
                    </div>
                </motion.aside>
            </div>
        </AnimatePresence>
    );
}
