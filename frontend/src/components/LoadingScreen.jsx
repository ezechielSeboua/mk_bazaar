import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ isLoading, children }) {
    return (
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="loading"
                    className="min-h-screen bg-[#F9F9F7] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="text-center">
                        {/* Cercle animé */}
                        <motion.div
                            className="w-16 h-16 mx-auto border-2 border-black rounded-full flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                            <span className="text-xl font-bold">M</span>
                        </motion.div>

                        {/* Texte */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 text-sm uppercase tracking-widest text-stone-500"
                        >
                            Chargement…
                        </motion.p>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}