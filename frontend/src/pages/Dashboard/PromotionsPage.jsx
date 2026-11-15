import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Info, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import {
    createAnnouncementBar,
    createPromotion,
    deleteAnnouncementBar,
    deletePromotion,
    getAllAnnouncementBars,
    getPromotions,
    reorderAnnouncementBars,
    updateAnnouncementBar,
    updatePromotion,
} from '../../services/catalog';
import { Badge, Drawer, Notice, PageHeader, Panel, SegmentedControl, Switch, Tip, SkeletonRows } from '../../components/admin/AdminUI';
import { buttonClass, fieldClass, formatFCFA, labelClass, td, th, variantLabel } from '../../components/admin/adminFormat';

const PROMO_STATUS = {
    active: { tone: 'success', label: 'Active' },
    scheduled: { tone: 'info', label: 'Programmée' },
    ended: { tone: 'neutral', label: 'Terminée' },
    inactive: { tone: 'warning', label: 'Désactivée' },
};

const BAR_STATUS = {
    displayed: { tone: 'success', label: 'Affiché' },
    scheduled: { tone: 'info', label: 'Programmé' },
    ended: { tone: 'neutral', label: 'Terminé' },
    inactive: { tone: 'neutral', label: 'Masqué' },
};

const FILTERS = [
    { value: 'all', label: 'Toutes' },
    { value: 'active', label: 'Actives' },
    { value: 'scheduled', label: 'Programmées' },
    { value: 'ended', label: 'Terminées' },
];

const EMPTY_PROMO = {
    id: null,
    name: '',
    discount_type: 'percentage',
    discount_value: '',
    target_type: 'category',
    category_id: '',
    product_ids: [],
    variant_ids: [],
    starts_at: '',
    ends_at: '',
    is_active: true,
    show_strikethrough: true,
    show_in_offers: true,
    create_bar: false,
};

const EMPTY_BAR = { id: null, message: '', link: '', starts_at: '', ends_at: '', is_active: true };

const firstError = (res, fallback) =>
    (res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null) || res?.error || fallback;

/** Date ISO → « AAAA-MM-JJ » local pour un input date. */
const toInputDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Début à 00:00, fin à 23:59:59 : la journée choisie est incluse. */
const startOfDay = (value) => (value ? `${value} 00:00:00` : null);
const endOfDay = (value) => (value ? `${value} 23:59:59` : null);

