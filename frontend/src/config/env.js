const stripTrailingSlash = (value) => value.replace(/\/$/, '');

export const getSiteUrl = () =>
    stripTrailingSlash(import.meta.env.VITE_SITE_URL || 'http://localhost:5173');

export const getApiUrl = () =>
    stripTrailingSlash(import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

export const getApiOrigin = () =>
    getApiUrl().replace(/\/api\/?$/, '');

/** URL de base de l'API (avec suffixe /api) */
export const API_URL = getApiUrl();

export const getWhatsAppNumber = () =>
    String(import.meta.env.VITE_WHATSAPP_NUMBER || '2250141649464').replace(/\D/g, '');

export const getWhatsAppLink = (message) => {
    const base = `https://wa.me/${getWhatsAppNumber()}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

export const DEFAULT_PLACEHOLDER_IMAGE =
    import.meta.env.VITE_PLACEHOLDER_IMAGE_URL
    || 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=800&fit=crop';

export const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${getApiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};
