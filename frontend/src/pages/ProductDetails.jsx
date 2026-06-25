import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Truck,
  Shield,
  Headphones,
  Award,
  X,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  Copy,
} from "lucide-react";
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
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";

// ---------- Composants utilitaires ----------

function SpinnerIcon() {
  return (
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
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-12 w-full animate-pulse">
        <div className="h-4 w-32 bg-stone-200 rounded-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <div className="aspect-square bg-stone-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-3 w-24 bg-stone-200 rounded" />
            <div className="h-8 w-3/4 bg-stone-200 rounded" />
            <div className="h-5 w-28 bg-stone-200 rounded" />
            <div className="h-4 w-full bg-stone-200 rounded" />
            <div className="h-4 w-5/6 bg-stone-200 rounded" />
            <div className="h-10 w-full bg-stone-200 rounded-xl mt-8" />
          </div>
        </div>
      </main>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    info: <AlertCircle className="w-4 h-4 text-sky-500" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    info: "bg-sky-50 border-sky-200 text-sky-900",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="text-xs font-medium pr-6">{message}</span>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 text-current opacity-60 hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ---------- Composant principal ----------

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shippingZones } = useCatalogData();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedZone, setSelectedZone] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const { toggleWishlist, isInWishlist } = useWishlist();

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name,
      text: `${product?.name} — ${currentPrice?.toLocaleString()} FCFA`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Lien copié dans le presse-papier", "success");
    }
  };

  const [errors, setErrors] = useState({});

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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product?.price || 0;
  const currentOldPrice = selectedVariant
    ? selectedVariant.old_price
    : product?.old_price || null;
  const hasVariants = product?.variants && product.variants.length > 0;
  const isAvailable = hasVariants
    ? selectedVariant
      ? selectedVariant.stock > 0
      : false
    : product
      ? product.is_active && (product.stock ?? 0) > 0
      : false;
  const maxAvailableStock =
    hasVariants && selectedVariant
      ? selectedVariant.stock
      : product?.stock ?? 99;
  const productSubtotal = currentPrice * quantity;
  const deliveryPrice = selectedZone ? selectedZone.price : 0;
  const totalAmount = productSubtotal + deliveryPrice;
  const discountPercentage =
    currentOldPrice && currentOldPrice > currentPrice
      ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
      : null;

  const validateForm = () => {
    const newErrors = {};
    if (!selectedZone) {
      newErrors.zone = "Sélectionnez votre ville";
    }
    if (!addressDetail.trim()) {
      newErrors.addressDetail = "L'adresse est obligatoire";
    }
    if (!user) {
      if (!customerName.trim()) newErrors.customerName = "Le nom est obligatoire";
      if (!customerPhone.trim()) newErrors.customerPhone = "Le téléphone est obligatoire";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      showToast("Veuillez corriger les champs en rouge.", "error");
      return;
    }

    const resolvedName  = user ? user.name  : customerName.trim();
    const resolvedPhone = user ? user.phone : customerPhone.trim();

    setIsSubmitting(true);
    try {
      const variantLabel = selectedVariant
        ? Object.entries(selectedVariant.attributes)
            .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
            .join(", ")
        : "Standard";

      const orderData = {
        delivery_location: selectedZone.name,
        detailed_address: addressDetail.trim(),
        ...(!user && { customer_name: resolvedName, customer_phone: resolvedPhone }),
        items: [
          {
            ...(selectedVariant
              ? { product_variant_id: selectedVariant.id }
              : { product_id: product.id }),
            quantity: quantity,
          },
        ],
      };

      const response = await createOrder(orderData);
      if (response.success) {
        const orderReference =
          response.data?.order?.order_number ||
          response.data?.reference ||
          "—";

        const message =
          `🛍️ *ACHAT INSTANTANÉ — MK BAZAAR*\n\n` +
          `📌 *Référence :* #${orderReference}\n\n` +
          `👤 *Client :* ${resolvedName}\n` +
          `📞 *Téléphone :* ${resolvedPhone}\n\n` +
          `📦 *Produit :* ${product.name}\n` +
          `✨ *Option / Taille :* ${variantLabel}\n` +
          `💰 *Prix unitaire :* ${currentPrice.toLocaleString()} FCFA\n` +
          `🔢 *Quantité :* ${quantity}\n\n` +
          `🚚 *Livraison :* ${selectedZone.name}\n` +
          `💵 *Frais :* ${selectedZone.price.toLocaleString()} FCFA\n` +
          `📍 *Adresse :* ${addressDetail.trim()}\n` +
          `💰 *Total :* ${totalAmount.toLocaleString()} FCFA\n\n` +
          `Merci de me valider la disponibilité.`;

        setOrderSuccess(true);
        showToast(
          "Commande enregistrée ! Redirection vers WhatsApp...",
          "success",
        );

        setTimeout(() => {
          window.open(getWhatsAppLink(message), "_blank");
          setQuantity(1);
          setSelectedZone(null);
          setAddressDetail("");
          if (!user) {
            setCustomerName("");
            setCustomerPhone("");
          }
          setOrderSuccess(false);
        }, 1500);
      } else {
        showToast(response.error || "Erreur lors de la validation. Veuillez réessayer.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Une erreur est survenue. Veuillez réessayer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  if (loading) {
    return <Skeleton />;
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

  const productImages = Array.isArray(product?.image_path) ? product.image_path : [];
  const allImages = (() => {
    if (!hasVariants) return productImages;
    const seen = new Set(productImages);
    const extraVariantImages = product.variants
      .map((v) => v.image_path)
      .filter((img) => img && !seen.has(img) && seen.add(img));
    return [...productImages, ...extraVariantImages];
  })();
  const activeGalleryIndex = selectedVariant?.image_path
    ? Math.max(0, allImages.indexOf(selectedVariant.image_path))
    : 0;
  const productPath = `/products/${product.slug || slug}`;
  const mainImage = allImages[0] ? absoluteImageUrl(allImages[0]) : null;


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

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-12 w-full">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/products")}
          className="group flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-700 hover:text-stone-950 bg-white/80 backdrop-blur px-3.5 py-2 rounded-full border border-stone-200 shadow-sm transition-colors mb-8"
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-[#c07b5a] " />
          <strong className="text-[#c07b5a]">Retour au catalogue</strong>
        </motion.button>

        {/* Grille principale : Galerie | Infos produit | Livraison & Récap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
          {/* Galerie */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProductGallery
              images={allImages}
              selectedIndex={activeGalleryIndex}
            />
          </motion.div>

          {/* Colonne centrale : Infos produit */}
          <motion.div
            className="flex flex-col"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* --- Infos produit --- */}
            <motion.div className="mb-6 space-y-2.5" variants={fadeInUp}>
              <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 font-bold block">
                {product.category?.name || "Nouvelle Collection"}
              </span>
              <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight leading-none text-stone-950">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 pt-1">
                <p className="text-xl font-medium text-stone-950">
                  {currentPrice.toLocaleString()}{" "}
                  <span className="text-xs font-light">FCFA</span>
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

            <motion.div className="mb-6" variants={fadeInUp}>
              <span
                className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-full ${
                  isAvailable
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-rose-500"}`}
                />
                {isAvailable ? "Disponible" : "Épuisé"}
              </span>
              {hasVariants
                ? selectedVariant &&
                  selectedVariant.stock <= 3 &&
                  selectedVariant.stock > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium ml-3 font-mono">
                      (Plus que {selectedVariant.stock} pièces !)
                    </span>
                  )
                : product?.stock > 0 &&
                  product.stock <= 3 && (
                    <span className="text-[10px] text-amber-600 font-medium ml-3 font-mono">
                      (Plus que {product.stock} pièces !)
                    </span>
                  )}
            </motion.div>

            <motion.p
              className="text-xs md:text-sm text-stone-600 leading-relaxed mb-5 font-light"
              variants={fadeInUp}
            >
              {product.description}
            </motion.p>

            {/* Actions : Favori + Partage */}
            <motion.div className="flex items-center gap-3 mb-6" variants={fadeInUp}>
              <button
                onClick={() => toggleWishlist(product)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                  isInWishlist(product.id)
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "border-stone-200 text-stone-500 hover:border-stone-400"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                {isInWishlist(product.id) ? "Dans vos favoris" : "Ajouter aux favoris"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 text-stone-500 text-xs font-medium hover:border-stone-400 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                Partager
              </button>
            </motion.div>

            <motion.div
              className="space-y-6 mb-6 pb-6 border-b border-stone-200/80"
              variants={staggerContainer}
            >
              {hasVariants && (
                <motion.div variants={fadeInUp} className="space-y-2.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold block text-stone-800">
                    Sélectionner la Taille / Option :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const attributesText = Object.values(v.attributes).join(
                        " - ",
                      );
                      const isOutOfStock = v.stock === 0;
                      const variantDiscount =
                        v.old_price && v.old_price > v.price
                          ? Math.round(
                              ((v.old_price - v.price) / v.old_price) * 100,
                            )
                          : null;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedVariant(v);
                            setQuantity(1);
                          }}
                          aria-label={`Option ${attributesText}${isOutOfStock ? " (épuisé)" : ""}`}
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
                                isSelected
                                  ? "bg-white text-stone-950"
                                  : "bg-rose-600 text-white"
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

              <motion.div variants={fadeInUp}>
                <label
                  htmlFor="quantity"
                  className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2.5 text-stone-800"
                >
                  Quantité
                </label>
                <div className="flex items-center border border-stone-200 rounded-xl w-fit overflow-hidden bg-stone-50 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Diminuer la quantité"
                    className="px-4 py-3 text-sm font-medium hover:bg-stone-200/60 active:bg-stone-200 text-stone-600 transition-colors"
                  >
                    −
                  </button>
                  <span
                    id="quantity"
                    className="px-5 py-3 text-sm font-mono font-medium text-stone-950 min-w-[40px] text-center select-none"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxAvailableStock}
                    onClick={() =>
                      setQuantity(Math.min(maxAvailableStock, quantity + 1))
                    }
                    aria-label="Augmenter la quantité"
                    className="px-4 py-3 text-sm font-medium hover:bg-stone-200/60 active:bg-stone-200 text-stone-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {orderSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-900 font-medium">
                    Commande enregistrée avec succès. Vous allez être redirigé
                    vers WhatsApp pour finaliser.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Colonne de droite : Livraison & Récapitulatif */}
          <motion.div
            className="sticky top-6 space-y-6"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* 1. INFORMATIONS DE LIVRAISON */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <h2 className="text-[12px] uppercase tracking-[0.25em] font-bold text-[#c07b5a]">
                1. Informations de livraison
              </h2>

              {/* Infos client — auto si connecté, saisie sinon */}
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
                <>
                  <div>
                    <label
                      htmlFor="customerName"
                      className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block"
                    >
                      Nom complet
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName)
                          setErrors((prev) => ({ ...prev, customerName: undefined }));
                      }}
                      placeholder="Votre nom et prénom"
                      className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                        errors.customerName
                          ? "border-rose-300 focus:border-rose-500"
                          : "border-stone-200"
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-[9px] text-rose-600 mt-1">{errors.customerName}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block"
                    >
                      Téléphone
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.customerPhone)
                          setErrors((prev) => ({ ...prev, customerPhone: undefined }));
                      }}
                      placeholder="07 XX XX XX XX"
                      className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                        errors.customerPhone
                          ? "border-rose-300 focus:border-rose-500"
                          : "border-stone-200"
                      }`}
                    />
                    {errors.customerPhone && (
                      <p className="text-[9px] text-rose-600 mt-1">{errors.customerPhone}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="zone"
                  className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block"
                >
                  Ville / Commune
                </label>
                <select
                  id="zone"
                  value={selectedZone?.name || ""}
                  onChange={(e) => {
                    const zone = shippingZones.find(
                      (z) => z.name === e.target.value,
                    );
                    setSelectedZone(zone || null);
                    if (errors.zone)
                      setErrors((prev) => ({ ...prev, zone: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-xs text-stone-900 focus:outline-none focus:border-stone-950 transition-all cursor-pointer ${
                    errors.zone
                      ? "border-rose-300 focus:border-rose-500"
                      : "border-stone-200"
                  }`}
                >
                  <option value="" disabled>
                    Choisir votre ville
                  </option>
                  {shippingZones.map(({ id, name, price }) => (
                    <option key={id} value={name}>
                      {name} (+{price.toLocaleString()} FCFA)
                    </option>
                  ))}
                </select>
                {errors.zone && (
                  <p className="text-[9px] text-rose-600 mt-1">{errors.zone}</p>
                )}
                {!errors.zone && (
                  <p className="text-[9px] text-stone-400 mt-1.5 tracking-wide">
                    Les frais de livraison s’affichent automatiquement.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="addressDetail"
                  className="text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-1 block"
                >
                  Adresse détaillée
                </label>
                <input
                  id="addressDetail"
                  type="text"
                  value={addressDetail}
                  onChange={(e) => {
                    setAddressDetail(e.target.value);
                    if (errors.addressDetail)
                      setErrors((prev) => ({
                        ...prev,
                        addressDetail: undefined,
                      }));
                  }}
                  placeholder="Quartier, rue, numéro de maison..."
                  className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-950 transition-all ${
                    errors.addressDetail
                      ? "border-rose-300 focus:border-rose-500"
                      : "border-stone-200"
                  }`}
                />
                {errors.addressDetail && (
                  <p className="text-[9px] text-rose-600 mt-1">
                    {errors.addressDetail}
                  </p>
                )}
              </div>
            </div>

            {/* 2. RÉSUMÉ DE COMMANDE */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-4">
              <h2 className="text-[12px] uppercase tracking-[0.25em] font-bold text-[#c07b5a]">
                2. Résumé de commande
              </h2>
              <div className="flex justify-between text-xs text-stone-600">
                <span className="font-medium">Produit</span>
                <span className="font-medium">
                  {product.name} × {quantity}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600">
                <span className="font-medium">Zone de livraison</span>
                <span className="font-medium">
                  {selectedZone ? selectedZone.name : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600 border-t border-stone-200 pt-3">
                <span className="font-medium">Sous-total</span>
                <span className="font-medium">
                  {productSubtotal.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600">
                <span className="font-medium">Frais de livraison</span>
                <span className="font-medium">
                  {deliveryPrice.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-950 border-t border-stone-200 pt-3">
                <span>TOTAL</span>
                <span>{totalAmount.toLocaleString()} FCFA</span>
              </div>

              {/* Bouton de commande */}
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !isAvailable}
                className={`w-full mt-4 py-4 rounded-xl text-[10px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all ${
                  !isAvailable
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                    : isSubmitting
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <SpinnerIcon />
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {isAvailable
                      ? "Confirmer la commande"
                      : "Produit indisponible"}
                  </>
                )}
              </button>
              {!isAvailable && (
                <p className="text-[9px] text-rose-600 text-center mt-2">
                  Ce produit est actuellement en rupture de stock.
                </p>
              )}
            </div>

            {/* Icônes d’avantages */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-stone-200">
                <Truck className="w-5 h-5 text-stone-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Paiement à la livraison
                  </p>
                  <p className="text-[8px] text-stone-400">
                    Payez en toute sécurité à réception
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-stone-200">
                <Shield className="w-5 h-5 text-stone-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Livraison rapide
                  </p>
                  <p className="text-[8px] text-stone-400">
                    Partout en Côte d’Ivoire
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-stone-200">
                <Award className="w-5 h-5 text-stone-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Produits de qualité
                  </p>
                  <p className="text-[8px] text-stone-400">
                    Sélectionnées avec soin
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-stone-200">
                <Headphones className="w-5 h-5 text-stone-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Support client
                  </p>
                  <p className="text-[8px] text-stone-400">
                    Disponible sur WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Politique de retour (maintenant sous la grille) */}
      </main>
        <Footer />
    </div>
  );
}