import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";
import { resolveMediaUrl } from "../config/env";
import LogoutFip from "./LogoutFip";

/* ---------- Icônes SVG ---------- */
function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function LogoutIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
      />
    </svg>
  );
}

function HeartIcon({ className = "w-5 h-5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function CartIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="#000"
      className={`${className}`}  // force l'absence de fond
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

const MotionLink = motion(Link);

const navItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const { user, isAdmin, handleLogout: logoutFromContext } = useAuth();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const calculateCartCount = () => {
    try {
      const savedCart = localStorage.getItem("mk_bazaar_cart");
      if (savedCart) {
        const items = JSON.parse(savedCart);
        const total = items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0,
        );
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Erreur localStorage:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    calculateCartCount();
    const handleStorageChange = () => calculateCartCount();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cart-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cart-updated", handleStorageChange);
    };
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setIsLoggingOut(true);
    try {
      await logoutFromContext();
      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (error) {
      console.error("Échec de la déconnexion :", error);
    } finally {
      navigate("/login");
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const navigationLinks = [
    { to: "/accueil",  label: "Accueil" },
    { to: "/products", label: "Collections" },
    { to: "/about",    label: "À propos" },
    ...(isAdmin ? [{ to: "/dashboard", label: "Dashboard" }] : []),
  ];

  const logoHeight = scrolled ? "h-12 sm:h-16 md:h-20" : "h-14 sm:h-20 md:h-24";

  return (
    <>
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LogoutFip isLoading={isLoggingOut} />
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "shadow-md bg-[#F9F9F7]/95 backdrop-blur-lg py-2"
            : "bg-[#F9F9F7]/80 backdrop-blur-md py-3"
        } border-b border-stone-200/60 px-4 sm:px-8 md:px-12`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Grille responsive */}
          <div className="grid grid-cols-[auto_1fr_auto] md:flex md:items-center md:justify-between">
            {/* Hamburger mobile */}
            <div className="flex items-center md:hidden">
              <button
                className="p-2 -ml-2 text-black hover:bg-stone-200/50 rounded-full transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <HamburgerIcon />
              </button>
            </div>

            {/* Logo centré */}
            <div className="flex items-center justify-center md:justify-start">
              <Link
                to="/accueil"
                className="hover:opacity-80 transition-opacity duration-200 inline-flex"
                aria-label="MK Bazaar – retour à l'accueil"
              >
                <img
                  src="/mk_bazaar_logo.png"
                  alt="MK Bazaar"
                  className={`${logoHeight} w-auto object-contain transition-all duration-300`}
                />
              </Link>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex flex-1 justify-center items-center gap-6 lg:gap-8 text-xs uppercase tracking-widest font-semibold">
              {navigationLinks.map((link) => {
                const isActive = pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative inline-block py-1 transition-colors duration-300 ${
                      isActive
                        ? "text-black"
                        : "text-stone-500 hover:text-black"
                    } after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-black after:transition-transform after:duration-300 ${
                      isActive
                        ? "after:scale-x-100"
                        : "after:scale-x-0 hover:after:scale-x-100"
                    } after:origin-left`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions (droite) */}
            <div className="flex items-center justify-end gap-1 sm:gap-3">
              {/* Favoris */}
              <Link
                to="/compte?tab=favorites"
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  pathname === "/compte" ? "text-rose-500 bg-rose-50" : "text-stone-400 hover:text-rose-500 hover:bg-rose-50"
                }`}
                aria-label="Mes favoris"
                title="Mes favoris"
              >
                <HeartIcon className="w-5 h-5 md:w-6 md:h-6" />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      key={wishlistCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#F9F9F7]"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Panier */}
              <Link
                to="/panier"
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  pathname === "/panier"
                    ? "text-[#c07b5a] bg-[#c07b5a]/10" // actif : texte marron, fond léger marron
                    : "text-[#c07b5a] hover:text-[#a0523d] hover:bg-[#c07b5a]/10" // normal : marron, hover plus foncé
                }`}
                aria-label="Voir le panier"
                title="Mon panier"
              >
                <CartIcon className="w-5 h-5 md:w-6 md:h-6" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="absolute -top-0.5 -right-0.5 bg-[#c07b5a] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#F9F9F7]"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              <div className="hidden md:block h-4 w-[1px] bg-stone-300/80 mx-0.5" />

              {user ? (
                <div className="hidden md:flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/compte"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    title="Mon compte"
                  >
                    <span className="hidden lg:inline text-xs uppercase tracking-wider text-stone-500 font-medium">
                      {user.name?.split(" ")[0] || "Mon compte"}
                    </span>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-black text-white flex items-center justify-center text-xs font-bold uppercase tracking-wider shadow-sm select-none shrink-0">
                      {user.avatar
                        ? <img src={resolveMediaUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                        : userInitials
                      }
                    </div>
                  </Link>
                  <div className="hidden sm:block h-4 w-[1px] bg-stone-300 mx-0.5" />
                  <button
                    onClick={handleLogout}
                    className="group relative p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 sm:hover:bg-stone-200/50 rounded-full transition-all duration-200"
                    aria-label="Se déconnecter"
                    title="Se déconnecter"
                  >
                    <LogoutIcon className="w-4 h-4 md:w-[18px] md:h-[18px] transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`group flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 ${
                    pathname === "/login"
                      ? "bg-black text-white"
                      : "bg-transparent text-black hover:bg-black hover:text-white"
                  }`}
                  aria-label="Connexion"
                >
                  <UsersIcon />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ---------- MENU MOBILE ---------- */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />

              <motion.div
                className="fixed top-0 left-0 h-full w-full sm:w-80 bg-[#F9F9F7] z-50 shadow-2xl flex flex-col"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-white">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    <img
                      src="/mk_bazaar_logo.png"
                      alt="MK Bazaar"
                      className="h-8 w-auto object-contain"
                    />
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-stone-500 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
                    aria-label="Fermer le menu"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <motion.nav
                  className="flex-1 flex flex-col p-4 space-y-2 text-sm uppercase tracking-[0.15em] font-semibold bg-white"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    visible: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {navigationLinks.map((link) => {
                    const isActive = pathname === link.to;
                    return (
                      <MotionLink
                        key={link.to}
                        to={link.to}
                        variants={navItemVariants}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-stone-900 text-white pl-6"
                            : "text-stone-600 hover:bg-stone-100 hover:text-black"
                        }`}
                      >
                        <span>{link.label}</span>
                        <ArrowRightIcon
                          className={`w-4 h-4 transition-transform ${isActive ? "translate-x-1" : "opacity-70"}`}
                        />
                      </MotionLink>
                    );
                  })}

                  {/* Favoris dans le menu mobile */}
                  <MotionLink
                    to="/compte?tab=favorites"
                    variants={navItemVariants}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-4 rounded-xl text-stone-600 hover:bg-rose-50 hover:text-rose-500 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span>Mes Favoris</span>
                      {wishlistCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </div>
                    <ArrowRightIcon className="w-4 h-4 opacity-70" />
                  </MotionLink>

                  {/* Panier dans le menu mobile */}
                  <MotionLink
                    to="/panier"
                    variants={navItemVariants}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all duration-200 ${
                      pathname === "/panier"
                        ? "bg-[#c07b5a]/20 text-[#c07b5a] pl-6"
                        : "text-stone-600 hover:bg-stone-100 hover:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Mon Panier</span>
                      {cartCount > 0 && (
                        <span className="bg-[#c07b5a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <ArrowRightIcon className="w-4 h-4 opacity-70" />
                  </MotionLink>

                  {!user && (
                    <MotionLink
                      to="/login"
                      variants={navItemVariants}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3.5 px-4 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-black transition-all duration-200"
                    >
                      <span>Se connecter</span>
                      <ArrowRightIcon className="w-4 h-4 opacity-70" />
                    </MotionLink>
                  )}

                  {user && (
                    <MotionLink
                      to="/compte"
                      variants={navItemVariants}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all duration-200 ${
                        pathname === "/compte"
                          ? "bg-stone-900 text-white pl-6"
                          : "text-stone-600 hover:bg-stone-100 hover:text-black"
                      }`}
                    >
                      <span>Mon compte</span>
                      <ArrowRightIcon className="w-4 h-4 opacity-70" />
                    </MotionLink>
                  )}

                  {user && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-between py-3.5 px-4 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 mt-auto border border-red-200/60"
                    >
                      <span>Se déconnecter</span>
                      <LogoutIcon className="w-4 h-4" />
                    </button>
                  )}
                </motion.nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
