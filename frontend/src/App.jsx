import { lazy, Suspense } from 'react'; // <-- 1. Importation des outils de lazy-loading
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Les Wrappers restent importés normalement car ils gèrent la structure et les contextes vitaux
import DashboardWrapper from './components/DashboardWrapper';
import StorefrontWrapper from './components/StorefrontWrapper';
import LoadingScreen from './components/LoadingScreen'; // <-- 2. Ton écran de chargement global

/* ---------- Chargement paresseux (Lazy Loading) des pages ---------- */
// Pages de la Vitrine (Storefront)
const Home = lazy(() => import('./pages/HomePage'));
const ProductList = lazy(() => import('./pages/ProductsList'));
const ProductPage = lazy(() => import('./pages/ProductDetails'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// Page d'Authentification
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));

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
      {/* 3. Suspense intercepte le téléchargement des morceaux de code (chunks) 
           et affiche ton LoadingScreen pendant l'opération */}
      <Suspense fallback={<LoadingScreen isLoading={true} />}>
        <Routes>
          {/* Vitrine */}
          <Route element={<StorefrontWrapper />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:slug" element={<ProductPage />} />
          </Route>
          
          {/* Hors layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Dashboard — Données chargées à la demande */}
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
    </AuthProvider>
  );
}

export default App;