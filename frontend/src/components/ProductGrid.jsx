import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingBag } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";
import VariantPickerModal from "./VariantPickerModal";

/* ---------- Icônes ---------- */
const CategoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-stone-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function SkeletonCard() {
  return <div className="bg-white rounded-xl border border-stone-200 h-[300px] sm:h-[400px] animate-pulse" />;
}

function GridProductCard({ product, index }) {
  const [showVariantModal, setShowVariantModal] = useState(false);
  const backgroundImage = product.image_path?.[0] ? resolveMediaUrl(product.image_path[0]) : DEFAULT_PLACEHOLDER_IMAGE;
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0;
  
  const addToCart = (variant) => {
    const localCartRaw = localStorage.getItem("mk_bazaar_cart");
    const currentCart = localCartRaw ? JSON.parse(localCartRaw) : [];
    currentCart.push({ id: product.id, variant_id: variant?.id || null, name: product.name, price: variant?.price || product.price, quantity: 1, image: backgroundImage });
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(currentCart));
    window.dispatchEvent(new Event("cart-updated"));
    setShowVariantModal(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group bg-white rounded-xl border border-stone-200/80 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all"
    >
      {showVariantModal && <VariantPickerModal product={product} variants={product.variants || []} onSelect={addToCart} onClose={() => setShowVariantModal(false)} />}
      
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/5] bg-stone-100 overflow-hidden">
        <img src={backgroundImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {hasDiscount && <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded">-{discountPercentage}%</span>}
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-4 space-y-1">
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-stone-500">
          <div className="flex items-center"><CategoryIcon />{typeof product.category === 'object' ? product.category.name : product.category}</div>
          <div className="flex items-center font-bold text-stone-800"><Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" /> 4.8</div>
        </div>
        <h2 className="text-xs sm:text-sm font-bold text-stone-950 line-clamp-1">{product.name}</h2>
        <div className="mt-auto pt-2 text-sm sm:text-base font-black text-stone-950">{product.price.toLocaleString()} FCFA</div>
      </div>

      <div className="p-2 sm:p-3 pt-0 flex flex-col gap-2">
        <button onClick={() => product.variants?.length > 1 ? setShowVariantModal(true) : addToCart(product.variants?.[0])}
          className="w-full py-2.5 rounded-lg bg-[#c07b5a] text-white text-[8px] sm:text-[11px] font-bold uppercase hover:bg-[#a5684a] flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Ajouter au panier
        </button>
        <Link to={`/products/${product.slug}`} className="w-full py-2.5 rounded-lg border border-emerald-600 text-emerald-700 text-[8px] sm:text-[11px font-bold uppercase hover:bg-emerald-600 hover:text-white flex items-center justify-center gap-2">
          <WhatsAppIcon /> Commander maintenant
        </Link>
      </div>
    </motion.div>
  );
}

export default function ProductGrid({ products = [], loading = false }) {
  return (
    <section className="px-4 py-8 sm:py-12 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, i) => <GridProductCard key={p.id || i} product={p} index={i} />)}
      </div>
    </section>
  );
}