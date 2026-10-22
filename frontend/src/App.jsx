import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';

// Wrappers vitaux
import DashboardWrapper from './components/DashboardWrapper';
import StorefrontWrapper from './components/StorefrontWrapper';
import LoadingScreen from './components/LoadingScreen';
import BasketPage from './pages/BasketPage';

/* ---------- Chargement paresseux (Lazy Loading) des pages ---------- */
// Pages de la Vitrine (Storefront)
const Home = lazy(() => import('./pages/HomePage'));
const ProductList = lazy(() => import('./pages/ProductsList'));
const ProductPage = lazy(() => import('./pages/ProductDetails'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));

// Pages d'Authentification
const LoginPage    = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));

// Espace client
const AccountPage = lazy(() => import('./pages/Account/AccountPage'));

// Pages du Dashboard
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'));
const CategoriesPage = lazy(() => import('./pages/Dashboard/CategoriesPage'));
const ProductsPage = lazy(() => import('./pages/Dashboard/ProductsPage'));
const UsersPage = lazy(() => import('./pages/Dashboard/UsersPage'));
const CommandsPage = lazy(() => import('./pages/Dashboard/OrdersPage'));
const FinancesPage = lazy(() => import('./pages/Dashboard/FinancesPage'));
const ConfigurationsPage = lazy(() => import('./pages/Dashboard/ConfigurationsPage'));

function App() {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <WishlistProvider>
          <Suspense fallback={<LoadingScreen isLoading={true} />}>
            <Routes>
              {/* Vitrine */}
              <Route element={<StorefrontWrapper />}>
                <Route path="/" element={<Home />} />
                <Route path="/accueil" element={<Navigate to="/" replace />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:slug" element={<ProductPage />} />
                <Route path="/panier" element={<BasketPage />} />
                <Route path="/favoris" element={<FavoritesPage />} />
              </Route>

              {/* Hors layout vitrine */}
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about"    element={<AboutPage />} />
              <Route path="/compte"   element={<AccountPage />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardWrapper />}>
                <Route index element={<DashboardHome />} />
                <Route path="commands" element={<CommandsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="configurations" element={<ConfigurationsPage />} />
                <Route path="finances" element={<FinancesPage />} />
              </Route>
            </Routes>
          </Suspense>
        </WishlistProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}

export default App;
