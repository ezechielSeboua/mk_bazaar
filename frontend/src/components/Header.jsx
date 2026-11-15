import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronRight, ChevronUp, Heart, Menu, MessageCircle, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { resolveMediaUrl, getWhatsAppLink } from "../config/env";
import { getCategoryMenu } from "../services/category";
import AnnouncementBar from "./shop/AnnouncementBar";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import { cartCount as readCartCount } from "./shop/shopUtils";

/*
 * En-tête de la boutique (maquette « Retail premium ») :
 * bandeau d'annonce, logo, menu des catégories avec menu déroulant
 * (catégories cochées « Dans le menu », 6 max puis « Plus »), recherche,
 * compte, favoris et panier. Sur mobile, tout passe dans un menu latéral.
 */

const ICON = { strokeWidth: 1.6, "aria-hidden": true };

// Le menu change rarement : une seule requête par session de navigation.
let menuCache = null;
let menuRequest = null;
const loadMenu = () => {
  if (menuCache) return Promise.resolve(menuCache);
  menuRequest ??= getCategoryMenu().then((res) => {
    menuCache = res?.success ? { items: res.data?.items ?? [], more: res.data?.more ?? [] } : { items: [], more: [] };
    return menuCache;
  });
  return menuRequest;
};

const categoryHref = (slug) => `/products?category=${encodeURIComponent(slug)}`;

function useCartCount() {
  const [count, setCount] = useState(() => readCartCount());
  useEffect(() => {
    const update = () => setCount(readCartCount());
    window.addEventListener("storage", update);
    window.addEventListener("cart-updated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cart-updated", update);
    };
  }, []);
  return count;
}

function CountBadge({ value }) {
  if (!value) return null;
  return (
    <span className="absolute -top-[7px] left-3 min-w-[17px] h-[17px] px-1 rounded-full bg-[#111] text-white text-[10px] font-semibold grid place-items-center tabular-nums">
      {value > 99 ? "99+" : value}
    </span>
  );
}

/* --------------------------------------------------------- Menu déroulant */

