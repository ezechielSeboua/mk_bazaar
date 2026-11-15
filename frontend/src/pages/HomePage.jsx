import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import Header from "../components/Header";
import Footer, { CommitmentStrip } from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import WhatsAppFloatingButton from "../components/WhatsAppFloatingButton";
import ScrollMarquee from "../components/motion/ScrollMarquee";
import useStorefrontMotion from "../hooks/useStorefrontMotion";
import { buildOrganizationJsonLd } from "../utils/seoStructuredData";
import appSettingsService from "../services/appSettings";
import { getFeaturedProducts } from "../services/product";
import { getCategoryMenu } from "../services/category";
import { getOffers } from "../services/catalog";
import { resolveMediaUrl, getWhatsAppLink } from "../config/env";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { HERO_DEFAULTS, FALLBACK_CAROUSEL } from "../constants/siteDefaults";
import { pillButton, promotionUntil, productImage, tagClass, wrapClass, formatFCFA } from "../components/shop/shopUtils";

/*
 * Accueil (maquette « 01 · Accueil ») : grand visuel, univers (catégories du
 * menu), offre en cours, diptyque éditorial, pièces phares, offres, avis
 * client, univers de la boutique et engagements.
 */

const media = (url) => (url && url.startsWith("/") ? resolveMediaUrl(url) : url);

function SectionTitle({ tag, title }) {
  return (
    <>
      <p data-anim="fade" className={`${tagClass} text-[#6b6b6b]`}>{tag}</p>
      <h2 data-anim="title" className="text-[30px] sm:text-[38px] font-light tracking-[-0.02em] text-[#111] mt-3">{title}</h2>
    </>
  );
}

