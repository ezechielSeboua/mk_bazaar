const CACHE_TTL_MS = 5 * 60 * 1000;

const listeners = new Set();

const emitCatalogUpdate = () => {
    listeners.forEach((fn) => fn(memoryCache));
};

export const subscribeCatalogCache = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

let memoryCache = {
    categories: [],
    shippingZones: [],
    timestamp: null,
    productPages: {},
};

export const buildProductsCacheKey = ({
    page = 1,
    categorySlug = null,
    sort = 'nouveautes',
    search = '',
    inStock = null,
}) => JSON.stringify({ page, categorySlug, sort, search: search.trim(), inStock });

export const getCatalogCache = () => memoryCache;

export const isCatalogFresh = () =>
    !!memoryCache.timestamp && Date.now() - memoryCache.timestamp < CACHE_TTL_MS;

export const isProductPageFresh = (entry) =>
    !!entry?.timestamp && Date.now() - entry.timestamp < CACHE_TTL_MS;

export const setCatalogCategories = (categories) => {
    memoryCache = {
        ...memoryCache,
        categories,
        timestamp: Date.now(),
    };
};

export const setCatalogShippingZones = (shippingZones) => {
    memoryCache = {
        ...memoryCache,
        shippingZones,
        timestamp: Date.now(),
    };
    emitCatalogUpdate();
};

export const getCachedProductPage = (key) => memoryCache.productPages[key] ?? null;

export const setCachedProductPage = (key, data) => {
    memoryCache = {
        ...memoryCache,
        productPages: {
            ...memoryCache.productPages,
            [key]: { ...data, timestamp: Date.now() },
        },
    };
};

export const getInitialCatalogState = () => {
    const fresh = isCatalogFresh();
    return {
        categories: fresh ? memoryCache.categories : [],
        shippingZones: fresh ? memoryCache.shippingZones : [],
        hasCache: fresh,
    };
};

export const clearCatalogCache = () => {
    memoryCache = { categories: [], shippingZones: [], timestamp: null, productPages: {} };
};
