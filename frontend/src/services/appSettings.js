import { fetchAPI } from './apiConfig';
import { normalizeShippingZones } from '../utils/shippingZones';

const appSettingsService = {
  getSetting: async (key) => {
    const result = await fetchAPI(`/settings/${key}`, {
      method: 'GET',
    });

    if (!result.success) {
      console.error(`[Settings Service] Erreur GET pour [${key}]:`, result.error);
      throw new Error(result.error);
    }

    const raw = result.data?.value ?? [];
    return key === 'shipping_zones' ? normalizeShippingZones(raw) : raw;
  },

  getShippingZones: async () => {
    return appSettingsService.getSetting('shipping_zones');
  },

  /**
   * Met à jour ou crée une configuration (Espace Admin)
   * @param {string} key - La clé de la configuration
   * @param {any} value - Le tableau ou l'objet JSON à sauvegarder
   * @returns {Promise<any>} Le payload complet de réponse de l'API
   */
  updateSetting: async (key, value) => {
    const result = await fetchAPI(`/settings/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value }), // Wrapper attend un JSON stringifié pour les requêtes standard
    });

    if (!result.success) {
      console.error(`[Settings Service] Erreur POST pour [${key}]:`, result.error);
      throw new Error(result.error);
    }

    return result.data;
  },

  uploadImage: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const result = await fetchAPI('/settings/upload-image', { method: 'POST', body: fd });
    if (!result.success) throw new Error(result.error);
    return result.data.url;
  },
};

export default appSettingsService;