import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardWrapper from './components/DashboardWrapper';
import StorefrontWrapper from './components/StorefrontWrapper';
import Home from './pages/HomePage';
import ProductList from './pages/ProductsList';
import ProductPage from './pages/ProductDetails';
import LoginPage from './pages/Auth/LoginPage';
import AboutPage from './pages/AboutPage';
import DashboardHome from './pages/Dashboard/DashboardHome';
import CategoriesPage from './pages/Dashboard/CategoriesPage';
import ProductsPage from './pages/Dashboard/ProductsPage';
import UsersPage from './pages/Dashboard/UsersPage';
import CommandsPage from './pages/Dashboard/OrdersPage';
import FinancesPage from './pages/Dashboard/FinancesPage';
import ConfigurationsPage from './pages/Dashboard/ConfigurationsPage';
  // import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<StorefrontWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />


        {/* Dashboard — données chargées une fois via DashboardDataProvider */}
        <Route path="/dashboard" element={<DashboardWrapper />}>
          <Route index element={<DashboardHome />} />
          <Route path="commands" element={<CommandsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="configurations" element={<ConfigurationsPage />} />
          <Route path="finances" element={<FinancesPage />} />
        </Route>

        {/* <Route path="/contact" element={<Contact />} */ }
      </Routes>
    </AuthProvider>
  );
}

export default App;