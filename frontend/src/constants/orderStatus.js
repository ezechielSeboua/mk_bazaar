/**
 * Statuts de commande (alignés sur le backend, maquette « Retail premium ») :
 * Envoyée → Validée → En livraison → Livrée, ou Annulée.
 */
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

/** Libellés côté back-office. */
export const ORDER_STATUS_LABEL = {
    pending: 'En attente',
    confirmed: 'En traitement',
    shipping: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
};

/** Libellés au pluriel pour les onglets de filtre. */
export const ORDER_STATUS_TAB_LABEL = {
    pending: 'En attente',
    confirmed: 'En traitement',
    shipping: 'En livraison',
    delivered: 'Livrées',
    cancelled: 'Annulées',
};

/** Pastilles : fond et texte (contraste ≥ 4.5:1). */
export const ORDER_STATUS_TONE = {
    pending: 'bg-[#fff4e0] text-[#8a4b00]',
    confirmed: 'bg-[#e8f0fe] text-[#1d4ed8]',
    shipping: 'bg-[#f1ebfd] text-[#5b21b6]',
    delivered: 'bg-[#e7f6ec] text-[#166534]',
    cancelled: 'bg-[#fdeaea] text-[#b42318]',
};

/** Transitions autorisées par le backend (OrderController::VALID_TRANSITIONS). */
export const ORDER_NEXT_STATUSES = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipping', 'cancelled'],
    shipping: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: ['confirmed'],
};
