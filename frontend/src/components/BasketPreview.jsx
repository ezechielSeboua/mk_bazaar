// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
// import { createPortal } from "react-dom";
// import { resolveMediaUrl } from "../config/env";

// export default function BasketPreview() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [cartItems, setCartItems] = useState([]);

//   const loadCart = () => {
//     const raw = localStorage.getItem("mk_bazaar_cart");
//     setCartItems(raw ? JSON.parse(raw) : []);
//   };

//   useEffect(() => {
//     const handleOpen = () => {
//       loadCart();
//       setIsOpen(true);
//     };
//     const handleUpdate = () => {
//       if (isOpen) loadCart();
//     };

//     window.addEventListener("show-basket-preview", handleOpen);
//     window.addEventListener("cart-updated", handleUpdate);
//     return () => {
//       window.removeEventListener("show-basket-preview", handleOpen);
//       window.removeEventListener("cart-updated", handleUpdate);
//     };
//   }, [isOpen]);

//   const removeItem = (id, variantId) => {
//     const updated = cartItems.filter(
//       (item) => !(item.id === id && (item.variant_id ?? null) === (variantId ?? null))
//     );
//     setCartItems(updated);
//     localStorage.setItem("mk_bazaar_cart", JSON.stringify(updated));
//     window.dispatchEvent(new Event("cart-updated"));
//   };

//   const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

//   return createPortal(
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           <motion.div
//             key="overlay"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[1px]"
//             onClick={() => setIsOpen(false)}
//           />

//           <motion.div
//             key="drawer"
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", damping: 28, stiffness: 300 }}
//             className="fixed top-0 right-0 h-full w-full max-w-sm z-[151] bg-white shadow-2xl flex flex-col"
//           >
//             {/* Header */}
//             <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
//               <div className="flex items-center gap-2">
//                 <ShoppingBag className="w-4 h-4 text-stone-700" />
//                 <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900">
//                   Mon Panier
//                 </h2>
//                 {totalItems > 0 && (
//                   <span className="bg-[#c07b5a] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
//                     {totalItems}
//                   </span>
//                 )}
//               </div>
//               <button
//                 onClick={() => setIsOpen(false)}
//                 className="text-stone-400 hover:text-stone-800 transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Items */}
//             <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
//               {cartItems.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
//                   <ShoppingBag className="w-10 h-10 text-stone-200" />
//                   <p className="text-xs text-stone-400 uppercase tracking-widest">
//                     Votre panier est vide
//                   </p>
//                 </div>
//               ) : (
//                 cartItems.map((item) => (
//                   <div
//                     key={`${item.id}-${item.variant_id ?? "base"}`}
//                     className="flex gap-3 bg-stone-50 rounded-xl p-3 border border-stone-100"
//                   >
//                     <img
//                       src={resolveMediaUrl(item.image)}
//                       alt={item.name}
//                       className="w-14 h-16 object-cover rounded-lg bg-stone-200 flex-shrink-0"
//                     />
//                     <div className="flex-1 min-w-0">
//                       <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate">
//                         {item.category}
//                       </p>
//                       <p className="text-xs font-semibold text-stone-900 line-clamp-2 leading-tight mt-0.5">
//                         {item.name}
//                       </p>
//                       {item.attributes && (
//                         <p className="text-[9px] text-stone-400 mt-0.5 font-mono">
//                           {Object.values(item.attributes).join(" · ")}
//                         </p>
//                       )}
//                       <div className="flex items-center justify-between mt-1.5">
//                         <span className="text-xs font-black text-stone-800 font-mono">
//                           {(item.price * item.quantity).toLocaleString()} FCFA
//                           <span className="text-[10px] font-normal text-stone-400 ml-1">
//                             ×{item.quantity}
//                           </span>
//                         </span>
//                         <button
//                           onClick={() => removeItem(item.id, item.variant_id)}
//                           className="text-rose-400 hover:text-rose-600 transition-colors"
//                         >
//                           <Trash2 className="w-3.5 h-3.5" />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             {/* Footer */}
//             {cartItems.length > 0 && (
//               <div className="border-t border-stone-100 px-5 py-4 space-y-3">
//                 <div className="flex justify-between items-center text-xs">
//                   <span className="text-stone-500 uppercase tracking-wider font-medium">
//                     Sous-total
//                   </span>
//                   <span className="font-black text-stone-900 font-mono">
//                     {subtotal.toLocaleString()} FCFA
//                   </span>
//                 </div>
//                 <Link
//                   to="/panier"
//                   onClick={() => setIsOpen(false)}
//                   className="flex items-center justify-center gap-2 w-full bg-stone-950 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-stone-800 transition-colors"
//                 >
//                   Voir le panier complet
//                   <ArrowRight className="w-3.5 h-3.5" />
//                 </Link>
//               </div>
//             )}
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>,
//     document.body
//   );
// }


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, CheckCircle, Truck, ShieldCheck, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { resolveMediaUrl } from "../config/env";

export default function BasketPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    const raw = localStorage.getItem("mk_bazaar_cart");
    setCartItems(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    const handleOpen = () => {
      loadCart();
      setIsOpen(true);
    };
    const handleUpdate = () => {
      if (isOpen) loadCart();
    };

    window.addEventListener("show-basket-preview", handleOpen);
    window.addEventListener("cart-updated", handleUpdate);
    return () => {
      window.removeEventListener("show-basket-preview", handleOpen);
      window.removeEventListener("cart-updated", handleUpdate);
    };
  }, [isOpen]);

  const removeItem = (id, variantId) => {
    const updated = cartItems.filter(
      (item) => !(item.id === id && (item.variant_id ?? null) === (variantId ?? null))
    );
    setCartItems(updated);
    localStorage.setItem("mk_bazaar_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm z-[151] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#bc7551] text-white flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  Panier ({totalItems})
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            {/* Success Message */}
            <div className="bg-stone-50 px-5 py-3 flex items-center gap-2 text-emerald-600 text-xs font-medium border-b border-stone-100">
              <CheckCircle className="w-4 h-4" />
              <span>Produit ajouté au panier !</span>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.variant_id}`} className="flex gap-4 border-b border-stone-100 pb-4">
                  <img src={resolveMediaUrl(item.image)} className="w-16 h-16 object-cover rounded bg-stone-100" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stone-900">{item.name}</p>
                    <p className="text-xs font-bold text-stone-900 mt-1">{item.price.toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Quantité : {item.quantity}</p>
                  </div>
                  <button onClick={() => removeItem(item.id, item.variant_id)} className="text-stone-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-stone-100 space-y-3">
              <div className="flex justify-between items-center font-bold text-sm">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              
              <Link to="/panier" onClick={() => setIsOpen(false)} className="block w-full bg-[#bc7551] text-white text-center py-3 rounded text-xs font-bold uppercase">
                Voir le panier
              </Link>
              <button onClick={() => setIsOpen(false)} className="w-full border border-stone-200 py-3 rounded text-xs font-bold uppercase hover:bg-stone-50">
                Continuer mes achats
              </button>

              {/* Trust Section */}
              <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <Truck className="w-4 h-4 text-stone-400" />
                  <div>
                    <p className="font-bold">Livraison rapide</p>
                    <p className="text-[10px] text-stone-400">Partout en Côte d'Ivoire</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <ShieldCheck className="w-4 h-4 text-stone-400" />
                  <div>
                    <p className="font-bold">Paiement sécurisé</p>
                    <p className="text-[10px] text-stone-400">Vos données sont protégées</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <HelpCircle className="w-4 h-4 text-stone-400" />
                  <p className="font-bold">Besoin d'aide ? Contactez-nous</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}