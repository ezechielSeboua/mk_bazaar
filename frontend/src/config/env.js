const stripTrailingSlash = (value) => value.replace(/\/$/, '');

export const getSiteUrl = () =>
    stripTrailingSlash(import.meta.env.VITE_SITE_URL);

export const getApiUrl = () =>
    stripTrailingSlash(import.meta.env.VITE_API_URL);

export const getApiOrigin = () =>
    getApiUrl().replace(/\/api\/?$/, '');

/** URL de base de l'API (avec suffixe /api) */
export const API_URL = getApiUrl();

/**
 * Ne garde que les chiffres d'un numéro.
 *
 * Indispensable avant toute interpolation dans une URL wa.me : une valeur
 * contenant `?`, `#` ou `/` détournerait le lien (ajout d'un `?text=` arbitraire,
 * changement de destination). Le numéro vient de la table `settings`, donc d'une
 * saisie admin non validée côté serveur.
 */
export const normalizeWhatsAppNumber = (value) =>
    String(value ?? '').replace(/\D/g, '');

/**
 * Numéro WhatsApp effectif.
 * `override` (valeur configurée au dashboard) prime sur VITE_WHATSAPP_NUMBER,
 * qui est figé à la compilation et ne sert plus que de repli.
 */
export const getWhatsAppNumber = (override) =>
    normalizeWhatsAppNumber(override)
    || normalizeWhatsAppNumber(import.meta.env.VITE_WHATSAPP_NUMBER);

/**
 * Lien wa.me. Retourne null si aucun numéro exploitable n'est disponible,
 * pour que l'appelant puisse masquer le bouton plutôt qu'afficher un lien mort.
 */
export const getWhatsAppLink = (message, number) => {
    const target = getWhatsAppNumber(number);
    if (!target) return null;

    const base = `https://wa.me/${target}`;
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
