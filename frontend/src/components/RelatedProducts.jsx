import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

function RelatedCard({ product, index }) {
  const image = product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discount = hasDiscount
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="snap-start shrink-0 w-[150px] sm:w-[190px]"
    >
      <Link to={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-stone-950 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
              -{discount}%
            </span>
          )}
        </div>
        <div className="pt-2.5 space-y-0.5">
          <span className="text-[8px] uppercase tracking-[0.2em] text-stone-400 font-bold block">
            {categoryName || "Collection"}
          </span>
          <h3 className="text-xs font-medium text-stone-900 line-clamp-1 group-hover:text-[#c07b5a] transition-colors">
            {product.name}
          </h3>
          <p className="text-sm font-semibold text-stone-950">
            {product.price.toLocaleString()}{" "}
            <span className="text-[10px] font-light">FCFA</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function RelatedProducts({ products = [] }) {
  const scrollRef = useRef(null);

  if (!products.length) return null;

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 w-full mt-8 mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-light uppercase tracking-tight text-stone-950">
          Vous aimerez aussi
        </h2>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Produits précédents"
            className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Produits suivants"
            className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => (
          <RelatedCard key={p.id || i} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
