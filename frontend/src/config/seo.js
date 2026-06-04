import {
    getSiteUrl,
    getApiOrigin,
    resolveMediaUrl,
    DEFAULT_PLACEHOLDER_IMAGE,
} from './env';

export const SITE_NAME = 'MK BAZAAR';

export const DEFAULT_DESCRIPTION =
    'MK BAZAAR — boutique de mode minimaliste. Découvrez des pièces intemporelles, coupes épurées et matières d\'exception.';

export { getSiteUrl, getApiOrigin };

export const absoluteUrl = (path = '') => {
    const base = getSiteUrl();
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
};

export const absoluteImageUrl = resolveMediaUrl;

export { DEFAULT_PLACEHOLDER_IMAGE };

export const truncateDescription = (text, maxLength = 160) => {
    if (!text) return DEFAULT_DESCRIPTION;
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;
    return `${clean.slice(0, maxLength - 1).trim()}…`;
};
