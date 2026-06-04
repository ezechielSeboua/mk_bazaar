// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import Header from '../components/Header';
// import ProductGallery from '../components/ProductGallery';

// // Numéro WhatsApp
// const WHATSAPP_NUMBER = '212600000000';

// /* ---------- Base de données ---------- */
// const PRODUCTS_DB = {
//     'manteau-oversize-structure': {
//         id: 1,
//         name: "Manteau Oversize Structuré",
//         price: "240 €",
//         category: "Vestes",
//         color: "Noir Mat",
//         slug: "manteau-oversize-structure",
//         images: [
//             "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop"
//         ],
//         description: "Un manteau oversize intemporel avec une structure parfaitement calibrée...",
//         details: [
//             "Tissu: Laine mélangée 85% / Polyamide 15%",
//             "Coupe: Oversize",
//             "Fermeture: Boutons",
//             "Poches: Deux poches plaquées",
//             "Doublure: Coton 100%"
//         ],
//         sizes: ["XS", "S", "M", "L", "XL", "XXL"],
//         colors: ["Noir Mat", "Blanc Cassé", "Gris Anthracite"],
//         inStock: true
//     },
//     't-shirt-coton-lourd': {
//         id: 2,
//         name: "T-Shirt Coton Lourd 320g",
//         price: "55 €",
//         category: "Hauts",
//         color: "Blanc Cassé",
//         slug: "t-shirt-coton-lourd",
//         images: [
//             "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop"
//         ],
//         description: "T-shirt en coton lourd premium...",
//         details: [
//             "Tissu: Coton 100% (320g/m²)",
//             "Coupe: Regular fit",
//             "Encolure: Col rond",
//             "Manches: Manches courtes",
//             "Confection: Coutures renforcées"
//         ],
//         sizes: ["XS", "S", "M", "L", "XL", "XXL"],
//         colors: ["Blanc Cassé", "Noir Mat", "Gris Clair"],
//         inStock: true
//     },
//     'pantalon-droit-pinces': {
//         id: 3,
//         name: "Pantalon Droit à Pinces",
//         price: "135 €",
//         category: "Pantalons",
//         color: "Gris Anthracite",
//         slug: "pantalon-droit-pinces",
//         images: [
//             "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&h=800&fit=crop"
//         ],
//         description: "Pantalon classique revisité avec des pinces élégantes...",
//         details: [
//             "Tissu: Laine mélangée 70% / Viscose 30%",
//             "Coupe: Droit",
//             "Fermeture: Braguette à glissière",
//             "Détails: Pinces avant",
//             "Ourlet: Chevauché"
//         ],
//         sizes: ["30", "32", "34", "36", "38", "40", "42"],
//         colors: ["Gris Anthracite", "Noir Mat", "Bleu Marine"],
//         inStock: true
//     },
//     'sweat-capuche-boxy': {
//         id: 4,
//         name: "Sweat à Capuche Boxy Fit",
//         price: "110 €",
//         category: "Hauts",
//         color: "Noir Mat",
//         slug: "sweat-capuche-boxy",
//         images: [
//             "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1572495641004-28421ae29d2b?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop"
//         ],
//         description: "Sweat à capuche au confort optimal...",
//         details: [
//             "Tissu: Coton 70% / Polyester 30%",
//             "Coupe: Boxy fit",
//             "Capuche: Doublée",
//             "Manches: Manches longues",
//             "Poches: Deux poches kangourou"
//         ],
//         sizes: ["XS", "S", "M", "L", "XL", "XXL"],
//         colors: ["Noir Mat", "Blanc Cassé", "Gris Clair"],
//         inStock: true
//     },
//     'blouson-crop-gabardine': {
//         id: 5,
//         name: "Blouson Crop en Gabardine",
//         price: "185 €",
//         category: "Vestes",
//         color: "Sable",
//         slug: "blouson-crop-gabardine",
//         images: [
//             "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=800&fit=crop"
//         ],
//         description: "Blouson court en gabardine premium...",
//         details: [
//             "Tissu: Gabardine 100% coton",
//             "Coupe: Crop",
//             "Fermeture: Boutons",
//             "Poches: Deux poches plaquées",
//             "Doublure: Satin de coton"
//         ],
//         sizes: ["XS", "S", "M", "L", "XL"],
//         colors: ["Sable", "Noir Mat", "Blanc Cassé"],
//         inStock: false
//     },
//     'short-minimaliste-molleton': {
//         id: 6,
//         name: "Short Minimaliste Molleton",
//         price: "65 €",
//         category: "Pantalons",
//         color: "Blanc Cassé",
//         slug: "short-minimaliste-molleton",
//         images: [
//             "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=800&fit=crop",
//             "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop"
//         ],
//         description: "Short épuré en molleton premium...",
//         details: [
//             "Tissu: Coton 85% / Polyester 15%",
//             "Coupe: Droit",
//             "Fermeture: Cordons",
//             "Poches: Deux poches latérales",
//             "Longueur: Genou"
//         ],
//         sizes: ["XS", "S", "M", "L", "XL", "XXL"],
//         colors: ["Blanc Cassé", "Noir Mat", "Gris Clair"],
//         inStock: true
//     }
// };

