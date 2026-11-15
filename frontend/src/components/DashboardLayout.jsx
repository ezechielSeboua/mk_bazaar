import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  Folder,
  Home,
  Layers,
  LogOut,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../contexts/DashboardDataContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { resolveMediaUrl } from "../config/env";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingScreen from "./LoadingScreen";
import { buttonClass } from "./admin/adminFormat";

/*
 * Habillage du back-office (maquette « Retail premium ») : barre latérale
 * blanche groupée par rubriques, barre supérieure avec recherche, fond #fafafa.
 * Les pages passent leur contenu en `children`.
 */

const ICON_PROPS = { className: "w-[17px] h-[17px] shrink-0", strokeWidth: 1.6, "aria-hidden": true };

const NAV_SECTIONS = [
  {
    title: "Pilotage",
    items: [
      { to: "/dashboard", label: "Tableau de bord", icon: BarChart3, end: true },
      { to: "/dashboard/finances", label: "Finances", icon: CircleDollarSign },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { to: "/dashboard/products", label: "Produits", icon: Layers },
      { to: "/dashboard/categories", label: "Catégories et menu", icon: Folder },
      { to: "/dashboard/attributes", label: "Attributs et types", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Ventes",
    items: [
      { to: "/dashboard/commands", label: "Commandes", icon: ClipboardList, badge: "pending" },
      { to: "/dashboard/promotions", label: "Promotions et bandeaux", icon: Tag },
      { to: "/dashboard/users", label: "Clients et utilisateurs", icon: Users },
    ],
  },
  {
    title: "Boutique",
    items: [
      { to: "/dashboard/configurations", label: "Contenu du site", icon: Settings },
      { to: "/", label: "Voir la boutique", icon: Home, end: true },
    ],
  },
];

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

const todayLabel = () => {
  const label = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function Sidebar({ logoSrc, user, pendingCount, onNavigate, onLogout, onClose }) {
  return (
    <aside className="flex flex-col h-full bg-white border-r border-[#ececec]">
      <div className="h-[68px] shrink-0 flex items-center gap-2.5 px-[22px] border-b border-[#ececec] text-sm font-semibold text-[#111]">
        <Link to="/" onClick={onNavigate} className="shrink-0" aria-label="Retour à la boutique">
          <img src={logoSrc} alt="MK Bazaar" className="h-7 w-auto" />
        </Link>
        Back-office
        <small className="text-[11px] font-medium text-[#666] border border-[#e3e3e3] rounded-[3px] px-1.5 py-px">
          Admin
        </small>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto -mr-2 p-2 text-[#666] hover:text-[#111]"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-[18px]" aria-label="Back-office">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="px-2.5 pt-3 pb-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#767676]">
              {section.title}
            </h2>
            {section.items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 h-10 px-2.5 mb-0.5 rounded text-sm transition-colors ${
                    isActive && to !== "/"
                      ? "bg-[#f1f1f1] text-[#111] font-semibold"
                      : "text-[#444] hover:bg-[#f7f7f7] hover:text-[#111]"
                  }`
                }
              >
                <Icon {...ICON_PROPS} />
                {label}
                {badge === "pending" && pendingCount > 0 && (
                  <span className="ml-auto min-w-[22px] text-center bg-[#111] text-white text-[11px] rounded-full px-[7px] py-px">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 px-[18px] py-4 border-t border-[#ececec] text-[13.5px]">
        {user?.avatar ? (
          <img src={resolveMediaUrl(user.avatar)} alt="" className="w-[34px] h-[34px] rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-[34px] h-[34px] rounded-full bg-[#111] text-white grid place-items-center text-xs font-semibold shrink-0" aria-hidden="true">
            {initials(user?.name)}
          </span>
        )}
        <span className="min-w-0">
          <b className="block font-semibold text-[#111] truncate">{user?.name || "Administrateur"}</b>
          <span className="block text-xs text-[#6b6b6b]">Administration</span>
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="ml-auto p-2 -mr-2 text-[#767676] hover:text-[#111]"
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut {...ICON_PROPS} />
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user, isAdmin, handleLogout } = useAuth();
  const { isLoading, isRefreshing, metrics } = useDashboardData();
  const { logo } = useSiteSettings();
  const logoSrc = logo?.url ? resolveMediaUrl(logo.url) : "/mk_bazaar_logo.png";

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const isAuthCheckComplete = Boolean(user && isAdmin);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (!isAdmin) {
      // S-05 : défense en profondeur — bloquer les non-admins même si ProtectedRoute est contourné
      navigate("/", { replace: true });
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

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/dashboard/commands?search=${encodeURIComponent(query)}` : "/dashboard/commands");
  };

  const pendingCount = metrics?.pending_orders_count ?? 0;
  const sidebarProps = {
    logoSrc,
    user,
    pendingCount,
    onLogout: () => {
      setMobileMenuOpen(false);
      setShowLogoutConfirm(true);
    },
  };

  return (
    <LoadingScreen isLoading={isLoading}>
      <div className="font-admin antialiased flex h-screen bg-[#fafafa] text-[#111]">
        {/* Barre latérale (bureau) */}
        <div className="hidden lg:block w-[248px] shrink-0">
          <Sidebar {...sidebarProps} />
        </div>

        {/* Barre latérale (mobile / tablette) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] z-50 lg:hidden shadow-xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                role="dialog"
                aria-modal="true"
                aria-label="Menu du back-office"
              >
                <Sidebar
                  {...sidebarProps}
                  onNavigate={() => setMobileMenuOpen(false)}
                  onClose={() => setMobileMenuOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Contenu */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <header className="h-[68px] shrink-0 bg-white border-b border-[#ececec] flex items-center gap-3 sm:gap-4 px-4 lg:px-8">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-[#111]"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6" strokeWidth={1.6} aria-hidden="true" />
            </button>

            <form onSubmit={submitSearch} role="search" className="flex-1 sm:flex-none sm:w-[340px] min-w-0">
              <label htmlFor="admin-search" className="sr-only">
                Rechercher une commande
              </label>
              <div className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676] focus-within:border-[#111] focus-within:bg-white">
                <Search className="w-4 h-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <input
                  id="admin-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une commande, un client…"
                  className="w-full min-w-0 bg-transparent text-[13.5px] text-[#111] placeholder:text-[#767676] outline-none"
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-4 text-[13.5px]">
              {isRefreshing && (
                <span className="hidden sm:inline text-xs text-[#767676] animate-pulse" aria-live="polite">
                  Actualisation…
                </span>
              )}
              <span className="hidden xl:inline text-[#6b6b6b]">{todayLabel()}</span>
              <Link to="/" className={`${buttonClass("secondary", "sm")} hidden sm:inline-flex`}>
                <Home className="w-[15px] h-[15px]" strokeWidth={1.6} aria-hidden="true" />
                Voir la boutique
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="px-4 py-6 sm:px-8 sm:pt-7 sm:pb-12 max-w-[1440px]">{children}</div>
          </main>
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
