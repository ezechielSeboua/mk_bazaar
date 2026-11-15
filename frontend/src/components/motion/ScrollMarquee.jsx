import { useRef } from 'react';
import { gsap, MEDIA, ScrollTrigger, useGSAP } from '../../animations/gsap.config';

/**
 * Bandeau typographique monumental qui défile en continu ; la vitesse et le
 * sens suivent le scroll (accélère quand on défile, s'inverse en remontant).
 * Décoratif : masqué aux lecteurs d'écran, figé si l'utilisateur réduit les animations.
 */
export default function ScrollMarquee({ words, className = '' }) {
    const root = useRef(null);
    const track = useRef(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        mm.add(MEDIA.motion, () => {
            // Le contenu est doublé : on fait défiler la première moitié en boucle.
            const loop = gsap.to(track.current, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
            let direction = 1;
            const st = ScrollTrigger.create({
                trigger: root.current,
                start: 'top bottom',
                end: 'bottom top',
                onUpdate: (self) => {
                    if (self.direction !== direction) direction = self.direction;
                    const boost = Math.min(Math.abs(self.getVelocity()) / 220, 6);
                    gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.3, overwrite: true });
                    gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.3, ease: 'power2.out' });
                },
            });
            return () => { st.kill(); loop.kill(); };
        });
        return () => mm.revert();
    }, { scope: root });

    const line = words.map((word) => (
        <span key={word} className="flex items-center gap-[0.35em] pr-[0.35em]">
            {word}
            <span className="inline-block w-[0.18em] h-[0.18em] rounded-full bg-current opacity-40" />
        </span>
    ));

    return (
        <div ref={root} className={`overflow-hidden select-none ${className}`} aria-hidden="true">
            <div ref={track} className="flex w-max whitespace-nowrap will-change-transform">
                <div className="flex">{line}</div>
                <div className="flex">{line}</div>
            </div>
        </div>
    );
}