function ProductRow({ products }) {
  return (
    <div data-anim="stagger" className="grid grid-cols-2 lg:grid-cols-4 gap-1 mt-10 sm:mt-12 text-left">
      {products.map((product) => <ProductCard key={product.id} product={product} layout="editorial" />)}
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 mt-12" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] bg-[#f4f3f1] animate-pulse" />
          <div className="h-3 w-2/3 mx-auto mt-4 bg-[#f1f1f1] rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { contactInfo } = useSiteSettings();
  const [hero, setHero] = useState(HERO_DEFAULTS);
  const [heroReady, setHeroReady] = useState(false);
  const mainRef = useRef(null);
  const [carousel, setCarousel] = useState(FALLBACK_CAROUSEL);
  const [testimonials, setTestimonials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [offers, setOffers] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const keep = (setter) => (value) => { if (!cancelled) setter(value); };

    appSettingsService.getSetting("hero")
      .then((data) => { if (data && !Array.isArray(data) && Object.keys(data).length) keep(setHero)({ ...HERO_DEFAULTS, ...data }); })
      .catch(() => {})
      .finally(() => keep(setHeroReady)(true));
    appSettingsService.getSetting("carousel")
      .then((data) => { if (Array.isArray(data) && data.length) keep(setCarousel)(data); })
      .catch(() => {});
    appSettingsService.getSetting("testimonials")
      .then((data) => { if (Array.isArray(data)) keep(setTestimonials)(data); })
      .catch(() => {});
    getCategoryMenu().then((res) => { if (res?.success) keep(setCategories)([...(res.data?.items ?? []), ...(res.data?.more ?? [])]); });
    getFeaturedProducts().then((res) => keep(setFeatured)(res?.success && Array.isArray(res.data) ? res.data : []));
    getOffers().then((res) => keep(setOffers)(res?.success ? res.data : { promotions: [], products: [], upcoming: null }));

    return () => { cancelled = true; };
  }, []);

  useStorefrontMotion(mainRef, [heroReady, categories.length, featured?.length, offers?.products?.length, testimonials.length, carousel.length]);

  const heroImage = media(hero.image_url) || media(carousel[0]);
  const heroTitle = [hero.title, hero.title_bold].filter(Boolean).join(" ");
  // Une vraie opération (pas une reprise automatique d'ancien prix barré) est mise en avant en priorité.
  const isLegacy = (p) => p.name?.startsWith("Prix barré");
  const promotion = offers?.promotions?.find((p) => !isLegacy(p)) ?? offers?.promotions?.[0];
  const genericPromo = promotion ? isLegacy(promotion) : false;
  const promoProduct = offers?.products?.[0];
  const offerProducts = (offers?.products ?? []).slice(0, 4);
  const testimonial = testimonials[0];
  const whatsappHref = getWhatsAppLink(null, contactInfo?.whatsapp);

  const promoValue = promotion
    ? promotion.discount_type === "percentage" ? `−${promotion.discount_value} %` : `−${formatFCFA(promotion.discount_value)}`
    : null;

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo
        title="Accueil"
        description="MK Bazaar : mode, bijoux et accessoires sélectionnés à Abidjan pour leur qualité et leur finition. Commande et paiement confirmés sur WhatsApp."
        path="/"
        jsonLd={buildOrganizationJsonLd()}
      />
      <Header />

      <main ref={mainRef}>
        {/* Grand visuel */}
        <section data-anim="hero" className="relative h-[560px] sm:h-[640px] lg:h-[720px] overflow-hidden bg-[#f4f3f1]">
          {heroReady && heroImage && <img src={heroImage} alt="" className="absolute inset-0 w-full h-[112%] -top-[6%] object-cover" fetchPriority="high" />}
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.55),rgba(0,0,0,0)_55%)]" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-12 sm:bottom-16 px-4 text-center text-white">
            {heroReady && (
              <>
                {hero.badge && <p data-anim="fade" data-anim-load data-anim-delay="0.3" className={`${tagClass} text-[#eee]`}>{hero.badge}</p>}
                <h1 data-anim="title" data-anim-load data-anim-delay="0.45" className="text-[34px] sm:text-[46px] lg:text-[56px] leading-[1.1] font-light tracking-[-0.02em] mt-3 mb-6 sm:mb-[26px] max-w-[900px] mx-auto">
                  {heroTitle || "Bijoux et accessoires"}
                </h1>
              </>
            )}
            <div data-anim="fade" data-anim-load data-anim-delay="0.9" className="flex gap-3 justify-center flex-wrap">
              <Link to={hero.cta_link?.startsWith("/") ? hero.cta_link : "/products"} className={pillButton("onDark")}>
                {hero.cta_text || "Découvrir la boutique"}
              </Link>
              {promotion && <Link to="/offres" className={pillButton("onDark")}>Voir les offres</Link>}
            </div>
          </div>
        </section>

        <ScrollMarquee
          words={categories.length ? categories.map((c) => c.name.toUpperCase()) : ["BAGUES", "COLLIERS", "BRACELETS", "PARURES"]}
          className="py-6 sm:py-8 border-b border-[#ececec] text-[44px] sm:text-[72px] lg:text-[96px] font-light tracking-[-0.03em] leading-none text-[#111]"
        />

        {/* Univers */}
        {categories.length > 0 && (
          <section className={`${wrapClass} pt-20 sm:pt-[120px] text-center`}>
            <SectionTitle tag="Nos univers" title="Explorez une sélection de la boutique" />
            <div data-anim="stagger" className={`grid grid-cols-2 sm:grid-cols-3 ${categories.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-1 mt-10 sm:mt-12`}>
              {categories.slice(0, 10).map((category) => (
                <Link key={category.id} to={`/products?category=${encodeURIComponent(category.slug)}`} className="group block text-center">
                  <div className="aspect-[4/5] bg-[#f4f3f1] overflow-hidden">
                    {category.image_path ? (
                      <img src={resolveMediaUrl(category.image_path)} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="w-full h-full grid place-items-center text-[#9a9a9a] text-[13px]">{category.name}</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#111] mt-3.5">{category.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Offre en cours */}
        {promotion && (
          <section className="mt-20 sm:mt-[120px]">
            <div className="grid grid-cols-1 md:grid-cols-2 bg-[#f4f3f1]">
              <div data-anim="image" className="aspect-[4/3] md:aspect-auto md:min-h-[520px] overflow-hidden">
                {promoProduct && <img src={productImage(promoProduct)} alt="" loading="lazy" className="w-full h-full object-cover" />}
              </div>
              <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left px-6 py-14 md:px-16">
                <p data-anim="fade" className={`${tagClass} text-[#6b6b6b]`}>Offre limitée</p>
                <h2 data-anim="title" className="text-[34px] sm:text-[48px] font-light tracking-[-0.02em] mt-3.5 mb-3">
                  {genericPromo ? "Les offres du moment" : `${promoValue} · ${promotion.name}`}
                </h2>
                <p data-anim="fade" data-anim-delay="0.2" className="text-[15px] text-[#555] max-w-[420px]">
                  {genericPromo
                    ? `${offers.products.length} pièce${offers.products.length > 1 ? "s" : ""} à prix réduit, dans la limite des stocks.`
                    : promotionUntil(promotion) ? `Valable ${promotionUntil(promotion)}, dans la limite des stocks.` : "Dans la limite des stocks."}
                </p>
                <Link data-anim="fade" data-anim-delay="0.3" to="/offres" className={`${pillButton("light")} mt-[26px]`}>Voir les offres</Link>
              </div>
            </div>
          </section>
        )}

        {/* Diptyque éditorial */}
        {carousel.length >= 2 && (
          <section className={promotion ? "" : "mt-20 sm:mt-[120px]"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {carousel.slice(0, 2).map((url, i) => (
                <div key={i} data-anim="image" data-anim-delay={i * 0.15} className="aspect-[4/5] overflow-hidden">
                  <img src={media(url)} alt="" loading="lazy" data-anim="parallax" data-speed="-14" className="w-full h-[116%] -mt-[8%] object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pièces phares */}
        <section className={`${wrapClass} pt-20 sm:pt-[120px] text-center`}>
          <SectionTitle tag="La sélection" title="Pièces phares" />
          {featured === null ? <ProductRowSkeleton /> : featured.length > 0 ? <ProductRow products={featured.slice(0, 8)} /> : null}
          <Link to="/products" className={`${pillButton("light")} mt-11`}>Découvrir la collection</Link>
        </section>

        {/* Offres du moment */}
        {offerProducts.length > 0 && (
          <section className={`${wrapClass} pt-20 sm:pt-[120px] text-center`}>
            <SectionTitle tag="Offres en cours" title="Les offres du moment" />
            <ProductRow products={offerProducts} />
            <Link to="/offres" className={`${pillButton("light")} mt-11`}>Toutes les offres</Link>
          </section>
        )}

        {/* Avis client */}
        {testimonial?.comment && (
          <section className={`${wrapClass} pt-20 sm:pt-[120px] text-center`}>
            <p className={`${tagClass} text-[#6b6b6b]`}>Avis clients</p>
            <blockquote className="max-w-[760px] mx-auto mt-6">
              <p data-anim="title" className="text-[22px] sm:text-[28px] font-light leading-snug tracking-[-0.01em]">« {testimonial.comment} »</p>
              <footer className="mt-5 text-[13px] text-[#6b6b6b]">
                {testimonial.name}{testimonial.role ? ` · ${testimonial.role}` : ""}
              </footer>
            </blockquote>
            <div className="flex justify-center gap-1 mt-3 text-[#111]" aria-label="Note : 5 sur 5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />)}
            </div>
          </section>
        )}

        {/* Univers de la boutique */}
        <section className={`${wrapClass} pt-20 sm:pt-[120px] text-center`}>
          <SectionTitle tag="L'univers MK Bazaar" title="La boutique" />
          <div data-anim="stagger" className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 sm:mt-12">
            {[
              { to: "/about", title: "Notre histoire", cta: "Découvrir", image: media(carousel[2] ?? carousel[0]) },
              { to: "/products", title: "Notre sélection", cta: "Explorer", image: media(carousel[3] ?? carousel[1]) },
              { href: whatsappHref, title: "Commander sur WhatsApp", cta: "Comment ça marche", image: heroImage },
            ].map((card) => {
              const content = (
                <>
                  <div className="aspect-[4/5] bg-[#f4f3f1] overflow-hidden">
                    {card.image && <img src={card.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                  </div>
                  <p className="text-[15px] text-[#111] mt-4">{card.title}</p>
                  <p className="text-[13px] text-[#6b6b6b] mt-1 underline underline-offset-4">{card.cta}</p>
                </>
              );
              return card.to ? (
                <Link key={card.title} to={card.to} className="group block">{content}</Link>
              ) : (
                <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer" className="group block">{content}</a>
              );
            })}
          </div>
        </section>

        <div className="mt-20 sm:mt-24">
          <CommitmentStrip />
        </div>
      </main>

      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}