// /* ---------- Icône cœur SVG ---------- */
// function HeartIcon() {
//     return (
//         <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
//         </svg>
//     );
// }

// export default function ProductDetails() {
//     const { slug } = useParams();
//     const navigate = useNavigate();
//     const product = PRODUCTS_DB[slug];

//     const [selectedSize, setSelectedSize] = useState(null);
//     const [selectedColor, setSelectedColor] = useState(product?.color || null);
//     const [quantity, setQuantity] = useState(1);

//     useEffect(() => {
//         if (product) {
//             document.title = `${product.name} | MK BAZAAR`;
//         } else {
//             document.title = "Produit introuvable | MK BAZAAR";
//         }
//     }, [product]);

//     const handleWhatsAppOrder = () => {
//         if (!selectedSize && product.sizes.length > 0) {
//             alert('Veuillez sélectionner une taille');
//             return;
//         }
//         const message = encodeURIComponent(
//             `Bonjour MK BAZAAR, je suis intéressé par le produit suivant :\n` +
//             `- Nom : ${product.name}\n` +
//             `- Couleur : ${selectedColor}\n` +
//             `- Taille : ${selectedSize || 'Non spécifiée'}\n` +
//             `- Quantité : ${quantity}\n\n` +
//             `Pouvez-vous me confirmer la disponibilité et le prix ? Merci.`
//         );
//         window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
//     };

//     if (!product) {
//         return (
//             <div className="min-h-screen bg-[#F9F9F7] text-black antialiased">
//                 <Header />
//                 <main className="max-w-7xl mx-auto px-6 py-24 text-center">
//                     <motion.p
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="text-stone-400 uppercase tracking-widest text-sm mb-6"
//                     >
//                         Produit introuvable
//                     </motion.p>
//                     <motion.button
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         transition={{ delay: 0.2 }}
//                         onClick={() => navigate('/products')}
//                         className="text-[11px] uppercase tracking-wider font-medium border border-black px-8 py-3 hover:bg-black hover:text-[#F9F9F7] transition-colors"
//                     >
//                         Retourner au catalogue
//                     </motion.button>
//                 </main>
//             </div>
//         );
//     }

//     // Variantes d'animation
//     const fadeInUp = {
//         hidden: { opacity: 0, y: 20 },
//         visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
//     };

//     const staggerContainer = {
//         hidden: { opacity: 0 },
//         visible: {
//             opacity: 1,
//             transition: { staggerChildren: 0.08 },
//         },
//     };

//     const itemFadeIn = {
//         hidden: { opacity: 0, y: 10 },
//         visible: { opacity: 1, y: 0 },
//     };

//     return (
//         <div className="min-h-screen bg-[#F9F9F7] text-black antialiased">
//             <Header />

//             <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
//                 {/* Lien de retour */}
//                 <motion.button
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.1 }}
//                     onClick={() => navigate('/products')}
//                     className="text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-black transition-colors mb-8"
//                 >
//                     ← Retour au catalogue
//                 </motion.button>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">

//                     {/* Galerie images */}
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.95 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ duration: 0.6 }}
//                     >
//                         <ProductGallery images={product.images} />
//                     </motion.div>

