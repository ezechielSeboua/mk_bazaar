import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ShoppingBag, Check, X } from "lucide-react";
import Header from "../components/Header";
import ProductGallery from "../components/ProductGallery";
import { getProductBySlug } from "../services/product";
import { createOrder } from "../services/order";
import Seo from "../components/Seo";
import { absoluteImageUrl } from "../config/seo";
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
} from "../utils/seoStructuredData";
import { useCatalogData } from "../contexts/CatalogContext";
import { getWhatsAppLink } from "../config/env";

/* ----- Icônes réutilisables ----- */
function HeartIcon() {
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shippingZones } = useCatalogData();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration produit
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedZone, setSelectedZone] = useState(null); // conservé pour pré-remplissage éventuel
  const [addressDetail, setAddressDetail] = useState("");   // idem
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false); // toast

  // Modale WhatsApp (contient maintenant les champs de livraison)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [modalZone, setModalZone] = useState(null);
  const [modalAddress, setModalAddress] = useState("");
  const [modalErrors, setModalErrors] = useState({ zone: false, address: false });

  // Récupération produit
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getProductBySlug(slug);
        if (cancelled) return;
        if (result.success && result.data) {
          const dataProduct = result.data.data || result.data;
          setProduct(dataProduct);
          if (dataProduct.variants && dataProduct.variants.length > 0) {
            setSelectedVariant(dataProduct.variants[0]);
          }
        } else {
          setError("Produit introuvable");
        }
      } catch (err) {
        if (!cancelled) setError("Erreur réseau");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => { cancelled = true; };
  }, [slug]);

  // Calculs prix
  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const currentOldPrice = selectedVariant ? selectedVariant.old_price : product?.old_price || null;
  const hasVariants = product?.variants && product.variants.length > 0;
  const isAvailable = hasVariants
    ? selectedVariant ? selectedVariant.stock > 0 : false
    : product ? product.is_active && product.in_stock : false;
  const maxAvailableStock = hasVariants && selectedVariant ? selectedVariant.stock : 99;
  const productSubtotal = currentPrice * quantity;
  // Pour la modale, on utilise modalZone
  const deliveryPrice = modalZone ? modalZone.price : 0;
  const totalAmount = productSubtotal + deliveryPrice;
  const discountPercentage =
    currentOldPrice && currentOldPrice > currentPrice
      ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
      : null;

  /* ----- AJOUT PANIER ----- */
  const handleAddToCart = () => {
    if (!product) return;
    const localCartRaw = localStorage.getItem("mk_bazaar_cart");
    let currentCart = localCartRaw ? JSON.parse(localCartRaw) : [];
    const variantId = selectedVariant?.id || null;
    const existingItemIndex = currentCart.findIndex(
      (item) => item.id === product.id && item.variant_id === variantId
    );
    if (existingItemIndex > -1) {
      const targetQty = currentCart[existingItemIndex].quantity + quantity;
      currentCart[existingItemIndex].quantity = Math.min(targetQty, maxAvailableStock);
    } else {
      currentCart.push({
        id: product.id,
        variant_id: variantId,
        name: product.name,
        slug: product.slug || slug,
        price: currentPrice,
        quantity: quantity,
        attributes: selectedVariant?.attributes || null,
        image: product.image_path?.[0] || null,
        category: product.category?.name || "Collection",
      });
    }
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(currentCart));

    setIsAddedToCart(true);
    setShowCartNotification(true);
    setTimeout(() => setIsAddedToCart(false), 2200);
    setTimeout(() => setShowCartNotification(false), 2600);

    window.dispatchEvent(new Event("cart-updated"));
  };

  /* ----- OUVERTURE MODALE WHATSAPP (sans validation) ----- */
  const openWhatsAppModal = () => {
    setModalZone(selectedZone);        // pré-remplit avec la dernière zone utilisée
    setModalAddress(addressDetail);    // idem adresse
    setModalErrors({ zone: false, address: false });
    setShowWhatsAppModal(true);
  };

  /* ----- CONFIRMATION DEPUIS LA MODALE ----- */
  const confirmWhatsAppOrder = async () => {
    const hasZoneError = !modalZone;
    const hasAddressError = modalZone && modalAddress.trim() === "";
    if (hasZoneError || hasAddressError) {
      setModalErrors({ zone: hasZoneError, address: hasAddressError });
      return;
    }

    setShowWhatsAppModal(false);
    setIsSubmitting(true);
    try {
      const clientOrderNumber = `MK-${Date.now().toString().slice(-6)}`;
      const today = new Date().toISOString().split("T")[0];
      const variantLabel = selectedVariant
        ? Object.entries(selectedVariant.attributes)
            .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
            .join(", ")
        : "Standard";

      const orderData = {
        order_number: clientOrderNumber,
        date: today,
        delivery_location: modalZone.name,
        delivery_fee: modalZone.price,
        detailed_address: modalAddress.trim(),
        total_price: totalAmount,
        status: "pending",
        items: [
          {
            product_id: product.id,
            product_variant_id: selectedVariant?.id || null,
            name: product.name,
            quantity: quantity,
            price: currentPrice,
            image_path: product.image_path?.[0] || null,
          },
        ],
      };

      console.log("Commande envoyée :", orderData);

      const response = await createOrder(orderData);
      if (response.success) {
        const orderReference =
          response.data.reference || response.data.order_number || clientOrderNumber;

        // Mise à jour des états persistants
        setSelectedZone(modalZone);
        setAddressDetail(modalAddress);
        setQuantity(1);
        setModalZone(null);
        setModalAddress("");

        const message =
          `🛍️ *ACHAT INSTANTANÉ — MK BAZAAR*\n\n` +
          `📌 *Référence Commande :* #${orderReference}\n\n` +
          `Bonjour,\n\n` +
          `Je souhaite commander cet article directement :\n\n` +
          `📦 *Produit :* ${product.name}\n` +
          `✨ *Option / Taille :* ${variantLabel}\n` +
          `💰 *Prix unitaire :* ${currentPrice.toLocaleString()} FCFA\n` +
          `🔢 *Quantité :* ${quantity}\n\n` +
          `🚚 *Livraison :* ${modalZone.name}\n` +
          `💵 *Frais de livraison :* ${modalZone.price.toLocaleString()} FCFA\n` +
          `📍 *Adresse :* ${modalAddress.trim()}\n` +
          `💰 *Montant total :* ${totalAmount.toLocaleString()} FCFA\n\n` +
          `Merci de me valider la disponibilité.`;

        window.open(getWhatsAppLink(message), "_blank");
      } else {
        alert("Erreur lors de la validation. Veuillez réessayer.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  // États de chargement / erreur
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
        <Seo title="Chargement..." path={`/products/${slug}`} />
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <SpinnerIcon />
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">
              Chargement des détails...
            </span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
        <Seo title="Produit introuvable" path={`/products/${slug}`} noindex />
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-24 text-center w-full flex flex-col items-center justify-center">
          <p className="text-stone-400 uppercase tracking-widest text-xs mb-6">
            {error || "Produit introuvable"}
          </p>
          <button
            onClick={() => navigate("/products")}
            className="text-[10px] uppercase tracking-wider font-bold border border-stone-900 rounded-xl px-8 py-3.5 hover:bg-black hover:text-[#F9F9F7] transition-all duration-300"
          >
            Retourner au catalogue
          </button>
        </main>
      </div>
    );
  }

  const images = product.image_path || [];
  const productPath = `/products/${product.slug || slug}`;
  const mainImage = images[0] ? absoluteImageUrl(images[0]) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-black antialiased">
      <Seo
        title={product.name}
        description={product.description}
        path={productPath}
        image={mainImage}
        type="product"
        jsonLd={[
          buildProductJsonLd(product),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Collections", path: "/products" },
            { name: product.name, path: productPath },
          ]),
        ].filter(Boolean)}
      />
      <Header />

      {/* --------------- TOAST AJOUT PANIER --------------- */}
      <AnimatePresence>
        {showCartNotification && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-lg pointer-events-none"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Ajouté au panier
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------- MODALE WHATSAPP (avec livraison) --------------- */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWhatsAppModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-800">
                  Commande rapide
                </h3>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="text-stone-400 hover:text-stone-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Choix livraison */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">
                    Lieu de livraison
                  </label>
                  <select
                    value={modalZone?.name || ""}
                    onChange={(e) => {
                      const zone = shippingZones.find((z) => z.name === e.target.value);
                      setModalZone(zone || null);
                      setModalErrors((prev) => ({ ...prev, zone: false }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all cursor-pointer ${
                      modalErrors.zone ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                    }`}
                  >
                    <option value="" disabled>Choisir une zone...</option>
                    {shippingZones.map(({ id, name, price }) => (
                      <option key={id} value={name}>
                        {name} (+{price.toLocaleString()} FCFA)
                      </option>
                    ))}
                  </select>
                </div>

                <AnimatePresence>
                  {modalZone && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <label className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block">
                        Adresse précise
                      </label>
                      <input
                        type="text"
                        value={modalAddress}
                        onChange={(e) => {
                          setModalAddress(e.target.value);
                          setModalErrors((prev) => ({ ...prev, address: false }));
                        }}
                        placeholder="Repères ou adresse complète..."
                        className={`w-full px-4 py-3 rounded-xl border bg-white text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                          modalErrors.address ? "border-rose-500 bg-rose-50/20" : "border-stone-200"
                        }`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Récapitulatif */}
                {modalZone && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-600 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Sous-total ({quantity}x)</span>
                      <span>{productSubtotal.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-stone-100">
                      <span>Livraison</span>
                      <span>+{deliveryPrice.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-950 pt-1 text-xs">
                      <span>Total</span>
                      <span>{totalAmount.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1 py-3 rounded-xl border border-stone-200 text-xs uppercase tracking-wider font-bold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmWhatsAppOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-stone-950 text-white text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <SpinnerIcon />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Confirmer & WhatsApp
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-12 w-full">
        {/* Bouton retour */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/products")}
          className="group flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-700 hover:text-stone-950 bg-white/80 backdrop-blur px-3.5 py-2 rounded-full border border-stone-200 shadow-sm transition-colors mb-8"
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <strong>Retour au catalogue</strong>
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Galerie */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProductGallery images={images} />
          </motion.div>

          {/* Infos produit */}
          <motion.div className="flex flex-col" variants={staggerContainer} initial="hidden" animate="visible">
            {/* Header Produit */}
            <motion.div className="mb-6 space-y-2.5" variants={fadeInUp}>
              <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 font-bold block">
                {product.category?.name || "Nouvelle Collection"}
              </span>
              <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight leading-none text-stone-950">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 pt-1">
                <p className="text-xl font-medium text-stone-950">
                  {currentPrice.toLocaleString()} <span className="text-xs font-light">FCFA</span>
                </p>
                {currentOldPrice && currentOldPrice > currentPrice && (
                  <>
                    <span className="text-sm font-light text-stone-400 line-through">
                      {currentOldPrice.toLocaleString()} FCFA
                    </span>
                    <span className="inline-flex items-center gap-0.5 bg-stone-950 text-white text-[9px] font-mono tracking-tight px-1.5 py-0.5 rounded-md">
                      -{discountPercentage}%
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Disponibilité */}
            <motion.div className="mb-6" variants={fadeInUp}>
              <span
                className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-full ${
                  isAvailable ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                }`}
              >
                <span className={`w-1 h-1 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
                {isAvailable ? "Disponible" : "Épuisé"}
              </span>
              {hasVariants && selectedVariant && selectedVariant.stock <= 3 && selectedVariant.stock > 0 && (
                <span className="text-[10px] text-amber-600 font-medium ml-3 font-mono">
                  (Plus que {selectedVariant.stock} pièces !)
                </span>
              )}
            </motion.div>

            {/* Description */}
            <motion.p className="text-xs md:text-sm text-stone-600 leading-relaxed mb-8 font-light" variants={fadeInUp}>
              {product.description}
            </motion.p>

            {/* Configuration produit */}
            <motion.div className="space-y-6 mb-6 pb-6 border-b border-stone-200/80" variants={staggerContainer}>
              {/* Variants avec badge promo */}
              {hasVariants && (
                <motion.div variants={fadeInUp} className="space-y-2.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold block text-stone-800">
                    Sélectionner la Taille / Option :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const attributesText = Object.values(v.attributes).join(" - ");
                      const isOutOfStock = v.stock === 0;
                      const variantDiscount =
                        v.old_price && v.old_price > v.price
                          ? Math.round(((v.old_price - v.price) / v.old_price) * 100)
                          : null;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                          className={`relative px-4 py-3 rounded-xl text-xs font-medium tracking-wider border transition-all duration-300 min-w-[55px] text-center ${
                            isSelected
                              ? "border-stone-950 bg-stone-950 text-white shadow-sm scale-[1.02]"
                              : isOutOfStock
                              ? "border-stone-100 bg-stone-50 text-stone-300 line-through cursor-not-allowed"
                              : "border-stone-200 text-stone-700 bg-transparent hover:border-stone-400"
                          }`}
                        >
                          {attributesText}
                          {variantDiscount && !isOutOfStock && (
                            <span
                              className={`absolute -top-1.5 -right-1.5 text-[8px] font-mono font-bold px-1 py-0.5 rounded ${
                                isSelected ? "bg-white text-stone-950" : "bg-rose-600 text-white"
                              }`}
                            >
                              -{variantDiscount}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Quantité */}
              <motion.div variants={fadeInUp}>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2.5 text-stone-800">
                  Quantité
                </label>
                <div className="flex items-center border border-stone-200 rounded-xl w-fit overflow-hidden bg-stone-50 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-sm font-medium hover:bg-stone-200/60 active:bg-stone-200 text-stone-600 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-5 py-3 text-sm font-mono font-medium text-stone-950 min-w-[40px] text-center select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxAvailableStock}
                    onClick={() => setQuantity(Math.min(maxAvailableStock, quantity + 1))}
                    className="px-4 py-3 text-sm font-medium hover:bg-stone-200/60 active:bg-stone-200 text-stone-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </motion.div>
            </motion.div>

            {/* BLOC TRANSACTIONNEL */}
            {isAvailable ? (
              <motion.div className="flex gap-3" variants={fadeInUp}>
                {/* Bouton Ajouter au panier */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  className={`flex-1 py-4 px-4 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isAddedToCart
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white text-[#c07b5a] border border-[#c07b5a]  hover:bg-[#c07b5a] hover:text-white shadow-md"
                  }`}
                >
                  {isAddedToCart ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3px]" />
                      Ajouté !
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      Ajouter au Panier
                    </>
                  )}
                </motion.button>

                {/* Bouton Commander (WhatsApp) */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={openWhatsAppModal}
                  className="flex-1 py-4 px-4 rounded-xl text-[10px] uppercase tracking-wider font-bold border border-green-600 text-green-600 bg-transparent hover:bg-green-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Commander directement
                </motion.button>
              </motion.div>
            ) : (
              /* Bouton désactivé si épuisé */
              <motion.button
                disabled
                className="w-full py-4 px-6 rounded-xl text-[11px] uppercase tracking-wider font-bold bg-stone-200 text-stone-400 cursor-not-allowed flex items-center justify-center gap-2.5"
                variants={fadeInUp}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                Pièce Épuisée
              </motion.button>
            )}

            {/* Bouton liste de souhaits (toujours présent) */}
            <button
              disabled
              className="w-full mt-3 py-3 px-6 rounded-xl text-[10px] uppercase tracking-wider font-bold border border-stone-200 text-stone-400 bg-stone-50 cursor-not-allowed transition-all flex items-center justify-center gap-1"
            >
              <HeartIcon />
              Ajouter à la liste de souhaits
            </button>
          </motion.div>
        </div>

        {/* Retours & Garantie */}
        <motion.div
          className="mt-20 pt-10 border-t border-stone-200/80"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="text-[11px] uppercase tracking-[0.25em] font-bold text-stone-950 mb-3">
            Politique de Retour &amp; Engagement
          </h2>
          <p className="text-xs md:text-sm text-stone-600 leading-relaxed max-w-3xl font-light">
            Chaque pièce MK BAZAAR est minutieusement inspectée. Vous disposez d'un droit de rétractation de 14 jours à compter
            de la réception de votre colis pour demander un échange ou un retour complet. Toutes nos créations sont couvertes
            par une garantie d'un an contre tout défaut lié à la fabrication.
          </p>
        </motion.div>
      </main>
    </div>
  );
}