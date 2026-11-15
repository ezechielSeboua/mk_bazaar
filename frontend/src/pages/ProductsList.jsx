import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Tag, X } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { useCatalogData } from "../contexts/CatalogContext";
import { fetchCatalog } from "../services/product";
import { getProductTypes } from "../services/catalog";
import { colorHex, wrapClass } from "../components/shop/shopUtils";
import useStorefrontMotion from "../hooks/useStorefrontMotion";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

/*
 * Catalogue (maquette « 02 · Catalogue ») : filtres à gauche (promotion,
 * catégorie, options du type de produit, prix, disponibilité), tri, grille
 * de cartes et pagination. Tous les filtres vivent dans l'URL.
 */

const PER_PAGE = 24;
const SORTS = [
  { value: "nouveautes", label: "Nouveautés", api: "newest" },
  { value: "prix-croissant", label: "Prix croissant", api: "price_low" },
  { value: "prix-decroissant", label: "Prix décroissant", api: "price_high" },
];

// Types de produit : chargés une fois par session
let typesCache = null;
const loadTypes = () => (typesCache ? Promise.resolve(typesCache) : getProductTypes().then((res) => (typesCache = res?.success ? res.data ?? [] : [])));

function Checkbox({ checked }) {
  return (
    <span className={`w-4 h-4 rounded-[3px] border grid place-items-center shrink-0 ${checked ? "bg-[#111] border-[#111] text-white" : "border-[#bdbdbd]"}`} aria-hidden="true">
      {checked && <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
    </span>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="border-t border-[#ececec]">
      <h2 className="text-sm font-semibold py-4">{title}</h2>
      <div className="pb-4">{children}</div>
    </section>
  );
}

function Filters({ params, update, categories, filterAttributes, onReset }) {
  const category = params.get("category");
  const [minPrice, setMinPrice] = useState(params.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");
  const parents = categories.filter((c) => !c.parent_id);
  const total = parents.reduce((sum, c) => sum + (c.total_products_count ?? c.products_count ?? 0), 0);

  const categoryRow = (slug, label, count, indent = false) => {
    const checked = slug === category || (!slug && !category);
    return (
      <button
        key={slug ?? "all"}
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={() => update({ category: slug, attrs: "reset" })}
        className={`w-full flex items-center gap-2.5 text-sm text-[#333] mb-2.5 text-left ${indent ? "pl-6" : ""}`}
      >
        <Checkbox checked={checked} />
        <span className={checked ? "font-medium text-[#111]" : ""}>{label}</span>
        {count !== undefined && <span className="ml-auto text-[13px] text-[#888] tabular-nums">{count}</span>}
      </button>
    );
  };

  const applyPrice = () => update({ min_price: minPrice || null, max_price: maxPrice || null });

  return (
    <div className="text-[#111]">
      <button
        type="button"
        role="switch"
        aria-checked={params.get("on_sale") === "1"}
        onClick={() => update({ on_sale: params.get("on_sale") === "1" ? null : "1" })}
        className="w-full flex items-center gap-2.5 text-sm text-[#333] mb-3.5 py-2.5"
      >
        <Tag className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
        En promotion
        <span className={`ml-auto relative w-[34px] h-5 rounded-full transition-colors ${params.get("on_sale") === "1" ? "bg-[#111]" : "bg-[#d4d4d4]"}`} aria-hidden="true">
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${params.get("on_sale") === "1" ? "left-4" : "left-0.5"}`} />
        </span>
      </button>

      <FilterSection title="Catégorie">
        <div role="radiogroup" aria-label="Catégorie">
          {categoryRow(null, "Toutes les pièces", total)}
          {parents.map((parent) => [
            categoryRow(parent.slug, parent.name, parent.total_products_count ?? parent.products_count),
            ...categories
              .filter((c) => c.parent_id === parent.id)
              .map((child) => categoryRow(child.slug, child.name, child.products_count, true)),
          ])}
        </div>
      </FilterSection>

      {filterAttributes.map((attribute) => {
        const current = params.get(`attr_${attribute.slug}`);
        const isColor = attribute.family === "color";
        return (
          <FilterSection key={attribute.slug} title={attribute.name}>
            <div className={`flex flex-wrap ${isColor ? "gap-2.5" : "gap-2"}`} role="group" aria-label={attribute.name}>
              {attribute.values.map(({ value, hex }) => {
                const active = current === value;
                const toggle = () => update({ [`attr_${attribute.slug}`]: active ? null : value });
                return isColor ? (
                  <button
                    key={value}
                    type="button"
                    onClick={toggle}
                    aria-pressed={active}
                    aria-label={value}
                    title={value}
                    className={`w-7 h-7 rounded-full grid place-items-center ${active ? "ring-[1.5px] ring-[#111] ring-offset-2" : ""}`}
                  >
                    <span className="w-6 h-6 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]" style={{ background: colorHex(value, hex) }} />
                  </button>
                ) : (
                  <button
                    key={value}
                    type="button"
                    onClick={toggle}
                    aria-pressed={active}
                    className={`min-w-[46px] h-9 px-2.5 rounded border text-[13px] transition-colors ${active ? "bg-[#111] border-[#111] text-white" : "border-[#d9d9d9] hover:border-[#111]"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        );
      })}

      <FilterSection title="Prix (FCFA)">
        <form className="flex gap-2 items-center" onSubmit={(e) => { e.preventDefault(); applyPrice(); }}>
          <label className="sr-only" htmlFor="price-min">Prix minimum</label>
          <input id="price-min" type="number" min={0} inputMode="numeric" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} onBlur={applyPrice} className="w-full h-10 px-3 border border-[#d9d9d9] rounded text-sm tabular-nums" />
          <span className="text-[#6b6b6b]" aria-hidden="true">–</span>
          <label className="sr-only" htmlFor="price-max">Prix maximum</label>
          <input id="price-max" type="number" min={0} inputMode="numeric" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onBlur={applyPrice} className="w-full h-10 px-3 border border-[#d9d9d9] rounded text-sm tabular-nums" />
        </form>
      </FilterSection>

      <FilterSection title="Disponibilité">
        <button type="button" role="checkbox" aria-checked={params.get("in_stock") === "1"} onClick={() => update({ in_stock: params.get("in_stock") === "1" ? null : "1" })} className="flex items-center gap-2.5 text-sm text-[#333]">
          <Checkbox checked={params.get("in_stock") === "1"} />
          En stock uniquement
        </button>
      </FilterSection>

      <button type="button" onClick={onReset} className="w-full h-9 mt-2 rounded border border-[#d4d4d4] text-[13px] font-semibold hover:bg-[#f5f5f5]">
        Réinitialiser les filtres
      </button>
    </div>
  );
}

