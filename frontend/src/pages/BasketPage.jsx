import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, MapPin, AlertCircle, Eye } from "lucide-react";
import Header from "../components/Header";
import { useCatalogData } from "../contexts/CatalogContext";
import { getWhatsAppLink, resolveMediaUrl } from "../config/env";
import { createOrder } from "../services/order";

/* ---------- Icônes SVG Locale ---------- */
function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ---------- Sous-Composant Footer ---------- */
function Footer() {
  return (
    <footer className="w-full bg-white border-t border-stone-200/80 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
        <div>
          <h3 className="font-bold uppercase tracking-widest text-black mb-3">MK Bazaar</h3>
          <p className="text-stone-500 leading-relaxed max-w-xs">
            Sélection d'objets d'art et pièces textiles épurées. L'authenticité à l'état pur.
          </p>
        </div>
        <div>
          <h3 className="font-bold uppercase tracking-widest text-black mb-3">Aide & Infos</h3>
          <ul className="space-y-2 text-stone-500 uppercase tracking-wider">
            <li><Link to="/products" className="hover:text-black">Collections</Link></li>
            <li><span className="cursor-not-allowed opacity-50">Livraisons</span></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold uppercase tracking-widest text-black mb-3">Commandes</h3>
          <p className="text-stone-500 leading-relaxed">
            Toutes les transactions et validations s'effectuent via notre canal WhatsApp sécurisé.
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 border-t border-stone-100 text-center text-[10px] text-stone-400 uppercase tracking-widest">
        &copy; {new Date().getFullYear()} MK BAZAAR. Tous droits réservés.
      </div>
    </footer>
  );
}

