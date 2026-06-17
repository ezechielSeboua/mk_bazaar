import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ProductGrid from "../components/ProductGrid";
import CategoryShowcase from "../components/CategoryShowcase";
import { useHomeProducts } from "../contexts/CatalogContext";
import Seo from "../components/Seo";
import { buildOrganizationJsonLd } from "../utils/seoStructuredData";
import WhatsAppFloatingButton from "../components/WhatsAppFloatingButton";
import TestimonialsSection from "../components/TestimonialsSection";
import appSettingsService from "../services/appSettings";
import { resolveMediaUrl } from "../config/env";
import { FALLBACK_CAROUSEL } from "../constants/siteDefaults";

/* ---------- Animation variants ---------- */
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ---------- Carrousel amélioré (flèches, dots, pause/play) ---------- */
function EnhancedCarousel({ images, interval = 6000, aspectRatio = "16/9" }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (index) => {
      setCurrent((index + images.length) % images.length);
    },
    [images.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Défilement automatique
  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, interval, isPaused, images.length]);

  // Accessibilité clavier
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  };

  if (!images || images.length === 0) return null;

  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-xl bg-stone-100"
      style={{ aspectRatio }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Galerie éditoriale"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={`Image ${current + 1} de la galerie`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5 }}
          loading="lazy"
          decoding="async"
        />
      </AnimatePresence>

      {/* Flèches de navigation (apparaissent au survol sur desktop) */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-stone-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-stone-400"
        aria-label="Image précédente"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-stone-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-stone-400"
        aria-label="Image suivante"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicateurs (dots) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === current
                ? "bg-white scale-110 shadow-md"
                : "bg-white/60 hover:bg-white/90"
            }`}
            aria-label={`Aller à l'image ${idx + 1}`}
            aria-current={idx === current ? "true" : undefined}
          />
        ))}
      </div>

      {/* Bouton pause/play */}
      <button
        onClick={() => setIsPaused((p) => !p)}
        className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-stone-700 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-stone-400"
        aria-label={isPaused ? "Lancer le défilement" : "Mettre en pause"}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>
    </div>
  );
}

/* ---------- Bouton "Retour en haut" ---------- */
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white p-3 rounded-full shadow-xl hover:bg-stone-700 transition-colors focus:outline-none focus-visible:ring-2 ring-offset-2 ring-stone-400"
      aria-label="Retour en haut de la page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </motion.button>
  );
}

/* ---------- Page d'accueil ---------- */
export default function Home() {
  const { products, isLoading } = useHomeProducts();
  const showInitialLoad = isLoading && products.length === 0;

  const [heroData, setHeroData] = useState({});
  const [carouselImages, setCarouselImages] = useState(FALLBACK_CAROUSEL);
  const [testimonialsData, setTestimonialsData] = useState([]);

  useEffect(() => {
    appSettingsService.getSetting('hero')
      .then(data => { if (data && !Array.isArray(data) && Object.keys(data).length) setHeroData(data); })
      .catch(() => {});
    appSettingsService.getSetting('carousel')
      .then(data => { if (Array.isArray(data) && data.length) setCarouselImages(data.map(url => url.startsWith('/storage') ? resolveMediaUrl(url) : url)); })
      .catch(() => {});
    appSettingsService.getSetting('testimonials')
      .then(data => { if (Array.isArray(data) && data.length) setTestimonialsData(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-black antialiased selection:bg-black selection:text-[#F9F9F7]">
      <Seo
        title="Accueil"
        description="Découvrez MK BAZAAR : mode minimaliste, pièces intemporelles et collections éditoriales. Livraison en Côte d'Ivoire."
        path="/"
        jsonLd={buildOrganizationJsonLd()}
      />
      <Header />
      <main className="overflow-x-hidden">
        <motion.section variants={sectionVariants} initial="hidden" animate="visible">
          <HeroSection hero={heroData} />
        </motion.section>

        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <CategoryShowcase />
        </motion.section>

        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <ProductGrid products={products} loading={showInitialLoad} />
        </motion.section>

        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="mb-8 text-center md:text-left">
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-3">
              Collections
            </span>
            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
              Galerie <span className="font-normal">éditoriale</span>
            </h2>
          </div>
          {/* Carrousel amélioré avec flèches, dots et pause */}
          <EnhancedCarousel images={carouselImages} interval={10000} aspectRatio="16/9" />
        </motion.section>

        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <TestimonialsSection testimonials={testimonialsData} />
        </motion.section>
      </main>

      <Footer />

      {/* Bouton WhatsApp flottant */}
      <WhatsAppFloatingButton />

      {/* Retour en haut */}
      <BackToTop />
    </div>
  );
}