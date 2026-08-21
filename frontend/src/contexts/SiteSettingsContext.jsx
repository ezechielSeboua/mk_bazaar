import { createContext, useContext, useState, useEffect } from 'react';
import appSettingsService from '../services/appSettings';

const DEFAULTS = {
    logo: null,
    siteName: 'MK Bazaar',
    contactInfo: { whatsapp: '', email: '', address: '' },
    socialLinks: { instagram: '', facebook: '', tiktok: '', pinterest: '' },
    promoBanner: { enabled: false, text: '' },
};

const isObject = (v) => v && !Array.isArray(v) && typeof v === 'object';

const SiteSettingsContext = createContext(DEFAULTS);

export function SiteSettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULTS);

    useEffect(() => {
        const keys = ['logo', 'site_name', 'contact_info', 'social_links', 'promo_banner'];
        Promise.allSettled(keys.map(k => appSettingsService.getSetting(k)))
            .then(([logoRes, nameRes, contactRes, socialRes, promoRes]) => {
                const val = (r) => r.status === 'fulfilled' ? r.value : null;
                setSettings({
                    logo: isObject(val(logoRes)) ? val(logoRes) : null,
                    siteName: (typeof val(nameRes) === 'string' && val(nameRes)) ? val(nameRes) : DEFAULTS.siteName,
                    contactInfo: isObject(val(contactRes)) ? { ...DEFAULTS.contactInfo, ...val(contactRes) } : DEFAULTS.contactInfo,
                    socialLinks: isObject(val(socialRes)) ? { ...DEFAULTS.socialLinks, ...val(socialRes) } : DEFAULTS.socialLinks,
                    promoBanner: isObject(val(promoRes)) ? val(promoRes) : DEFAULTS.promoBanner,
                });
            });
    }, []);

    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
