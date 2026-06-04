import { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { getCurrentUser, isAuthenticated, logout } from '../services/auth';
import { clearDashboardCache } from '../utils/dashboardCache';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            if (isAuthenticated()) {
                const currentUser = getCurrentUser();
                setUser(currentUser);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            clearDashboardCache();
            setUser(null);
        }
    };

    const setAuthUser = (userData) => {
        setUser(userData);
    };

    // dérivés memoisés (performance + cohérence)
    const isAdmin = useMemo(() => {
        // Vérifier plusieurs possibilités selon le format du backend
        return user?.is_admin === true || 
               user?.role === 'admin' || 
               user?.roles?.includes('admin');
    }, [user]);

    const isAuth = useMemo(() => {
        return !!user;
    }, [user]);

    const value = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated: isAuth,
        isAdmin,
        setAuthUser,
        handleLogout
    }), [user, isLoading, isAuth, isAdmin]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans AuthProvider');
    }
    return context;
};