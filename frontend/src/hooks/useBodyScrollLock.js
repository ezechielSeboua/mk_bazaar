import { useEffect } from 'react';

/*
 * Verrou du défilement de la page pendant qu'une modale est ouverte.
 *
 * Partagé par toutes les modales : un compteur évite qu'une modale qui se
 * ferme débloque la page alors qu'une autre est encore ouverte. SmoothScroll
 * observe ce verrou (overflow de <body>) pour suspendre Lenis.
 */
let locks = 0;
let previous = '';

export default function useBodyScrollLock(active = true) {
    useEffect(() => {
        if (!active) return undefined;
        if (locks === 0) {
            previous = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        locks += 1;
        return () => {
            locks -= 1;
            if (locks === 0) document.body.style.overflow = previous;
        };
    }, [active]);
}

/** Défile jusqu'à un élément en tenant compte de l'en-tête collant (via Lenis s'il est actif). */
export const scrollToElement = (element, offset = -96) => {
    if (!element) return;
    const lenis = window.__mkLenis;
    if (lenis) lenis.scrollTo(element, { offset });
    else window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
};
