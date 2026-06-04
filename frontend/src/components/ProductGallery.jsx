import { useState } from 'react';
import { resolveMediaUrl } from '../config/env';

export default function ProductGallery({ images = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);


    console.log("ProductGallery images:", images);

    // Images de secours au format gris minimaliste si aucune photo n'est fournie
    const displayImages = images.length > 0 ? images : [null, null, null];

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4">
            
            {/* Colonne des miniatures (En bas sur mobile, à gauche sur desktop) */}
            <div className="flex md:flex-col gap-3 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
                {displayImages.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`w-20 aspect-[3/4] bg-stone-100 relative overflow-hidden transition-all border ${
                            activeIndex === index 
                                ? 'border-black opacity-100' 
                                : 'border-transparent opacity-50 hover:opacity-100'
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

            {/* Zone d'affichage principale */}
            <div className="flex-1 aspect-[3/4] bg-stone-100 relative overflow-hidden shadow-sm">
                {displayImages[activeIndex] ? (
                    <img 
                        src={resolveMediaUrl(displayImages[activeIndex])} 
                        alt="Pièce sélectionnée" 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px] uppercase tracking-widest font-mono">
                        Studio Frame
                    </div>
                )}
            </div>
        </div>
    );
}