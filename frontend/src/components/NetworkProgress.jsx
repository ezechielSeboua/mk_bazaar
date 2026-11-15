import { useEffect, useState } from 'react';
import { subscribeNetwork } from '../services/apiConfig';

/**
 * Barre de progression fine en haut de l'écran tant qu'une requête API est en
 * cours (vitrine et back-office). Apparaît après 200 ms pour ne pas clignoter
 * sur les réponses rapides, et s'annonce aux lecteurs d'écran.
 */
export default function NetworkProgress() {
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let timer;
        const unsubscribe = subscribeNetwork((pending) => {
            clearTimeout(timer);
            if (pending > 0) timer = setTimeout(() => setBusy(true), 200);
            else setBusy(false);
        });
        return () => { clearTimeout(timer); unsubscribe(); };
    }, []);

    return (
        <>
            <div
                className={`fixed top-0 inset-x-0 h-[2px] z-[300] overflow-hidden pointer-events-none transition-opacity duration-300 ${busy ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden="true"
            >
                <div className="mk-progress-bar h-full w-1/3 bg-[#111]" />
            </div>
            <p className="sr-only" role="status" aria-live="polite">{busy ? 'Chargement en cours…' : ''}</p>
        </>
    );
}
