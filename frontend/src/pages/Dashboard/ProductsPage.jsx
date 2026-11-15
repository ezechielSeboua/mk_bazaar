import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, Star } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { deleteProducts, updateProduct } from '../../services/product';
import { resolveMediaUrl } from '../../config/env';
import { Badge, Notice, PageHeader, Pagination, Panel, SkeletonRows } from '../../components/admin/AdminUI';
import { buttonClass, fieldClass, formatFCFA, td, th } from '../../components/admin/adminFormat';

const PER_PAGE = 20;

/** Stock total : somme des variantes actives, sinon stock du produit. */
const totalStock = (product) =>
    product.variants?.length
        ? product.variants.filter((v) => v.is_active !== false).reduce((sum, v) => sum + (v.stock ?? 0), 0)
        : product.stock ?? 0;

function Checkbox({ checked, indeterminate = false, onChange, label }) {
    return (
        <input
            type="checkbox"
            checked={checked}
            ref={(el) => { if (el) el.indeterminate = indeterminate; }}
            onChange={(e) => onChange(e.target.checked)}
            aria-label={label}
            className="w-4 h-4 accent-[#111] cursor-pointer"
        />
    );
}

export default function ProductsPage() {
    const navigate = useNavigate();
    const { products, setProducts, categories, isLoading } = useDashboardData();

    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState('');
    const [featured, setFeatured] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const categoryIds = categoryId
            ? new Set([Number(categoryId), ...categories.filter((c) => c.parent_id === Number(categoryId)).map((c) => c.id)])
            : null;
        return [...products]
            .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
                || (p.variants ?? []).some((v) => (v.sku ?? '').toLowerCase().includes(q)))
            .filter((p) => !categoryIds || categoryIds.has(p.category_id))
            .filter((p) => !status || (status === 'active' ? p.is_active : !p.is_active))
            .filter((p) => !featured || (featured === 'yes' ? p.featured : !p.featured))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [products, categories, search, categoryId, status, featured]);

    const lastPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, lastPage);
    const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const filterSetter = (setter) => (event) => { setter(event.target.value); setPage(1); };

    const pageIds = pageItems.map((p) => p.id);
    const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const someOnPage = pageIds.some((id) => selected.includes(id));

    const togglePage = (checked) =>
        setSelected((prev) => (checked ? [...new Set([...prev, ...pageIds])] : prev.filter((id) => !pageIds.includes(id))));
    const toggleOne = (id, checked) =>
        setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

    /** Applique la même modification à la sélection (un appel par produit). */
    const bulkUpdate = async (patch) => {
        setBusy(true);
        setError(null);
        const results = await Promise.all(selected.map((id) => updateProduct(id, patch)));
        const failed = results.filter((r) => !r?.success).length;
        const updated = Object.fromEntries(results.filter((r) => r?.success).map((r) => [r.data.id, r.data]));
        setProducts((prev) => prev.map((p) => updated[p.id] ?? p));
        if (failed) setError(`${failed} produit${failed > 1 ? 's' : ''} n'${failed > 1 ? 'ont' : 'a'} pas pu être modifié${failed > 1 ? 's' : ''}.`);
        setSelected([]);
        setBusy(false);
    };

    const bulkDelete = async () => {
        setBusy(true);
        const res = await deleteProducts(selected);
        setBusy(false);
        setConfirmDelete(false);
        if (!res?.success) { setError(res?.error || 'La suppression a échoué.'); return; }
        setProducts((prev) => prev.filter((p) => !selected.includes(p.id)));
        setSelected([]);
    };

    const featuredCount = products.filter((p) => p.featured).length;
    const parents = categories.filter((c) => !c.parent_id);

    return (
        <DashboardLayout>
            <PageHeader
                title="Produits"
                subtitle={`${products.length} produit${products.length > 1 ? 's' : ''} · ${featuredCount} mis en avant`}
                actions={
                    <Link to="/dashboard/products/new" className={buttonClass('primary')}>
                        <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                        Ajouter un produit
                    </Link>
                }
            />

            {error && <div className="mb-4"><Notice>{error}</Notice></div>}

            <Panel>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-[#ececec]">
                    <label className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676] w-full sm:w-[280px] focus-within:border-[#111] focus-within:bg-white">
                        <Search className="w-4 h-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                        <span className="sr-only">Rechercher un produit</span>
                        <input type="search" value={search} onChange={filterSetter(setSearch)} placeholder="Nom ou référence…" className="w-full bg-transparent text-[13.5px] text-[#111] placeholder:text-[#767676] outline-none" />
                    </label>
                    <select aria-label="Catégorie" value={categoryId} onChange={filterSetter(setCategoryId)} className={`${fieldClass} pr-8`}>
                        <option value="">Toutes les catégories</option>
                        {parents.map((parent) => (
                            <optgroup key={parent.id} label={parent.name}>
                                <option value={parent.id}>{parent.name} (tout)</option>
                                {categories.filter((c) => c.parent_id === parent.id).map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                            </optgroup>
                        ))}
                    </select>
                    <select aria-label="Statut" value={status} onChange={filterSetter(setStatus)} className={`${fieldClass} pr-8`}>
                        <option value="">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="draft">Brouillons / inactifs</option>
                    </select>
                    <select aria-label="Mis en avant" value={featured} onChange={filterSetter(setFeatured)} className={`${fieldClass} pr-8`}>
                        <option value="">Mis en avant : tous</option>
                        <option value="yes">Mis en avant</option>
                        <option value="no">Non mis en avant</option>
                    </select>
                </div>

                {selected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2.5 px-5 py-3 bg-[#fafafa] border-b border-[#ececec] text-sm">
                        <b className="font-semibold mr-2">{selected.length} produit{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</b>
                        <button type="button" disabled={busy} onClick={() => bulkUpdate({ featured: true })} className={buttonClass('secondary', 'sm')}>Mettre en avant</button>
                        <button type="button" disabled={busy} onClick={() => bulkUpdate({ featured: false })} className={buttonClass('secondary', 'sm')}>Retirer de la une</button>
                        <button type="button" disabled={busy} onClick={() => bulkUpdate({ is_active: true })} className={buttonClass('secondary', 'sm')}>Activer</button>
                        <button type="button" disabled={busy} onClick={() => bulkUpdate({ is_active: false })} className={buttonClass('secondary', 'sm')}>Désactiver</button>
                        <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className={`${buttonClass('secondary', 'sm')} text-[#b42318] border-[#f5c2c0] hover:bg-[#fdeaea]`}>Supprimer</button>
                        <button type="button" onClick={() => setSelected([])} className={`${buttonClass('ghost', 'sm')} ml-auto`}>Désélectionner</button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th scope="col" className={`${th} w-10`}>
                                    <Checkbox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} label="Sélectionner les produits de la page" />
                                </th>
                                <th scope="col" className={th}>Produit</th>
                                <th scope="col" className={th}>Catégorie</th>
                                <th scope="col" className={`${th} text-right`}>Prix</th>
                                <th scope="col" className={`${th} text-right`}>Variantes</th>
                                <th scope="col" className={`${th} text-right`}>Stock</th>
                                <th scope="col" className={th}>Statut</th>
                                <th scope="col" className={th}>Mis en avant</th>
                                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((product) => {
                                const image = product.image_path?.[0];
                                const stock = totalStock(product);
                                const onSale = product.pricing?.has_promotion;
                                return (
                                    <tr key={product.id} className="hover:bg-[#fafafa] cursor-pointer" onClick={() => navigate(`/dashboard/products/${product.id}`)}>
                                        <td className={td} onClick={(e) => e.stopPropagation()}>
                                            <Checkbox checked={selected.includes(product.id)} onChange={(c) => toggleOne(product.id, c)} label={`Sélectionner ${product.name}`} />
                                        </td>
                                        <td className={td}>
                                            <span className="flex items-center gap-3">
                                                {image ? (
                                                    <img src={resolveMediaUrl(image)} alt="" className="w-10 h-10 rounded-[3px] object-cover bg-[#f1f1f1] shrink-0" loading="lazy" />
                                                ) : (
                                                    <span className="w-10 h-10 rounded-[3px] bg-[#f1f1f1] shrink-0" aria-hidden="true" />
                                                )}
                                                <span className="min-w-0">
                                                    <b className="block font-medium text-[#111] truncate max-w-[260px]">{product.name}</b>
                                                    {(product.sku || product.is_new) && (
                                                        <small className="text-[12.5px] text-[#767676]">{[product.sku, product.is_new ? 'Nouveau' : null].filter(Boolean).join(' · ')}</small>
                                                    )}
                                                </span>
                                            </span>
                                        </td>
                                        <td className={`${td} text-[#6b6b6b]`}>{categoryName[product.category_id] ?? product.category?.name ?? '—'}</td>
                                        <td className={`${td} text-right tabular-nums whitespace-nowrap`}>
                                            {formatFCFA(product.price)}
                                            {onSale && <small className="block text-[12px] text-[#166534]">Promo en cours</small>}
                                        </td>
                                        <td className={`${td} text-right tabular-nums`}>{product.variants?.length ?? 0}</td>
                                        <td className={`${td} text-right tabular-nums ${stock === 0 ? 'text-[#b42318]' : stock <= 3 ? 'text-[#8a4b00]' : ''}`}>{stock}</td>
                                        <td className={td}><Badge tone={product.is_active ? 'success' : 'neutral'} dot>{product.is_active ? 'Actif' : 'Brouillon'}</Badge></td>
                                        <td className={td}>
                                            {product.featured
                                                ? <Badge><Star className="w-3 h-3" strokeWidth={1.8} aria-hidden="true" />Oui</Badge>
                                                : <span className="text-[#767676]">—</span>}
                                        </td>
                                        <td className={td}>
                                            <Link to={`/dashboard/products/${product.id}`} onClick={(e) => e.stopPropagation()} className="p-1.5 inline-flex rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]" aria-label={`Modifier ${product.name}`}>
                                                <Pencil className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {isLoading && pageItems.length === 0 && <SkeletonRows rows={8} cols={9} media />}
                            {!isLoading && pageItems.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#666]">
                                        {products.length ? 'Aucun produit ne correspond à ces filtres.' : 'Aucun produit. Ajoutez le premier.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={currentPage}
                    lastPage={lastPage}
                    total={filtered.length}
                    perPage={PER_PAGE}
                    onChange={setPage}
                    noun={filtered.length > 1 ? 'produits' : 'produit'}
                />
            </Panel>

            <ConfirmDialog
                open={confirmDelete}
                title="Supprimer les produits"
                message={`Supprimer définitivement ${selected.length} produit${selected.length > 1 ? 's' : ''} et leurs variantes ? Les commandes passées restent consultables.`}
                onConfirm={bulkDelete}
                onCancel={() => setConfirmDelete(false)}
                loading={busy}
            />
        </DashboardLayout>
    );
}
