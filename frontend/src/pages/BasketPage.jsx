import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, AlertCircle, Eye, Trash2 } from "lucide-react";
import Header from "../components/Header";
import { useCatalogData } from "../contexts/CatalogContext";
import { getWhatsAppLink, resolveMediaUrl } from "../config/env";
import { createOrder } from "../services/order";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

/* ---------- Icône WhatsApp ---------- */
function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}


/* ---------- BasketPage ---------- */
export default function BasketPage() {
  const { shippingZones } = useCatalogData();
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("mk_bazaar_cart");
    if (!savedCart) return [];
    const parsed = JSON.parse(savedCart);
    const grouped = [];
    parsed.forEach((item) => {
      const variantKey = item.variant_id ?? null;
      const existing = grouped.find(
        (g) => g.id === item.id && (g.variant_id ?? null) === variantKey
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        grouped.push({ ...item, variant_id: item.variant_id ?? null });
      }
    });
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(grouped));
    return grouped;
  });

  const [selectedZone, setSelectedZone] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    zone: false,
    address: false,
    customerName: false,
    customerPhone: false,
  });

  useEffect(() => {
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cart-updated"));
  }, [cartItems]);

  useEffect(() => {
    setAddressDetail("");
    setValidationErrors((prev) => ({ ...prev, address: false }));
  }, [selectedZone]);

  const updateQuantity = (id, variantId, amount) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && (item.variant_id ?? null) === (variantId ?? null)
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const removeItem = (id, variantId) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === id && (item.variant_id ?? null) === (variantId ?? null))
      )
    );
  };

  const calculateSubtotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const deliveryPrice = selectedZone ? selectedZone.price : 0;
  const totalAmount = calculateSubtotal() + deliveryPrice;

  const handleWhatsAppCheckout = async () => {
    const hasZoneError = !selectedZone;
    const hasAddressError = selectedZone && addressDetail.trim() === "";
    const hasNameError = !user && customerName.trim() === "";
    const hasPhoneError = !user && customerPhone.trim() === "";

    if (hasZoneError || hasAddressError || hasNameError || hasPhoneError) {
      setValidationErrors({
        zone: hasZoneError,
        address: hasAddressError,
        customerName: hasNameError,
        customerPhone: hasPhoneError,
      });
      return;
    }

    const resolvedName  = user ? user.name  : customerName.trim();
    const resolvedPhone = user ? user.phone : customerPhone.trim();

    setIsSubmitting(true);
    try {
      const orderData = {
        delivery_location: selectedZone.name,
        delivery_fee: deliveryPrice,
        detailed_address: addressDetail.trim(),
        total_price: totalAmount,
        ...(!user && { customer_name: resolvedName, customer_phone: resolvedPhone }),
        items: cartItems.map((item) => ({
          ...(item.variant_id
            ? { product_variant_id: item.variant_id }
            : { product_id: item.id }),
          quantity: item.quantity,
        })),
      };

      const response = await createOrder(orderData);
      if (response.success) {
        const orderReference =
          response.data?.order?.order_number ||
          response.data?.reference ||
          "—";

        let message = `🛍️ *NOUVELLE COMMANDE — MK BAZAAR*\n\n`;
        message += `📌 *Référence :* #${orderReference}\n\n`;
        message += `👤 *Client :* ${resolvedName}\n`;
        message += `📞 *Téléphone :* ${resolvedPhone}\n\n`;
        message += `Bonjour, je souhaite valider mon panier :\n\n`;
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
        message += `📍 *Adresse :* ${addressDetail.trim()}\n`;
        message += `💰 *Total à régler :* ${totalAmount.toLocaleString()} FCFA\n\n`;
        message += `Merci de prendre en compte ma commande.`;

        setCartItems([]);
        setSelectedZone(null);
        setAddressDetail("");
        if (!user) {
          setCustomerName("");
          setCustomerPhone("");
        }
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

      <main className="flex-1 py-6 sm:py-10 px-3 sm:px-6 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-light uppercase tracking-widest mb-6 sm:mb-10 border-b border-stone-200/80 pb-3 text-stone-950">
            Mon Panier
          </h1>

          <AnimatePresence mode="wait">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 sm:py-24 flex flex-col items-center justify-center"
              >
                <p className="text-stone-500 uppercase tracking-widest text-xs mb-6 font-light">
                  Votre panier est actuellement vide.
                </p>
                <Link
                  to="/products"
                  className="inline-block bg-black text-white text-xs uppercase tracking-widest font-semibold px-8 py-4 hover:bg-stone-900 transition-colors duration-200 shadow-sm rounded-xl"
                >
                  Découvrir nos collections
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 items-start">
                {/* ---------- Liste des articles ---------- */}
                <div className="lg:col-span-2 space-y-4">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={`${item.id}-${item.variant_id ?? "base"}`}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                        className="bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden"
                      >
                        {/* Conteneur flexible : colonne sur mobile, ligne sur sm+ */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
                          {/* Image + Infos (toujours côte à côte) */}
                          <div className="flex items-start gap-3 w-full sm:flex-1 min-w-0">
                            <img
                              src={resolveMediaUrl(item.image)}
                              alt={item.name}
                              className="w-16 h-20 sm:w-20 sm:h-24 object-cover bg-stone-100 flex-shrink-0 rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                                {item.category}
                              </span>
                              <h2 className="text-sm font-medium uppercase tracking-wider text-black line-clamp-2">
                                {item.name}
                              </h2>
                              {item.attributes && (
                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                  {Object.entries(item.attributes)
                                    .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
                                    .join(", ")}
                                </p>
                              )}
                              <p className="text-xs text-stone-600 mt-1 font-medium font-mono">
                                {item.price.toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>

                          {/* Bloc quantité + prix + actions */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 w-full sm:w-auto mt-1 sm:mt-0">
                            {/* Quantité et prix total sur la même ligne en mobile, empilés sur desktop */}
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial justify-between sm:justify-end w-full sm:w-auto">
                              {/* Quantité */}
                              <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden shadow-inner">
                                <button
                                  onClick={() => updateQuantity(item.id, item.variant_id, -1)}
                                  className="px-2 sm:px-2.5 py-1.5 sm:py-2 text-stone-600 hover:bg-stone-200/60 transition-colors font-bold text-xs"
                                  aria-label="Diminuer la quantité"
                                >
                                  −
                                </button>
                                <span className="text-xs font-medium px-2 sm:px-3 min-w-[2rem] text-center font-mono select-none bg-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.variant_id, 1)}
                                  className="px-2 sm:px-2.5 py-1.5 sm:py-2 text-stone-600 hover:bg-stone-200/60 transition-colors font-bold text-xs"
                                  aria-label="Augmenter la quantité"
                                >
                                  +
                                </button>
                              </div>

                              {/* Prix total */}
                              <span className="text-xs sm:text-sm font-semibold tracking-wider text-black font-mono whitespace-nowrap">
                                Total : {(item.price * item.quantity).toLocaleString()} FCFA
                              </span>
                            </div>

                            {/* Actions (Voir, Supprimer) */}
                            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
                              <Link
                                to={`/products/${item.slug}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-2 py-1.5 rounded-lg transition-colors duration-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Voir</span>
                              </Link>
                              <button
                                onClick={() => removeItem(item.id, item.variant_id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Supprimer</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* ---------- Résumé commande ---------- */}
                <div className="space-y-4 lg:sticky lg:top-24">
                  <div className="bg-white p-4 sm:p-5 border border-stone-200/60 shadow-sm rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-black border-b border-stone-100 pb-2">
                      <MapPin className="w-4 h-4 text-stone-500" />
                      <h2>Ville / Commune</h2>
                    </div>

                    {/* Infos client */}
                    {user ? (
                      <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-stone-600 uppercase">
                            {user.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 truncate">{user.name}</p>
                          <p className="text-[10px] text-stone-400 truncate">
                            {user.phone || "Aucun téléphone enregistré"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              setValidationErrors((prev) => ({ ...prev, customerName: false }));
                            }}
                            placeholder="Nom complet"
                            className={`w-full px-4 py-3 rounded-xl border bg-white text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                              validationErrors.customerName ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                            }`}
                          />
                        </div>
                        <div>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => {
                              setCustomerPhone(e.target.value);
                              setValidationErrors((prev) => ({ ...prev, customerPhone: false }));
                            }}
                            placeholder="Téléphone (07 XX XX XX XX)"
                            className={`w-full px-4 py-3 rounded-xl border bg-white text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                              validationErrors.customerPhone ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <select
                          value={selectedZone?.name || ""}
                          onChange={(e) => {
                            const zone = shippingZones.find((z) => z.name === e.target.value);
                            setSelectedZone(zone || null);
                            setValidationErrors((prev) => ({ ...prev, zone: false }));
                          }}
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-xs md:text-sm text-stone-900 focus:outline-none focus:border-stone-950 transition-all cursor-pointer ${
                            validationErrors.zone ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                          }`}
                        >
                          <option value="" disabled>
                            Lieu de livraison...
                          </option>
                          {shippingZones &&
                            shippingZones.map(({ id, name, price }) => (
                              <option key={id} value={name}>
                                {name} (+{price.toLocaleString()} FCFA)
                              </option>
                            ))}
                        </select>
                      </div>
                      <AnimatePresence>
                        {selectedZone && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                          >
                            <input
                              type="text"
                              value={addressDetail}
                              onChange={(e) => {
                                setAddressDetail(e.target.value);
                                setValidationErrors((prev) => ({ ...prev, address: false }));
                              }}
                              placeholder="Repères ou adresse précise de livraison..."
                              className={`w-full px-4 py-3 rounded-xl border bg-white text-xs md:text-sm text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                                validationErrors.address
                                  ? "border-rose-500 bg-rose-50/20"
                                  : "border-stone-200"
                              }`}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-6 border border-stone-200/60 shadow-sm rounded-xl">
                    <h2 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-black border-b border-stone-200 pb-3 mb-4">
                      Résumé de la commande
                    </h2>
                    <div className="space-y-3 text-xs sm:text-sm uppercase tracking-wider font-medium text-stone-600">
                      <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span className="text-black font-semibold font-mono">
                          {calculateSubtotal().toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] items-center">
                        <span className="normal-case tracking-normal text-stone-400">
                          Frais de livraison
                        </span>
                        <span className="text-black font-semibold font-mono">
                          {selectedZone
                            ? `${deliveryPrice.toLocaleString()} FCFA`
                            : "Sélectionner un lieu"}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-stone-200 my-4 pt-4 flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-black">
                        Total Général
                      </span>
                      <span className="text-lg font-bold tracking-wider text-black font-mono">
                        {totalAmount.toLocaleString()}{" "}
                        <span className="text-xs font-light">FCFA</span>
                      </span>
                    </div>
                    {(validationErrors.zone || validationErrors.address || validationErrors.customerName || validationErrors.customerPhone) && (
                      <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Veuillez remplir tous les champs obligatoires avant de continuer.
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleWhatsAppCheckout}
                      disabled={isSubmitting}
                      className="w-full bg-black text-[#F9F9F7] text-xs sm:text-sm uppercase tracking-widest font-bold py-3 sm:py-4 flex items-center justify-center hover:bg-stone-900 transition-colors duration-200 shadow-md rounded-xl"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
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