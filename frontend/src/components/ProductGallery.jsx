import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../config/env';

function Lightbox({ images, activeIndex, onClose, onGoTo }) {
    const handleDragEnd = (_, info) => {
        if (info.offset.x > 50) onGoTo(-1);
        else if (info.offset.x < -50) onGoTo(1);
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            {/* Fermer */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Fermer"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Compteur */}
            {images.length > 1 && (
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-[10px] uppercase tracking-[0.25em] font-mono">
                    {activeIndex + 1} / {images.length}
                </span>
            )}

            {/* Image */}
            <motion.div
                className="relative w-full h-full md:w-auto md:h-auto md:max-w-[90vw] md:max-h-[90vh] flex items-center justify-center"
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeIndex}
                        src={resolveMediaUrl(images[activeIndex])}
                        alt="Aperçu agrandi"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-full h-full object-contain md:rounded-lg md:max-w-[90vw] md:max-h-[90vh] select-none"
                        draggable={false}
                    />
                </AnimatePresence>
            </motion.div>

            {/* Flèches */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); onGoTo(-1); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label="Image précédente"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onGoTo(1); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label="Image suivante"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Miniatures */}
            {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); onGoTo(i - activeIndex); }}
                            className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${
                                i === activeIndex ? 'border-white opacity-100' : 'border-white/20 opacity-40 hover:opacity-70'
                            }`}
                            aria-label={`Aller à l'image ${i + 1}`}
                        >
                            <img src={resolveMediaUrl(img)} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

export default function ProductGallery({ images = [], selectedIndex = 0 }) {
    const [activeIndex, setActiveIndex] = useState(selectedIndex);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const scrollContainerRef = useRef(null);

    const displayImages = images && images.length > 0 ? images : [null, null, null];
    const hasRealImages = images && images.length > 0;

    useEffect(() => {
        setActiveIndex(selectedIndex);
    }, [selectedIndex]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeThumb = container.children[activeIndex];
            if (activeThumb) {
                container.scrollTo({
                    left: activeThumb.offsetLeft - container.offsetWidth / 2 + activeThumb.offsetWidth / 2,
                    behavior: 'smooth',
                });
            }
        }
    }, [activeIndex]);

    const goTo = useCallback((delta) => {
        setActiveIndex((prev) => {
            const next = prev + delta;
            if (next < 0) return displayImages.length - 1;
            if (next >= displayImages.length) return 0;
            return next;
        });
    }, [displayImages.length]);

    // Navigation clavier dans le lightbox
    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowLeft') goTo(-1);
            if (e.key === 'ArrowRight') goTo(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen, goTo]);

    // Bloquer le scroll du body quand le lightbox est ouvert
    useEffect(() => {
        document.body.style.overflow = lightboxOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [lightboxOpen]);

    const handleDragEnd = (_, info) => {
        if (info.offset.x > 50) goTo(-1);
        else if (info.offset.x < -50) goTo(1);
    };

    const hasMultipleImages = displayImages.length > 1;

    return (
        <>
            <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 w-full">
                {/* Miniatures */}
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
                                    <img src={resolveMediaUrl(img)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-stone-200/70" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Image principale */}
                <div className="flex-1 aspect-[3/4] bg-[#FAFAFA] rounded-xl border border-stone-200/60 relative overflow-hidden shadow-sm group select-none">
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
                                    key={activeIndex}
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

                    {/* Bouton zoom — visible au hover sur desktop, toujours visible sur mobile */}
                    {hasRealImages && (
                        <button
                            onClick={() => setLightboxOpen(true)}
                            className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-md text-stone-950 rounded-full shadow-sm border border-stone-200/40 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-stone-950 hover:text-white"
                            aria-label="Agrandir l'image"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    )}

                    {/* Flèches de navigation */}
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

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && hasRealImages && (
                    <Lightbox
                        images={images}
                        activeIndex={activeIndex}
                        onClose={() => setLightboxOpen(false)}
                        onGoTo={goTo}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
