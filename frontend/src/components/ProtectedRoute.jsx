import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    // S-05 : utiliser isAdmin du contexte (couvre is_admin, role, roles[])
    const { isLoading, isAuthenticated, isAdmin } = useAuth();

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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
