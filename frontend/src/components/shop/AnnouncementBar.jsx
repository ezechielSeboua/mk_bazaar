import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAnnouncementBars } from '../../services/catalog';
import { useAuth } from '../../contexts/AuthContext';

const ROTATE_MS = 6000;
const DISMISS_KEY = 'mk_announcements_dismissed';

/** Lien interne (« /offres ») ou externe en https. */
function BarLink({ href, children }) {
    if (!href) return null;
    const className = 'underline underline-offset-2 ml-2 hover:text-white';
    return href.startsWith('/')
        ? <Link to={href} className={className}>{children}</Link>
        : <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
}

/**
 * Bandeaux d'annonce (back-office › Promotions et bandeaux), affichés à tour
 * de rôle au-dessus de l'en-tête, avec les liens utilitaires à droite.
 */
export default function AnnouncementBar() {
    const { isAdmin } = useAuth();
    const [bars, setBars] = useState([]);
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        let cancelled = false;
        getAnnouncementBars().then((res) => {
            if (!cancelled && res?.success && Array.isArray(res.data)) setBars(res.data);
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (bars.length < 2 || paused) return undefined;
        const timer = setInterval(() => setIndex((i) => (i + 1) % bars.length), ROTATE_MS);
        return () => clearInterval(timer);
    }, [bars.length, paused]);

    if (dismissed) return null;

    const current = bars[index % Math.max(bars.length, 1)];
    const go = (delta) => setIndex((i) => (i + delta + bars.length) % bars.length);

    return (
        <div
            className="bg-[#111] text-[#e7e7e7] text-[12.5px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="max-w-[1280px] mx-auto h-9 px-4 sm:px-6 lg:px-10 flex items-center justify-center lg:justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0" aria-live="polite">
                    {bars.length > 1 && (
                        <button type="button" onClick={() => go(-1)} className="p-1 text-[#aaa] hover:text-white" aria-label="Annonce précédente">
                            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                        </button>
                    )}
                    {current ? (
                        <span className="truncate">
                            <b className="font-semibold">{current.message}</b>
                            <BarLink href={current.link}>{current.link === '/offres' ? 'Voir les offres' : 'En savoir plus'}</BarLink>
                        </span>
                    ) : (
                        <span className="truncate">Commande et paiement confirmés sur WhatsApp</span>
                    )}
                    {bars.length > 1 && (
                        <>
                            <button type="button" onClick={() => go(1)} className="p-1 text-[#aaa] hover:text-white" aria-label="Annonce suivante">
                                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                            </button>
                            <span className="hidden sm:inline text-[11.5px] text-[#999] tabular-nums">{(index % bars.length) + 1} / {bars.length}</span>
                        </>
                    )}
                </div>
                <div className="hidden lg:flex items-center gap-[22px] shrink-0">
                    <Link to="/compte?tab=orders" className="hover:text-white">Suivre ma commande</Link>
                    <Link to="/about" className="hover:text-white">Aide</Link>
                    {isAdmin && <Link to="/dashboard" className="hover:text-white">Espace admin</Link>}
                    {bars.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { setDismissed(true); try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* stockage indisponible */ } }}
                            className="p-1 text-[#aaa] hover:text-white"
                            aria-label="Masquer les annonces"
                        >
                            <X className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
