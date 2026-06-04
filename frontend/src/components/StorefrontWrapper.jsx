import { Outlet } from 'react-router-dom';
import { CatalogProvider } from '../contexts/CatalogContext';

export default function StorefrontWrapper() {
    return (
        <CatalogProvider>
            <Outlet />
        </CatalogProvider>
    );
}
