import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Share2,
  ShoppingBag,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductGallery from "../components/ProductGallery";
import RelatedProducts from "../components/RelatedProducts";
import ProductVariantSelector from "../components/ProductVariantSelector";
import SizeGuideModal from "../components/SizeGuideModal";
import WhatsAppOrderDrawer from "../components/WhatsAppOrderDrawer";
import StickyMobileBar from "../components/StickyMobileBar";
import ProductAccordions from "../components/ProductAccordions";
import { getProductBySlug } from "../services/product";
import Seo from "../components/Seo";
import { absoluteImageUrl } from "../config/seo";
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
} from "../utils/seoStructuredData";
import { useCatalogData, useCatalogProducts } from "../contexts/CatalogContext";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";
import { useWishlist } from "../contexts/WishlistContext";

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4 shrink-0"
  >
    <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z" />
  </svg>
);

function Skeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full animate-pulse">
        <div className="h-4 w-40 bg-stone-200 rounded-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          <div className="lg:col-span-7 aspect-[3/4] bg-stone-200 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-4 w-28 bg-stone-200 rounded-full" />
            <div className="h-9 w-3/4 bg-stone-200 rounded-xl" />
            <div className="h-6 w-36 bg-stone-200 rounded-lg" />
            <div className="h-20 w-full bg-stone-200 rounded-2xl mt-6" />
            <div className="h-12 w-full bg-stone-200 rounded-2xl" />
            <div className="h-12 w-full bg-stone-200 rounded-2xl" />
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
      role="alert"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="text-xs font-medium pr-6">{message}</span>
      <button
        onClick={onClose}
        aria-label="Fermer la notification"
        className="absolute right-2 top-2 text-current opacity-60 hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shippingZones } = useCatalogData();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [whatsAppDrawerOpen, setWhatsAppDrawerOpen] = useState(false);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const buyActionsRef = useRef(null);

  // Détection du scroll pour la barre d'achat mobile flottante
  useEffect(() => {
    const handleScroll = () => {
      if (!buyActionsRef.current) return;
      const rect = buyActionsRef.current.getBoundingClientRect();
      // Si les boutons principaux ont disparu vers le haut
      setStickyBarVisible(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Chargement du produit par slug
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
            // Sélectionner la première variante en stock, ou la première par défaut
            const firstInStock = dataProduct.variants.find((v) => v.stock > 0);
            setSelectedVariant(firstInStock || dataProduct.variants[0]);
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

  // Produits similaires
  const categorySlug = product?.category?.slug ?? null;
  const { products: relatedRaw } = useCatalogProducts({ page: 1, categorySlug });
  const relatedProducts = relatedRaw
    .filter((p) => p.id !== product?.id)
    .slice(0, 8);

  // Prix et stock
  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const currentOldPrice = selectedVariant ? selectedVariant.old_price : product?.old_price || null;
  const hasVariants = product?.variants && product.variants.length > 0;
  const isAvailable = hasVariants
    ? selectedVariant
      ? selectedVariant.stock > 0
      : false
    : product
    ? product.is_active && (product.stock ?? 0) > 0
    : false;
  const maxAvailableStock = hasVariants && selectedVariant
    ? selectedVariant.stock
    : product?.stock ?? 99;

  const discountPercentage =
    currentOldPrice && currentOldPrice > currentPrice
      ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
      : null;

  // Préparation des images pour la galerie
  const productImages = Array.isArray(product?.image_path) ? product.image_path : [];
  const allImages = (() => {
    if (!hasVariants) return productImages;
    const seen = new Set(productImages);
    const extraVariantImages = product.variants
      .map((v) => v.image_path)
      .filter((img) => img && !seen.has(img) && seen.add(img));
    return [...productImages, ...extraVariantImages];
  })();

  // Index de la photo synchronisée avec la variante choisie
  const activeGalleryIndex = selectedVariant?.image_path
    ? Math.max(0, allImages.indexOf(selectedVariant.image_path))
    : 0;

  // Ajout au panier multi-articles
  const handleAddToCart = () => {
    if (!isAvailable) return;
    try {
      const localCartRaw = localStorage.getItem("mk_bazaar_cart");
      const currentCart = localCartRaw ? JSON.parse(localCartRaw) : [];
      const variantId = selectedVariant?.id || null;
      const existingIndex = currentCart.findIndex(
        (item) => item.id === product.id && (item.variant_id ?? null) === variantId
      );

      const price = selectedVariant?.price || currentPrice;
      const image = selectedVariant?.image_path
        ? resolveMediaUrl(selectedVariant.image_path)
        : allImages[0]
        ? resolveMediaUrl(allImages[0])
        : DEFAULT_PLACEHOLDER_IMAGE;

      if (existingIndex > -1) {
        currentCart[existingIndex].quantity += quantity;
      } else {
        currentCart.push({
          id: product.id,
          variant_id: variantId,
          name: product.name,
          price: price,
          quantity: quantity,
          image: image,
          attributes: selectedVariant?.attributes || null,
          category: product.category?.name || "Boutique",
          slug: product.slug,
        });
      }

      localStorage.setItem("mk_bazaar_cart", JSON.stringify(currentCart));
      window.dispatchEvent(new Event("cart-updated"));
      window.dispatchEvent(new Event("show-basket-preview"));
      showToast(
        `${quantity} pièce${quantity > 1 ? "s" : ""} ajoutée${quantity > 1 ? "s" : ""} au panier !`,
        "success"
      );
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de l'ajout au panier", "error");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name,
      text: `${product?.name} — ${currentPrice?.toLocaleString()} FCFA sur MK BAZAAR`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Lien copié dans le presse-papier", "success");
    }
  };

  if (loading) return <Skeleton />;

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="font-serif text-3xl font-light text-stone-900">
              Pièce introuvable
            </h1>
            <p className="text-stone-500 text-sm font-light">
              Cet article a été retiré de nos collections ou l'adresse n'est plus valide.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-stone-950 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-colors shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour aux collections
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryName = product.category?.name || "Nouvelle Collection";
  const mainImage = allImages[0] ? absoluteImageUrl(allImages[0]) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-stone-950 antialiased selection:bg-stone-950 selection:text-white">
      <Seo
        title={product.name}
        description={product.description}
        path={`/products/${product.slug || slug}`}
        image={mainImage}
        type="product"
        jsonLd={[
          buildProductJsonLd(product),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Collections", path: "/products" },
            { name: product.name, path: `/products/${product.slug || slug}` },
          ]),
        ].filter(Boolean)}
      />

      <Header />

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 w-full">
        {/* Fil d'Ariane Éditorial */}
        <nav className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
          <Link to="/" className="hover:text-stone-900 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-stone-900 transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-stone-900 font-bold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Grille Principale 2 Colonnes Nobles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Colonne Gauche (58%) : Grande Galerie Photo */}
          <div className="lg:col-span-7 w-full">
            <ProductGallery images={allImages} selectedIndex={activeGalleryIndex} />
          </div>

          {/* Colonne Droite (42%) : Informations & Décision d'Achat */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            
            {/* 1. Catégorie, Titre & Prix */}
            <div className="space-y-3 pb-4 border-b border-stone-200/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-stone-400">
                  {categoryName}
                </span>

                {/* Boutons Favoris & Partage discrets */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleWishlist(product)}
                    title={isInWishlist(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    className={`p-2 rounded-full border transition-all ${
                      isInWishlist(product.id)
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : "border-stone-200 text-stone-400 hover:text-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isInWishlist(product.id) ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                  </button>

                  <button
                    onClick={handleShare}
                    title="Partager cette pièce"
                    className="p-2 rounded-full border border-stone-200 text-stone-400 hover:text-stone-800 hover:border-stone-300 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-stone-950 tracking-tight leading-[1.1]">
                {product.name}
              </h1>

              {/* Prix & Remise */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-serif text-2xl sm:text-3xl font-medium text-stone-950">
                  {currentPrice.toLocaleString()}{" "}
                  <span className="text-sm font-sans font-light text-stone-600">FCFA</span>
                </span>

                {currentOldPrice && currentOldPrice > currentPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-light text-stone-400 line-through">
                      {currentOldPrice.toLocaleString()} FCFA
                    </span>
                    <span className="bg-[#c07b5a] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                      -{discountPercentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Badge Disponibilité & Réassurance immédiate */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                      : "bg-rose-50 text-rose-800 border border-rose-200/50"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAvailable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  {isAvailable ? "En stock" : "Rupture de stock"}
                </span>

                {isAvailable && (
                  <span className="text-stone-500 text-[11px] font-light flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" /> Expédition sous 24h
                  </span>
                )}
              </div>
            </div>

            {/* 2. Sélecteur de Variantes Moderne (Couleur en pastilles / Taille en boutons) */}
            {hasVariants && (
              <ProductVariantSelector
                variants={product.variants || []}
                selectedVariant={selectedVariant}
                onSelectVariant={(v) => {
                  setSelectedVariant(v);
                  setQuantity(1);
                }}
                onOpenSizeGuide={() => setSizeGuideOpen(true)}
              />
            )}

            {/* 3. Sélecteur de Quantité */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="product-quantity"
                className="text-[10px] uppercase tracking-[0.2em] font-bold block text-stone-500"
              >
                Quantité
              </label>

              <div className="flex items-center border border-stone-200 rounded-xl w-fit overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Diminuer la quantité"
                  className="px-4 py-2.5 text-sm font-medium hover:bg-stone-100 active:bg-stone-200 text-stone-700 transition-colors"
                >
                  −
                </button>
                <span
                  id="product-quantity"
                  className="px-5 py-2.5 text-xs font-mono font-bold text-stone-950 min-w-[42px] text-center select-none"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxAvailableStock}
                  onClick={() => setQuantity(Math.min(maxAvailableStock, quantity + 1))}
                  aria-label="Augmenter la quantité"
                  className="px-4 py-2.5 text-sm font-medium hover:bg-stone-100 active:bg-stone-200 text-stone-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* 4. Boutons d'Action Hiérarchisés */}
            <div id="buy-actions" ref={buyActionsRef} className="space-y-3 pt-3">
              {/* Action Principale : Ajouter au panier */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={`w-full py-4 px-6 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                  isAvailable
                    ? "bg-[#c07b5a] text-white hover:bg-[#a5684a] active:scale-[0.99] shadow-[#c07b5a]/30 hover:shadow-xl cursor-pointer"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{isAvailable ? "Ajouter au panier" : "Article indisponible"}</span>
              </button>

              {/* Action Complémentaire : Commande Express 1 Clic (WhatsApp) */}
              <button
                type="button"
                onClick={() => setWhatsAppDrawerOpen(true)}
                disabled={!isAvailable}
                className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 border ${
                  isAvailable
                    ? "bg-stone-950 text-white hover:bg-stone-800 border-stone-950 active:scale-[0.99] shadow-md cursor-pointer"
                    : "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                }`}
              >
                <WhatsAppIcon />
                <span>Achat Express en 1 Clic (WhatsApp)</span>
              </button>
            </div>

            {/* 5. Réassurances & Engagements de Marque */}
            <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-stone-100/70 rounded-2xl border border-stone-200/60 text-center">
              <div className="space-y-1">
                <Truck className="w-4 h-4 mx-auto text-[#c07b5a]" />
                <span className="text-[10px] uppercase font-bold text-stone-800 block">
                  Expédition 24h
                </span>
                <span className="text-[9px] text-stone-500 font-light block">
                  Abidjan & Intérieur
                </span>
              </div>

              <div className="space-y-1 border-x border-stone-200/80">
                <ShieldCheck className="w-4 h-4 mx-auto text-[#c07b5a]" />
                <span className="text-[10px] uppercase font-bold text-stone-800 block">
                  Paiement Réception
                </span>
                <span className="text-[9px] text-stone-500 font-light block">
                  Cash ou Wave / Orange
                </span>
              </div>

              <div className="space-y-1">
                <RotateCcw className="w-4 h-4 mx-auto text-[#c07b5a]" />
                <span className="text-[10px] uppercase font-bold text-stone-800 block">
                  Échange 48h
                </span>
                <span className="text-[9px] text-stone-500 font-light block">
                  Si souci de taille
                </span>
              </div>
            </div>

            {/* 6. Accordéons Techniques : Matières, Entretien, Livraison */}
            <ProductAccordions
              description={product.description}
              categoryName={categoryName}
            />
          </div>
        </div>

        {/* Section Produits Similaires */}
        <div className="mt-16 sm:mt-24 pt-12 border-t border-stone-200/80">
          <RelatedProducts products={relatedProducts} currentProductId={product.id} />
        </div>
      </main>

      <Footer />

      {/* Tiroir Achat Express WhatsApp */}
      <WhatsAppOrderDrawer
        isOpen={whatsAppDrawerOpen}
        onClose={() => setWhatsAppDrawerOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        setQuantity={setQuantity}
        shippingZones={shippingZones}
        onOrderCompleted={() => {
          showToast("Votre commande a été préparée pour WhatsApp !", "success");
        }}
      />

      {/* Modal Guide des Tailles */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        defaultTab={product.category?.name?.toLowerCase().includes("chauss") ? "chaussures" : "vetements"}
      />

      {/* Barre d'action fixe mobile */}
      <StickyMobileBar
        isVisible={stickyBarVisible}
        product={product}
        selectedVariant={selectedVariant}
        onAddToCart={handleAddToCart}
        onOpenWhatsApp={() => setWhatsAppDrawerOpen(true)}
      />
    </div>
  );
}
