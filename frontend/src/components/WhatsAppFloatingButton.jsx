// // components/WhatsAppFloatingButton.jsx
// import { useEffect } from "react";
// import { motion } from "framer-motion";

// const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;
// const DEFAULT_MESSAGE = encodeURIComponent(
//   "Bonjour, je souhaite en savoir plus sur comment passer une commande sur votre site."
// );

// export default function WhatsAppFloatingButton() {
//   const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${DEFAULT_MESSAGE}`;

//   // Injection du keyframe de pulsation dans le DOM
//   useEffect(() => {
//     const style = document.createElement("style");
//     style.textContent = `
//       @keyframes whatsapp-pulse {
//         0%, 100% { transform: scale(1); }
//         50% { transform: scale(1.12); }
//       }
//       .animate-whatsapp-pulse {
//         animation: whatsapp-pulse 2.5s ease-in-out infinite;
//       }
//     `;
//     document.head.appendChild(style);
//     return () => {
//       document.head.removeChild(style);
//     };
//   }, []);

//   return (
//     <motion.div
//       className="fixed bottom-6 right-6 z-50"
//       initial={{ scale: 0, opacity: 0 }}
//       animate={{ scale: 1, opacity: 1 }}
//       transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
//     >
//       <a
//         href={whatsappUrl}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors animate-whatsapp-pulse"
//         aria-label="Contacter sur WhatsApp"
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 24 24"
//           fill="currentColor"
//           className="w-7 h-7 sm:w-8 sm:h-8"
//         >
//           <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z" />
//         </svg>
//       </a>
//     </motion.div>
//   );
// }



import { motion } from "framer-motion";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6"
  >
    <path d="M12.032 2.002c-5.52 0-10 4.48-10 10 0 1.832.5 3.544 1.344 5.02l-1.344 4.978 5.104-1.312c1.408.832 3.008 1.312 4.896 1.312 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18c-1.632 0-3.2-.416-4.576-1.184l-.336-.192-3.024.784.784-3.008-.208-.336a7.955 7.955 0 0 1-1.216-4.064c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8zm4.288-5.664c-.24-.12-1.424-.704-1.648-.784-.224-.08-.384-.12-.544.12-.16.24-.624.784-.768.944-.144.16-.288.184-.528.064-.24-.12-1.024-.376-1.952-1.2-.72-.64-1.2-1.424-1.344-1.664-.144-.24-.016-.376.112-.496.112-.112.24-.288.36-.432.12-.144.16-.24.24-.4.08-.16.04-.304-.016-.424-.064-.12-.544-1.312-.752-1.792-.192-.456-.384-.4-.528-.4h-.448c-.144 0-.384.064-.576.288-.192.224-.736.72-.736 1.76 0 1.04.752 2.048.864 2.176.112.128 1.488 2.272 3.6 3.152.512.224.912.352 1.232.448.512.16.976.144 1.344.08.416-.064 1.28-.528 1.456-1.04.176-.512.176-.944.128-1.04-.048-.096-.176-.16-.4-.28z" />
  </svg>
);

export default function WhatsAppFloatingButton() {
  const { contactInfo } = useSiteSettings();
  const number = contactInfo.whatsapp || "2250000000000";
  const PRESET_MESSAGE = "Bonjour MK BAZAAR, je souhaiterais avoir des informations sur vos collections.";
  const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(PRESET_MESSAGE)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
      {/* Onde de pulsation d'arrière-plan (effet sonar d'appel à l'action discret) */}
      <span className="absolute inset-0 rounded-full bg-stone-950 animate-ping opacity-25 pointer-events-none" />

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter sur WhatsApp"
        
        // Configuration de l'apparition (Apparaît avec un léger retard après le Hero)
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 1.2 
        }}
        
        // Micro-interactions au survol et clic
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        
        // Style : Base noire minimaliste qui vire au vert WhatsApp officiel uniquement au survol
        className="relative p-3.5 bg-stone-950 text-white rounded-full shadow-xl border border-stone-800/40 hover:bg-[#25D366] hover:text-white hover:border-transparent transition-colors duration-300 ease-out group"
      >
        <WhatsAppIcon />

        {/* Tooltip discret qui apparaît uniquement sur Desktop au survol prolongé */}
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-md whitespace-nowrap border border-stone-800">
          Besoin d'aide ?
        </span>
      </motion.a>
    </div>
  );
}