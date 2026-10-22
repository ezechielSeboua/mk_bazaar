import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { useWishlist } from "../contexts/WishlistContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FavoritesPage() {
  const { wishlist } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col bg-brand-sand text-black antialiased selection:bg-black selection:text-brand-sand">
      <Seo
        title="Mes Favoris – MK BAZAAR"
        description="Retrouvez toutes vos pièces favorites MK BAZAAR."
        path="/favoris"
      />
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 w-full">
        {/* En-tête */}
        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/80 pb-6">
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-3 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Retour au catalogue</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-stone-950 tracking-tight">
                Mes Favoris
              </h1>
              {wishlist.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
                  {wishlist.length} pièce{wishlist.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-2 font-light max-w-md">
              Vos articles sauvegardés sont conservés sur cet appareil pour vos futures commandes.
            </p>
          </div>
        </div>

        {/* Contenu */}
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center py-20 sm:py-28 px-4 bg-white/60 border border-stone-200/80 rounded-3xl"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 mb-6 border border-rose-100 shadow-sm">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-stone-900 mb-2">
              Votre liste de favoris est vide
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-8 font-light leading-relaxed">
              Explorez nos collections et cliquez sur le cœur pour conserver vos pièces favorites.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-stone-950 text-white text-xs uppercase tracking-widest font-semibold hover:bg-stone-800 transition-all shadow-md active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Découvrir la collection</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-6 sm:gap-y-10"
          >
            <AnimatePresence>
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ProductCard product={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

