/**
 * Construction des messages de commande WhatsApp.
 *
 * Le texte pré-rempli via wa.me reste éditable par le client avant l'envoi : il
 * ne peut donc jamais faire foi. Ce module vise deux objectifs concrets —
 *  1. n'afficher que des montants calculés par le serveur, pour que le vendeur
 *     ne lise jamais un total inventé côté navigateur ;
 *  2. empêcher qu'une saisie client (nom, adresse, nom de produit) fabrique de
 *     fausses lignes de récapitulatif via des sauts de ligne ou du markdown.
 *
 * La référence de commande reste la seule information qui compte : elle permet
 * au vendeur de retrouver la commande réelle dans le dashboard.
 */

/** Longueur max d'un champ libre inséré dans le message. */
const MAX_FIELD_LENGTH = 60;

/** Nombre d'articles détaillés avant bascule sur un résumé. */
const MAX_ITEMS_LISTED = 5;

/**
 * Neutralise une valeur saisie par le client avant insertion dans le message.
 *
 * Retire les sauts de ligne et les caractères de formatage WhatsApp (* _ ~ `)
 * afin qu'un champ « nom » ne puisse pas produire une ligne ressemblant à
 * « *Total à régler :* 500 FCFA » ou « *DÉJÀ PAYÉ* ».
 */
export const sanitizeForWhatsApp = (value, maxLength = MAX_FIELD_LENGTH) => {
    if (value === null || value === undefined) return '';

    const cleaned = String(value)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[*_~`]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return cleaned.length > maxLength
        ? `${cleaned.slice(0, maxLength - 1)}…`
        : cleaned;
};

/**
 * Formate un montant en FCFA avec des espaces simples.
 * `toLocaleString` insère des espaces insécables qui s'affichent mal dans
 * certains clients WhatsApp.
 */
const formatAmount = (value) => {
    const amount = Math.round(Number(value) || 0);
    return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
};

/** Construit le libellé de variante à partir d'un objet d'attributs. */
export const formatVariantLabel = (attributes) => {
    if (!attributes || typeof attributes !== 'object') return '';
    const values = Object.values(attributes).filter(Boolean);
    return values.length ? values.join(' - ') : '';
};

/**
 * Compose le message de commande.
 *
 * @param {object}   params
 * @param {object}   params.order  Commande renvoyée par l'API — source de vérité
 *                                 pour la référence et tous les montants.
 * @param {Array}    params.items  Libellés locaux : [{ name, variantLabel, quantity }].
 *                                 Sert uniquement à nommer les articles, jamais
 *                                 à calculer un montant.
 * @param {string}   params.customerName
 * @param {string}   params.customerPhone
 * @param {string}   params.title  Titre du message.
 */
export const buildOrderMessage = ({
    order,
    items = [],
    customerName,
    customerPhone,
    title = 'NOUVELLE COMMANDE — MK BAZAAR',
}) => {
    const reference = sanitizeForWhatsApp(order?.order_number || '—', 40);
    const deliveryFee = order?.delivery_fee ?? 0;
    const totalPrice = order?.total_price ?? 0;
    const zone = sanitizeForWhatsApp(order?.delivery_location || '');
    const address = sanitizeForWhatsApp(order?.detailed_address || '', 120);

    // Référence et total en tête : ce sont les deux seules informations que le
    // vendeur doit pouvoir lire même si l'URL est tronquée par le navigateur.
    const lines = [
        `🛍️ *${title}*`,
        `📌 *Référence :* #${reference}`,
        `💰 *Total à régler :* ${formatAmount(totalPrice)}`,
        '',
        `👤 *Client :* ${sanitizeForWhatsApp(customerName)}`,
        `📞 *Téléphone :* ${sanitizeForWhatsApp(customerPhone, 25)}`,
        '',
        '*Articles :*',
    ];

    const listed = items.slice(0, MAX_ITEMS_LISTED);
    listed.forEach((item, index) => {
        const variant = sanitizeForWhatsApp(item.variantLabel || '', 40);
        const name = sanitizeForWhatsApp(item.name || 'Article');
        const quantity = Number(item.quantity) || 1;
        lines.push(`${index + 1}. ${name}${variant ? ` (${variant})` : ''} — x${quantity}`);
    });

    const remaining = items.length - listed.length;
    if (remaining > 0) {
        lines.push(`… et ${remaining} autre${remaining > 1 ? 's' : ''} article${remaining > 1 ? 's' : ''}`);
    }

    lines.push(
        '',
        `🚚 *Livraison :* ${zone} — ${formatAmount(deliveryFee)}`,
        `📍 *Adresse :* ${address}`,
        '',
        `Merci de confirmer ma commande (réf. #${reference}).`,
    );

    return lines.join('\n');
};
