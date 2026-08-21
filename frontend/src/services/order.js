// import { fetchAPI } from './apiConfig';

// // Get all orders (with optional status filter)
// export const getOrders = async (status = null) => {
//     const endpoint = status ? `/orders?status=${status}` : '/orders';
//     return fetchAPI(endpoint, {
//         method: 'GET'
//     });
// };

// // Create order
// export const createOrder = async (orderData) => {
//     console.log("Creating order with data:", orderData);
//     return fetchAPI('/orders', {
//         method: 'POST',
//         body: JSON.stringify(orderData)
//     });
// };

// // Update order status or details
// export const updateOrder = async (orderId, orderData) => {
//     console.log(`Updating order ${orderId} with data:`, orderData);
//     return fetchAPI(`/orders/${orderId}`, {
//         method: 'PUT',
//         body: JSON.stringify(orderData)
//     });
// };


import { fetchAPI } from './apiConfig';

/**
 * Récupérer les commandes paginées (admin)
 * @param {{ page?: number, perPage?: number, status?: string }} options
 */
export const getOrders = async ({ page = 1, perPage = 25, status = null } = {}) => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (status) params.set('status', status);
    return fetchAPI(`/orders?${params.toString()}`, { method: 'GET' });
};

/**
 * Créer une nouvelle commande (Utilisateur connecté ou Invité)
 * @param {Object} orderData - { delivery_location, detailed_address, items: [{ product_variant_id, quantity }] }
 */
export const createOrder = async (orderData) => {
    return fetchAPI('/orders', {
        method: 'POST',
        body: orderData // Allégé : fetchAPI s'occupe du JSON.stringify()
    });
};

/**
 * Mettre à jour le statut ou les détails d'une commande
 */
export const updateOrder = async (orderId, orderData) => {
    return fetchAPI(`/orders/${orderId}`, {
        method: 'PUT',
        body: orderData
    });
};

/**
 * Récupérer les commandes de l'utilisateur connecté
 */
export const getMyOrders = async () => {
    return fetchAPI('/orders/my', { method: 'GET' });
};

/**
 * Suivre une commande par son numéro (public, sans auth)
 */
export const trackOrder = async (orderNumber) => {
    return fetchAPI(`/orders/track/${encodeURIComponent(orderNumber)}`, { method: 'GET' });
};