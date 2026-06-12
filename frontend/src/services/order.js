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
 * Récupérer toutes les commandes (avec filtre de statut optionnel)
 * Idéal pour l'historique ou le panneau d'administration
 */
export const getOrders = async (status = null) => {
    const endpoint = status ? `/orders?status=${status}` : '/orders';
    return fetchAPI(endpoint, {
        method: 'GET'
    });
};

/**
 * Créer une nouvelle commande (Utilisateur connecté ou Invité)
 * @param {Object} orderData - { delivery_location, detailed_address, items: [{ product_variant_id, quantity }] }
 */
export const createOrder = async (orderData) => {
    console.log("Creating order with data:", orderData);
    return fetchAPI('/orders', {
        method: 'POST',
        body: orderData // Allégé : fetchAPI s'occupe du JSON.stringify()
    });
};

/**
 * Mettre à jour le statut ou les détails d'une commande
 */
export const updateOrder = async (orderId, orderData) => {
    console.log(`Updating order ${orderId} with data:`, orderData);
    return fetchAPI(`/orders/${orderId}`, {
        method: 'PUT',
        body: orderData // Allégé : fetchAPI s'occupe du JSON.stringify()
    });
};