// import { Link } from "react-router-dom";
// import { motion } from "framer-motion";
// import { Star } from "lucide-react";

// // Icône SVG pour la catégorie (tag)
// const CategoryIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill="none"
//     viewBox="0 0 24 24"
//     strokeWidth={1.5}
//     stroke="currentColor"
//     className="w-4 h-4 mr-1"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M9.568 3.5c.375 0 .722.15.984.412l5.472 5.472c.263.262.412.609.412.984v7.132c0 .773-.627 1.4-1.4 1.4H7.4c-.773 0-1.4-.627-1.4-1.4V7.4c0-.773.627-1.4 1.4-1.4h2.168zM12 12h.008v.008H12V12z"
//     />
//   </svg>
// );

// const WhatsAppIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     fill="currentColor"
//     className="w-3 h-3 sm:w-4 sm:h-4"
//   >
//     <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z" />
//   </svg>
// );

// export default function ProductCard({ product, delay = 0 }) {
//   console.log("ProductCard reçoit le produit :", product);
//   const backgroundImage = product.image_path?.[0]
//     ? `http://localhost:8000${product.image_path[0]}`
//     : "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=800&fit=crop";

//   const name = product.name || "Natasha Romanoff";
//   const categoryName =
//     typeof product.category === "object"
//       ? product.category?.name
//       : product.category || "Brand Designer";

//   const description = product.description || "Description par défaut";
//   const rating = product.rating || "4.8";
//   const price = `${product.price || 50} FCFA`;
//   const in_stock = product.in_stock;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true, amount: 0.2 }}
//       transition={{ duration: 0.5, delay }}
//       whileHover={{ y: -8, transition: { duration: 0.2 } }}
//       className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-[500px]"
//     >
//       <div className="absolute inset-0 w-full h-full">
//         <img
//           src={backgroundImage}
//           alt={name}
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//         />
//         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
//       </div>

//       <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white">
//         <h2 className="text-xl font-bold tracking-tight">{name}</h2>
//         <p className="text-sm mt-1 leading-relaxed text-white/90">
//           {description}
//         </p>

//         <div className="flex justify-around items-center border-y border-white/20 py-3 my-3">
//           <div className="text-center">
//             <div className="flex items-center justify-center gap-1">
//               <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
//               <span className="font-bold">{rating}</span>
//             </div>
//             <span className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
//               Note
//             </span>
//           </div>
//           <div className="text-center">
//             <div className="font-bold">{price}</div>
//             <span className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
//               Prix
//             </span>
//           </div>
//         </div>

//         <div className="flex justify-between">
//           <div className="flex items-center mt-2">
//             <CategoryIcon />
//             <p className="text-sm font-medium">{categoryName}</p>
//           </div>

//           <div>
//             <span
//               className={`inline-block px-2 py-1 mt-3 text-xs font-semibold rounded-full ${in_stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
//             >
//               {in_stock ? "En stock" : "Rupture de stock"}
//             </span>
//           </div>
//         </div>

//         {/* ✅ Passage de l'objet produit via state */}
//         <Link to={`/products/${product.slug}`} state={{ product }}>
//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             className="w-full py-3 rounded-full flex items-center justify-center gap-4 bg-white text-black text-sm font-medium uppercase tracking-wider hover:bg-green-500 hover:text-white transition-colors duration-300 shadow-md mt-4"
//           >
//             passer commande
//             <WhatsAppIcon />
//           </motion.button>
//         </Link>
//       </div>
//     </motion.div>
//   );
// }


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from "../config/env";

// Icône SVG pour la catégorie (tag)
const CategoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4 mr-1"
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

  const name = product.name || "Natasha Romanoff";
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "Brand Designer";

  const description = product.description || "Description par défaut";
  const rating = product.rating || "4.8";
  const price = `${product.price || 50} FCFA`;
  const inStock = product.in_stock;

  // --- Gestion des favoris (localStorage) ---
//   const [isFavorite, setIsFavorite] = useState(false);

//   useEffect(() => {
//     // Récupère la liste des favoris depuis localStorage
//     const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
//     setIsFavorite(favorites.includes(product.id));
//   }, [product.id]);

//   const toggleFavorite = (e) => {
//     e.preventDefault(); // Empêche la navigation
//     e.stopPropagation();
//     const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
//     let newFavorites;
//     if (isFavorite) {
//       newFavorites = favorites.filter((id) => id !== product.id);
//     } else {
//       newFavorites = [...favorites, product.id];
//     }
//     localStorage.setItem("favorites", JSON.stringify(newFavorites));
//     setIsFavorite(!isFavorite);
//   };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-[500px]"
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

      {/* Bouton favoris (cœur) en haut à droite */}
      {/* <button
        onClick={toggleFavorite}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-5 h-5 text-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button> */}

      {/* Contenu en bas */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white">
        <h2 className="text-xl font-bold tracking-tight">{name}</h2>
        <p className="text-sm mt-1 leading-relaxed text-white/90">
          {description}
        </p>

        <div className="flex justify-around items-center border-y border-white/20 py-3 my-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{rating}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
              Note
            </span>
          </div>
          <div className="text-center">
            <div className="font-bold">{price}</div>
            <span className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
              Prix
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center mt-2">
            <CategoryIcon />
            <p className="text-sm font-medium">{categoryName}</p>
          </div>
          <div>
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                inStock
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {inStock ? "En stock" : "Rupture de stock"}
            </span>
          </div>
        </div>

        {/* Bouton passer commande (désactivé si rupture) */}
        <Link to={`/products/${product.slug}`}>
          <motion.button
            whileHover={inStock ? { scale: 1.02 } : {}}
            whileTap={inStock ? { scale: 0.98 } : {}}
            disabled={!inStock}
            className={`w-full py-3 rounded-full flex items-center justify-center gap-4 mt-4 text-sm font-medium uppercase tracking-wider transition-colors duration-300 shadow-md ${
              inStock
                ? "bg-white text-black hover:bg-green-500 hover:text-white"
                : "bg-stone-400 text-stone-600 cursor-not-allowed"
            }`}
          >
            {inStock ? "Passer commande" : "Indisponible"}
            {inStock && <WhatsAppIcon />}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}