/* ---------- Composant Principal BasketPage ---------- */
export default function BasketPage() {
  const { shippingZones } = useCatalogData();

  // Chargement initial depuis le localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("mk_bazaar_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // États liés à la livraison
  const [selectedZone, setSelectedZone] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ zone: false, address: false });

  // Synchronisation avec le localStorage + Alerte Header globale
  useEffect(() => {
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cart-updated"));
  }, [cartItems]);

  // Réinitialiser l'adresse si la zone change
  useEffect(() => {
    setAddressDetail("");
    setValidationErrors(prev => ({ ...prev, address: false }));
  }, [selectedZone]);

  // Actions du panier
  const updateQuantity = (id, variantId, amount) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.variant_id === variantId
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const removeItem = (id, variantId) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.variant_id === variantId)));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const deliveryPrice = selectedZone ? selectedZone.price : 0;
  const totalAmount = calculateSubtotal() + deliveryPrice;

  // Soumission et envoi sur WhatsApp
  const handleWhatsAppCheckout = async () => {
    const hasZoneError = !selectedZone;
    const hasAddressError = selectedZone && addressDetail.trim() === "";

    if (hasZoneError || hasAddressError) {
      setValidationErrors({ zone: hasZoneError, address: hasAddressError });
      return;
    }

    setIsSubmitting(true);

    try {
      const clientOrderNumber = `MK-${Date.now().toString().slice(-6)}`;
      const today = new Date().toISOString().split("T")[0];

      // Préparation du payload pour l'API
      const orderData = {
        order_number: clientOrderNumber,
        date: today,
        delivery_location: selectedZone.name,
        delivery_fee: deliveryPrice,
        detailed_address: addressDetail.trim(),
        total_price: totalAmount,
        status: "pending",
        items: cartItems.map(item => ({
          product_id: item.id,
          product_variant_id: item.variant_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          image_path: item.image,
        })),
      };

      const response = await createOrder(orderData);
      
      if (response.success) {
        const orderReference = response.data.reference || response.data.order_number || clientOrderNumber;

        // Construction du message formatté
        let message = `🛍️ *NOUVELLE COMMANDE — MK BAZAAR*\n\n`;
        message += `📌 *Référence Commande :* #${orderReference}\n\n`;
        message += `Bonjour, je souhaite valider mon panier contenant les articles suivants :\n\n`;

        cartItems.forEach((item, index) => {
          const variantText = item.attributes 
            ? ` (${Object.values(item.attributes).join(" - ")})` 
            : "";
          message += `${index + 1}. *${item.name}${variantText}*\n`;
          message += `   Quantité : ${item.quantity}\n`;
          message += `   Prix : ${(item.price * item.quantity).toLocaleString()} FCFA\n\n`;
        });

        message += `---------------------------------\n`;
        message += `📦 *Sous-total :* ${calculateSubtotal().toLocaleString()} FCFA\n`;
        message += `🚚 *Livraison :* ${selectedZone.name}\n`;
        message += `💵 *Frais d'expédition :* ${deliveryPrice.toLocaleString()} FCFA\n`;
        message += `📍 *Adresse Précise :* ${addressDetail.trim()}\n`;
        message += `💰 *Montant global à régler :* ${totalAmount.toLocaleString()} FCFA\n\n`;
        message += `Merci de prendre en compte ma commande pour expédition.`;

        // Vider le panier après commande réussie
        setCartItems([]);
        setSelectedZone(null);
        setAddressDetail("");

        window.open(getWhatsAppLink(message), "_blank");
      } else {
        alert("Erreur lors de la validation. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur de commande:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-black antialiased">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          
          <h1 className="text-xl md:text-2xl font-light uppercase tracking-widest mb-10 border-b border-stone-200/80 pb-4 text-stone-950">
            Mon Panier
          </h1>

          <AnimatePresence mode="wait">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-24 flex flex-col items-center justify-center"
              >
                <p className="text-stone-500 uppercase tracking-widest text-xs mb-6 font-light">
                  Votre panier est actuellement vide.
                </p>
                <Link
                  to="/products"
                  className="inline-block bg-black text-white text-xs uppercase tracking-widest font-semibold px-8 py-4 hover:bg-stone-900 transition-colors duration-200 shadow-sm"
                >
                  Découvrir nos collections
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                
                {/* LISTE DES ARTICLES (GAUCHE) */}
                <div className="lg:col-span-2 space-y-4">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={`${item.id}-${item.variant_id || "base"}`}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                        className="flex items-center gap-4 bg-white p-4 border border-stone-200/60 shadow-sm rounded-sm"
                      >
                        <img
                          src={resolveMediaUrl(item.image)}
                          alt={item.name}
                          className="w-20 h-24 object-cover bg-stone-100 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                            {item.category}
                          </span>
                          <h2 className="text-sm font-medium uppercase tracking-wider text-black truncate">
                            {item.name}
                          </h2>
                          {item.attributes && (
                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                              {Object.entries(item.attributes).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-stone-600 mt-1 font-medium font-mono">
                            {item.price.toLocaleString()} FCFA
                          </p>

                          {/* Sélecteur quantité Mobile */}
                          <div className="flex items-center gap-2 mt-3 sm:hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.variant_id, -1)}
                              className="p-1 border border-stone-200 hover:bg-stone-50 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-6 text-center font-mono">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.variant_id, 1)}
                              className="p-1 border border-stone-200 hover:bg-stone-50 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Sélecteur quantité Desktop */}
                        <div className="hidden sm:flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden shadow-inner">
                          <button
                            onClick={() => updateQuantity(item.id, item.variant_id, -1)}
                            className="p-2.5 hover:bg-stone-200/60 text-stone-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-medium px-2 min-w-[2rem] text-center font-mono select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.variant_id, 1)}
                            className="p-2.5 hover:bg-stone-200/60 text-stone-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Ligne Prix Ligne & Supprimer & Détails */}
                        <div className="flex flex-col items-end justify-between h-24 py-1 ml-2">
                          <span className="text-xs font-semibold tracking-wider text-black font-mono whitespace-nowrap">
                            {(item.price * item.quantity).toLocaleString()} FCFA
                          </span>
                          <div className="flex gap-2">
                            <Link
                              to={`/products/${item.slug}`}
                              title="Voir le produit"
                              className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => removeItem(item.id, item.variant_id)}
                              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all duration-200"
                              title="Supprimer l'article"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* TUNNEL DE RECAPITULATIF & EXPÉDITION (DROITE) */}
                <div className="space-y-4 sticky top-24">
                  
                  {/* Formulaire Informations Livraison */}
                  <div className="bg-white p-5 border border-stone-200/60 shadow-sm rounded-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-black border-b border-stone-100 pb-2">
                      <MapPin className="w-4 h-4 text-stone-500" />
                      <h2>Détails d'expédition</h2>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <select
                          value={selectedZone?.name || ""}
                          onChange={(e) => {
                            const zone = shippingZones.find((z) => z.name === e.target.value);
                            setSelectedZone(zone || null);
                            setValidationErrors(prev => ({ ...prev, zone: false }));
                          }}
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all cursor-pointer ${
                            validationErrors.zone ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                          }`}
                        >
                          <option value="" disabled>Lieu de livraison...</option>
                          {shippingZones && shippingZones.map(({ id, name, price }) => (
                            <option key={id} value={name}>{name} (+{price.toLocaleString()} FCFA)</option>
                          ))}
                        </select>
                      </div>

                      <AnimatePresence>
                        {selectedZone && (
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                            <input
                              type="text"
                              value={addressDetail}
                              onChange={(e) => {
                                setAddressDetail(e.target.value);
                                setValidationErrors(prev => ({ ...prev, address: false }));
                              }}
                              placeholder="Repères ou adresse précise de livraison..."
                              className={`w-full px-4 py-3 rounded-xl border bg-white text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                                validationErrors.address ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                              }`}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Résumé Financier Global */}
                  <div className="bg-white p-6 border border-stone-200/60 shadow-sm rounded-sm">
                    <h2 className="text-xs uppercase tracking-widest font-bold text-black border-b border-stone-200 pb-3 mb-4">
                      Résumé de la commande
                    </h2>

                    <div className="space-y-3 text-xs uppercase tracking-wider font-medium text-stone-600">
                      <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span className="text-black font-semibold font-mono">{calculateSubtotal().toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-[11px] items-center">
                        <span className="normal-case tracking-normal text-stone-400">Frais de livraison</span>
                        <span className="text-black font-semibold font-mono">
                          {selectedZone ? `${deliveryPrice.toLocaleString()} FCFA` : "Sélectionner un lieu"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-stone-200 my-4 pt-4 flex justify-between items-baseline">
                      <span className="text-xs uppercase tracking-widest font-bold text-black">Total Général</span>
                      <span className="text-lg font-bold tracking-wider text-black font-mono">
                        {totalAmount.toLocaleString()} <span className="text-xs font-light">FCFA</span>
                      </span>
                    </div>

                    {/* Alertes d'erreurs de formulaire */}
                    {(validationErrors.zone || validationErrors.address) && (
                      <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Veuillez sélectionner un lieu de livraison valide et renseigner votre adresse physique avant d'envoyer.</span>
                      </div>
                    )}

                    {/* Bouton Principal d'envoi WhatsApp */}
                    <button
                      onClick={handleWhatsAppCheckout}
                      disabled={isSubmitting}
                      className="w-full bg-black text-[#F9F9F7] text-xs uppercase tracking-widest font-bold py-4 flex items-center justify-center hover:bg-stone-900 transition-colors duration-200 shadow-md rounded-xl"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Validation en cours...
                        </span>
                      ) : (
                        <>
                          <WhatsAppIcon />
                          Commander via WhatsApp
                        </>
                      )}
                    </button>

                    <Link
                      to="/products"
                      className="block text-center text-[10px] uppercase tracking-widest font-semibold text-stone-500 hover:text-black mt-4 transition-colors duration-200"
                    >
                      Continuer mes achats
                    </Link>
                  </div>

                </div>

              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}