function MegaMenu({ category, onNavigate }) {
  const children = category.children ?? [];
  const columns = [];
  for (let i = 0; i < children.length; i += 6) columns.push(children.slice(i, i + 6));
  const image = category.image_path ? resolveMediaUrl(category.image_path) : null;

  return (
    <div className="absolute left-0 right-0 top-full bg-white border-b border-[#ececec] shadow-[0_24px_40px_-24px_rgba(0,0,0,.25)] z-30">
      <div className="max-w-[1280px] mx-auto px-10 pt-8 pb-9 grid grid-cols-[repeat(3,minmax(0,1fr))_1.3fr] gap-10">
        {columns.length === 0 && <div />}
        {columns.slice(0, 3).map((column, index) => (
          <div key={index}>
            {index === 0 && <h3 className="text-[13px] font-semibold text-[#111] mb-3.5">{category.name}</h3>}
            {index > 0 && <div className="h-[18px] mb-3.5" aria-hidden="true" />}
            {column.map((child) => (
              <Link key={child.id} to={categoryHref(child.slug)} onClick={onNavigate} className="block text-sm text-[#444] hover:text-[#111] mb-[11px]">
                {child.name}
              </Link>
            ))}
            {index === columns.length - 1 && (
              <Link to={categoryHref(category.slug)} onClick={onNavigate} className="block text-sm font-semibold text-[#111] mt-4 hover:underline">
                Tout voir →
              </Link>
            )}
          </div>
        ))}
        {Array.from({ length: Math.max(0, 3 - Math.max(columns.length, 1)) }).map((_, i) => <div key={`pad-${i}`} />)}
        <Link to={categoryHref(category.slug)} onClick={onNavigate} className="grid grid-cols-[150px_1fr] gap-4 items-center text-[#111] group">
          {image ? (
            <img src={image} alt="" className="w-[150px] h-[180px] object-cover rounded-sm" />
          ) : (
            <span className="w-[150px] h-[180px] rounded-sm bg-[#f4f3f1]" aria-hidden="true" />
          )}
          <span>
            <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#6b6b6b]">À découvrir</span>
            <b className="block text-base my-2">{category.name}</b>
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold group-hover:underline">
              Voir la sélection <ArrowRight className="w-3.5 h-3.5" {...ICON} />
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Menu mobile */

function MobileMenu({ open, onClose, menu, logoSrc, user, wishlistCount, whatsappHref, onSearch }) {
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const categories = [...menu.items, ...menu.more];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden font-admin">
          <motion.div className="absolute inset-0 bg-[#111]/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.nav
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            aria-label="Menu"
            className="absolute inset-y-0 left-0 w-[330px] max-w-[88vw] bg-white flex flex-col overflow-y-auto overscroll-contain"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="flex justify-between items-center h-14 pl-4 pr-2 border-b border-[#ececec] shrink-0">
              <img src={logoSrc} alt="MK Bazaar" className="h-7 w-auto" />
              <button type="button" onClick={onClose} className="w-10 h-10 grid place-items-center" aria-label="Fermer le menu">
                <X className="w-[22px] h-[22px]" {...ICON} />
              </button>
            </div>

            <form className="px-4 py-3.5" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(query); }}>
              <label className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676]">
                <Search className="w-4 h-4 shrink-0" {...ICON} />
                <span className="sr-only">Rechercher un article</span>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un article" className="w-full bg-transparent text-[13.5px] text-[#111] outline-none" />
              </label>
            </form>

            <Link to="/products?sort=nouveautes" onClick={onClose} className="flex justify-between items-center h-[50px] px-4 border-b border-[#f0f0f0] text-[15px]">
              Nouveautés <ChevronRight className="w-4 h-4" {...ICON} />
            </Link>
            <Link to="/offres" onClick={onClose} className="flex justify-between items-center h-[50px] px-4 border-b border-[#f0f0f0] text-[15px] font-semibold">
              Offres <ChevronRight className="w-4 h-4" {...ICON} />
            </Link>

            {categories.map((category) => {
              const children = category.children ?? [];
              const isOpen = expanded === category.id;
              if (!children.length) {
                return (
                  <Link key={category.id} to={categoryHref(category.slug)} onClick={onClose} className="flex justify-between items-center h-[50px] px-4 border-b border-[#f0f0f0] text-[15px]">
                    {category.name} <ChevronRight className="w-4 h-4" {...ICON} />
                  </Link>
                );
              }
              return (
                <div key={category.id} className="border-b border-[#f0f0f0]">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : category.id)}
                    aria-expanded={isOpen}
                    className={`w-full flex justify-between items-center h-[50px] px-4 text-[15px] text-left ${isOpen ? "font-semibold" : ""}`}
                  >
                    {category.name}
                    {isOpen ? <ChevronUp className="w-4 h-4" {...ICON} /> : <ChevronDown className="w-4 h-4" {...ICON} />}
                  </button>
                  {isOpen && (
                    <div className="bg-[#fafafa] pt-1.5 pb-2.5">
                      {children.map((child) => (
                        <Link key={child.id} to={categoryHref(child.slug)} onClick={onClose} className="block px-8 py-[9px] text-sm text-[#444]">
                          {child.name}
                        </Link>
                      ))}
                      <Link to={categoryHref(category.slug)} onClick={onClose} className="block px-8 py-[9px] text-sm font-semibold text-[#111]">
                        Tout voir →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="p-4 grid gap-3 text-sm text-[#444]">
              <Link to={user ? "/compte" : "/login"} onClick={onClose} className="flex items-center gap-2.5">
                <User className="w-[17px] h-[17px]" {...ICON} /> {user ? "Mon compte" : "Se connecter"}
              </Link>
              <Link to="/favoris" onClick={onClose} className="flex items-center gap-2.5">
                <Heart className="w-[17px] h-[17px]" {...ICON} /> Mes favoris{wishlistCount ? ` (${wishlistCount})` : ""}
              </Link>
              <Link to="/compte?tab=orders" onClick={onClose} className="flex items-center gap-2.5">
                <Package className="w-[17px] h-[17px]" {...ICON} /> Suivre ma commande
              </Link>
            </div>

            <div className="mt-auto p-4 border-t border-[#ececec]">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-11 rounded bg-[#111] text-white text-sm font-semibold">
                <MessageCircle className="w-4 h-4" {...ICON} /> Écrire sur WhatsApp
              </a>
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ En-tête */

export default function Header() {
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const { logo, contactInfo } = useSiteSettings();
  const logoSrc = logo?.url ? resolveMediaUrl(logo.url) : "/mk_bazaar_logo.png";
  const whatsappHref = getWhatsAppLink(null, contactInfo?.whatsapp);
  const cartCount = useCartCount();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const [menu, setMenu] = useState(menuCache ?? { items: [], more: [] });
  const [openId, setOpenId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closeTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadMenu().then((data) => { if (!cancelled) setMenu(data); });
    return () => { cancelled = true; };
  }, []);

  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    if (!openId && !mobileOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { setOpenId(null); setMobileOpen(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId, mobileOpen]);

  const open = (id) => { clearTimeout(closeTimer.current); setOpenId(id); };
  const scheduleClose = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpenId(null), 120); };

  const runSearch = (value) => {
    const q = value.trim();
    setMobileOpen(false);
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  const activeCategory = new URLSearchParams(search).get("category");
  const firstName = user?.name?.split(" ")[0];
  const openCategory = [...menu.items, ...menu.more].find((c) => c.id === openId);

  const navItemClass = (active) =>
    `flex items-center gap-1 py-[25px] border-b-2 whitespace-nowrap transition-colors ${active ? "border-[#111] text-[#111]" : "border-transparent hover:text-[#111]"}`;

  return (
    <>
      <div className="font-admin antialiased">
        <AnnouncementBar />
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-[#ececec] font-admin antialiased text-[#111]" onMouseLeave={scheduleClose}>
        {/* Bureau */}
        <div className="hidden lg:flex max-w-[1280px] mx-auto px-10 h-[72px] items-center gap-7">
          <Link to="/" className="shrink-0" aria-label="MK Bazaar, accueil">
            <img src={logoSrc} alt="MK Bazaar" className="h-[38px] w-auto" />
          </Link>

          <nav aria-label="Catégories" className="flex gap-5 text-sm font-medium text-[#333] min-w-0">
            <NavLink to="/products?sort=nouveautes" className={() => navItemClass(pathname === "/products" && !activeCategory && search.includes("nouveautes"))}>
              Nouveautés
            </NavLink>
            {menu.items.map((category) => {
              const hasChildren = (category.children ?? []).length > 0;
              const active = activeCategory === category.slug || (category.children ?? []).some((c) => c.slug === activeCategory);
              return (
                <div key={category.id} onMouseEnter={() => hasChildren ? open(category.id) : setOpenId(null)} onFocus={() => hasChildren && open(category.id)}>
                  <Link to={categoryHref(category.slug)} onClick={() => setOpenId(null)} className={navItemClass(active || openId === category.id)} aria-expanded={hasChildren ? openId === category.id : undefined}>
                    {category.name}
                    {hasChildren && <ChevronDown className="w-[13px] h-[13px] text-[#888]" {...ICON} />}
                  </Link>
                </div>
              );
            })}
            {menu.more.length > 0 && (
              <div onMouseEnter={() => open("more")} onFocus={() => open("more")} className="relative">
                <button type="button" className={navItemClass(openId === "more")} aria-expanded={openId === "more"}>
                  Plus <ChevronDown className="w-[13px] h-[13px] text-[#888]" {...ICON} />
                </button>
                {openId === "more" && (
                  <div className="absolute top-full left-0 bg-white border border-[#ececec] shadow-lg py-2 min-w-[200px] z-30">
                    {menu.more.map((category) => (
                      <Link key={category.id} to={categoryHref(category.slug)} onClick={() => setOpenId(null)} className="block px-4 py-2 text-sm text-[#444] hover:bg-[#fafafa] hover:text-[#111]">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <NavLink to="/offres" onMouseEnter={() => setOpenId(null)} className={({ isActive }) => navItemClass(isActive)}>
              Offres
            </NavLink>
          </nav>

          <form role="search" onSubmit={(e) => { e.preventDefault(); runSearch(query); }} className="ml-auto w-[200px] shrink-0">
            <label className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676] focus-within:border-[#111] focus-within:bg-white">
              <Search className="w-4 h-4 shrink-0" {...ICON} />
              <span className="sr-only">Rechercher</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" className="w-full min-w-0 bg-transparent text-[13.5px] text-[#111] placeholder:text-[#767676] outline-none" />
            </label>
          </form>

          <div className="flex items-center gap-[18px] text-[13.5px] font-medium shrink-0">
            <Link to={user ? "/compte" : "/login"} className="flex items-center gap-2 hover:text-[#111]">
              <User className="w-5 h-5" {...ICON} />
              {user ? firstName : "Se connecter"}
            </Link>
            <Link to="/favoris" className="relative" aria-label={`Favoris (${wishlist.length})`}>
              <Heart className="w-5 h-5" {...ICON} />
              <CountBadge value={wishlist.length} />
            </Link>
            <Link to="/panier" className="relative" aria-label={`Panier (${cartCount} article${cartCount > 1 ? "s" : ""})`}>
              <ShoppingBag className="w-5 h-5" {...ICON} />
              <CountBadge value={cartCount} />
            </Link>
          </div>
        </div>

        {openCategory && (openCategory.children ?? []).length > 0 && (
          <div className="hidden lg:block" onMouseEnter={() => open(openCategory.id)}>
            <MegaMenu category={openCategory} onNavigate={() => setOpenId(null)} />
          </div>
        )}

        {/* Mobile */}
        <div className="lg:hidden h-14 grid grid-cols-[1fr_auto_1fr] items-center px-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMobileOpen(true)} className="w-10 h-10 grid place-items-center" aria-label="Ouvrir le menu">
              <Menu className="w-[22px] h-[22px]" {...ICON} />
            </button>
            <Link to="/products" className="w-10 h-10 grid place-items-center" aria-label="Rechercher dans le catalogue">
              <Search className="w-5 h-5" {...ICON} />
            </Link>
          </div>
          <Link to="/" aria-label="MK Bazaar, accueil">
            <img src={logoSrc} alt="MK Bazaar" className="h-[30px] w-auto" />
          </Link>
          <div className="flex items-center gap-1 justify-end">
            <Link to={user ? "/compte" : "/login"} className="w-10 h-10 grid place-items-center" aria-label={user ? "Mon compte" : "Se connecter"}>
              <User className="w-5 h-5" {...ICON} />
            </Link>
            <Link to="/panier" className="relative w-10 h-10 grid place-items-center" aria-label={`Panier (${cartCount})`}>
              <ShoppingBag className="w-5 h-5" {...ICON} />
              {cartCount > 0 && (
                <span className="absolute top-[3px] right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#111] text-white text-[9.5px] font-semibold grid place-items-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        menu={menu}
        logoSrc={logoSrc}
        user={user}
        wishlistCount={wishlist.length}
        whatsappHref={whatsappHref}
        onSearch={runSearch}
      />
    </>
  );
}
