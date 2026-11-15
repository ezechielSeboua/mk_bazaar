import { useEffect } from 'react';

const VISIBLE_MS = 900;

/**
 * Pose `data-scrolling` sur l'élément qui défile (ou <html> pour la page)
 * pendant le défilement et un court instant après : la feuille de style ne
 * montre la barre de défilement qu'à ce moment-là.
 */
export default function ScrollbarActivity() {
    useEffect(() => {
        const timers = new WeakMap();
        const onScroll = (event) => {
            const element = event.target === document ? document.documentElement : event.target;
            if (!(element instanceof Element)) return;
            if (!element.hasAttribute('data-scrolling')) element.setAttribute('data-scrolling', '');
            clearTimeout(timers.get(element));
            timers.set(element, setTimeout(() => element.removeAttribute('data-scrolling'), VISIBLE_MS));
        };
        document.addEventListener('scroll', onScroll, { capture: true, passive: true });
        return () => document.removeEventListener('scroll', onScroll, { capture: true });
    }, []);

    return null;
}
