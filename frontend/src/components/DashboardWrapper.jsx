import { Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Seo from './Seo';
import { DashboardDataProvider } from '../contexts/DashboardDataContext';

export default function DashboardWrapper() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <Seo title="Administration" noindex path="/dashboard" />
            <DashboardDataProvider>
                <Outlet />
            </DashboardDataProvider>
        </ProtectedRoute>
    );
}