//                     {/* Détails du produit */}
//                     <motion.div
//                         className="flex flex-col justify-start"
//                         variants={staggerContainer}
//                         initial="hidden"
//                         animate="visible"
//                     >
//                         {/* En-tête produit */}
//                         <motion.div className="mb-8 space-y-4" variants={fadeInUp}>
//                             <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 font-bold block">
//                                 {product.category}
//                             </span>
//                             <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight leading-tight">
//                                 {product.name}
//                             </h1>
//                             <p className="text-2xl font-semibold text-black">
//                                 {product.price}
//                             </p>
//                         </motion.div>

//                         {/* Statut stock */}
//                         <motion.div className="mb-8" variants={fadeInUp}>
//                             {product.inStock ? (
//                                 <p className="text-[10px] uppercase tracking-[0.2em] text-green-700 font-medium">
//                                     ✓ En stock
//                                 </p>
//                             ) : (
//                                 <p className="text-[10px] uppercase tracking-[0.2em] text-red-700 font-medium">
//                                     Rupture de stock
//                                 </p>
//                             )}
//                         </motion.div>

//                         {/* Description */}
//                         <motion.p
//                             className="text-sm text-stone-600 leading-relaxed mb-8"
//                             variants={fadeInUp}
//                         >
//                             {product.description}
//                         </motion.p>

//                         {/* Sélecteurs */}
//                         <motion.div
//                             className="space-y-8 mb-8 pb-8 border-b border-stone-200"
//                             variants={staggerContainer}
//                         >
//                             {/* Couleur */}
//                             <motion.div variants={fadeInUp}>
//                                 <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-3">
//                                     Couleur
//                                 </label>
//                                 <div className="flex gap-3">
//                                     {product.colors.map(color => (
//                                         <motion.button
//                                             key={color}
//                                             onClick={() => setSelectedColor(color)}
//                                             className={`px-4 py-2 text-[10px] uppercase tracking-[0.15em] border transition-all ${
//                                                 selectedColor === color
//                                                     ? 'border-black bg-black text-[#F9F9F7]'
//                                                     : 'border-stone-300 text-black hover:border-black'
//                                             }`}
//                                             whileTap={{ scale: 0.95 }}
//                                         >
//                                             {color}
//                                         </motion.button>
//                                     ))}
//                                 </div>
//                             </motion.div>

//                             {/* Taille */}
//                             {product.sizes.length > 0 && (
//                                 <motion.div variants={fadeInUp}>
//                                     <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-3">
//                                         Taille {selectedSize && `- ${selectedSize}`}
//                                     </label>
//                                     <div className="grid grid-cols-4 gap-2">
//                                         {product.sizes.map(size => (
//                                             <motion.button
//                                                 key={size}
//                                                 onClick={() => setSelectedSize(size)}
//                                                 className={`py-3 text-[10px] uppercase tracking-[0.15em] border transition-all ${
//                                                     selectedSize === size
//                                                         ? 'border-black bg-black text-[#F9F9F7]'
//                                                         : 'border-stone-300 text-black hover:border-black'
//                                                 }`}
//                                                 whileTap={{ scale: 0.95 }}
//                                             >
//                                                 {size}
//                                             </motion.button>
//                                         ))}
//                                     </div>
//                                 </motion.div>
//                             )}

//                             {/* Quantité */}
//                             <motion.div variants={fadeInUp}>
//                                 <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-3">
//                                     Quantité
//                                 </label>
//                                 <div className="flex items-center border border-stone-300 w-fit">
//                                     <motion.button
//                                         whileTap={{ scale: 0.9 }}
//                                         onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                                         className="px-4 py-3 text-sm hover:bg-stone-100 transition-colors"
//                                     >
//                                         −
//                                     </motion.button>
//                                     <span className="px-6 py-3 border-l border-r border-stone-300 text-sm font-medium">
//                                         {quantity}
//                                     </span>
//                                     <motion.button
//                                         whileTap={{ scale: 0.9 }}
//                                         onClick={() => setQuantity(quantity + 1)}
//                                         className="px-4 py-3 text-sm hover:bg-stone-100 transition-colors"
//                                     >
//                                         +
//                                     </motion.button>
//                                 </div>
//                             </motion.div>
//                         </motion.div>

