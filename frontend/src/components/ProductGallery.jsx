import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../config/env';

export default function ProductGallery({ images = [], selectedIndex = 0 }) {
    const [activeIndex, setActiveIndex] = useState(selectedIndex);
    const scrollContainerRef = useRef(null);

    const displayImages = images && images.length > 0 ? images : [null, null, null];

    useEffect(() => {
        setActiveIndex(selectedIndex);
    }, [selectedIndex]);

    // Défilement automatique et centrage de la miniature active
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeThumb = container.children[activeIndex];
            if (activeThumb) {
                const containerWidth = container.offsetWidth;
                const thumbLeft = activeThumb.offsetLeft;
                const thumbWidth = activeThumb.offsetWidth;
                
                container.scrollTo({
                    left: thumbLeft - containerWidth / 2 + thumbWidth / 2,
                    behavior: 'smooth',
                });
            }
        }
    }, [activeIndex]);

    const goTo = (delta) => {
        setActiveIndex((prev) => {
            const next = prev + delta;
            if (next < 0) return displayImages.length - 1;
            if (next >= displayImages.length) return 0;
            return next;
        });
    };

    // Gestion du swipe mobile (Framer Motion gesture)
    const handleDragEnd = (event, info) => {
        const swipeThreshold = 50; // Sensibilité du balayage
        if (info.offset.x > swipeThreshold) {
            goTo(-1); // Swipe vers la droite -> Image précédente
        } else if (info.offset.x < -swipeThreshold) {
            goTo(1);  // Swipe vers la gauche -> Image suivante
        }
    };

    const hasMultipleImages = displayImages.length > 1;

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 w-full">
            
            {/* Colonne des miniatures — Aligné sur le standard rounded-xl de mk-bazaar */}
            <div
                ref={scrollContainerRef}
                className="flex md:flex-col gap-3 shrink-0 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-none snap-x snap-mandatory max-h-[500px]"
            >
                {displayImages.map((img, index) => {
                    const isSelected = activeIndex === index;
                    return (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`w-16 sm:w-20 aspect-[3/4] bg-stone-100 rounded-xl relative overflow-hidden transition-all duration-300 border shrink-0 snap-start ${
                                isSelected
                                    ? 'border-stone-950 opacity-100 ring-1 ring-stone-950/20 scale-[1.02]'
                                    : 'border-stone-200/60 opacity-50 hover:opacity-90'
                            }`}
                            aria-label={`Afficher la photo ${index + 1}`}
                            aria-current={isSelected ? 'true' : 'false'}
                        >
                            {img ? (
                                <img 
                                    src={resolveMediaUrl(img)} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full bg-stone-200/70" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Zone d'affichage principale */}
            <div className="flex-1 aspect-[3/4] bg-[#FAFAFA] rounded-xl border border-stone-200/60 relative overflow-hidden shadow-sm group select-none">
                
                {/* Conteneur de l'image animée + Support du Swipe tactile */}
                <motion.div 
                    className="w-full h-full cursor-grab active:cursor-grabbing relative"
                    drag={hasMultipleImages ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                >
                    <AnimatePresence mode="wait">
                        {displayImages[activeIndex] ? (
                            <motion.img
                                key={activeIndex} // Force le ré-enclenchement de l'animation au changement d'index
                                src={resolveMediaUrl(displayImages[activeIndex])}
                                alt="Aperçu de la pièce"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="w-full h-full object-cover pointer-events-none"
                            />
                        ) : (
                            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-400 gap-1">
                                <span className="text-[10px] uppercase tracking-[0.25em] font-medium font-mono text-stone-400/80">
                                    Studio Frame
                                </span>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Flèches de navigation — Accessibilité et correctif Hover Tactile */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={() => goTo(-1)}
                            className="absolute top-1/2 left-3 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md text-stone-950 rounded-full shadow-sm border border-stone-200/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-stone-950 hover:text-white"
                            aria-label="Image précédente"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => goTo(1)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md text-stone-950 rounded-full shadow-sm border border-stone-200/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-stone-950 hover:text-white"
                            aria-label="Image suivante"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}