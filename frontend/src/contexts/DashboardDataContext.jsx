import {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
    useRef,
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
    //  OPTIMISATION 1 : getInitialDashboardState n'est appelé qu'UNE SEULE FOIS au montage
    const [initial] = useState(() => getInitialDashboardState());

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

    // Utilisation d'une ref pour éviter que fetchAll dépende des valeurs par défaut de initial
    const defaultsRef = useRef({
        heroConfig: initial.heroConfig,
        metrics: initial.metrics,
        advancedStats: initial.advancedStats
    });

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
            //  OPTIMISATION 2 : On sépare les données vitales immédiates (Boutique / Ventes) 
            // des statistiques lourdes calculées par le serveur (AdvancedStats)
            const [
                productsList,
                categoriesRes,
                usersRes,
                ordersRes,
                settings,
            ] = await Promise.all([
                getAllProducts(),
                getCategories(),
                getUsers(),
                getOrders(),
                dashboardService.getSettings().catch(() => ({
                    shippingZones: cached?.shippingZones ?? [],
                    heroConfig: cached?.heroConfig ?? defaultsRef.current.heroConfig,
                })),
            ]);

            const nextCategories = extractList(categoriesRes);
            const nextUsers = extractList(usersRes);
            const nextOrders = extractList(ordersRes, 'orders');
            const nextMetrics = ordersRes?.success && ordersRes.data?.metrics
                ? ordersRes.data.metrics
                : cached?.metrics ?? defaultsRef.current.metrics;
            const nextShippingZones = normalizeShippingZones(settings?.shippingZones ?? []);
            const nextHeroConfig = settings?.heroConfig ?? defaultsRef.current.heroConfig;

            // Mise à jour immédiate des données principales pour libérer l'écran de chargement au plus vite
            setProducts(productsList);
            setCategories(nextCategories);
            setUsers(nextUsers);
            setOrders(nextOrders);
            setMetrics(nextMetrics);
            setShippingZones(nextShippingZones);
            setHeroConfig(nextHeroConfig);
            
            // On cache les données actuelles (sans les stats avancées pour le moment)
            syncCache({
                products: productsList,
                categories: nextCategories,
                users: nextUsers,
                orders: nextOrders,
                metrics: nextMetrics,
                shippingZones: nextShippingZones,
                heroConfig: nextHeroConfig,
                advancedStats: cached?.advancedStats ?? defaultsRef.current.advancedStats,
            });

            // L'écran principal est disponible pour l'utilisateur dès maintenant !
            setIsLoading(false);

            //  OPTIMISATION 3 : On lance le calcul des stats avancées en arrière-plan
            // sans bloquer l'affichage global du tableau de bord
            dashboardService.getAdvancedStats(30)
                .then((stats) => {
                    const nextAdvancedStats = stats ?? cached?.advancedStats ?? null;
                    setAdvancedStats(nextAdvancedStats);
                    
                    // On met à jour le cache final avec les stats calculées
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
                })
                .catch((err) => console.error('Erreur stats avancées différées:', err));

        } catch (err) {
            console.error('Erreur chargement dashboard:', err);
            setError('Erreur lors du chargement des données');
            setIsLoading(false); // S'assurer de couper le loader en cas de crash complet
        } finally {
            setIsRefreshing(false);
        }
    }, [syncCache]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Sauvegarde automatique en cache lors des mutations locales
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
            products, setProducts,
            categories, setCategories,
            users, setUsers,
            orders, setOrders,
            metrics, setMetrics,
            shippingZones, setShippingZones,
            heroConfig, setHeroConfig,
            advancedStats, setAdvancedStats,
            isLoading,
            isRefreshing,
            error,
            refreshAll,
        }),
        [
            products, categories, users, orders, metrics,
            shippingZones, heroConfig, advancedStats,
            isLoading, isRefreshing, error, refreshAll,
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