import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

/*
 * Configuration unique de GSAP pour la vitrine : plugins et langage de
 * mouvement commun (durées, courbes, décalages). Toutes les animations de la
 * boutique puisent ici pour rester cohérentes.
 */

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export const MOTION = {
    ease: {
        reveal: 'expo.out',     // titres, apparitions
        curtain: 'expo.inOut',  // rideaux d'images
        soft: 'power3.out',     // fondus, cartes
    },
    duration: {
        title: 1.1,
        image: 1.3,
        fade: 0.9,
        item: 0.9,
    },
    stagger: {
        lines: 0.08,
        items: 0.08,
    },
    /** Point de déclenchement au scroll : l'élément entre dans le dernier 12 % de l'écran. */
    start: 'top 88%',
};

/** Préférences : animations complètes, réduites (accessibilité), écran large. */
export const MEDIA = {
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 768px)',
};

export { gsap, ScrollTrigger, SplitText, useGSAP };
