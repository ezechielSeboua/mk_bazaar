import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { useCatalogData } from "../contexts/CatalogContext";
import { getOffers } from "../services/catalog";
import { tagClass, wrapClass } from "../components/shop/shopUtils";
import useStorefrontMotion from "../hooks/useStorefrontMotion";

/*
 * Offres en cours (maquette « 02d · Offres ») : produits remisés par une
 * promotion visible dans les offres, filtrables par univers, et prochaine
 * opération programmée.
 */
export default function OffersPage() {
  const { categories } = useCatalogData();
  const [offers, setOffers] = useState(null);
  const [universe, setUniverse] = useState("all");
  const mainRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getOffers().then((res) => {
      if (!cancelled) setOffers(res?.success ? res.data : { promotions: [], products: [], upcoming: null });
    });
    return () => { cancelled = true; };
  }, []);

  // Univers = catégorie principale du produit
  const universeOf = useMemo(() => {
    const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
    return (product) => {
      const category = product.category ?? byId[product.category_id];
      if (!category) return null;
      return category.parent_id ? byId[category.parent_id] ?? category : category;
    };
  }, [categories]);

  const products = useMemo(() => offers?.products ?? [], [offers]);
  const universes = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const u = universeOf(p);
      if (u) map.set(u.id, { id: u.id, name: u.name, count: (map.get(u.id)?.count ?? 0) + 1 });
    });
    return [...map.values()];
  }, [products, universeOf]);

  useStorefrontMotion(mainRef, [offers === null, universe]);

  const shown = universe === "all" ? products : products.filter((p) => universeOf(p)?.id === universe);
  const upcoming = offers?.upcoming;

  const chip = (value, label, count) => (
    <button
      key={value}
      type="button"
      onClick={() => setUniverse(value)}
      aria-pressed={universe === value}
      className={`h-9 px-4 rounded-full border text-[13px] transition-colors ${universe === value ? "bg-[#111] border-[#111] text-white" : "border-[#d9d9d9] hover:border-[#111]"}`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title="Offres" description="Les offres du moment chez MK Bazaar : remises sur une sélection de vêtements, bijoux et accessoires." path="/offres" />
      <Header />

      <main ref={mainRef} className={wrapClass}>
        <nav className="text-[13px] text-[#777] py-[22px]" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link> / <b className="font-medium text-[#111]">Offres</b>
        </nav>

        <p data-anim="fade" data-anim-load className={`${tagClass} text-[#6b6b6b]`}>Offres en cours</p>
        <h1 data-anim="title" data-anim-load data-anim-delay="0.1" className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] mt-2">Les offres du moment</h1>
        <p data-anim="fade" data-anim-load data-anim-delay="0.3" className="text-[15px] text-[#6b6b6b] mt-1.5">Remises valables dans la limite des stocks. Le montant final vous est confirmé sur WhatsApp.</p>

        {universes.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {chip("all", "Toutes les offres", products.length)}
            {universes.map((u) => chip(u.id, u.name, u.count))}
          </div>
        )}

        <div data-anim={offers === null ? undefined : "stagger"} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-9 mt-8">
          {shown.map((product) => <ProductCard key={product.id} product={product} />)}
          {offers === null && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} aria-hidden="true"><div className="aspect-[3/4] bg-[#f3f3f3] animate-pulse rounded-sm" /></div>
          ))}
        </div>

        {offers !== null && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[15px] text-[#444]">Aucune offre en cours pour le moment.</p>
            <Link to="/products" className="inline-block mt-4 text-sm underline">Voir toute la boutique</Link>
          </div>
        )}

        {upcoming && (
          <p className="mt-14 py-5 border-y border-[#ececec] text-center text-sm text-[#444]">
            Prochaine opération : <b className="font-semibold">{upcoming.name}</b>
            {upcoming.starts_at && ` dès le ${new Date(upcoming.starts_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
