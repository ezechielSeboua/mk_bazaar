import { Outlet } from 'react-router-dom';
import { CatalogProvider } from '../contexts/CatalogContext';
import BasketPreview from './BasketPreview';

export default function StorefrontWrapper() {
    return (
        <CatalogProvider>
            <Outlet />
            <BasketPreview />
        </CatalogProvider>
    );
}
