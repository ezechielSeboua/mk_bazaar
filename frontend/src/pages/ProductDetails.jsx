import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, Heart, MessageCircle, RefreshCcw, Share2, ShieldCheck, ShoppingBag, Tag, Truck, X } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import SizeGuideModal from "../components/SizeGuideModal";
import VariantOrderDrawer from "../components/shop/VariantOrderDrawer";
import useMultiVariantOrder from "../components/shop/useMultiVariantOrder";
import { MultiVariantActions, MultiVariantPicker } from "../components/shop/MultiVariantPicker";
import { getProductBySlug, fetchCatalog } from "../services/product";
import useStorefrontMotion from "../hooks/useStorefrontMotion";
import useBodyScrollLock, { scrollToElement } from "../hooks/useBodyScrollLock";
import { useCatalogData } from "../contexts/CatalogContext";
import { useWishlist } from "../contexts/WishlistContext";
import { absoluteImageUrl } from "../config/seo";
import { resolveMediaUrl } from "../config/env";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "../utils/seoStructuredData";
import {
  formatFCFA,
  isInStock,
  getPricing,
  productImage,
  promotionLabel,
  promotionUntil,
  shopButton,
  showStrikethrough,
  wrapClass,
} from "../components/shop/shopUtils";

/*
 * Fiche produit (maquettes « 03 · Fiche vêtement » et « 03b · Fiche collier ») :
 * galerie, options du type de produit, prix remisé, ajout au panier, commande
 * express sur WhatsApp, livraison, onglets d'information et suggestions.
 */

const TABS = [
  { id: "description", label: "Description" },
  { id: "details", label: "Matières et entretien" },
  { id: "delivery", label: "Livraison et échanges" },
];