//                         {/* Boutons */}
//                         <motion.div variants={staggerContainer}>
//                             <motion.button
//                                 whileHover={{ scale: 1.01 }}
//                                 whileTap={{ scale: 0.98 }}
//                                 onClick={handleWhatsAppOrder}
//                                 disabled={!product.inStock}
//                                 className={`w-full py-4 px-6 text-[11px] uppercase tracking-wider font-medium transition-all mb-6 flex items-center justify-center gap-2 ${
//                                     product.inStock
//                                         ? 'bg-green-600 text-white hover:bg-green-700'
//                                         : 'bg-stone-300 text-stone-500 cursor-not-allowed'
//                                 }`}
//                             >
//                                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
//                                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//                                 </svg>
//                                 {product.inStock ? 'Commander sur WhatsApp' : 'Rupture de stock'}
//                             </motion.button>

//                             <motion.button
//                                 whileHover={{ scale: 1.01 }}
//                                 whileTap={{ scale: 0.98 }}
//                                 className="w-full py-4 px-6 text-[11px] uppercase tracking-wider font-medium border border-stone-300 text-black hover:border-black hover:bg-stone-50 transition-all flex items-center justify-center"
//                             >
//                                 <HeartIcon />
//                                 Ajouter aux favoris
//                             </motion.button>
//                         </motion.div>
//                     </motion.div>
//                 </div>

//                 {/* Section caractéristiques & entretien */}
//                 <motion.div
//                     className="mt-20 pt-12 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-12"
//                     variants={staggerContainer}
//                     initial="hidden"
//                     whileInView="visible"
//                     viewport={{ once: true, amount: 0.2 }}
//                 >
//                     <motion.div variants={fadeInUp}>
//                         <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-black mb-6">
//                             Caractéristiques
//                         </h2>
//                         <ul className="space-y-3">
//                             {product.details.map((detail, index) => (
//                                 <motion.li
//                                     key={index}
//                                     className="text-sm text-stone-600"
//                                     variants={itemFadeIn}
//                                 >
//                                     {detail}
//                                 </motion.li>
//                             ))}
//                         </ul>
//                     </motion.div>

//                     <motion.div variants={fadeInUp}>
//                         <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-black mb-6">
//                             Conseils d'entretien
//                         </h2>
//                         <ul className="space-y-3 text-sm text-stone-600">
//                             {[
//                                 "Laver à l'eau froide (30°C maximum)",
//                                 "Utiliser une lessive douce",
//                                 "Séchage à l'air libre",
//                                 "Ne pas blanchir",
//                                 "Repasser à basse température si nécessaire"
//                             ].map((tip, index) => (
//                                 <motion.li key={index} variants={itemFadeIn}>{tip}</motion.li>
//                             ))}
//                         </ul>
//                     </motion.div>
//                 </motion.div>

//                 {/* Retours & garantie */}
//                 <motion.div
//                     className="mt-20 pt-12 border-t border-stone-200"
//                     initial={{ opacity: 0, y: 30 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     viewport={{ once: true, amount: 0.3 }}
//                     transition={{ duration: 0.5 }}
//                 >
//                     <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-black mb-4">
//                         Retours & garantie
//                     </h2>
//                     <p className="text-sm text-stone-600">
//                         Vous avez 14 jours pour retourner votre commande. Les retours sont gratuits et sans questions.
//                         Tous les produits bénéficient d'une garantie défauts de fabrication d'1 an.
//                     </p>
//                 </motion.div>
//             </main>
//         </div>
//     );
// }

// pages/ProductDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import ProductGallery from "../components/ProductGallery";
import { getProductBySlug } from "../services/product";
import { createOrder } from "../services/order";
import Seo from "../components/Seo";
import { absoluteImageUrl } from "../config/seo";
import { buildProductJsonLd, buildBreadcrumbJsonLd } from "../utils/seoStructuredData";
import { useCatalogData } from "../contexts/CatalogContext";
import { getWhatsAppLink } from "../config/env";

