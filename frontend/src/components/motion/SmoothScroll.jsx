import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../../animations/gsap.config';
import { scrollToElement } from '../../hooks/useBodyScrollLock';

/*
 * Défilement fluide de la vitrine (Lenis), synchronisé avec ScrollTrigger sur
 * une seule boucle (gsap.ticker). Inactif sur le back-office et quand
 * l'utilisateur demande moins d'animations.
 *
 * - Un seul Lenis, recréé seulement en entrant ou sortant de la vitrine.
 * - Mis en pause quand une modale bloque le défilement (body overflow hidden).
 * - Retour en haut de page à chaque changement de route (hors ancres #).
 */

const isStorefront = (pathname) => !pathname.startsWith('/dashboard');

export default function SmoothScroll() {
    const { pathname, hash } = useLocation();
    const enabled = isStorefront(pathname);

    useEffect(() => {
        if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const lenis = new Lenis({
            duration: 1.1,
            smoothWheel: true,
            anchors: { offset: -96 },
            // Les modales et les zones défilantes internes gardent leur défilement natif,
            // même quand Lenis est en pause (sinon la molette y serait bloquée).
            prevent: (node) => node.getAttribute?.('role') === 'dialog' || node.getAttribute?.('aria-modal') === 'true',
            allowNestedScroll: true,
        });
        lenis.on('scroll', ScrollTrigger.update);
        const tick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // Les tiroirs et modales posent overflow:hidden sur <body> : on suspend Lenis.
        const observer = new MutationObserver(() => {
            if (document.body.style.overflow === 'hidden') lenis.stop();
            else lenis.start();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

        window.__mkLenis = lenis;
        return () => {
            observer.disconnect();
            gsap.ticker.remove(tick);
            lenis.destroy();
            delete window.__mkLenis;
        };
    }, [enabled]);

    // Nouvelle page : on repart du haut (ou on rejoint l'ancre #…), puis on recalcule les déclencheurs.
    useEffect(() => {
        const lenis = window.__mkLenis;
        if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
        else window.scrollTo(0, 0);

        const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
        // Le contenu des pages arrive après coup : on attend un peu l'élément visé.
        let timer;
        if (hash) {
            let tries = 0;
            const seek = () => {
                const target = document.getElementById(decodeURIComponent(hash.slice(1)));
                if (target) scrollToElement(target);
                else if (tries++ < 20) timer = setTimeout(seek, 100);
            };
            timer = setTimeout(seek, 150);
        }
        return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
    }, [pathname, hash]);

    return null;
}
