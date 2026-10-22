import { motion } from "framer-motion";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { getWhatsAppLink } from "../config/env";

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
  const PRESET_MESSAGE = "Bonjour MK BAZAAR, je souhaiterais avoir des informations sur vos collections.";
  const whatsappUrl = getWhatsAppLink(PRESET_MESSAGE, contactInfo.whatsapp);

  if (!whatsappUrl) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter sur WhatsApp"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.8 
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative p-3.5 bg-stone-950 text-white rounded-full shadow-2xl border border-stone-800/40 hover:bg-[#25D366] hover:text-white hover:border-transparent transition-all duration-300 ease-out group"
      >
        <WhatsAppIcon />

        {/* Tooltip discret visible au survol sur desktop */}
        <span className="hidden sm:inline-block absolute right-14 top-1/2 -translate-y-1/2 bg-stone-900 text-white text-[10px] font-medium uppercase tracking-wider px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-md whitespace-nowrap border border-stone-800">
          Besoin d'aide ?
        </span>
      </motion.a>
    </div>
  );
}
