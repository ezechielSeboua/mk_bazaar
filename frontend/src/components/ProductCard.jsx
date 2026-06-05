import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

/* ---------- Icônes ---------- */
const CategoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-3 h-3 sm:w-4 sm:h-4"
  >
    <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z" />
  </svg>
);

export default function ProductCard({ product, delay = 0 }) {
  const backgroundImage = product.image_path?.[0]
    ? resolveMediaUrl(product.image_path[0])
    : DEFAULT_PLACEHOLDER_IMAGE;

  const name = product.name || "Sans titre";
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "—";

  const description = product.description || "";
  const rating = product.rating || "4.8";
  const price = `${product.price || 0} FCFA`;
  const inStock = product.in_stock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]"
    >
      {/* Image de fond */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={backgroundImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Contenu superposé */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-5 text-white">
        {/* Nom du produit */}
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight leading-tight">
          {name}
        </h2>

        {/* Description (limitée à 2 lignes sur mobile, 3 sur tablette+) */}
        {description && (
          <p className="text-[11px] sm:text-xs md:text-sm mt-1 leading-relaxed text-white/90 line-clamp-2 sm:line-clamp-3">
            {description}
          </p>
        )}

        {/* Note & Prix */}
        <div className="flex justify-around items-center border-y border-white/20 py-1.5 my-1.5 sm:py-2 sm:my-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-[11px] sm:text-sm">{rating}</span>
            </div>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/70 font-medium">
              Note
            </span>
          </div>
          <div className="text-center">
            <div className="font-bold text-[11px] sm:text-sm">{price}</div>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/70 font-medium">
              Prix
            </span>
          </div>
        </div>

        {/* Catégorie + Statut */}
        <div className="flex justify-between items-center">
          <div className="flex items-center mt-1 sm:mt-2">
            <CategoryIcon />
            <p className="text-[11px] sm:text-xs md:text-sm font-medium truncate max-w-[100px] sm:max-w-none">
              {categoryName}
            </p>
          </div>
          <span
            className={`inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-full ${
              inStock
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {inStock ? "En stock" : "Rupture"}
          </span>
        </div>

        {/* Bouton commander */}
        <Link to={`/products/${product.slug}`} className="block mt-2 sm:mt-3">
          <motion.button
            whileHover={inStock ? { scale: 1.02 } : {}}
            whileTap={inStock ? { scale: 0.98 } : {}}
            disabled={!inStock}
            className={`w-full py-2 sm:py-2.5 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium uppercase tracking-wider transition-colors duration-300 shadow-md ${
              inStock
                ? "bg-white text-black hover:bg-green-500 hover:text-white"
                : "bg-stone-400 text-stone-600 cursor-not-allowed"
            }`}
          >
            {inStock ? "Commander" : "Indisponible"}
            {inStock && <WhatsAppIcon />}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}