import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { createOrder } from '../services/order';
import { getWhatsAppLink, resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/env';
import { buildOrderMessage, formatVariantLabel } from '../utils/whatsappMessage';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useAuth } from '../contexts/AuthContext';

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 shrink-0"
  >
    <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z" />
  </svg>
);

export default function WhatsAppOrderDrawer({
  isOpen,
  onClose,
  product,
  selectedVariant,
  quantity,
  setQuantity,
  shippingZones = [],
  onOrderCompleted,
}) {
  const { user } = useAuth();
  const { contactInfo } = useSiteSettings();

  const [selectedZone, setSelectedZone] = useState(null);
  const [addressDetail, setAddressDetail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Initialisation auto de la zone si 1 seule disponible
  useEffect(() => {
    if (shippingZones.length > 0 && !selectedZone) {
      setSelectedZone(shippingZones[0]);
    }
  }, [shippingZones, selectedZone]);

  if (!isOpen || !product) return null;

  const currentPrice = selectedVariant?.price || product.price || 0;
  const subtotal = currentPrice * quantity;
  const deliveryFee = selectedZone?.price || 0;
  const total = subtotal + deliveryFee;

  const image = selectedVariant?.image_path
    ? resolveMediaUrl(selectedVariant.image_path)
    : product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;

  const variantLabel = selectedVariant
    ? formatVariantLabel(selectedVariant.attributes)
    : 'Standard';

  const validate = () => {
    const errs = {};
    if (!selectedZone) errs.zone = 'Veuillez sélectionner une commune/ville.';
    if (!addressDetail.trim()) errs.address = 'L\'adresse de livraison est requise.';
    if (!user) {
      if (!customerName.trim()) errs.name = 'Votre nom est requis.';
      const cleanPhone = customerPhone.replace(/[\s.-]/g, '');
      if (!cleanPhone) {
        errs.phone = 'Le numéro de téléphone est requis.';
      } else if (!/^(\+?225)?[0-9]{10}$/.test(cleanPhone)) {
        errs.phone = 'Numéro invalide (10 chiffres attendus pour la CI).';
      }
    } else if (!user.phone?.trim()) {
      errs.phone = 'Veuillez renseigner un numéro de téléphone pour être contacté.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmOrder = async () => {
    if (!validate()) return;

    const resolvedName = user ? user.name : customerName.trim();
    const resolvedPhone = user ? user.phone : customerPhone.trim();

    // Ouvrir un onglet immédiatement dans le geste utilisateur
    const waWindow = window.open('', '_blank');
    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: resolvedName,
        customer_phone: resolvedPhone,
        shipping_address: `${selectedZone.name} — ${addressDetail.trim()}`,
        shipping_zone_id: selectedZone.id,
        items: [
          {
            product_id: product.id,
            product_variant_id: selectedVariant?.id || null,
            quantity: quantity,
          },
        ],
      };

      const response = await createOrder(orderData);
      if (response.success) {
        const message = buildOrderMessage({
          order: response.data?.order,
          items: [{ name: product.name, variantLabel, quantity }],
          customerName: resolvedName,
          customerPhone: resolvedPhone,
          title: 'ACHAT INSTANTANÉ — MK BAZAAR',
        });

        const waLink = getWhatsAppLink(message, contactInfo.whatsapp);
        if (waLink) {
          if (waWindow) waWindow.location.href = waLink;
          else window.location.assign(waLink);
        } else {
          if (waWindow) waWindow.close();
        }

        if (onOrderCompleted) onOrderCompleted();
        onClose();
      } else {
        if (waWindow) waWindow.close();
        alert(response.error || 'Erreur lors de l\'enregistrement de la commande.');
      }
    } catch (err) {
      if (waWindow) waWindow.close();
      alert('Une erreur réseau est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop sombre */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
        />

        {/* Tiroir coulissant */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Achat Express WhatsApp"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-full bg-[#25D366]/10 text-[#25D366]">
                <WhatsAppIcon />
              </span>
              <div>
                <h2 className="font-serif text-lg font-normal text-stone-950">
                  Commande Express 1 Clic
                </h2>
                <p className="text-[11px] text-stone-500 font-light">
                  Paiement à la livraison après confirmation
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200/60 text-stone-500 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps défilant */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. Récapitulatif Produit */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 flex gap-3.5 items-center">
              <div className="w-16 h-20 bg-stone-200 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                <img src={image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm font-medium text-stone-950 truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-stone-500 font-light truncate mt-0.5">
                  {variantLabel}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-stone-950">
                    {currentPrice.toLocaleString()} FCFA
                  </span>

                  {/* Quantité inline */}
                  <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2 py-1 hover:bg-stone-100 text-stone-600"
                    >
                      −
                    </button>
                    <span className="px-2.5 py-1 font-mono font-semibold">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2 py-1 hover:bg-stone-100 text-stone-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Coordonnées & Livraison */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 block">
                Adresse de livraison
              </span>

              {/* Commune / Ville */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Commune / Ville *
                </label>
                <div className="relative">
                  <select
                    value={selectedZone?.id || ''}
                    onChange={(e) => {
                      const zone = shippingZones.find((z) => String(z.id) === e.target.value);
                      setSelectedZone(zone || null);
                      if (errors.zone) setErrors((prev) => ({ ...prev, zone: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all ${
                      errors.zone ? 'border-rose-400' : 'border-stone-200'
                    }`}
                  >
                    <option value="" disabled>
                      Sélectionnez votre zone...
                    </option>
                    {shippingZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.price > 0 ? `${z.price.toLocaleString()} FCFA` : 'Gratuit'})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.zone && <p className="text-[10px] text-rose-600 mt-1">{errors.zone}</p>}
              </div>

              {/* Adresse détaillée */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Adresse précise / Repère *
                </label>
                <input
                  type="text"
                  value={addressDetail}
                  onChange={(e) => {
                    setAddressDetail(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  placeholder="Ex : Cocody Angré 8e tranche, près de la pharmacie"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all ${
                    errors.address ? 'border-rose-400' : 'border-stone-200'
                  }`}
                />
                {errors.address && (
                  <p className="text-[10px] text-rose-600 mt-1">{errors.address}</p>
                )}
              </div>

              {/* Coordonnées Client */}
              {user ? (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-700">
                    {user.name?.[0] || 'U'}
                  </div>
                  <div className="text-xs min-w-0">
                    <p className="font-semibold text-stone-950 truncate">{user.name}</p>
                    <p className="text-stone-500 font-light truncate">{user.phone || 'Pas de numéro'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                      Votre Nom *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Ex : Marie Koffi"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all ${
                        errors.name ? 'border-rose-400' : 'border-stone-200'
                      }`}
                    />
                    {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                      Téléphone (10 chiffres) *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="07 00 00 00 00"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all ${
                        errors.phone ? 'border-rose-400' : 'border-stone-200'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Récapitulatif Financier */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total ({quantity} art.)</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Frais de livraison ({selectedZone?.name || '—'})</span>
                <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString()} FCFA` : 'Gratuit'}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-stone-950 text-sm">
                <span>Total à régler à la livraison</span>
                <span className="font-serif text-base text-[#c07b5a]">{total.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Reassurance */}
            <div className="space-y-1.5 text-[11px] text-stone-500 font-light">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Paiement en espèces ou Wave/Orange Money lors de la réception</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Article vérifié avant expédition par MK BAZAAR</span>
              </p>
            </div>
          </div>

          {/* Footer d'action */}
          <div className="p-5 border-t border-stone-100 bg-white">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmOrder}
              className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-[#25D366]/25 hover:shadow-xl active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <WhatsAppIcon />
              <span>{isSubmitting ? 'Préparation...' : 'Confirmer sur WhatsApp'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

