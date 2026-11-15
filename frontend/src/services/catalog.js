import { fetchAPI } from './apiConfig';

/*
 * Types de produit, attributs de variation, promotions et bandeaux d'annonce.
 * Les réponses suivent le format fetchAPI : { success, status, data, error }.
 */

// --- Types de produit -------------------------------------------------------

export const getProductTypes = () => fetchAPI('/product-types', { method: 'GET' });

/** payload : { name, guide_label?, show_as_filter?, attribute_ids: [id, …] (dans l'ordre) } */
export const createProductType = (payload) => fetchAPI('/product-types', { method: 'POST', body: payload });

export const updateProductType = (id, payload) => fetchAPI(`/product-types/${id}`, { method: 'PUT', body: payload });

export const deleteProductType = (id) => fetchAPI(`/product-types/${id}`, { method: 'DELETE' });

// --- Attributs ---------------------------------------------------------------

export const getAttributes = () => fetchAPI('/attributes', { method: 'GET' });

/** payload : { name, slug?, family: 'color'|'size'|'other', values: [{ id?, value, hex? }] } */
export const createAttribute = (payload) => fetchAPI('/attributes', { method: 'POST', body: payload });

export const updateAttribute = (id, payload) => fetchAPI(`/attributes/${id}`, { method: 'PUT', body: payload });

export const deleteAttribute = (id) => fetchAPI(`/attributes/${id}`, { method: 'DELETE' });

// --- Promotions --------------------------------------------------------------

/** status : 'active' | 'scheduled' | 'ended' | 'inactive' | null (toutes) */
export const getPromotions = (status = null) =>
    fetchAPI(`/promotions${status ? `?status=${status}` : ''}`, { method: 'GET' });

export const createPromotion = (payload) => fetchAPI('/promotions', { method: 'POST', body: payload });

export const updatePromotion = (id, payload) => fetchAPI(`/promotions/${id}`, { method: 'PUT', body: payload });

export const deletePromotion = (id) => fetchAPI(`/promotions/${id}`, { method: 'DELETE' });

/** Public : { promotions, products, upcoming } */
export const getOffers = () => fetchAPI('/offers', { method: 'GET' });

// --- Bandeaux d'annonce ------------------------------------------------------

/** Public : bandeaux à afficher maintenant. */
export const getAnnouncementBars = () => fetchAPI('/announcement-bars', { method: 'GET' });

/** Admin : tous les bandeaux, avec statut. */
export const getAllAnnouncementBars = () => fetchAPI('/announcement-bars/all', { method: 'GET' });

export const createAnnouncementBar = (payload) => fetchAPI('/announcement-bars', { method: 'POST', body: payload });

export const updateAnnouncementBar = (id, payload) => fetchAPI(`/announcement-bars/${id}`, { method: 'PUT', body: payload });

export const deleteAnnouncementBar = (id) => fetchAPI(`/announcement-bars/${id}`, { method: 'DELETE' });

export const reorderAnnouncementBars = (ids) => fetchAPI('/announcement-bars/reorder', { method: 'PUT', body: { ids } });
