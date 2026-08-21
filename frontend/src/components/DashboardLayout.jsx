import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../contexts/DashboardDataContext";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingScreen from "./LoadingScreen"; // <-- 1. Importation de ton écran de chargement
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Icônes SVG ---------- */
function ChartIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <line x1="9" y1="22" x2="9" y2="12" />
      <line x1="15" y1="22" x2="15" y2="12" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, handleLogout } = useAuth();

  // 2. Récupération de l'état de chargement initial (adapte la clé si ton contexte utilise un autre nom comme 'loading')
  const { isLoading, isRefreshing } = useDashboardData();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false); // 3. Nouvel état

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (!isAdmin) {
      // S-05 : défense en profondeur — bloquer les non-admins même si ProtectedRoute est contourné
      navigate("/", { replace: true });
    } else {
      setIsAuthCheckComplete(true);
    }
  }, [user, isAdmin, navigate]);

  if (!isAuthCheckComplete) {
    return <LoadingScreen isLoading={true} />;
  }

  const performLogout = async () => {
    setLogoutLoading(true);
    await handleLogout();
    setLogoutLoading(false);
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const menuItems = [
    { path: "/", label: "Ma Boutique", icon: <StoreIcon /> },
    { path: "/dashboard", label: "Accueil", icon: <ChartIcon /> },
    {
      path: "/dashboard/categories",
      label: "Catégories",
      icon: <FolderIcon />,
    },
    { path: "/dashboard/products", label: "Produits", icon: <PackageIcon /> },
    {
      path: "/dashboard/commands",
      label: "Commandes",
      icon: <ClipboardIcon />,
    },
    { path: "/dashboard/users", label: "Utilisateurs", icon: <UsersIcon /> },
    { path: "/dashboard/finances", label: "Finances", icon: <FinanceIcon /> },
    {
      path: "/dashboard/configurations",
      label: "Configurations",
      icon: <SettingsIcon />,
    },
  ];

  const isActive = (path) => location.pathname === path;

  // 3. On enveloppe tout le rendu dans le LoadingScreen
  return (
    <LoadingScreen isLoading={isLoading}>
      <div className="flex h-screen bg-[#F9F9F7]">
        {/* Sidebar Desktop */}
        <div
          className={`hidden md:flex ${sidebarOpen ? "w-64" : "w-20"} bg-black text-[#F9F9F7] transition-all duration-300 flex-col`}
        >
          <div className="p-6 flex items-center justify-between border-b border-stone-700">
            {sidebarOpen && (
              <h1 className="text-sm font-bold uppercase tracking-widest">
                MK Admin
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-lg hover:text-stone-300 transition-colors w-5 h-5 flex items-center justify-center"
              aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </button>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-stone-700 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-900"
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-6 border-t border-stone-700">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full text-left px-4 py-3 text-stone-400 hover:text-white transition-colors text-sm flex items-center gap-3"
            >
              <span className="w-5 h-5 flex-shrink-0">
                <LogoutIcon />
              </span>
              {sidebarOpen && "Déconnexion"}
            </button>
          </div>
        </div>

        {/* Sidebar Mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                className="fixed top-0 left-0 h-full w-64 bg-black text-[#F9F9F7] z-50 md:hidden flex flex-col shadow-xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.3 }}
              >
                <div className="p-6 flex items-center justify-between border-b border-stone-700">
                  <h1 className="text-sm font-bold uppercase tracking-widest">
                    MK Admin
                  </h1>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-white hover:text-stone-300"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-stone-700 text-white"
                          : "text-stone-400 hover:text-white hover:bg-stone-900"
                      }`}
                    >
                      <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="p-6 border-t border-stone-700">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full text-left px-4 py-3 text-stone-400 hover:text-white transition-colors text-sm flex items-center gap-3"
                  >
                    <span className="w-5 h-5 flex-shrink-0">
                      <LogoutIcon />
                    </span>
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 -ml-2 text-black hover:text-stone-500"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
              >
                <HamburgerIcon />
              </button>
              <h2 className="text-lg md:text-xl font-light uppercase tracking-wider text-black">
                Dashboard
              </h2>
              {isRefreshing && (
                <span className="text-[10px] uppercase tracking-wider text-stone-400 animate-pulse">
                  Actualisation…
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600 hidden sm:block">
                <strong>Bienvenue</strong> , {user?.name || "Admin"}
              </span>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-stone-700 font-bold">
                {/* {user?.name?.charAt(0)?.toUpperCase() || "A"} */}
                <img
                  className="w-14 h-14 object-contain"
                  src="/mk_bazaar_logo.png"
                  alt="Logo"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
        </div>

        <ConfirmDialog
          open={showLogoutConfirm}
          title="Déconnexion"
          message="Êtes-vous sûr de vouloir vous déconnecter ?"
          onConfirm={performLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          loading={logoutLoading}
          confirmLabel="Déconnexion"
        />
      </div>
    </LoadingScreen>
  );
}
