import { createOrder } from '../../services/order';
import { getWhatsAppLink } from '../../config/env';
import { buildOrderMessage, formatVariantLabel } from '../../utils/whatsappMessage';
import { promotionLabel } from './shopUtils';

export const LAST_ORDER_KEY = 'mk_last_order';

/** Numéro ivoirien : 10 chiffres, avec ou sans indicatif 225. */
export const isValidPhone = (phone) => /^(\+?225)?[0-9]{10}$/.test(String(phone ?? '').replace(/[\s.()-]/g, ''));

/**
 * Valide les coordonnées de livraison. `user` connecté : nom repris du compte,
 * téléphone demandé seulement s'il manque au compte.
 */
export const validateCheckout = ({ user, name, phone, zone, address }) => {
    const errors = {};
    if (!zone) errors.zone = 'Choisissez votre commune.';
    if (!address?.trim()) errors.address = "Précisez l'adresse de livraison (quartier, rue, repère).";
    if (!user && !name?.trim()) errors.name = 'Indiquez votre nom.';
    const needsPhone = !user || !user.phone;
    if (needsPhone && !isValidPhone(phone)) errors.phone = 'Numéro WhatsApp invalide (10 chiffres).';
    return errors;
};

/**
 * Enregistre la commande puis ouvre WhatsApp avec le récapitulatif.
 *
 * Le serveur recalcule prix, remises et livraison : le message ne reprend que
 * ses montants. La fenêtre WhatsApp est ouverte tout de suite (dans le geste du
 * client) pour ne pas être bloquée par le navigateur.
 *
 * @param {object} params
 * @param {Array}  params.items  [{ product_id, variant_id, quantity, name, attributes }]
 * @returns {Promise<{ order: object, whatsappLink: string|null }>}
 */
export const submitOrder = async ({ items, user, name, phone, zone, address, whatsappNumber, title }) => {
    const waWindow = window.open('', '_blank');

    const customerName = user ? user.name : name.trim();
    const customerPhone = user?.phone || phone.trim();

    const payload = {
        delivery_location: zone.name,
        detailed_address: address.trim(),
        items: items.map((item) => ({
            product_id: item.product_id,
            product_variant_id: item.variant_id || null,
            quantity: item.quantity,
        })),
    };
    if (!user) {
        payload.customer_name = customerName;
        payload.customer_phone = customerPhone;
    } else if (!user.phone) {
        payload.customer_phone = customerPhone;
    }

    const res = await createOrder(payload);
    if (!res?.success || !res.data?.order) {
        waWindow?.close();
        const firstError = res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null;
        throw new Error(firstError || res?.data?.message || res?.error || "La commande n'a pas pu être enregistrée.");
    }

    const order = res.data.order;
    const promotionFor = (item) => order.items?.find((line) =>
        (item.variant_id ? line.product_variant_id === item.variant_id : line.product_id === item.product_id) && line.discount > 0,
    )?.promotion?.name;

    const message = buildOrderMessage({
        order,
        items: items.map((item) => ({
            name: item.name,
            variantLabel: formatVariantLabel(item.attributes),
            quantity: item.quantity,
            promotion: promotionLabel(promotionFor(item)),
        })),
        customerName,
        customerPhone,
        title,
    });

    const whatsappLink = getWhatsAppLink(message, whatsappNumber);
    if (whatsappLink && waWindow) waWindow.location.href = whatsappLink;
    else waWindow?.close();

    try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ order, whatsappLink, guest: !user }));
    } catch { /* stockage indisponible : la page de confirmation utilise l'état de navigation */ }

    return { order, whatsappLink };
};
