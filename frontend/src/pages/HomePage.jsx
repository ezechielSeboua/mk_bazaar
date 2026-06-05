import { motion } from "framer-motion";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ProductGrid from "../components/ProductGrid";
import ImageCarousel from "../components/ImageCarousel";
import CategoryShowcase from "../components/CategoryShowcase";
import { useHomeProducts } from "../contexts/CatalogContext";
import Seo from "../components/Seo";
import { buildOrganizationJsonLd } from "../utils/seoStructuredData";
import WhatsAppFloatingButton from "../components/WhatsAppFloatingButton";

const CAROUSEL_IMAGES = [
    "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&h=675&fit=crop",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&h=675&fit=crop",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&h=675&fit=crop",
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1200&h=675&fit=crop",
];

const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: "easeOut" },
    },
};

export default function Home() {
    const { products, isLoading } = useHomeProducts();
    const showInitialLoad = isLoading && products.length === 0;

    return (
        <div className="min-h-screen bg-[#F9F9F7] text-black antialiased selection:bg-black selection:text-[#F9F9F7]">
            <Seo
                title="Accueil"
                description="Découvrez MK BAZAAR : mode minimaliste, pièces intemporelles et collections éditoriales. Livraison en Côte d'Ivoire."
                path="/"
                jsonLd={buildOrganizationJsonLd()}
            />
            <Header />
            <main className="space-y-12 md:space-y-20">
                {/* Hero section – pleine largeur */}
                <motion.section
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative overflow-hidden"
                >
                    <HeroSection />
                </motion.section>

                {/* Catégories */}
                <motion.section
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative overflow-hidden px-4 sm:px-6"
                >
                    <CategoryShowcase />
                </motion.section>

                {/* Produits */}
                <motion.section
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="relative overflow-hidden px-4 sm:px-6"
                >
                    <ProductGrid products={products} loading={showInitialLoad} />
                </motion.section>

                {/* Galerie éditoriale */}
                <motion.section
                    className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 relative overflow-hidden"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    <div className="mb-6 md:mb-8">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-3">
                            Collections
                        </span>
                        <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
                            Galerie <span className="font-normal">éditoriale</span>
                        </h2>
                    </div>
                    <ImageCarousel images={CAROUSEL_IMAGES} interval={10000} aspectRatio="16/9" />
                </motion.section>
            </main>

            <Footer />
            <WhatsAppFloatingButton />
        </div>
    );
}