function Gallery({ images, name, activeImage, onActiveImage }) {
  const [zoom, setZoom] = useState(false);
  const current = activeImage ?? images[0];
  useBodyScrollLock(zoom);
  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setZoom(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[76px_1fr] gap-3.5">
      {images.length > 1 && (
        <div className="order-2 sm:order-1 flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => onActiveImage(src)}
              aria-label={`Photo ${index + 1}`}
              aria-pressed={src === current}
              className={`shrink-0 w-[76px] h-[100px] rounded-sm overflow-hidden ${src === current ? "outline outline-[1.5px] outline-[#111]" : "opacity-70 hover:opacity-100"}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div data-anim="image" data-anim-load className={`relative aspect-[3/4] bg-[#f3f3f3] rounded-sm overflow-hidden ${images.length > 1 ? "order-1 sm:order-2" : "sm:col-span-2"}`}>
        <img src={current} alt={name} className="w-full h-full object-cover" />
        <button type="button" onClick={() => setZoom(true)} className="absolute right-3.5 bottom-3.5 h-[34px] px-3 rounded bg-white text-[13px] font-medium flex items-center gap-1.5">
          <Expand className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" /> Agrandir
        </button>
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Photo de ${name}`}
            className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <img src={current} alt={name} className="max-w-full max-h-full object-contain" />
            <button type="button" onClick={() => setZoom(false)} className="absolute top-4 right-4 w-11 h-11 grid place-items-center rounded-full bg-white text-[#111]" aria-label="Fermer">
              <X className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductView({ product }) {
  const { shippingZones } = useCatalogData();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const order = useMultiVariantOrder(product);
  const hasVariants = order.variants.length > 0;

  const [tab, setTab] = useState("description");
  const [activeImage, setActiveImage] = useState(null);
  const [zoneId, setZoneId] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(null);
  const [shared, setShared] = useState(false);
  const [related, setRelated] = useState([]);
  const viewRef = useRef(null);
  useStorefrontMotion(viewRef, [related.length]);

  const images = useMemo(() => {
    const list = (product.image_path ?? []).map(resolveMediaUrl);
    return list.length ? list : [productImage(product)];
  }, [product]);

  // La photo de la couleur (ou finition) choisie passe au premier plan
  const variantImage = order.groupImage ? resolveMediaUrl(order.groupImage) : null;
  const [lastVariantImage, setLastVariantImage] = useState(variantImage);
  if (variantImage !== lastVariantImage) {
    setLastVariantImage(variantImage);
    if (variantImage) setActiveImage(variantImage);
  }
  const galleryImages = variantImage && !images.includes(variantImage) ? [variantImage, ...images] : images;

  useEffect(() => {
    if (!product.category?.slug) return undefined;
    let cancelled = false;
    fetchCatalog({ category_slug: product.category.slug, per_page: 5 }).then((res) => {
      if (!cancelled && res?.success) setRelated((res.data?.data ?? []).filter((p) => p.id !== product.id).slice(0, 4));
    });
    return () => { cancelled = true; };
  }, [product]);

  const pricing = getPricing(product);
  const loved = isInWishlist(product.id);
  const zone = shippingZones.find((z) => z.id === zoneId) ?? shippingZones[0] ?? null;
  const reference = product.sku;
  const guideLabel = product.product_type?.guide_label || (order.attributes.some((a) => a.slug === "taille" || a.slug === "pointure") ? "Guide des tailles" : null);
  const specs = Array.isArray(product.specs) ? product.specs : [];

  const anyStock = isInStock(product);
  const stockCount = hasVariants ? order.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0) : product.stock ?? 0;

  const addSelectionToCart = () => {
    const count = order.totalQuantity;
    order.addAllToCart();
    setAddedFeedback(`${count} article${count > 1 ? "s" : ""} ajouté${count > 1 ? "s" : ""}`);
    setTimeout(() => setAddedFeedback(null), 2500);
  };
  const scrollToPicker = () => scrollToElement(document.getElementById("achat"));

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch { /* partage annulé */ }
  };

  const stockLine = !anyStock
    ? { tone: "text-[#b42318]", text: "Épuisé" }
    : stockCount <= 3
      ? { tone: "text-[#8a4b00]", text: `Plus que ${stockCount} en stock · expédié sous 24 h` }
      : { tone: "text-[#166534]", text: "En stock · expédié sous 24 h" };

  const category = product.category;
  const parent = category?.parent;

  return (
    <>
      <main ref={viewRef} className={wrapClass}>
        <nav className="text-[13px] text-[#777] py-[22px]" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link>
          {parent && <> / <Link to={`/products?category=${parent.slug}`} className="hover:underline">{parent.name}</Link></>}
          {category && <> / <Link to={`/products?category=${category.slug}`} className="hover:underline">{category.name}</Link></>}
          {" / "}<b className="font-medium text-[#111]">{product.name}</b>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 lg:gap-14">
          <Gallery images={galleryImages} name={product.name} activeImage={activeImage && galleryImages.includes(activeImage) ? activeImage : null} onActiveImage={setActiveImage} />

          <div>
            <div className="flex justify-between items-start gap-4">
              <p className="text-[13px] text-[#777]">{[parent?.name, category?.name].filter(Boolean).join(" · ")}</p>
              <div className="flex gap-2">
                <button type="button" onClick={share} className={shopButton("secondary", "sm")} aria-label="Partager">
                  <Share2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                  {shared && <span className="text-[12px] font-medium">Lien copié</span>}
                </button>
                <button type="button" onClick={() => toggleWishlist(product)} aria-pressed={loved} className={`${shopButton("secondary", "sm")} ${loved ? "text-[#c2410c]" : ""}`} aria-label={loved ? "Retirer des favoris" : "Ajouter aux favoris"}>
                  <Heart className="w-4 h-4" strokeWidth={1.6} fill={loved ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              </div>
            </div>

            <h1 data-anim="title" data-anim-load data-anim-delay="0.2" className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.02em] mt-1.5 mb-2">{product.name}</h1>
            {reference && <p className="text-[13px] text-[#777]">Réf. {reference}</p>}

            <p className="text-2xl font-semibold tabular-nums mt-5 mb-1.5">
              {pricing.from && <span className="text-base font-normal text-[#555] mr-1.5">dès</span>}
              {showStrikethrough(pricing) && !pricing.from && <s className="mr-3 text-lg font-normal text-[#767676]">{formatFCFA(pricing.base_price)}</s>}
              {formatFCFA(pricing.final_price)}
            </p>
            {pricing.discount > 0 && (
              <p className="flex items-center gap-1.5 text-[13.5px] text-[#111] mb-1.5">
                <Tag className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                −{pricing.discount_percent} %{promotionLabel(pricing.promotion?.name) ? ` · ${promotionLabel(pricing.promotion.name)}` : ""}{promotionUntil(pricing.promotion) ? ` · ${promotionUntil(pricing.promotion)}` : ""}
              </p>
            )}
            <p className={`flex items-center gap-2 text-[13.5px] ${stockLine.tone}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" /> {stockLine.text}
            </p>

            <div id="achat" data-anim="fade" data-anim-load data-anim-delay="0.45" className="border-t border-[#ececec] mt-6 pt-[22px] scroll-mt-28">
              {anyStock ? (
                <>
                  <MultiVariantPicker order={order} guideLabel={guideLabel} onGuide={() => setGuideOpen(true)} />
                  {hasVariants && order.groupAttributes.length + (order.rowAttribute ? 1 : 0) > 1 && (
                    <p className="mt-4 text-[13px] text-[#666]">Plusieurs tailles ou coloris ? Indiquez les quantités de chacun : elles sont conservées quand vous changez de coloris.</p>
                  )}
                  <div className="mt-6 pt-5 border-t border-[#ececec]">
                    <MultiVariantActions order={order} onAddToCart={addSelectionToCart} onWhatsApp={() => setCheckoutOpen(true)} feedback={addedFeedback} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#444]">Cet article est épuisé pour le moment. Écrivez-nous sur WhatsApp pour connaître son prochain réassort.</p>
              )}

              <div className="bg-[#fafafa] border border-[#ececec] rounded px-[18px] py-4 mt-5 text-sm space-y-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Truck className="w-4 h-4 text-[#555] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                  {zone ? <span>Livraison à <b className="font-semibold">{zone.name}</b> : {formatFCFA(zone.price)} · sous 24 h</span> : <span>Livraison sous 24 h</span>}
                  {shippingZones.length > 1 && (
                    <label className="ml-auto">
                      <span className="sr-only">Changer de commune</span>
                      <select value={zone?.id ?? ""} onChange={(e) => setZoneId(Number(e.target.value))} className="bg-transparent text-[13px] underline cursor-pointer max-w-[150px]">
                        {shippingZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <p className="flex items-center gap-2.5"><RefreshCcw className="w-4 h-4 text-[#555] shrink-0" strokeWidth={1.6} aria-hidden="true" />Échange sous 48 h en cas de souci de taille</p>
                <p className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-[#555] shrink-0" strokeWidth={1.6} aria-hidden="true" />Paiement confirmé avec notre équipe sur WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets d'information */}
        <div role="tablist" aria-label="Informations produit" className="flex gap-7 border-b border-[#ececec] mt-16 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`py-3.5 -mb-px text-[15px] whitespace-nowrap border-b-2 ${tab === t.id ? "border-[#111] text-[#111] font-semibold" : "border-transparent text-[#666] hover:text-[#111]"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 md:gap-14 py-7 text-[15px] leading-[1.7] text-[#333]">
          {tab === "description" && (
            <>
              <div className="whitespace-pre-line">{product.description}</div>
              {specs.length > 0 && (
                <dl className="border-t border-[#ececec]">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-6 py-[11px] border-b border-[#ececec] text-sm">
                      <dt className="text-[#777]">{spec.label}</dt><dd className="text-right">{spec.value}</dd>
                    </div>
                  ))}
                  {order.attributes.map((a) => (
                    <div key={a.slug} className="flex justify-between gap-6 py-[11px] border-b border-[#ececec] text-sm">
                      <dt className="text-[#777]">{a.name}</dt><dd className="text-right">{a.values.map((v) => v.value).join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          )}
          {tab === "details" && (
            <div>
              {specs.length > 0 ? (
                <dl>{specs.map((spec) => <p key={spec.label}><b className="font-semibold">{spec.label} :</b> {spec.value}</p>)}</dl>
              ) : (
                <p>Les détails de matière et d'entretien vous sont précisés sur WhatsApp à la commande.</p>
              )}
            </div>
          )}
          {tab === "delivery" && (
            <div className="space-y-3">
              <p>Expédition sous 24 h après validation de la commande, à Abidjan et à l'intérieur du pays. Les frais dépendent de votre commune et vous sont indiqués avant la validation.</p>
              <p>Un souci de taille ? L'échange est possible sous 48 h après réception, article non porté et dans son état d'origine.</p>
              <Link to="/about#livraison" className="underline">En savoir plus</Link>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <div className="flex justify-between items-end mb-6">
              <h2 data-anim="title" className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em]">Vous aimerez aussi</h2>
              {category && <Link to={`/products?category=${category.slug}`} className="text-sm font-medium underline">Tout voir</Link>}
            </div>
            <div data-anim="stagger" className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-9">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      {/* Barre d'achat mobile */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-[#ececec] px-4 py-3 flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[13px] truncate">{product.name}</p>
          <p className="text-sm font-semibold tabular-nums">
            {order.totalQuantity > 0 ? `${order.totalQuantity} art. · ${formatFCFA(order.subtotal)}` : formatFCFA(pricing.final_price)}
          </p>
        </div>
        {order.totalQuantity > 0 ? (
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={addSelectionToCart} className={shopButton("primary")} aria-label="Ajouter la sélection au panier">
              <ShoppingBag className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setCheckoutOpen(true)} className={shopButton("whatsapp")}>
              <MessageCircle className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /> WhatsApp
            </button>
          </div>
        ) : (
          <button type="button" onClick={scrollToPicker} disabled={!anyStock} className={`${shopButton("primary")} ml-auto`}>
            Choisir les quantités
          </button>
        )}
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />

      {checkoutOpen && (
        <VariantOrderDrawer product={product} order={order} initialStep="checkout" onClose={() => setCheckoutOpen(false)} />
      )}
      <SizeGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        defaultTab={order.attributes.some((a) => a.slug === "pointure") ? "chaussures" : "vetements"}
      />
    </>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const [state, setState] = useState({ slug: null, product: null, error: null });

  useEffect(() => {
    let cancelled = false;
    getProductBySlug(slug).then((res) => {
      if (cancelled) return;
      const product = res?.success ? res.data?.data ?? res.data : null;
      setState({ slug, product, error: product ? null : "Ce produit est introuvable ou n'est plus disponible." });
    });
    return () => { cancelled = true; };
  }, [slug]);

  const loading = state.slug !== slug;
  const product = loading ? null : state.product;

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      {product && (
        <Seo
          title={product.name}
          description={product.description}
          path={`/products/${product.slug}`}
          image={product.image_path?.[0] ? absoluteImageUrl(resolveMediaUrl(product.image_path[0])) : undefined}
          type="product"
          jsonLd={[
            buildProductJsonLd(product),
            buildBreadcrumbJsonLd([
              { name: "Accueil", path: "/" },
              { name: "Boutique", path: "/products" },
              { name: product.name, path: `/products/${product.slug}` },
            ]),
          ].filter(Boolean)}
        />
      )}
      <Header />

      {loading && (
        <div className={`${wrapClass} pt-16 grid grid-cols-1 lg:grid-cols-2 gap-14`} aria-busy="true" aria-label="Chargement du produit">
          <div className="aspect-[3/4] bg-[#f3f3f3] animate-pulse rounded-sm" />
          <div className="space-y-4">
            <div className="h-4 w-32 bg-[#f1f1f1] rounded" />
            <div className="h-9 w-3/4 bg-[#f1f1f1] rounded" />
            <div className="h-6 w-28 bg-[#f1f1f1] rounded" />
          </div>
        </div>
      )}

      {!loading && state.error && (
        <main className={`${wrapClass} py-24 text-center`}>
          <h1 className="text-2xl font-semibold">Produit introuvable</h1>
          <p className="text-[15px] text-[#666] mt-2">{state.error}</p>
          <Link to="/products" className={`${shopButton("primary")} mt-6`}>Retour à la boutique</Link>
        </main>
      )}

      {product && <ProductView key={product.id} product={product} />}

      <Footer />
    </div>
  );
}
