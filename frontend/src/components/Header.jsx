import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { getWhatsAppLink } from "../config/env";

/* ---------- Icônes SVG ---------- */
function HamburgerIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function WhatsAppIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
    );
}

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-[#F9F9F7]/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 md:px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Partie gauche : hamburger mobile + navigation desktop */}
                <div className="flex items-center gap-4">
                    <button
                        className="md:hidden p-2 -ml-2 text-black hover:text-stone-500"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Menu"
                    >
                        <HamburgerIcon />
                    </button>

                    <nav className="hidden md:flex gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold">
                        <Link to="/products" className="hover:text-stone-500 transition-colors">Collections</Link>
                        <Link to="/about" className="hover:text-stone-500 transition-colors">Le Studio</Link>
                        {user && (
                            <Link to="/dashboard" className="hover:text-stone-500 transition-colors">Mon tableau de bord</Link>
                        )}
                    </nav>
                </div>

                {/* Logo Centré */}
                <Link
                    to="/"
                    className="text-xl font-black tracking-[0.25em] uppercase text-black absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
                >
                    MK BAZAAR
                </Link>

                {/* Actions Droite */}
                <div className="flex items-center gap-2 md:gap-4 text-black">
                    <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-stone-200/40 rounded-full transition-colors text-stone-800 hover:text-emerald-600"
                        aria-label="Nous contacter sur WhatsApp"
                    >
                        <WhatsAppIcon />
                    </a>
                </div>
            </div>

            {/* Menu Mobile */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Overlay plus opaque pour bien isoler le panneau */}
                        <motion.div
                            className="fixed inset-0 bg-black/70 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        {/* Panneau avec fond totalement opaque */}
                        <motion.div
                            className="fixed top-0 left-0 h-full w-80 bg-[#F9F9F7] z-50 shadow-2xl flex flex-col"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* En-tête du panneau */}
                            <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white/80">
                                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-black tracking-[0.15em] uppercase text-black">
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

                            {/* Navigation */}
                            <nav className="flex-1 flex flex-col p-6 space-y-1 text-[15px] uppercase tracking-[0.1em] font-medium bg-white/80 rounded-r-md">
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-black hover:text-white transition-colors"
                                >
                                    Accueil
                                    <ArrowRightIcon />
                                </Link>
                                <Link
                                    to="/products"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-black hover:text-white transition-colors"
                                >
                                    Collections
                                    <ArrowRightIcon />
                                </Link>
                                <Link
                                    to="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-black hover:text-white transition-colors"
                                >
                                    Le Studio
                                    <ArrowRightIcon />
                                </Link>
                                {user && (
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-black hover:text-white transition-colors"
                                    >
                                        Mon tableau de bord
                                        <ArrowRightIcon />
                                    </Link>
                                )}
                            </nav>

                            {/* Pied du panneau : contact WhatsApp */}
                            {/* <div className="p-6 border-t border-stone-200 bg-white/80">
                                <a
                                    href="https://wa.me/2250141649464"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-black text-[#F9F9F7] rounded-lg text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
                                >
                                    <WhatsAppIcon />
                                    Nous contacter
                                </a>
                                <p className="text-[9px] text-black text-center mt-3 uppercase tracking-wider">
                                    Service client via WhatsApp
                                </p>
                            </div> */}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}