function HeartIcon() {
  return (
    <svg
      className="w-4 h-4 mr-2"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
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

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shippingZones } = useCatalogData();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedZone, setSelectedZone] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAddressDetail("");
  }, [selectedZone]);

  useEffect(() => {
    setSelectedZone(null);
  }, [shippingZones]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setProduct(null);

      try {
        const result = await getProductBySlug(slug);
        if (cancelled) return;

        if (result.success && result.data) {
          setProduct(result.data.data || result.data);
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

  const handleWhatsAppOrder = async () => {
    if (!product) return;
    if (!selectedZone) {
      alert("Veuillez sélectionner une option de livraison");
      return;
    }
    if (addressDetail.trim() === "") {
      alert("Veuillez indiquer votre adresse exacte (quartier, rue, etc.)");
      return;
    }

    const deliveryPrice = selectedZone.price;
    const totalAmount = product.price * quantity + deliveryPrice;

    // Récupération sécurisée des images du produit
    const productImages =
      product.image_path && product.image_path.length > 0
        ? product.image_path
        : [];
    const mainImage = productImages.length > 0 ? productImages[0] : null;

    setIsSubmitting(true);

    try {
      const clientOrderNumber = `MK-${Date.now().toString().slice(-6)}`;
      const today = new Date().toISOString().split("T")[0];

      const orderData = {
        order_number: clientOrderNumber,
        date: today,
        delivery_location: selectedZone.name,
        delivery_fee: deliveryPrice,
        detailed_address: addressDetail.trim(),
        total_price: totalAmount,
        status: "pending",
        products: [
          {
            product_id: product.id,
            name: product.name,
            quantity: quantity,
            unit_price: product.price,
            image_path: mainImage,
          },
        ],
      };

      const response = await createOrder(orderData);
      if (response.success) {
        const orderReference =
          response.data.reference ||
          response.data.order_number ||
          clientOrderNumber;

        // Réinitialiser les champs
        setQuantity(1);
        setSelectedZone(null);
        setAddressDetail("");

        const message =
          `🛍️ *NOUVELLE COMMANDE MK BAZAAR*\n\n` +
            `📌 *Référence Commande :* #${orderReference}\n\n` +
            `Bonjour,\n\n` +
            `Je viens de valider ma commande sur le site. Voici les détails :\n\n` +
            `📦 *Produit :* ${product.name}\n` +
            `🏷️ *Catégorie :* ${product.category?.name || "Non renseignée"}\n` +
            `💰 *Prix unitaire :* ${product.price.toLocaleString()} FCFA\n` +
            `🔢 *Quantité souhaitée :* ${quantity}\n\n` +
            `🚚 *Livraison :* ${selectedZone.name}\n` +
            `💵 *Frais de livraison :* ${deliveryPrice.toLocaleString()} FCFA\n` +
            `📍 *Adresse détaillée :* ${addressDetail.trim()}\n` +
            `💰 *Montant total :* ${totalAmount.toLocaleString()} FCFA\n\n` +
            `Merci de me confirmer la prise en compte de ma commande.`;

        window.open(getWhatsAppLink(message), "_blank");
      } else {
        alert(
          "Erreur lors de la validation de la commande. Veuillez réessayer.",
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      alert(
        "Une erreur est survenue lors de la création de votre commande. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
        <Seo title="Produit" path={`/products/${slug}`} />
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 w-full">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-32 bg-stone-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-[3/4] bg-stone-200 rounded" />
              <div className="space-y-4">
                <div className="h-4 w-24 bg-stone-200 rounded" />
                <div className="h-8 w-64 bg-stone-200 rounded" />
                <div className="h-6 w-32 bg-stone-200 rounded" />
                <div className="h-4 w-full bg-stone-200 rounded" />
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
        <Seo
          title="Produit introuvable"
          description="Ce produit n'est plus disponible ou n'existe pas."
          path={`/products/${slug}`}
          noindex
        />
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-24 text-center w-full">
          <p className="text-stone-400 uppercase tracking-widest text-sm mb-6">
            {error || "Produit introuvable"}
          </p>
          <button
            onClick={() => navigate("/products")}
            className="text-[11px] uppercase tracking-wider font-medium border border-black px-8 py-3 hover:bg-black hover:text-[#F9F9F7] transition-colors"
          >
            Retourner au catalogue
          </button>
        </main>
      </div>
    );
  }

  const images =
    product.image_path && product.image_path.length > 0
      ? product.image_path
      : [];

  const productPath = `/products/${product.slug || slug}`;
  const mainImage = images[0] ? absoluteImageUrl(images[0]) : null;
  const productJsonLd = buildProductJsonLd(product);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', path: '/' },
    { name: 'Collections', path: '/products' },
    { name: product.name, path: productPath },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7] text-black antialiased">
      <Seo
        title={product.name}
        description={product.description}
        path={productPath}
        image={mainImage}
        type="product"
        jsonLd={[productJsonLd, breadcrumbJsonLd].filter(Boolean)}
      />
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 w-full">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/products")}
          className="text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-black transition-colors mb-8"
        >
          ← Retour au catalogue
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <ProductGallery images={images} />
          </motion.div>

          <motion.div
            className="flex flex-col justify-start"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="mb-8 space-y-4" variants={fadeInUp}>
              <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 font-bold block">
                {product.category?.name || "Catégorie"}
              </span>
              <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight leading-tight">
                {product.name}
              </h1>
              <p className="text-2xl font-semibold text-black">
                {product.price} FCFA
              </p>
            </motion.div>

            <motion.div className="mb-8" variants={fadeInUp}>
              {product.in_stock ? (
                <p className="text-[10px] uppercase tracking-[0.2em] text-green-700 font-medium">
                  ✓ En stock
                </p>
              ) : (
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-700 font-medium">
                  Rupture de stock
                </p>
              )}
            </motion.div>

            <motion.p
              className="text-sm text-stone-600 leading-relaxed mb-8"
              variants={fadeInUp}
            >
              {product.description}
            </motion.p>

            <motion.div
              className="space-y-8 mb-8 pb-8 border-b border-stone-200"
              variants={staggerContainer}
            >
              {/* Option de livraison */}
              <motion.div variants={fadeInUp}>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-3">
                  Option de livraison
                </label>
                <select
                  value={selectedZone?.name || ""}
                  onChange={(e) => {
                    const zoneName = e.target.value;
                    const zone = shippingZones.find((z) => z.name === zoneName);
                    setSelectedZone(zone || null);
                  }}
                  className="w-full px-4 py-3 border border-stone-300 bg-transparent text-sm text-black focus:outline-none focus:border-black transition-colors"
                >
                  <option value="" disabled>
                    Sélectionnez une option
                  </option>
                  {shippingZones.map(({ id, name, price }) => (
                    <option key={id} value={name}>
                      {name} – {price.toLocaleString()} FCFA
                    </option>
                  ))}
                </select>

                {selectedZone && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-3">
                      Votre adresse exacte *
                    </label>
                    <input
                      type="text"
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="Ex: Quartier, rue, ville, indications..."
                      className="w-full px-4 py-3 border border-stone-300 bg-transparent text-sm text-black placeholder-stone-400 focus:outline-none focus:border-black transition-colors"
                      required
                    />
                  </motion.div>
                )}
              </motion.div>
              <motion.div variants={fadeInUp}>
                <p>
                  NB: Pour les expéditions le paiement se fera avant la
                  livraison.
                </p>
              </motion.div>

              {/* Quantité */}
              <motion.div variants={fadeInUp}>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-3">
                  Quantité
                </label>
                <div className="flex items-center border border-stone-300 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-sm hover:bg-stone-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-6 py-3 border-l border-r border-stone-300 text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 text-sm hover:bg-stone-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={staggerContainer}>
              {/* Bouton Commander avec loader */}
              <motion.button
                whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                onClick={handleWhatsAppOrder}
                disabled={!product.in_stock || isSubmitting}
                className={`w-full py-4 px-6 text-[11px] uppercase tracking-wider font-medium transition-all mb-6 flex items-center justify-center gap-2 ${
                  product.in_stock
                    ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    : "bg-stone-300 text-stone-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon />
                    Commande en cours...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {product.in_stock
                      ? "Commander sur WhatsApp"
                      : "Rupture de stock"}
                  </>
                )}
              </motion.button>

              {/* Bouton Favoris grisé (non fonctionnel) */}
              <button
                disabled
                className="w-full py-4 px-6 text-[11px] uppercase tracking-wider font-medium border border-stone-300 text-stone-400 bg-stone-100 cursor-not-allowed transition-all flex items-center justify-center"
              >
                <HeartIcon />
                Ajouter aux favoris (bientôt disponible)
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Retours & garantie */}
        <motion.div
          className="mt-20 pt-12 border-t border-stone-200"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-black mb-4">
            Retours & garantie
          </h2>
          <p className="text-sm text-stone-600">
            Vous avez 14 jours pour retourner votre commande. Les retours sont
            gratuits et sans questions. Tous les produits bénéficient d'une
            garantie défauts de fabrication d'1 an.
          </p>
        </motion.div>
      </main>
    </div>
  );
}