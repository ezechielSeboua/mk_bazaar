import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F9F9F7] text-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-sm uppercase tracking-wider">Chargement...</p>
                </div>
            </div>
        );
    }

    // Vérifier l'authentification
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Vérifier les permissions admin si requis
    if (requireAdmin && !user?.is_admin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
