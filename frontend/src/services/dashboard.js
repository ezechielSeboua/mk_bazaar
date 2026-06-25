import { fetchAPI } from './apiConfig';
import { normalizeShippingZones } from '../utils/shippingZones';

const SHIPPING_KEY = 'shipping_zones';

const extractSettingValue = (result) => {
    if (!result?.success || !result.data) return [];
    const raw = result.data.value ?? result.data.data?.value ?? [];
    return normalizeShippingZones(raw);
};

const dashboardService = {
  getAdvancedStats: async (days = 30) => {
    const result = await fetchAPI(`/stats/advanced?days=${days}`, {
      method: 'GET',
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  getShippingZones: async () => {
    const result = await fetchAPI(`/settings/${SHIPPING_KEY}`, { method: 'GET' });
    return extractSettingValue(result);
  },

  getSettings: async () => {
    const [shippingRes, heroRes] = await Promise.all([
      fetchAPI(`/settings/${SHIPPING_KEY}`, { method: 'GET' }),
      fetchAPI('/settings/hero', { method: 'GET' }),
    ]);

    return {
      shippingZones: extractSettingValue(shippingRes),
      heroConfig: heroRes.success
        ? (heroRes.data?.value ?? { title: '', subtitle: '', ctaText: '' })
        : { title: '', subtitle: '', ctaText: '' },
    };
  },

  updateSettingByKey: async (key, payloadValue) => {
    const result = await fetchAPI(`/settings/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value: payloadValue }),
    });

    if (!result.success) {
      throw new Error(result.error || `Erreur lors de la mise à jour de ${key}`);
    }
    return result.data;
  },

  updateShippingZones: async (zones) => {
    return dashboardService.updateSettingByKey(SHIPPING_KEY, zones);
  },
};

export default dashboardService;
