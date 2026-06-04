import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ---------- Icônes SVG ---------- */
function ChevronLeftIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function PlaceholderImage() {
    return (
        <svg className="w-16 h-16 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <circle cx="8.5" cy="10" r="2.5" />
            <path d="M21 15l-4-4-8 8-3-2" />
        </svg>
    );
}

export default function ImageCarousel({
    images = [],
    interval = 5000,
    aspectRatio = '3/4',
    resumeDelay = 4000,
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);
    const resumeTimerRef = useRef(null);

    const displayImages = images.length > 0 ? images : [null, null, null, null];

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    };

    // Auto‑play
    useEffect(() => {
        if (isPaused || displayImages.length <= 1) return;
        timerRef.current = setInterval(goToNext, interval);
        return () => clearInterval(timerRef.current);
    }, [isPaused, displayImages.length, interval]);

    const pauseTemporarily = () => {
        setIsPaused(true);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setIsPaused(false);
        }, resumeDelay);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
        pauseTemporarily();
    };

    const handleGoToNext = () => {
        goToNext();
        pauseTemporarily();
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
        pauseTemporarily();
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };
    }, []);

    const ratioClass = aspectRatio === '16/9' ? 'aspect-video' : 'aspect-[3/4]';

    return (
        <div className="w-full space-y-4">
            <motion.div
                className={`relative w-full ${ratioClass} bg-stone-100 overflow-hidden shadow-lg`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="relative w-full h-full">
                    <AnimatePresence mode="wait">
                        {displayImages[currentIndex] ? (
                            <motion.img
                                key={currentIndex}
                                src={displayImages[currentIndex]}
                                alt={`Slide ${currentIndex + 1}`}
                                className="absolute inset-0 w-full h-full object-cover"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                            />
                        ) : (
                            <motion.div
                                key={`placeholder-${currentIndex}`}
                                className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="text-center space-y-3">
                                    <PlaceholderImage />
                                    <p className="text-stone-400 text-[10px] uppercase tracking-widest">
                                        Slide {currentIndex + 1}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Flèches */}
                <motion.button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white w-10 h-10 flex items-center justify-center rounded-full transition-all opacity-0 hover:opacity-100 focus:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Slide précédent"
                >
                    <ChevronLeftIcon />
                </motion.button>
                <motion.button
                    onClick={handleGoToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white w-10 h-10 flex items-center justify-center rounded-full transition-all opacity-0 hover:opacity-100 focus:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Slide suivant"
                >
                    <ChevronRightIcon />
                </motion.button>

                {/* Compteur */}
                <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {currentIndex + 1} / {displayImages.length}
                </motion.div>
            </motion.div>

            {/* Points */}
            <motion.div
                className="flex justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {displayImages.map((_, index) => (
                    <motion.button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 ${
                            index === currentIndex
                                ? 'w-8 h-2 bg-black'
                                : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                        }`}
                        layout
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Aller au slide ${index + 1}`}
                    />
                ))}
            </motion.div>
        </div>
    );
}