/** « 1 – 30 nov. 2026 », « Dès le 26 déc. 2026 », « Sans date de fin ». */
const periodLabel = (start, end) => {
    const fmt = (d, opts) => new Date(d).toLocaleDateString('fr-FR', opts);
    if (!start && !end) return 'Sans date de fin';
    if (start && !end) return `Dès le ${fmt(start, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (!start && end) return `Jusqu'au ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    const s = new Date(start);
    const e = new Date(end);
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
        return `${s.getDate()} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    const sameYear = s.getFullYear() === e.getFullYear();
    return `${fmt(start, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

const discountLabel = (promo) =>
    promo.discount_type === 'percentage'
        ? `Pourcentage · ${promo.discount_value} %`
        : `Montant fixe · ${formatFCFA(promo.discount_value)}`;

const targetLabel = (promo) => {
    if (promo.target_type === 'category') return promo.category ? `Catégorie ${promo.category.name}` : 'Catégorie supprimée';
    if (promo.target_type === 'products') {
        const n = promo.products?.length ?? 0;
        return n === 1 ? promo.products[0].name : `Sélection de ${n} produits`;
    }
    const variants = promo.variants ?? [];
    if (variants.length === 1) return `${variants[0].product?.name ?? 'Variante'} · ${variantLabel(variants[0].attributes)}`;
    return `${variants.length} variantes`;
};

/* ------------------------------------------------- Sélection produits/variantes */

function TargetPicker({ products, mode, selected, onChange }) {
    const [query, setQuery] = useState('');
    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products
            .filter((p) => (mode === 'variants' ? (p.variants?.length ?? 0) > 0 : true))
            .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
            .slice(0, 60);
    }, [products, mode, query]);

    const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

    return (
        <div className="border border-[#d9d9d9] rounded">
            <label className="flex items-center gap-2 px-3 h-10 border-b border-[#ececec] text-[#767676]">
                <Search className="w-4 h-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <span className="sr-only">Rechercher un produit</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit…" className="w-full bg-transparent text-[13.5px] text-[#111] outline-none" />
            </label>
            <ul className="max-h-60 overflow-y-auto py-1 text-[13.5px]">
                {list.map((product) => (
                    <li key={product.id}>
                        {mode === 'products' ? (
                            <label className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#fafafa] cursor-pointer">
                                <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} className="accent-[#111] w-4 h-4" />
                                <span className="truncate">{product.name}</span>
                            </label>
                        ) : (
                            <fieldset className="px-3 py-1.5">
                                <legend className="font-medium text-[#111] mb-1">{product.name}</legend>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {product.variants.map((variant) => (
                                        <label key={variant.id} className="flex items-center gap-2 cursor-pointer text-[#444]">
                                            <input type="checkbox" checked={selected.includes(variant.id)} onChange={() => toggle(variant.id)} className="accent-[#111] w-4 h-4" />
                                            {variantLabel(variant.attributes) || `Variante ${variant.id}`}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                    </li>
                ))}
                {list.length === 0 && <li className="px-3 py-3 text-[#767676]">Aucun produit.</li>}
            </ul>
        </div>
    );
}

/* ----------------------------------------------------------- Formulaire promo */

function PromotionEditor({ form, setForm, categories, products, onSave, onCancel, onToggleActive, saving, error, status }) {
    const matching = useMemo(() => {
        if (form.target_type !== 'category' || !form.category_id) return [];
        const id = Number(form.category_id);
        const ids = new Set([id, ...categories.filter((c) => c.parent_id === id).map((c) => c.id)]);
        return products.filter((p) => ids.has(p.category_id));
    }, [form.target_type, form.category_id, categories, products]);

    const parents = categories.filter((c) => !c.parent_id);

    return (
        <Panel
            className="xl:sticky xl:top-0"
            title={form.id ? `Modifier « ${form.name || '…'} »` : 'Nouvelle promotion'}
            action={status && <Badge tone={PROMO_STATUS[status]?.tone} dot>{PROMO_STATUS[status]?.label}</Badge>}
        >
            <form onSubmit={onSave} className="p-5 grid gap-4">
                <Notice>{error}</Notice>
                <div>
                    <label htmlFor="promo-name" className={labelClass}>Nom interne</label>
                    <input id="promo-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Bijoux −20 %" className={`${fieldClass} w-full`} />
                </div>
                <div>
                    <span className={labelClass}>Type de remise</span>
                    <SegmentedControl
                        label="Type de remise"
                        value={form.discount_type}
                        onChange={(v) => setForm({ ...form, discount_type: v })}
                        options={[{ value: 'percentage', label: 'Pourcentage' }, { value: 'fixed', label: 'Montant fixe' }]}
                    />
                </div>
                <div>
                    <label htmlFor="promo-value" className={labelClass}>Valeur {form.discount_type === 'percentage' ? '(%)' : '(FCFA)'}</label>
                    <input
                        id="promo-value"
                        type="number"
                        min={1}
                        max={form.discount_type === 'percentage' ? 90 : undefined}
                        value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                        className={`${fieldClass} w-full`}
                    />
                </div>
                <div>
                    <label htmlFor="promo-target" className={labelClass}>S'applique à</label>
                    <select id="promo-target" value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })} className={`${fieldClass} w-full`}>
                        <option value="category">Une catégorie</option>
                        <option value="products">Des produits choisis</option>
                        <option value="variants">Une variante (taille, finition…)</option>
                    </select>
                </div>

                {form.target_type === 'category' && (
                    <div>
                        <label htmlFor="promo-category" className={labelClass}>Catégorie</label>
                        <select id="promo-category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={`${fieldClass} w-full`}>
                            <option value="">Choisir…</option>
                            {parents.map((parent) => (
                                <optgroup key={parent.id} label={parent.name}>
                                    <option value={parent.id}>{parent.name} (avec ses sous-catégories)</option>
                                    {categories.filter((c) => c.parent_id === parent.id).map((child) => (
                                        <option key={child.id} value={child.id}>{child.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {form.category_id && (
                            <p className="mt-1.5 text-[12.5px] text-[#666]">
                                {matching.length} produit{matching.length > 1 ? 's' : ''} concerné{matching.length > 1 ? 's' : ''}
                                {matching.length > 0 && ` : ${matching.slice(0, 3).map((p) => p.name).join(', ')}${matching.length > 3 ? '…' : ''}`}
                            </p>
                        )}
                    </div>
                )}
                {form.target_type === 'products' && (
                    <TargetPicker products={products} mode="products" selected={form.product_ids} onChange={(ids) => setForm({ ...form, product_ids: ids })} />
                )}
                {form.target_type === 'variants' && (
                    <TargetPicker products={products} mode="variants" selected={form.variant_ids} onChange={(ids) => setForm({ ...form, variant_ids: ids })} />
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="promo-start" className={labelClass}>Début</label>
                        <input id="promo-start" type="date" value={form.starts_at} max={form.ends_at || undefined} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={`${fieldClass} w-full px-2.5`} />
                    </div>
                    <div>
                        <label htmlFor="promo-end" className={labelClass}>Fin</label>
                        <input id="promo-end" type="date" value={form.ends_at} min={form.starts_at || undefined} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={`${fieldClass} w-full px-2.5`} />
                    </div>
                </div>

                <div className="grid gap-3">
                    <Switch showLabel label="Afficher le prix barré" checked={form.show_strikethrough} onChange={(v) => setForm({ ...form, show_strikethrough: v })} />
                    <Switch showLabel label="Afficher dans la page Offres" checked={form.show_in_offers} onChange={(v) => setForm({ ...form, show_in_offers: v })} />
                    {!form.id && <Switch showLabel label="Créer un bandeau d'annonce" checked={form.create_bar} onChange={(v) => setForm({ ...form, create_bar: v })} />}
                </div>

                <Tip icon={Info}>La remise est indiquée dans le message WhatsApp envoyé avec la commande, pour que l'équipe valide le bon montant.</Tip>

                <div className="flex flex-wrap justify-end gap-2.5">
                    {form.id ? (
                        <button type="button" onClick={onToggleActive} disabled={saving} className={buttonClass('secondary')}>{form.is_active ? 'Désactiver' : 'Réactiver'}</button>
                    ) : (
                        <button type="button" onClick={onCancel} className={buttonClass('secondary')}>Annuler</button>
                    )}
                    <button type="submit" disabled={saving} className={buttonClass('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
            </form>
        </Panel>
    );
}

/* --------------------------------------------------------------------- Page */

export default function PromotionsPage() {
    const { categories, products } = useDashboardData();

    const [promotions, setPromotions] = useState([]);
    const [counts, setCounts] = useState(null);
    const [bars, setBars] = useState([]);
    // Filtre dont la liste affichée provient : tant qu'il diffère du filtre choisi, on charge.
    const [loadedFilter, setLoadedFilter] = useState(null);
    const [barsLoaded, setBarsLoaded] = useState(false);
    const promotionsLoading = loadedFilter !== filter;
    const [filter, setFilter] = useState('all');
    const [pageError, setPageError] = useState(null);

    const [form, setForm] = useState(EMPTY_PROMO);
    const [formStatus, setFormStatus] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    const [barForm, setBarForm] = useState(null);
    const [barSaving, setBarSaving] = useState(false);
    const [barError, setBarError] = useState(null);

    const [toDelete, setToDelete] = useState(null); // { kind: 'promo'|'bar', item }
    const [deleting, setDeleting] = useState(false);

    const loadPromotions = useCallback(async (status) => {
        const res = await getPromotions(status === 'all' ? null : status);
        if (res?.success) {
            setPromotions(res.data?.promotions ?? []);
            setCounts(res.data?.counts ?? null);
        } else {
            setPageError(res?.error || 'Impossible de charger les promotions.');
        }
    }, []);

    const loadBars = useCallback(async () => {
        const res = await getAllAnnouncementBars();
        if (res?.success) setBars(res.data ?? []);
    }, []);

    useEffect(() => {
        let cancelled = false;
        getPromotions(filter === 'all' ? null : filter).then((res) => {
            if (cancelled) return;
            setLoadedFilter(filter);
            if (res?.success) {
                setPromotions(res.data?.promotions ?? []);
                setCounts(res.data?.counts ?? null);
            } else {
                setPageError(res?.error || 'Impossible de charger les promotions.');
            }
        });
        return () => { cancelled = true; };
    }, [filter]);

    useEffect(() => {
        let cancelled = false;
        getAllAnnouncementBars().then((res) => {
            if (cancelled) return;
            setBarsLoaded(true);
            if (res?.success) setBars(res.data ?? []);
        });
        return () => { cancelled = true; };
    }, []);

    const editPromotion = (promo) => {
        setFormError(null);
        setFormStatus(promo.status);
        setForm({
            id: promo.id,
            name: promo.name,
            discount_type: promo.discount_type,
            discount_value: String(promo.discount_value),
            target_type: promo.target_type,
            category_id: promo.category_id ? String(promo.category_id) : '',
            product_ids: (promo.products ?? []).map((p) => p.id),
            variant_ids: (promo.variants ?? []).map((v) => v.id),
            starts_at: toInputDate(promo.starts_at),
            ends_at: toInputDate(promo.ends_at),
            is_active: promo.is_active,
            show_strikethrough: promo.show_strikethrough,
            show_in_offers: promo.show_in_offers,
            create_bar: false,
        });
    };

    const newPromotion = () => { setForm(EMPTY_PROMO); setFormStatus(null); setFormError(null); };

    const payloadFrom = (values) => ({
        name: values.name.trim(),
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value),
        target_type: values.target_type,
        category_id: values.target_type === 'category' ? Number(values.category_id) || null : null,
        product_ids: values.target_type === 'products' ? values.product_ids : [],
        variant_ids: values.target_type === 'variants' ? values.variant_ids : [],
        starts_at: startOfDay(values.starts_at),
        ends_at: endOfDay(values.ends_at),
        is_active: values.is_active,
        show_strikethrough: values.show_strikethrough,
        show_in_offers: values.show_in_offers,
    });

    const savePromotion = async (event, override = {}) => {
        event?.preventDefault();
        const values = { ...form, ...override };
        if (!values.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        if (!Number(values.discount_value)) { setFormError('Indiquez la valeur de la remise.'); return; }

        setSaving(true);
        setFormError(null);
        const res = values.id ? await updatePromotion(values.id, payloadFrom(values)) : await createPromotion(payloadFrom(values));
        if (!res?.success) {
            setSaving(false);
            setFormError(firstError(res, "L'enregistrement a échoué."));
            return;
        }

        if (!values.id && values.create_bar) {
            const value = values.discount_type === 'percentage' ? `−${values.discount_value} %` : `−${formatFCFA(values.discount_value)}`;
            const category = categories.find((c) => String(c.id) === String(values.category_id));
            const until = values.ends_at ? ` jusqu'au ${new Date(values.ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '';
            await createAnnouncementBar({
                message: `${value}${category ? ` sur ${category.name.toLowerCase()}` : ''}${until}`.slice(0, 255),
                link: '/offres',
                starts_at: startOfDay(values.starts_at),
                ends_at: endOfDay(values.ends_at),
                is_active: true,
            });
            await loadBars();
        }

        setSaving(false);
        editPromotion(res.data);
        await loadPromotions(filter);
    };

    const toggleBar = async (bar, value) => {
        setBars((prev) => prev.map((b) => (b.id === bar.id ? { ...b, is_active: value } : b)));
        const res = await updateAnnouncementBar(bar.id, { is_active: value });
        if (!res?.success) setPageError(firstError(res, 'La modification a échoué.'));
        await loadBars();
    };

    const moveBar = async (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= bars.length) return;
        const reordered = [...bars];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        setBars(reordered);
        const res = await reorderAnnouncementBars(reordered.map((b) => b.id));
        if (!res?.success) { setPageError(firstError(res, "L'ordre n'a pas pu être enregistré.")); await loadBars(); }
    };

    const saveBar = async () => {
        if (!barForm.message.trim()) { setBarError('Le message est obligatoire.'); return; }
        setBarSaving(true);
        setBarError(null);
        const payload = {
            message: barForm.message.trim(),
            link: barForm.link.trim() || null,
            starts_at: startOfDay(barForm.starts_at),
            ends_at: endOfDay(barForm.ends_at),
            is_active: barForm.is_active,
        };
        const res = barForm.id ? await updateAnnouncementBar(barForm.id, payload) : await createAnnouncementBar(payload);
        setBarSaving(false);
        if (!res?.success) { setBarError(firstError(res, "L'enregistrement a échoué.")); return; }
        setBarForm(null);
        await loadBars();
    };

    const confirmDelete = async () => {
        setDeleting(true);
        const res = toDelete.kind === 'promo' ? await deletePromotion(toDelete.item.id) : await deleteAnnouncementBar(toDelete.item.id);
        setDeleting(false);
        if (!res?.success) setPageError(firstError(res, 'La suppression a échoué.'));
        if (toDelete.kind === 'promo') {
            if (form.id === toDelete.item.id) newPromotion();
            await loadPromotions(filter);
        } else {
            await loadBars();
        }
        setToDelete(null);
    };

    const shownBars = bars.filter((b) => b.status === 'displayed').length;
    const subtitle = counts
        ? `${counts.active} promotion${counts.active > 1 ? 's' : ''} active${counts.active > 1 ? 's' : ''} · ${counts.scheduled} programmée${counts.scheduled > 1 ? 's' : ''} · ${shownBars} bandeau${shownBars > 1 ? 'x' : ''} affiché${shownBars > 1 ? 's' : ''}`
        : ' ';

    return (
        <DashboardLayout>
            <PageHeader
                title="Promotions et bandeaux"
                subtitle={subtitle}
                actions={
                    <>
                        <button type="button" onClick={() => { setBarError(null); setBarForm(EMPTY_BAR); }} className={buttonClass('secondary')}>
                            <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                            Nouveau bandeau
                        </button>
                        <button type="button" onClick={newPromotion} className={buttonClass('primary')}>
                            <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                            Nouvelle promotion
                        </button>
                    </>
                }
            />

            {pageError && <div className="mb-4"><Notice>{pageError}</Notice></div>}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
                <div className="space-y-5 min-w-0">
                    <Panel title="Promotions" action={<SegmentedControl label="Filtrer les promotions" options={FILTERS} value={filter} onChange={setFilter} />}>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th scope="col" className={th}>Promotion</th>
                                        <th scope="col" className={th}>S'applique à</th>
                                        <th scope="col" className={th}>Période</th>
                                        <th scope="col" className={th}>Statut</th>
                                        <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.map((promo) => (
                                        <tr key={promo.id} onClick={() => editPromotion(promo)} className={`cursor-pointer ${form.id === promo.id ? 'bg-[#fafafa]' : 'hover:bg-[#fafafa]'}`}>
                                            <td className={td}>
                                                <span className="font-medium text-[#111]">{promo.name}</span>
                                                <small className="block text-[12.5px] text-[#767676] mt-0.5">{discountLabel(promo)}</small>
                                            </td>
                                            <td className={`${td} max-w-[220px] truncate`}>{targetLabel(promo)}</td>
                                            <td className={`${td} whitespace-nowrap text-[#444]`}>{periodLabel(promo.starts_at, promo.ends_at)}</td>
                                            <td className={td}><Badge tone={PROMO_STATUS[promo.status]?.tone} dot>{PROMO_STATUS[promo.status]?.label ?? promo.status}</Badge></td>
                                            <td className={td}>
                                                <div className="flex justify-end gap-1">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); editPromotion(promo); }} className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]" aria-label={`Modifier ${promo.name}`}>
                                                        <Pencil className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                    </button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setToDelete({ kind: 'promo', item: promo }); }} className="p-1.5 rounded text-[#666] hover:text-[#b42318] hover:bg-[#fdeaea]" aria-label={`Supprimer ${promo.name}`}>
                                                        <Trash2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {promotionsLoading && promotions.length === 0 && <SkeletonRows rows={4} cols={5} />}
                                    {!promotionsLoading && promotions.length === 0 && (
                                        <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[#666]">Aucune promotion dans cette liste.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    <Panel title="Bandeaux d'annonce" action={<span className="text-[13px] text-[#6b6b6b] hidden sm:inline">Affichés à tour de rôle en haut du site</span>}>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th scope="col" className={th}><span className="sr-only">Ordre</span></th>
                                        <th scope="col" className={th}>Message</th>
                                        <th scope="col" className={th}>Lien</th>
                                        <th scope="col" className={th}>Période</th>
                                        <th scope="col" className={th}>Statut</th>
                                        <th scope="col" className={th}>Actif</th>
                                        <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bars.map((bar, index) => (
                                        <tr key={bar.id} className="hover:bg-[#fafafa]">
                                            <td className={`${td} w-10`}>
                                                <span className="inline-flex flex-col">
                                                    <button type="button" onClick={() => moveBar(index, -1)} disabled={index === 0} className="p-0.5 text-[#999] hover:text-[#111] disabled:opacity-30" aria-label="Monter le bandeau">
                                                        <ArrowUp className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                                                    </button>
                                                    <button type="button" onClick={() => moveBar(index, 1)} disabled={index === bars.length - 1} className="p-0.5 text-[#999] hover:text-[#111] disabled:opacity-30" aria-label="Descendre le bandeau">
                                                        <ArrowDown className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                                                    </button>
                                                </span>
                                            </td>
                                            <td className={`${td} max-w-[260px]`}><span className="block truncate">{bar.message}</span></td>
                                            <td className={`${td} text-[#6b6b6b]`}>{bar.link || '—'}</td>
                                            <td className={`${td} whitespace-nowrap text-[#444]`}>{bar.starts_at || bar.ends_at ? periodLabel(bar.starts_at, bar.ends_at) : 'Permanent'}</td>
                                            <td className={td}><Badge tone={BAR_STATUS[bar.status]?.tone} dot>{BAR_STATUS[bar.status]?.label ?? bar.status}</Badge></td>
                                            <td className={td}><Switch label={`Activer « ${bar.message} »`} checked={bar.is_active} onChange={(v) => toggleBar(bar, v)} /></td>
                                            <td className={td}>
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setBarError(null); setBarForm({ id: bar.id, message: bar.message, link: bar.link ?? '', starts_at: toInputDate(bar.starts_at), ends_at: toInputDate(bar.ends_at), is_active: bar.is_active }); }}
                                                        className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]"
                                                        aria-label="Modifier le bandeau"
                                                    >
                                                        <Pencil className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                    </button>
                                                    <button type="button" onClick={() => setToDelete({ kind: 'bar', item: bar })} className="p-1.5 rounded text-[#666] hover:text-[#b42318] hover:bg-[#fdeaea]" aria-label="Supprimer le bandeau">
                                                        <Trash2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!barsLoaded && <SkeletonRows rows={2} cols={7} />}
                                    {barsLoaded && bars.length === 0 && (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[#666]">Aucun bandeau.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>

                <PromotionEditor
                    form={form}
                    setForm={setForm}
                    categories={categories}
                    products={products}
                    status={formStatus}
                    saving={saving}
                    error={formError}
                    onSave={savePromotion}
                    onCancel={newPromotion}
                    onToggleActive={() => savePromotion(null, { is_active: !form.is_active })}
                />
            </div>

            <Drawer
                open={Boolean(barForm)}
                onClose={() => setBarForm(null)}
                title={barForm?.id ? 'Modifier le bandeau' : 'Nouveau bandeau'}
                footer={
                    <div className="flex justify-end gap-2.5">
                        <button type="button" onClick={() => setBarForm(null)} className={buttonClass('secondary')}>Annuler</button>
                        <button type="button" onClick={saveBar} disabled={barSaving} className={buttonClass('primary')}>{barSaving ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                }
            >
                {barForm && (
                    <div className="space-y-5">
                        <Notice>{barError}</Notice>
                        <div>
                            <label htmlFor="bar-message" className={labelClass}>Message</label>
                            <input id="bar-message" maxLength={255} value={barForm.message} onChange={(e) => setBarForm({ ...barForm, message: e.target.value })} placeholder="Ex. Expédition sous 24 h, Abidjan et intérieur" className={`${fieldClass} w-full`} />
                        </div>
                        <div>
                            <label htmlFor="bar-link" className={labelClass}>Lien <span className="font-normal text-[#767676]">(facultatif)</span></label>
                            <input id="bar-link" value={barForm.link} onChange={(e) => setBarForm({ ...barForm, link: e.target.value })} placeholder="/offres" className={`${fieldClass} w-full`} />
                            <p className="mt-1.5 text-[12.5px] text-[#666]">Une page du site (« /offres ») ou une adresse en https://.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="bar-start" className={labelClass}>Début</label>
                                <input id="bar-start" type="date" value={barForm.starts_at} onChange={(e) => setBarForm({ ...barForm, starts_at: e.target.value })} className={`${fieldClass} w-full`} />
                            </div>
                            <div>
                                <label htmlFor="bar-end" className={labelClass}>Fin</label>
                                <input id="bar-end" type="date" value={barForm.ends_at} min={barForm.starts_at || undefined} onChange={(e) => setBarForm({ ...barForm, ends_at: e.target.value })} className={`${fieldClass} w-full`} />
                            </div>
                        </div>
                        <p className="-mt-2 text-[12.5px] text-[#666]">Sans dates, le bandeau est permanent.</p>
                        <Switch showLabel label="Actif" checked={barForm.is_active} onChange={(v) => setBarForm({ ...barForm, is_active: v })} />
                    </div>
                )}
            </Drawer>

            <ConfirmDialog
                open={Boolean(toDelete)}
                title={toDelete?.kind === 'promo' ? 'Supprimer la promotion' : 'Supprimer le bandeau'}
                message={toDelete?.kind === 'promo'
                    ? `Supprimer « ${toDelete.item.name} » ? Les commandes déjà passées gardent leur remise.`
                    : 'Supprimer ce bandeau ?'}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
                loading={deleting}
            />
        </DashboardLayout>
    );
}
