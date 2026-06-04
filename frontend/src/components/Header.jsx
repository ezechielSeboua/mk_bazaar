import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { getWhatsAppLink } from "../config/env";

/* ---------- Icônes SVG (inchangées) ---------- */
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

function UsersIcon() {
  return (
    <svg
      className="w-5 h-5"
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

function ArrowRightIcon() {
  return (
    <svg
      className="w-3 h-3"
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

// Composant pour les liens animés du menu mobile
const MotionLink = motion(Link);

// Variants pour l'animation cascade du menu mobile
const navVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  // Détection du scroll pour ajouter une ombre
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initiales pour l'avatar utilisateur
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled
          ? "shadow-lg bg-[#F9F9F7]/90 backdrop-blur-lg"
          : "bg-[#F9F9F7]/80 backdrop-blur-md"
      } border-b border-stone-200/60 px-6 py-4 md:px-12`}
    >
      <div className="max-w-7xl mx-auto flex items-center">
        {/* ---- Partie gauche : burger mobile + navigation desktop ---- */}
        <div className="flex-1 flex items-center">
          <button
            className="md:hidden p-2 -ml-2 text-black hover:text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <HamburgerIcon />
          </button>

          <nav className="hidden md:flex gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold">
            {[
              { to: "/products", label: "Collections" },
              { to: "/about", label: "Le Studio" },
              ...(user ? [{ to: "/dashboard", label: "Mon tableau de bord" }] : []),
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative inline-block hover:text-stone-600 transition-colors after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-black after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ---- Logo parfaitement centré ---- */}
        <div className="flex-1 flex justify-center">
          <Link
            to="/"
            className="text-xl md:text-2xl font-black tracking-[0.25em] uppercase text-black hover:scale-105 transition-transform duration-200 select-none"
          >
            MK BAZAAR
          </Link>
        </div>

        {/* ---- Actions à droite ---- */}
        <div className="flex-1 flex justify-end items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs uppercase tracking-wider text-stone-600">
                Bienvenue
              </span>
              <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold uppercase">
                {userInitials}
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-black hover:text-white transition-colors duration-300"
              aria-label="Connexion"
            >
              <UsersIcon />
            </Link>
          )}
        </div>
      </div>

      {/* ---------- Menu Mobile (animations améliorées) ---------- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Panneau */}
            <motion.div
              className="fixed top-0 left-0 h-full w-80 bg-[#F9F9F7] z-50 shadow-2xl flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* En-tête du panneau */}
              <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white/90">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-black tracking-[0.15em] uppercase text-black"
                >
                  MK BAZAAR
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-stone-500 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
                  aria-label="Fermer le menu"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Navigation avec cascade */}
              <motion.nav
                className="flex-1 flex flex-col p-6 space-y-1 text-[15px] uppercase tracking-[0.1em] font-medium bg-white/90"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              >
                {[
                  { to: "/", label: "Accueil" },
                  { to: "/products", label: "Collections" },
                  { to: "/about", label: "Le Studio" },
                  ...(user
                    ? [{ to: "/dashboard", label: "Mon tableau de bord" }]
                    : []),
                ].map((link, i) => (
                  <MotionLink
                    key={link.to}
                    to={link.to}
                    custom={i}
                    variants={navVariants}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-black hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                    <ArrowRightIcon />
                  </MotionLink>
                ))}
              </motion.nav>

              {/* Pied (optionnel) */}
              {/* <div className="p-6 border-t border-stone-200 bg-white/90">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-black text-[#F9F9F7] rounded-lg text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
                >
                  <WhatsAppIcon />
                  Nous contacter
                </a>
              </div> */}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}