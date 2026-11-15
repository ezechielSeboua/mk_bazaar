import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { resolveMediaUrl } from '../../config/env';
import appSettingsService from '../../services/appSettings';
import { HERO_DEFAULTS } from '../../constants/siteDefaults';
import { authField } from './shopUtils';

/**
 * Mise en page Connexion / Inscription (maquettes « 08 » et « 09 ») :
 * visuel de la boutique à gauche, formulaire à droite.
 */
export default function AuthLayout({ visualTitle, visualText, children }) {
    const { logo } = useSiteSettings();
    const logoSrc = logo?.url ? resolveMediaUrl(logo.url) : '/mk_bazaar_logo.png';
    const [image, setImage] = useState(HERO_DEFAULTS.image_url);

    useEffect(() => {
        let cancelled = false;
        appSettingsService.getSetting('hero')
            .then((data) => { if (!cancelled && data?.image_url) setImage(data.image_url.startsWith('/') ? resolveMediaUrl(data.image_url) : data.image_url); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-[#111] font-admin antialiased">
            <div className="relative hidden lg:block overflow-hidden bg-[#f4f3f1]">
                {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.6),rgba(0,0,0,0)_55%)]" aria-hidden="true" />
                <div className="absolute left-12 right-12 bottom-12 text-white">
                    <h2 className="text-[30px] font-semibold tracking-[-0.02em] leading-tight mb-2.5">{visualTitle}</h2>
                    <p className="text-[15px] text-[#e5e5e5] leading-relaxed">{visualText}</p>
                </div>
            </div>
            <div className="flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-24">
                <div className="w-full max-w-[400px] mx-auto lg:mx-0">
                    <Link to="/" aria-label="MK Bazaar, retour à la boutique">
                        <img src={logoSrc} alt="MK Bazaar" className="h-11 w-auto" />
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}

/** Champ mot de passe avec bouton afficher / masquer. */
export function PasswordInput({ id, name, value, onChange, error, autoComplete }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input id={id} name={name} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={Boolean(error)} className={`${authField(error)} pr-11`} />
            <button type="button" onClick={() => setVisible((v) => !v)} className="absolute right-1 top-1 w-9 h-9 grid place-items-center text-[#777] hover:text-[#111]" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {visible ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.6} aria-hidden="true" /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.6} aria-hidden="true" />}
            </button>
        </div>
    );
}
