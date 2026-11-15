import { gsap, MEDIA, MOTION, ScrollTrigger, SplitText, useGSAP } from '../animations/gsap.config';

/*
 * Anime une page de la vitrine à partir d'attributs posés dans le JSX :
 *
 *   data-anim="title"     titre révélé ligne par ligne sous un masque
 *   data-anim="fade"      fondu avec léger déplacement vertical
 *   data-anim="image"     rideau (clip-path) + zoom arrière de l'image intérieure
 *   data-anim="hero"      grand visuel : zoom arrière à l'arrivée + parallaxe au scroll
 *   data-anim="stagger"   enfants (ou [data-anim-item]) qui apparaissent en cascade
 *   data-anim="parallax"  déplacement vertical lié au scroll (data-speed, en %)
 *   data-anim="line"      filet qui se trace de gauche à droite
 *
 * Options : data-anim-load (anime au chargement plutôt qu'au scroll),
 * data-anim-delay (secondes).
 *
 * Avec prefers-reduced-motion, rien n'est caché ni animé. Tout est nettoyé au
 * démontage et rejoué quand `dependencies` changent (contenu chargé, filtres).
 */
export default function useStorefrontMotion(scope, dependencies = []) {
    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, ({ conditions }) => {
            if (!conditions.motion) return;
            const root = scope.current;
            if (!root) return;

            const all = (selector) => gsap.utils.toArray(root.querySelectorAll(selector));
            const trigger = (el) => (el.hasAttribute('data-anim-load') ? {} : {
                scrollTrigger: { trigger: el, start: MOTION.start, once: true },
            });
            const delay = (el) => parseFloat(el.dataset.animDelay || '0');

            // Titres : lignes masquées qui montent
            all('[data-anim="title"]').forEach((el) => {
                SplitText.create(el, {
                    type: 'lines',
                    mask: 'lines',
                    autoSplit: true,
                    linesClass: 'mk-line',
                    onSplit: (self) => gsap.from(self.lines, {
                        yPercent: 110,
                        duration: MOTION.duration.title,
                        ease: MOTION.ease.reveal,
                        stagger: MOTION.stagger.lines,
                        delay: delay(el),
                        ...trigger(el),
                    }),
                });
            });

            // Fondus
            all('[data-anim="fade"]').forEach((el) => {
                gsap.from(el, {
                    y: 28,
                    autoAlpha: 0,
                    duration: MOTION.duration.fade,
                    ease: MOTION.ease.soft,
                    delay: delay(el),
                    clearProps: 'transform', // pas de bloc transformé résiduel (positionnement des modales)
                    ...trigger(el),
                });
            });

            // Images en rideau
            all('[data-anim="image"]').forEach((el) => {
                const img = el.querySelector('img');
                const tl = gsap.timeline({ delay: delay(el), ...trigger(el) });
                tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    duration: MOTION.duration.image,
                    ease: MOTION.ease.curtain,
                });
                if (img) tl.from(img, { scale: 1.18, duration: MOTION.duration.image + 0.4, ease: MOTION.ease.reveal }, 0);
            });

            // Grand visuel d'accueil
            all('[data-anim="hero"]').forEach((el) => {
                const img = el.querySelector('img');
                if (!img) return;
                gsap.from(img, { scale: 1.12, duration: 1.8, ease: MOTION.ease.reveal });
                gsap.to(img, {
                    yPercent: conditions.desktop ? 12 : 6,
                    ease: 'none',
                    scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
                });
            });

            // Cascades (grilles de cartes, listes)
            all('[data-anim="stagger"]').forEach((group) => {
                const marked = group.querySelectorAll('[data-anim-item]');
                const items = gsap.utils.toArray(marked.length ? marked : group.children);
                if (!items.length) return;
                gsap.set(items, { autoAlpha: 0, y: 40 });
                ScrollTrigger.batch(items, {
                    start: 'top 92%',
                    once: true,
                    onEnter: (batch) => gsap.to(batch, {
                        autoAlpha: 1,
                        y: 0,
                        duration: MOTION.duration.item,
                        ease: MOTION.ease.soft,
                        stagger: MOTION.stagger.items,
                        overwrite: true,
                        clearProps: 'transform',
                    }),
                });
            });

            // Parallaxe
            all('[data-anim="parallax"]').forEach((el) => {
                const speed = parseFloat(el.dataset.speed || '-10') * (conditions.desktop ? 1 : 0.5);
                gsap.fromTo(el, { yPercent: -speed / 2 }, {
                    yPercent: speed / 2,
                    ease: 'none',
                    scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
                });
            });

            // Filets
            all('[data-anim="line"]').forEach((el) => {
                gsap.from(el, { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: MOTION.ease.curtain, delay: delay(el), ...trigger(el) });
            });

            // Images chargées après coup : on recale les déclencheurs
            const pending = all('img').filter((img) => !img.complete);
            const refresh = () => ScrollTrigger.refresh();
            pending.forEach((img) => img.addEventListener('load', refresh, { once: true }));
            return () => pending.forEach((img) => img.removeEventListener('load', refresh));
        });

        return () => mm.revert();
    }, { scope, dependencies, revertOnUpdate: true });
}
