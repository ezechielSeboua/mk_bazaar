const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const EMPTY_METRICS = {
    total_revenue_fcfa: 0,
    pending_orders_count: 0,
    lost_revenue_cancelled_fcfa: 0,
};

const EMPTY_HERO = { title: '', subtitle: '', ctaText: '' };

let memoryCache = null;

export const getDashboardCache = () => memoryCache;

export const setDashboardCache = (data) => {
    memoryCache = {
        products: data.products ?? [],
        categories: data.categories ?? [],
        users: data.users ?? [],
        orders: data.orders ?? [],
        metrics: data.metrics ?? EMPTY_METRICS,
        shippingZones: data.shippingZones ?? [],
        heroConfig: data.heroConfig ?? EMPTY_HERO,
        advancedStats: data.advancedStats ?? null,
        timestamp: Date.now(),
    };
};

export const clearDashboardCache = () => {
    memoryCache = null;
};

export const isCacheFresh = (cache = memoryCache) =>
    !!cache && Date.now() - cache.timestamp < CACHE_TTL_MS;

export const getInitialDashboardState = () => {
    const cache = getDashboardCache();
    if (!cache) {
        return {
            products: [],
            categories: [],
            users: [],
            orders: [],
            metrics: EMPTY_METRICS,
            shippingZones: [],
            heroConfig: EMPTY_HERO,
            advancedStats: null,
            hasCache: false,
        };
    }

    return {
        products: cache.products,
        categories: cache.categories,
        users: cache.users,
        orders: cache.orders,
        metrics: cache.metrics,
        shippingZones: cache.shippingZones,
        heroConfig: cache.heroConfig,
        advancedStats: cache.advancedStats,
        hasCache: true,
    };
};
