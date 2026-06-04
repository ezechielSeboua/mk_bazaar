import { fetchAPI } from './apiConfig';

// Get all orders (with optional status filter)
export const getOrders = async (status = null) => {
    const endpoint = status ? `/orders?status=${status}` : '/orders';
    return fetchAPI(endpoint, {
        method: 'GET'
    });
};

// Create order
export const createOrder = async (orderData) => {
    console.log("Creating order with data:", orderData);
    return fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
};

// Update order status or details
export const updateOrder = async (orderId, orderData) => {
    console.log(`Updating order ${orderId} with data:`, orderData);
    return fetchAPI(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(orderData)
    });
};