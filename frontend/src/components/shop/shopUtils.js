import { resolveMediaUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../../config/env';

/*
 * Utilitaires de la boutique (maquette « Retail premium ») : prix, panier,
 * libellés d'attributs et classes de boutons partagées.
 */

export const CART_KEY = 'mk_bazaar_cart';

/** 25000 → « 25 000 FCFA ». */
export const formatFCFA = (value) =>
    `${Math.round(Number(value) || 0).toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA`;

/**
 * Prix d'un produit ou d'une variante tel que renvoyé par l'API (`pricing`),
 * avec un repli sur `price` pour les anciennes données.
 */
export const getPricing = (product, variant = null) => {
    const source = variant?.pricing ?? (variant ? null : product?.pricing);
    if (source) return source;
    const base = Number(variant?.price ?? product?.price ?? 0);
    return { base_price: base, final_price: base, discount: 0, discount_percent: 0, promotion: null, from: false, has_promotion: false };
};

/** Prix barré affiché seulement si la promotion le demande. */
export const showStrikethrough = (pricing) =>
    pricing.discount > 0 && pricing.promotion?.show_strikethrough !== false;

/**
 * Nom de promotion présentable au client. Les promotions créées automatiquement
 * à partir des anciens prix barrés (« Prix barré · … ») restent anonymes.
 */
export const promotionLabel = (name) => (name && !String(name).startsWith('Prix barré') ? name : null);

/** « jusqu'au 30 novembre » pour une promotion datée. */
export const promotionUntil = (promotion) =>
    promotion?.ends_at
        ? `jusqu'au ${new Date(promotion.ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
        : '';

export const productImage = (product, index = 0) => {
    const path = product?.image_path?.[index] ?? (index === 0 ? product?.image : null);
    return path ? resolveMediaUrl(path) : (index === 0 ? DEFAULT_PLACEHOLDER_IMAGE : null);
};

export const categoryLabel = (product) =>
    (typeof product?.category === 'object' ? product.category?.name : product?.category) || '';

/** Variantes vendables (actives). */
export const activeVariants = (product) => (product?.variants ?? []).filter((v) => v.is_active !== false);

export const isInStock = (product) => {
    const variants = activeVariants(product);
    return variants.length ? variants.some((v) => (v.stock ?? 0) > 0) : (product?.stock ?? 0) > 0;
};

/** « taille » → « Taille » quand le type de produit n'est pas connu. */
export const humanizeAttribute = (slug) =>
    String(slug).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Couleurs courantes, quand le type de produit ne fournit pas de pastille. */
const COLOR_HEX = {
    original: '#c9a77c', indigo: '#1e3a8a', terre: '#a0381c', noir: '#18181b', blanc: '#fafafa',
    beige: '#e7e5e4', dore: '#d4af37', 'doré': '#d4af37', argente: '#c0c0c0', 'argenté': '#c0c0c0',
    'or rose': '#d8a48f', bordeaux: '#881337', vert: '#166534', bleu: '#1d4ed8', rouge: '#b91c1c',
    marron: '#78350f', ocre: '#b45309', kaki: '#3f6212',
};

export const colorHex = (name, hex = null) => hex || COLOR_HEX[String(name ?? '').toLowerCase().trim()] || '#a8a29e';

/** Couleurs (ou finitions) proposées par un produit, pour les pastilles des cartes. */
export const productSwatches = (product) => {
    const seen = new Map();
    activeVariants(product).forEach((v) => {
        const value = v.attributes?.couleur ?? v.attributes?.finition;
        if (value && !seen.has(value)) seen.set(value, colorHex(value));
    });
    return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
};

/* ------------------------------------------------------------------ Panier */

export const readCart = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
};

export const writeCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
};

export const cartCount = () => readCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

/**
 * Ajoute un article au panier. Le prix stocké est indicatif : le serveur
 * recalcule prix et remises à la commande.
 */
export const addToCart = ({ product, variant = null, quantity = 1 }) => {
    const pricing = getPricing(product, variant);
    const items = readCart();
    const variantId = variant?.id ?? null;
    const index = items.findIndex((item) => item.id === product.id && (item.variant_id ?? null) === variantId);
    const maxStock = variant ? variant.stock : product.stock;

    if (index > -1) {
        const next = items[index].quantity + quantity;
        items[index] = {
            ...items[index],
            quantity: maxStock ? Math.min(next, maxStock) : next,
            price: pricing.final_price,
            base_price: pricing.base_price,
            promotion: pricing.promotion?.name ?? null,
        };
    } else {
        items.push({
            id: product.id,
            variant_id: variantId,
            name: product.name,
            slug: product.slug,
            category: categoryLabel(product),
            price: pricing.final_price,
            base_price: pricing.base_price,
            promotion: pricing.promotion?.name ?? null,
            quantity,
            stock: maxStock ?? null,
            image: variant?.image_path ? resolveMediaUrl(variant.image_path) : productImage(product),
            attributes: variant?.attributes ?? null,
        });
    }

    writeCart(items);
    window.dispatchEvent(new Event('show-basket-preview'));
};

/* ----------------------------------------------------------------- Classes */

/** Bouton « pilule » éditorial (accueil, sections). */
export const pillButton = (tone = 'light') => {
    const base = 'inline-flex items-center justify-center gap-2 h-[46px] px-7 rounded-full border text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
    const tones = {
        light: 'border-[#111] text-[#111] bg-white hover:bg-[#111] hover:text-white focus-visible:outline-[#111]',
        onDark: 'border-white text-[#111] bg-white hover:bg-transparent hover:text-white focus-visible:outline-white',
    };
    return `${base} ${tones[tone]}`;
};

/** Bouton rectangulaire (fiche produit, panier, formulaires). */
export const shopButton = (variant = 'primary', size = 'md') => {
    const base = 'inline-flex items-center justify-center gap-2 rounded font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]';
    const sizes = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-[22px] text-sm', lg: 'h-12 px-6 text-sm' };
    const variants = {
        primary: 'bg-[#111] text-white hover:bg-[#333]',
        secondary: 'bg-white text-[#111] border border-[#d4d4d4] hover:bg-[#f5f5f5]',
        whatsapp: 'bg-[#1f8f4e] text-white hover:bg-[#187a42]',
    };
    return `${base} ${sizes[size]} ${variants[variant]}`;
};

/** Conteneur centré des pages boutique. */
export const wrapClass = 'max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10';

/** Sur-titre en capitales espacées. */
export const tagClass = 'text-[11px] tracking-[0.22em] uppercase font-medium';

/** Champs des formulaires compte (connexion, inscription, profil). */
export const authField = (error) =>
    `block w-full h-11 px-3.5 border rounded bg-white text-sm text-[#111] outline-none focus:border-[#111] ${error ? 'border-[#b42318]' : 'border-[#d9d9d9]'}`;

export const authLabel = 'block text-[13px] font-medium text-[#222] mb-1.5';
