import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

export default function PromoBanner() {
    const { promoBanner } = useSiteSettings();
    const visible = promoBanner?.enabled && !!promoBanner?.text;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="promo-banner"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                >
                    <div className="bg-[#c07b5a] text-white text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-center py-2 px-4">
                        {promoBanner.text}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
