import {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import { getProducts } from '../services/product';
import { getCategories } from '../services/category';
import appSettingsService from '../services/appSettings';
import { DEFAULT_SHIPPING_ZONES, normalizeShippingZones } from '../utils/shippingZones';
import {
    buildProductsCacheKey,
    getInitialCatalogState,
    setCatalogCategories,
    setCatalogShippingZones,
    getCachedProductPage,
    setCachedProductPage,
    isCatalogFresh,
    isProductPageFresh,
    getCatalogCache,
    subscribeCatalogCache,
} from '../utils/catalogCache';

const CatalogContext = createContext();

const extractList = (result) => {
    if (!result?.success) return [];
    const data = result.data;
    return Array.isArray(data) ? data : (data?.data ?? []);
};

export const CatalogProvider = ({ children }) => {
    const initial = getInitialCatalogState();

    const [categories, setCategories] = useState(initial.categories);
    const [shippingZones, setShippingZones] = useState(
        initial.shippingZones.length > 0 ? initial.shippingZones : DEFAULT_SHIPPING_ZONES,
    );
    const [isLoading, setIsLoading] = useState(!initial.hasCache);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchCatalogBase = useCallback(async (force = false) => {
        if (!force && isCatalogFresh()) {
            return {
                categories: getCatalogCache().categories,
                shippingZones: getCatalogCache().shippingZones.length > 0
                    ? getCatalogCache().shippingZones
                    : DEFAULT_SHIPPING_ZONES,
            };
        }

        if (getCatalogCache().categories.length > 0) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const [categoriesResult, zonesResult] = await Promise.all([
                getCategories(),
                appSettingsService.getShippingZones().catch(() => []),
            ]);

            const list = extractList(categoriesResult);
            const zones = normalizeShippingZones(zonesResult);
            const effectiveZones = zones.length > 0 ? zones : DEFAULT_SHIPPING_ZONES;

            setCategories(list);
            setShippingZones(effectiveZones);
            setCatalogCategories(list);
            setCatalogShippingZones(effectiveZones);

            return { categories: list, shippingZones: effectiveZones };
        } catch (err) {
            console.error('Erreur chargement catalogue:', err);
            setError('Erreur lors du chargement du catalogue');
            return {
                categories: getCatalogCache().categories,
                shippingZones: getCatalogCache().shippingZones.length > 0
                    ? getCatalogCache().shippingZones
                    : DEFAULT_SHIPPING_ZONES,
            };
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const fetchCategories = useCallback(async (force = false) => {
        await fetchCatalogBase(force);
    }, [fetchCatalogBase]);

    const fetchProductPage = useCallback(async ({
        page = 1,
        categorySlug = null,
        sort = 'nouveautes',
        search = '',
        inStock = null,
        force = false,
    } = {}) => {
        const key = buildProductsCacheKey({ page, categorySlug, sort, search, inStock });
        const cached = getCachedProductPage(key);

        if (!force && cached && isProductPageFresh(cached)) {
            return {
                products: cached.products,
                totalPages: cached.totalPages,
                totalItems: cached.totalItems,
                fromCache: true,
            };
        }

        const inStockOnly = sort === 'rupture' ? false : inStock;
        const effectiveSort = sort === 'rupture' ? 'nouveautes' : sort;

        const result = await getProducts(
            page,
            categorySlug,
            effectiveSort,
            search,
            inStockOnly,
        );

        if (!result.success) {
            if (cached) {
                return {
                    products: cached.products,
                    totalPages: cached.totalPages,
                    totalItems: cached.totalItems,
                    fromCache: true,
                };
            }
            return { products: [], totalPages: 1, totalItems: 0, fromCache: false };
        }

        const pageData = result.data;
        const payload = {
            products: pageData.data || [],
            totalPages: pageData.last_page || 1,
            totalItems: pageData.total || 0,
        };

        setCachedProductPage(key, payload);
        return { ...payload, fromCache: false };
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        return subscribeCatalogCache((cache) => {
            if (cache.shippingZones?.length > 0) {
                setShippingZones(cache.shippingZones);
            }
        });
    }, []);

    const refreshCatalog = useCallback(() => fetchCatalogBase(true), [fetchCatalogBase]);

    const value = useMemo(
        () => ({
            categories,
            shippingZones,
            isLoading,
            isRefreshing,
            error,
            fetchProductPage,
            refreshCatalog,
        }),
        [categories, shippingZones, isLoading, isRefreshing, error, fetchProductPage, refreshCatalog],
    );

    return (
        <CatalogContext.Provider value={value}>
            {children}
        </CatalogContext.Provider>
    );
};

export const useCatalogData = () => {
    const context = useContext(CatalogContext);
    if (!context) {
        throw new Error('useCatalogData doit être utilisé dans CatalogProvider');
    }
    return context;
};

/** Hook pour une page produits paginée avec cache */
export const useCatalogProducts = ({
    page = 1,
    categorySlug = null,
    sort = 'nouveautes',
    search = '',
    inStock = null,
}) => {
    const { fetchProductPage } = useCatalogData();
    const cacheKey = buildProductsCacheKey({ page, categorySlug, sort, search, inStock });
    const cached = getCachedProductPage(cacheKey);

    const [products, setProducts] = useState(cached?.products ?? []);
    const [totalPages, setTotalPages] = useState(cached?.totalPages ?? 1);
    const [totalItems, setTotalItems] = useState(cached?.totalItems ?? 0);
    const [isLoading, setIsLoading] = useState(!cached);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const key = buildProductsCacheKey({ page, categorySlug, sort, search, inStock });
        const existing = getCachedProductPage(key);

        if (existing) {
            setProducts(existing.products);
            setTotalPages(existing.totalPages);
            setTotalItems(existing.totalItems);
            setIsLoading(false);
            if (isProductPageFresh(existing)) return;
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        fetchProductPage({ page, categorySlug, sort, search, inStock })
            .then((result) => {
                if (cancelled) return;
                setProducts(result.products);
                setTotalPages(result.totalPages);
                setTotalItems(result.totalItems);
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [page, categorySlug, sort, search, inStock, fetchProductPage]);

    return { products, totalPages, totalItems, isLoading, isRefreshing };
};

/** 4 produits mis en avant pour la home (1ère page en cache) */
export const useHomeProducts = () => {
    const { fetchProductPage } = useCatalogData();
    const cacheKey = buildProductsCacheKey({});
    const cached = getCachedProductPage(cacheKey);

    const [products, setProducts] = useState(
        cached ? cached.products.slice(0, 4) : [],
    );
    const [isLoading, setIsLoading] = useState(!cached);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const existing = getCachedProductPage(cacheKey);

        if (existing) {
            setProducts(existing.products.slice(0, 4));
            setIsLoading(false);
            if (isProductPageFresh(existing)) return;
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        fetchProductPage({ page: 1 })
            .then((result) => {
                if (cancelled) return;
                setProducts(result.products.slice(0, 4));
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [fetchProductPage, cacheKey]);

    return {
        products,
        isLoading,
        isRefreshing,
    };
};
