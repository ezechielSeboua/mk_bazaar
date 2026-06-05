import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveMediaUrl } from '../config/env';

export default function ProductGallery({ images = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    // Défilement automatique vers la miniature active (mobile)
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const activeThumb = container.children[activeIndex];
            if (activeThumb) {
                const containerWidth = container.offsetWidth;
                const thumbLeft = activeThumb.offsetLeft;
                const thumbWidth = activeThumb.offsetWidth;
                // Centrer la miniature dans le conteneur si possible
                container.scrollTo({
                    left: thumbLeft - containerWidth / 2 + thumbWidth / 2,
                    behavior: 'smooth',
                });
            }
        }
    }, [activeIndex]);

    // Images de secours au format gris minimaliste si aucune photo n'est fournie
    const displayImages = images.length > 0 ? images : [null, null, null];

    const goTo = (delta) => {
        setActiveIndex((prev) => {
            const next = prev + delta;
            if (next < 0) return displayImages.length - 1;
            if (next >= displayImages.length) return 0;
            return next;
        });
    };

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6">
            {/* Colonne des miniatures (En bas sur mobile, à gauche sur desktop) */}
            <div
                ref={scrollContainerRef}
                className="flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none snap-x snap-mandatory"
            >
                {displayImages.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`w-14 sm:w-20 aspect-[3/4] bg-stone-100 relative overflow-hidden transition-all border snap-start ${
                            activeIndex === index
                                ? 'border-black opacity-100 scale-105'
                                : 'border-transparent opacity-60 hover:opacity-90'
                        }`}
                        aria-label={`Afficher l'image ${index + 1}`}
                    >
                        {img ? (
                            <img src={resolveMediaUrl(img)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-stone-200" />
                        )}
                    </button>
                ))}
            </div>

            {/* Zone d'affichage principale avec contrôles (flèches) */}
            <div className="flex-1 aspect-[3/4] bg-stone-100 relative overflow-hidden shadow-sm group">
                {displayImages[activeIndex] ? (
                    <img
                        src={resolveMediaUrl(displayImages[activeIndex])}
                        alt="Pièce sélectionnée"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px] uppercase tracking-widest font-mono">
                        Studio Frame
                    </div>
                )}

                {/* Flèches de navigation (mobiles et desktop) */}
                <button
                    onClick={() => goTo(-1)}
                    className="absolute top-1/2 left-2 -translate-y-1/2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    aria-label="Image précédente"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => goTo(1)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    aria-label="Image suivante"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}