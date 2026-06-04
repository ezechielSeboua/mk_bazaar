// import { useState, useEffect } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "../contexts/AuthContext";
// import LoadingScreen from "./LoadingScreen"; // <-- Ajuste le chemin selon ton projet

// /* ---------- Icônes SVG ---------- */
// function HamburgerIcon() {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//       <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
//     </svg>
//   );
// }

// function UsersIcon() {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//       <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
//     </svg>
//   );
// }

// function CloseIcon() {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
//     </svg>
//   );
// }

// function ArrowRightIcon({ className = "w-4 h-4" }) {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
//       <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
//     </svg>
//   );
// }

// function LogoutIcon({ className = "w-4 h-4" }) {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
//       <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
//     </svg>
//   );
// }

// const MotionLink = motion(Link);

// const navItemVariants = {
//   hidden: { opacity: 0, x: -16 },
//   visible: {
//     opacity: 1,
//     x: 0,
//     transition: { type: "spring", stiffness: 300, damping: 24 }
//   },
// };

// export default function Header() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [isLoggingOut, setIsLoggingOut] = useState(false); // <-- État pour le chargement

//   const { user, handleLogout: logoutFromContext } = useAuth();
//   const { pathname } = useLocation();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleScroll = () => setScrolled(window.scrollY > 10);
//     window.addEventListener("scroll", handleScroll, { passive: true });
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const handleLogout = async () => {
//     setMobileMenuOpen(false);
//     setIsLoggingOut(true); // 1. On lance l'écran de chargement immédiatement

//     try {
//       // 2. Micro-pause pour laisser l'animation s'installer (UX Premium)
//       await new Promise((resolve) => setTimeout(resolve, 800));
//       await logoutFromContext();
//     } catch (error) {
//       console.error("Échec de la déconnexion :", error);
//     } finally {
//       // 3. Redirection vers le login
//       navigate("/login");
//       // Note : On ne repasse pasisLoggingOut à false ici car le composant va être démonté/changé de page
//     }
//   };

//   const userInitials = user?.name
//     ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
//     : "AD";

//   const navigationLinks = [
//     { to: "/products", label: "Collections" },
//     { to: "/about", label: "Le Studio" },
//     ...(user ? [{ to: "/dashboard", label: "Mon tableau de bord" }] : []),
//   ];

//   return (
//     <>
//       {/* ÉCRAN DE CHARGEMENT DE DÉCONNEXION (Plein écran au-dessus de tout) */}
//       <AnimatePresence>
//         {isLoggingOut && (
//           <div className="fixed inset-0 z-[9999]">
//             <LoadingScreen isLoading={true} />
//           </div>
//         )}
//       </AnimatePresence>

//       <header
//         className={`sticky top-0 z-50 transition-all duration-300 ${
//           scrolled ? "shadow-md bg-[#F9F9F7]/95 backdrop-blur-lg py-3" : "bg-[#F9F9F7]/80 backdrop-blur-md py-5"
//         } border-b border-stone-200/60 px-4 sm:px-8 md:px-12`}
//       >
//         <div className="max-w-7xl mx-auto flex items-center justify-between">

//           {/* 1. PARTIE GAUCHE */}
//           <div className="flex-1 flex items-center min-w-[40px] md:min-w-0">
//             <button
//               className="md:hidden p-2 -ml-2 text-black hover:bg-stone-200/50 rounded-full transition-colors"
//               onClick={() => setMobileMenuOpen(true)}
//               aria-label="Ouvrir le menu"
//             >
//               <HamburgerIcon />
//             </button>

//             <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold">
//               {navigationLinks.map((link) => {
//                 const isActive = pathname === link.to;
//                 return (
//                   <Link
//                     key={link.to}
//                     to={link.to}
//                     className={`relative inline-block py-1 transition-colors duration-300 ${
//                       isActive ? "text-black" : "text-stone-500 hover:text-black"
//                     } after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-black after:transition-transform after:duration-300 ${
//                       isActive ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
//                     } after:origin-left`}
//                   >
//                     {link.label}
//                   </Link>
//                 );
//               })}
//             </nav>
//           </div>

//           {/* 2. PARTIE CENTRALE */}
//           <div className="flex-shrink-0 flex justify-center">
//             <Link to="/" className="inline-block hover:opacity-80 transition-opacity duration-200">
//               <img src="/mk_bazaar_logo.png" alt="MK Bazaar" className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-all duration-300" />
//             </Link>
//           </div>

//           {/* 3. PARTIE DROITE */}
//           <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4 min-w-[40px] md:min-w-0">
//             {user ? (
//               <div className="flex items-center gap-2 sm:gap-3">
//                 <span className="hidden lg:inline text-[11px] uppercase tracking-wider text-stone-500 font-medium">
//                   Bonjour, {user.name?.split(" ")[0] || "vous"}
//                 </span>

//                 <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold uppercase tracking-wider shadow-sm select-none">
//                   {userInitials}
//                 </div>

//                 <div className="hidden sm:block h-4 w-[1px] bg-stone-300 mx-0.5" />

//                 <button
//                   onClick={handleLogout}
//                   className="group relative p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 sm:hover:bg-stone-200/50 rounded-full transition-all duration-200"
//                   aria-label="Se déconnecter"
//                 >
//                   <LogoutIcon className="w-4 h-4 md:w-[18px] md:h-[18px] transition-transform group-hover:translate-x-0.5" />
//                   <span className="absolute top-full right-0 mt-2 hidden group-hover:block bg-stone-900 text-white text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
//                     Déconnexion
//                   </span>
//                 </button>
//               </div>
//             ) : (
//               <Link
//                 to="/login"
//                 className={`group flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 ${
//                   pathname === "/login" ? "bg-black text-white" : "bg-transparent text-black hover:bg-black hover:text-white"
//                 }`}
//                 aria-label="Connexion"
//               >
//                 <UsersIcon />
//               </Link>
//             )}
//           </div>
//         </div>

//         {/* ---------- MENU MOBILE ---------- */}
//         <AnimatePresence>
//           {mobileMenuOpen && (
//             <>
//               <motion.div
//                 className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 onClick={() => setMobileMenuOpen(false)}
//               />

//               <motion.div
//                 className="fixed top-0 left-0 h-full w-full sm:w-80 bg-[#F9F9F7] z-50 shadow-2xl flex flex-col"
//                 initial={{ x: "-100%" }}
//                 animate={{ x: 0 }}
//                 exit={{ x: "-100%" }}
//                 transition={{ type: "spring", stiffness: 350, damping: 35 }}
//               >
//                 <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-white">
//                   <Link to="/" onClick={() => setMobileMenuOpen(false)}>
//                     <img src="/mk_bazaar_logo.png" alt="MK Bazaar" className="h-8 w-auto object-contain" />
//                   </Link>
//                   <button
//                     onClick={() => setMobileMenuOpen(false)}
//                     className="p-2 text-stone-500 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
//                     aria-label="Fermer le menu"
//                   >
//                     <CloseIcon />
//                   </button>
//                 </div>

//                 <motion.nav
//                   className="flex-1 flex flex-col p-4 space-y-2 text-[13px] uppercase tracking-[0.15em] font-semibold bg-white"
//                   initial="hidden"
//                   animate="visible"
//                   exit="hidden"
//                   variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
//                 >
//                   {[
//                     { to: "/", label: "Accueil" },
//                     ...navigationLinks,
//                     ...(!user ? [{ to: "/login", label: "Se connecter" }] : [])
//                   ].map((link) => {
//                     const isActive = pathname === link.to;
//                     return (
//                       <MotionLink
//                         key={link.to}
//                         to={link.to}
//                         variants={navItemVariants}
//                         onClick={() => setMobileMenuOpen(false)}
//                         className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all duration-200 ${
//                           isActive ? "bg-stone-900 text-white pl-6" : "text-stone-600 hover:bg-stone-100 hover:text-black"
//                         }`}
//                       >
//                         <span>{link.label}</span>
//                         <ArrowRightIcon className={`w-4 h-4 transition-transform ${isActive ? "translate-x-1" : "opacity-70"}`} />
//                       </MotionLink>
//                     );
//                   })}

//                   {user && (
//                     <button
//                       onClick={handleLogout}
//                       className="flex items-center justify-between py-3.5 px-4 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 mt-auto border border-red-200/60"
//                     >
//                       <span>Se déconnecter</span>
//                       <LogoutIcon className="w-4 h-4" />
//                     </button>
//                   )}
//                 </motion.nav>
//               </motion.div>
//             </>
//           )}
//         </AnimatePresence>
//       </header>
//     </>
//   );
// }

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import LogoutFip from "./LogoutFip"; // <-- Importation de ton nouveau composant

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

  const { user, handleLogout: logoutFromContext } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setIsLoggingOut(true);

    try {
      // Pause de 1200ms pour apprécier le loader de vitesse avant le démontage
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await logoutFromContext();
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
    { to: "/products", label: "Collections" },
    { to: "/about", label: "Le Studio" },
    ...(user ? [{ to: "/dashboard", label: "Mon tableau de bord" }] : []),
  ];

  return (
    <>
      {/* ANIMATION DE DECONNEXION AVEC LOGOUTFIP */}
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
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "shadow-md bg-[#F9F9F7]/95 backdrop-blur-lg py-1"
            : "bg-[#F9F9F7]/80 backdrop-blur-md py-3"
        } border-b border-stone-200/60 px-4 sm:px-8 md:px-12`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* 1. PARTIE GAUCHE */}
          <div className="flex-1 flex items-center min-w-[40px] md:min-w-0">
            <button
              className="md:hidden p-2 -ml-2 text-black hover:bg-stone-200/50 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <HamburgerIcon />
            </button>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold">
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
          </div>

          {/* 2. PARTIE CENTRALE */}
          <div className="flex-shrink-0 flex justify-center">
            <Link
              to="/"
              className="inline-block hover:opacity-80 transition-opacity duration-200"
            >
              <img
                src="/mk_bazaar_logo.png"
                alt="MK Bazaar"
                className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-all duration-300"
              />
            </Link>
          </div>

          {/* 3. PARTIE DROITE */}
          <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4 min-w-[40px] md:min-w-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden lg:inline text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                  Bonjour, {user.name?.split(" ")[0] || "vous"}
                </span>

                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold uppercase tracking-wider shadow-sm select-none">
                  {userInitials}
                </div>

                <div className="hidden sm:block h-4 w-[1px] bg-stone-300 mx-0.5" />

                <button
                  onClick={handleLogout}
                  className="group relative p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 sm:hover:bg-stone-200/50 rounded-full transition-all duration-200"
                  aria-label="Se déconnecter"
                >
                  <LogoutIcon className="w-4 h-4 md:w-[18px] md:h-[18px] transition-transform group-hover:translate-x-0.5" />
                  <span className="absolute top-full right-0 mt-2 hidden group-hover:block bg-stone-900 text-white text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
                    Déconnexion
                  </span>
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
                  className="flex-1 flex flex-col p-4 space-y-2 text-[13px] uppercase tracking-[0.15em] font-semibold bg-white"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    visible: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {[
                    { to: "/", label: "Accueil" },
                    ...navigationLinks,
                    ...(!user ? [{ to: "/login", label: "Se connecter" }] : []),
                  ].map((link) => {
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
