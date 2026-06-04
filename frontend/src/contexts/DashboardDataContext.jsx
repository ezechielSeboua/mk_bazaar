import {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import { getAllProducts } from '../services/product';
import { getCategories } from '../services/category';
import { getUsers } from '../services/users';
import { getOrders } from '../services/order';
import dashboardService from '../services/dashboard';
import { normalizeShippingZones } from '../utils/shippingZones';
import {
    getInitialDashboardState,
    setDashboardCache,
    isCacheFresh,
    getDashboardCache,
} from '../utils/dashboardCache';

const DashboardDataContext = createContext();

export const extractList = (result, key = null) => {
    if (!result?.success) return [];
    const data = result.data;

    if (key && data && typeof data === 'object' && key in data) {
        return Array.isArray(data[key]) ? data[key] : [];
    }

    return Array.isArray(data) ? data : (data?.data ?? []);
};

export const DashboardDataProvider = ({ children }) => {
    const initial = getInitialDashboardState();

    const [products, setProducts] = useState(initial.products);
    const [categories, setCategories] = useState(initial.categories);
    const [users, setUsers] = useState(initial.users);
    const [orders, setOrders] = useState(initial.orders);
    const [metrics, setMetrics] = useState(initial.metrics);
    const [shippingZones, setShippingZones] = useState(initial.shippingZones);
    const [heroConfig, setHeroConfig] = useState(initial.heroConfig);
    const [advancedStats, setAdvancedStats] = useState(initial.advancedStats);
    const [isLoading, setIsLoading] = useState(!initial.hasCache);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const syncCache = useCallback((data) => {
        setDashboardCache({
            products: data.products,
            categories: data.categories,
            users: data.users,
            orders: data.orders,
            metrics: data.metrics,
            shippingZones: data.shippingZones,
            heroConfig: data.heroConfig,
            advancedStats: data.advancedStats,
        });
    }, []);

    const fetchAll = useCallback(async (force = false) => {
        const cached = getDashboardCache();

        if (!force && isCacheFresh(cached)) {
            return;
        }

        if (cached) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const [
                productsList,
                categoriesRes,
                usersRes,
                ordersRes,
                settings,
                stats,
            ] = await Promise.all([
                getAllProducts(),
                getCategories(),
                getUsers(),
                getOrders(),
                dashboardService.getSettings().catch(() => ({
                    shippingZones: cached?.shippingZones ?? [],
                    heroConfig: cached?.heroConfig ?? initial.heroConfig,
                })),
                dashboardService.getAdvancedStats(30).catch(() => cached?.advancedStats ?? null),
            ]);

            const nextCategories = extractList(categoriesRes);
            const nextUsers = extractList(usersRes);
            const nextOrders = extractList(ordersRes, 'orders');
            const nextMetrics = ordersRes?.success && ordersRes.data?.metrics
                ? ordersRes.data.metrics
                : cached?.metrics ?? initial.metrics;
            const nextShippingZones = normalizeShippingZones(settings?.shippingZones ?? []);
            const nextHeroConfig = settings?.heroConfig ?? initial.heroConfig;
            const nextAdvancedStats = stats ?? cached?.advancedStats ?? null;

            setProducts(productsList);
            setCategories(nextCategories);
            setUsers(nextUsers);
            setOrders(nextOrders);
            setMetrics(nextMetrics);
            setShippingZones(nextShippingZones);
            setHeroConfig(nextHeroConfig);
            setAdvancedStats(nextAdvancedStats);

            syncCache({
                products: productsList,
                categories: nextCategories,
                users: nextUsers,
                orders: nextOrders,
                metrics: nextMetrics,
                shippingZones: nextShippingZones,
                heroConfig: nextHeroConfig,
                advancedStats: nextAdvancedStats,
            });
        } catch (err) {
            console.error('Erreur chargement dashboard:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [initial.heroConfig, initial.metrics, syncCache]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (isLoading) return;
        syncCache({
            products,
            categories,
            users,
            orders,
            metrics,
            shippingZones,
            heroConfig,
            advancedStats,
        });
    }, [
        products,
        categories,
        users,
        orders,
        metrics,
        shippingZones,
        heroConfig,
        advancedStats,
        isLoading,
        syncCache,
    ]);

    const refreshAll = useCallback(() => fetchAll(true), [fetchAll]);

    const value = useMemo(
        () => ({
            products,
            setProducts,
            categories,
            setCategories,
            users,
            setUsers,
            orders,
            setOrders,
            metrics,
            setMetrics,
            shippingZones,
            setShippingZones,
            heroConfig,
            setHeroConfig,
            advancedStats,
            setAdvancedStats,
            isLoading,
            isRefreshing,
            error,
            refreshAll,
        }),
        [
            products,
            categories,
            users,
            orders,
            metrics,
            shippingZones,
            heroConfig,
            advancedStats,
            isLoading,
            isRefreshing,
            error,
            refreshAll,
        ],
    );

    return (
        <DashboardDataContext.Provider value={value}>
            {children}
        </DashboardDataContext.Provider>
    );
};

export const useDashboardData = () => {
    const context = useContext(DashboardDataContext);
    if (!context) {
        throw new Error('useDashboardData doit être utilisé dans DashboardDataProvider');
    }
    return context;
};