export default function ProductsList() {
  const { categories } = useCatalogData();
  const [params, setParams] = useSearchParams();
  const [types, setTypes] = useState(typesCache ?? []);
  const [result, setResult] = useState({ key: null, products: [], total: 0, lastPage: 1 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mainRef = useRef(null);
  useBodyScrollLock(filtersOpen);

  useEffect(() => {
    let cancelled = false;
    loadTypes().then((list) => { if (!cancelled) setTypes(list); });
    return () => { cancelled = true; };
  }, []);

  const categorySlug = params.get("category");
  const category = categories.find((c) => c.slug === categorySlug) ?? null;
  const parent = category?.parent_id ? categories.find((c) => c.id === category.parent_id) : null;
  const children = useMemo(
    () => (category && !category.parent_id ? categories.filter((c) => c.parent_id === category.id) : []),
    [category, categories],
  );
  const sort = SORTS.find((s) => s.value === params.get("sort")) ?? SORTS[0];
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const search = params.get("search") ?? "";
  const onSale = params.get("on_sale") === "1";

  // Filtres d'options : type de la catégorie (ou de ses sous-catégories), sinon tous les types filtrables.
  const filterAttributes = useMemo(() => {
    let relevant;
    if (category) {
      const typeIds = new Set([category.product_type_id ?? parent?.product_type_id, ...children.map((c) => c.product_type_id)].filter(Boolean));
      relevant = types.filter((t) => typeIds.has(t.id));
    } else {
      relevant = types;
    }
    const merged = new Map();
    relevant.filter((t) => t.show_as_filter).forEach((type) => {
      (type.variation_attributes ?? []).forEach((attribute) => {
        const entry = merged.get(attribute.slug) ?? { slug: attribute.slug, name: attribute.name, family: attribute.family, values: [] };
        attribute.values.forEach((v) => { if (!entry.values.some((x) => x.value === v.value)) entry.values.push({ value: v.value, hex: v.hex }); });
        merged.set(attribute.slug, entry);
      });
    });
    // Sans catégorie : on se limite aux options communes (couleur, taille…) pour garder le panneau lisible
    const list = [...merged.values()];
    return category ? list : list.filter((a) => ["couleur", "taille"].includes(a.slug));
  }, [types, category, parent, children]);

  const attrFilters = useMemo(() => {
    const attr = {};
    params.forEach((value, key) => { if (key.startsWith("attr_")) attr[key.slice(5)] = value; });
    if (params.get("size")) attr.taille = params.get("size"); // anciens liens
    if (params.get("color")) attr.couleur = params.get("color");
    return attr;
  }, [params]);

  const query = useMemo(() => ({
    page,
    per_page: PER_PAGE,
    category_slug: categorySlug,
    sort: sort.api,
    search,
    on_sale: onSale ? 1 : null,
    in_stock: params.get("in_stock") === "1" ? 1 : null,
    min_price: params.get("min_price"),
    max_price: params.get("max_price"),
    attr: attrFilters,
  }), [page, categorySlug, sort, search, onSale, params, attrFilters]);

  const requestKey = JSON.stringify(query);
  const loading = result.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    fetchCatalog(query).then((res) => {
      if (cancelled) return;
      setResult({
        key: requestKey,
        products: res?.success ? res.data?.data ?? [] : [],
        total: res?.success ? res.data?.total ?? 0 : 0,
        lastPage: res?.success ? res.data?.last_page ?? 1 : 1,
        error: res?.success ? null : "Le catalogue n'a pas pu être chargé.",
      });
    });
    return () => { cancelled = true; };
  }, [requestKey, query]);

  /** Met à jour l'URL ; toute modification de filtre revient à la page 1. */
  const update = (changes) => {
    const next = new URLSearchParams(params);
    if (changes.attrs === "reset") {
      [...next.keys()].filter((k) => k.startsWith("attr_") || k === "size" || k === "color").forEach((k) => next.delete(k));
    }
    Object.entries(changes).forEach(([key, value]) => {
      if (key === "attrs") return;
      if (value === null || value === undefined || value === "") next.delete(key); else next.set(key, value);
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next);
    if ("page" in changes) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => setParams(search ? { search } : {});

  // Titre à l'arrivée, cartes en cascade à chaque nouveau résultat (filtres, page)
  useStorefrontMotion(mainRef, [result.key, categorySlug, search]);

  const title = search ? `Résultats pour « ${search} »` : onSale && !category ? "Pièces en promotion" : category?.name ?? "Toutes les pièces";
  const description = category?.description || (search ? null : "Mode, bijoux et accessoires sélectionnés pour leur qualité et leur finition.");

  const activeChips = [
    ...Object.entries(attrFilters).map(([slug, value]) => ({ key: `attr_${slug}`, label: value, clear: { [`attr_${slug}`]: null, ...(slug === "taille" ? { size: null } : {}), ...(slug === "couleur" ? { color: null } : {}) } })),
    ...(onSale ? [{ key: "on_sale", label: "En promotion", clear: { on_sale: null } }] : []),
    ...(params.get("in_stock") === "1" ? [{ key: "in_stock", label: "En stock", clear: { in_stock: null } }] : []),
    ...(params.get("min_price") || params.get("max_price") ? [{ key: "price", label: `${params.get("min_price") || 0} – ${params.get("max_price") || "∞"} FCFA`, clear: { min_price: null, max_price: null } }] : []),
  ];

  const filtersPanel = <Filters key={`${params.get("min_price") ?? ""}-${params.get("max_price") ?? ""}`} params={params} update={update} categories={categories} filterAttributes={filterAttributes} onReset={reset} />;

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title={title} description={description ?? undefined} path={`/products${categorySlug ? `?category=${categorySlug}` : ""}`} />
      <Header />

      <main ref={mainRef} className={wrapClass}>
        <nav className="text-[13px] text-[#777] py-[22px]" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link>
          {parent && <> / <Link to={`/products?category=${parent.slug}`} className="hover:underline">{parent.name}</Link></>}
          {" / "}<b className="font-medium text-[#111]">{category?.name ?? (search ? "Recherche" : "Toutes les pièces")}</b>
        </nav>

        <div className="mb-7">
          <h1 data-anim="title" data-anim-load className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em]">{title}</h1>
          {description && <p data-anim="fade" data-anim-load data-anim-delay="0.2" className="text-[15px] text-[#6b6b6b] mt-1.5">{description}</p>}
          {children.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {children.map((child) => (
                <Link key={child.id} to={`/products?category=${child.slug}`} className="h-9 px-3.5 inline-flex items-center rounded-full border border-[#d9d9d9] text-[13px] hover:border-[#111]">
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          <aside className="hidden lg:block" aria-label="Filtres">{filtersPanel}</aside>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-3 justify-between items-center pb-[18px] mb-6 border-b border-[#ececec]">
              <div className="flex flex-wrap gap-2 items-center">
                <button type="button" onClick={() => setFiltersOpen(true)} className="lg:hidden inline-flex items-center gap-2 h-9 px-3.5 rounded border border-[#d4d4d4] text-[13px] font-semibold">
                  <SlidersHorizontal className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /> Filtres{activeChips.length ? ` (${activeChips.length})` : ""}
                </button>
                <span className="text-sm text-[#6b6b6b] mr-1.5" aria-live="polite">{loading ? "Chargement…" : `${result.total} article${result.total > 1 ? "s" : ""}`}</span>
                {activeChips.map((chip) => (
                  <button key={chip.key} type="button" onClick={() => update(chip.clear)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f2f2f2] text-[13px] hover:bg-[#e8e8e8]" aria-label={`Retirer le filtre ${chip.label}`}>
                    {chip.label} <X className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <span className="text-[#6b6b6b]">Trier par</span>
                <select value={sort.value} onChange={(e) => update({ sort: e.target.value })} className="h-10 pl-3.5 pr-8 border border-[#d9d9d9] rounded bg-white text-sm">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            </div>

            {result.error && <p className="text-sm text-[#b42318] mb-6" role="alert">{result.error}</p>}

            <div data-anim={loading ? undefined : "stagger"} className={`grid grid-cols-2 md:grid-cols-3 gap-x-3 sm:gap-x-5 gap-y-9 transition-opacity ${loading && result.products.length ? "opacity-60" : ""}`}>
              {result.products.map((product) => <ProductCard key={product.id} product={product} />)}
              {loading && result.products.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} aria-hidden="true">
                  <div className="aspect-[3/4] bg-[#f3f3f3] animate-pulse rounded-sm" />
                  <div className="h-3 w-1/2 mt-4 bg-[#f1f1f1] rounded" />
                  <div className="h-3 w-1/3 mt-2 bg-[#f1f1f1] rounded" />
                </div>
              ))}
            </div>

            {!loading && result.products.length === 0 && !result.error && (
              <div className="text-center py-20">
                <p className="text-[15px] text-[#444]">Aucun article ne correspond à votre recherche.</p>
                <button type="button" onClick={reset} className="mt-4 text-sm underline">Réinitialiser les filtres</button>
              </div>
            )}

            {result.lastPage > 1 && (
              <nav className="flex justify-center items-center gap-1.5 mt-14" aria-label="Pagination">
                <button type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })} className="w-10 h-10 grid place-items-center rounded border border-[#e0e0e0] disabled:opacity-40" aria-label="Page précédente">
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                </button>
                {Array.from({ length: result.lastPage }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === result.lastPage || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1.5">
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-[#777]">…</span>}
                      <button type="button" onClick={() => update({ page: p })} aria-current={p === page ? "page" : undefined} className={`min-w-10 h-10 px-2 rounded border text-sm ${p === page ? "bg-[#111] border-[#111] text-white" : "border-[#e0e0e0] hover:bg-[#f5f5f5]"}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button type="button" disabled={page >= result.lastPage} onClick={() => update({ page: page + 1 })} className="w-10 h-10 grid place-items-center rounded border border-[#e0e0e0] disabled:opacity-40" aria-label="Page suivante">
                  <ChevronRight className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>

      {/* Filtres mobiles */}
      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden font-admin">
            <motion.div className="absolute inset-0 bg-[#111]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtres"
              className="absolute inset-y-0 right-0 w-[340px] max-w-[90vw] bg-white flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex justify-between items-center h-14 px-4 border-b border-[#ececec]">
                <h2 className="text-base font-semibold">Filtres</h2>
                <button type="button" onClick={() => setFiltersOpen(false)} className="w-10 h-10 grid place-items-center" aria-label="Fermer les filtres">
                  <X className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">{filtersPanel}</div>
              <div className="p-4 border-t border-[#ececec]">
                <button type="button" onClick={() => setFiltersOpen(false)} className="w-full h-11 rounded bg-[#111] text-white text-sm font-semibold">
                  Voir {result.total} article{result.total > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
