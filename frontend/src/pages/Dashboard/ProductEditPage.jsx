import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ExternalLink, ImagePlus, Plus, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { createProduct, getProductById, updateProduct } from '../../services/product';
import { getProductTypes } from '../../services/catalog';
import { resolveMediaUrl } from '../../config/env';
import { Badge, Notice, Panel, Switch } from '../../components/admin/AdminUI';
import { buttonClass, fieldClass, labelClass, td, th, variantLabel } from '../../components/admin/adminFormat';

const EMPTY = {
    name: '',
    category_id: '',
    price: '',
    sku: '',
    description: '',
    stock: '0',
    is_active: false,
    featured: false,
    is_new: true,
    specs: [],
};

/** Clé d'une combinaison de valeurs, dans l'ordre des attributs du type. */
const comboKey = (attributes, slugs) => slugs.map((slug) => attributes?.[slug] ?? '').join('\u0001');

/** Produit cartésien : [[a,b],[1,2]] → [[a,1],[a,2],[b,1],[b,2]]. */
const cartesian = (lists) => lists.reduce((acc, list) => acc.flatMap((prefix) => list.map((value) => [...prefix, value])), [[]]);

const firstError = (res, fallback) =>
    (res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null) || res?.error || fallback;

export default function ProductEditPage() {
    const { id } = useParams();
    const isNew = !id;
    const navigate = useNavigate();
    const { categories, setProducts } = useDashboardData();

    const [types, setTypes] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [product, setProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(!isNew);

    // Valeurs cochées par attribut : { finition: ['Doré', 'Argenté'], longueur: [...] }
    const [selectedValues, setSelectedValues] = useState({});
    // Lignes de variantes éditées, indexées par combinaison
    const [rows, setRows] = useState({});
    // Variantes existantes hors type (catégorie sans type, données anciennes)
    const [legacyVariants, setLegacyVariants] = useState([]);

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]); // [{ file, url }]

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        getProductTypes().then((res) => { if (res?.success) setTypes(res.data ?? []); });
    }, []);

    // Chargement du produit à modifier
    useEffect(() => {
        if (isNew) return undefined;
        let cancelled = false;
        getProductById(id).then((res) => {
            if (cancelled) return;
            if (!res?.success) { setError('Produit introuvable.'); setLoadingProduct(false); return; }
            const p = res.data;
            setProduct(p);
            setForm({
                name: p.name ?? '',
                category_id: p.category_id ? String(p.category_id) : '',
                price: String(p.price ?? ''),
                sku: p.sku ?? '',
                description: p.description ?? '',
                stock: String(p.stock ?? 0),
                is_active: Boolean(p.is_active),
                featured: Boolean(p.featured),
                is_new: Boolean(p.is_new),
                specs: Array.isArray(p.specs) ? p.specs : [],
            });
            setExistingImages(p.image_path ?? []);
            setLoadingProduct(false);
        });
        return () => { cancelled = true; };
    }, [id, isNew]);

    // Type effectif : celui de la catégorie, sinon celui de son parent.
    const category = categories.find((c) => String(c.id) === String(form.category_id));
    const parentCategory = category?.parent_id ? categories.find((c) => c.id === category.parent_id) : null;
    const typeId = category?.product_type_id ?? parentCategory?.product_type_id ?? null;
    const type = types.find((t) => t.id === typeId) ?? null;
    const typeAttributes = useMemo(() => type?.variation_attributes ?? [], [type]);
    const slugs = useMemo(() => typeAttributes.map((a) => a.slug), [typeAttributes]);

    // À l'arrivée du produit (et de son type), on reconstruit options et lignes depuis ses variantes.
    const [hydratedFor, setHydratedFor] = useState(null);
    const hydrateKey = product && types.length ? `${product.id}-${typeId ?? 'none'}` : null;
    if (hydrateKey && hydratedFor !== hydrateKey) {
        setHydratedFor(hydrateKey);
        const variants = product.variants ?? [];
        if (typeAttributes.length && variants.every((v) => Object.keys(v.attributes ?? {}).every((k) => slugs.includes(k)))) {
            const picked = {};
            const nextRows = {};
            typeAttributes.forEach((a) => { picked[a.slug] = []; });
            variants.forEach((v) => {
                typeAttributes.forEach((a) => {
                    const value = v.attributes?.[a.slug];
                    if (value && !picked[a.slug].includes(value)) picked[a.slug].push(value);
                });
                nextRows[comboKey(v.attributes, slugs)] = {
                    id: v.id,
                    sku: v.sku ?? '',
                    price: v.price != null ? String(v.price) : '',
                    stock: String(v.stock ?? 0),
                    is_active: v.is_active !== false,
                    image_path: v.image_path ?? null,
                    imageFile: null,
                };
            });
            setSelectedValues(picked);
            setRows(nextRows);
            setLegacyVariants([]);
        } else {
            setSelectedValues({});
            setRows({});
            setLegacyVariants(variants.map((v) => ({
                id: v.id,
                attributes: v.attributes ?? {},
                sku: v.sku ?? '',
                price: v.price != null ? String(v.price) : '',
                stock: String(v.stock ?? 0),
                is_active: v.is_active !== false,
                image_path: v.image_path ?? null,
                imageFile: null,
            })));
        }
    }

    // Combinaisons générées à partir des valeurs cochées (ordre des valeurs de l'attribut)
    const combos = useMemo(() => {
        if (!typeAttributes.length) return [];
        const lists = typeAttributes.map((a) => a.values.map((v) => v.value).filter((v) => (selectedValues[a.slug] ?? []).includes(v)));
        if (lists.some((list) => list.length === 0)) return [];
        return cartesian(lists).map((values) => Object.fromEntries(values.map((value, i) => [slugs[i], value])));
    }, [typeAttributes, selectedValues, slugs]);

    const usesVariants = combos.length > 0 || legacyVariants.length > 0;

    const rowFor = (attributes) => rows[comboKey(attributes, slugs)] ?? { id: null, sku: '', price: '', stock: '0', is_active: true, image_path: null, imageFile: null };
    const setRow = (attributes, patch) => {
        const key = comboKey(attributes, slugs);
        setRows((prev) => ({ ...prev, [key]: { ...rowFor(attributes), ...prev[key], ...patch } }));
    };

    const toggleValue = (slug, value) => {
        setSelectedValues((prev) => {
            const current = prev[slug] ?? [];
            return { ...prev, [slug]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
        });
    };

    const changeCategory = (value) => {
        setForm((prev) => ({ ...prev, category_id: value }));
        setSelectedValues({});
        setRows({});
    };

    const addImages = (files) => {
        const list = Array.from(files ?? []).map((file) => ({ file, url: URL.createObjectURL(file) }));
        setNewImages((prev) => [...prev, ...list]);
    };

    const groupedCategories = useMemo(() => {
        const parents = categories.filter((c) => !c.parent_id).sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0));
        return parents.map((parent) => ({
            parent,
            children: categories.filter((c) => c.parent_id === parent.id).sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0)),
        }));
    }, [categories]);

    const save = async (publish) => {
        setError(null);
        setSuccess(null);
        if (!form.name.trim()) return setError('Le nom du produit est obligatoire.');
        if (!form.category_id) return setError('Choisissez une catégorie.');
        if (form.price === '' || Number(form.price) < 0) return setError('Indiquez le prix de base.');
        if (!form.description.trim()) return setError('La description est obligatoire.');

        const isActive = publish ?? form.is_active;
        const basePrice = parseInt(form.price, 10);
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('category_id', form.category_id);
        fd.append('price', basePrice);
        fd.append('sku', form.sku.trim());
        fd.append('description', form.description.trim());
        fd.append('is_active', isActive ? '1' : '0');
        fd.append('featured', form.featured ? '1' : '0');
        fd.append('is_new', form.is_new ? '1' : '0');
        form.specs.filter((s) => s.label.trim() && s.value.trim()).forEach((spec, i) => {
            fd.append(`specs[${i}][label]`, spec.label.trim());
            fd.append(`specs[${i}][value]`, spec.value.trim());
        });

        // Photos : galerie finale = conservées + nouvelles
        existingImages.forEach((url) => fd.append('existing_images[]', url));
        newImages.forEach(({ file }) => fd.append('image_path[]', file));
        if (!isNew) fd.append('sync_images', '1');

        // Variantes : un prix égal au prix de base est envoyé vide (il suit alors le prix de base)
        const variantRows = combos.length
            ? combos.map((attributes) => ({ attributes, ...rowFor(attributes) }))
            : legacyVariants;

        if (variantRows.length) {
            variantRows.forEach((row, i) => {
                if (row.id) fd.append(`variants[${i}][id]`, row.id);
                Object.entries(row.attributes).forEach(([slug, value]) => fd.append(`variants[${i}][attributes][${slug}]`, value));
                fd.append(`variants[${i}][sku]`, row.sku.trim());
                const price = row.price === '' ? null : parseInt(row.price, 10);
                fd.append(`variants[${i}][price]`, price === null || price === basePrice ? '' : price);
                fd.append(`variants[${i}][stock]`, parseInt(row.stock || '0', 10));
                fd.append(`variants[${i}][is_active]`, row.is_active ? '1' : '0');
                if (row.imageFile) fd.append(`variants[${i}][image]`, row.imageFile);
            });
        } else {
            fd.append('stock', parseInt(form.stock || '0', 10));
            if (!isNew && (product?.variants?.length ?? 0) > 0) fd.append('clear_variants', '1');
        }

        setSaving(true);
        const res = isNew ? await createProduct(fd) : await updateProduct(product.id, fd);
        setSaving(false);
        if (!res?.success) return setError(firstError(res, "L'enregistrement a échoué."));

        const saved = res.data;
        setProducts((prev) => (isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p))));
        if (isNew) {
            navigate(`/dashboard/products/${saved.id}`, { replace: true });
        } else {
            setProduct(saved);
            setHydratedFor(null); // reconstruit les lignes avec les identifiants des nouvelles variantes
            setForm((prev) => ({ ...prev, is_active: Boolean(saved.is_active) }));
            setExistingImages(saved.image_path ?? []);
            setNewImages([]);
            setSuccess(isActive ? 'Produit enregistré et publié.' : 'Brouillon enregistré.');
        }
        return undefined;
    };

    const title = form.name.trim() || (isNew ? 'Nouveau produit' : 'Produit');
    // Cellules resserrées pour le tableau des variantes (7 colonnes dans la largeur du panneau)
    const cth = th.replace('px-5', 'px-3');
    const ctd = td.replace('px-5', 'px-3').replace('py-[13px]', 'py-2.5');
    const statusLine = form.is_active ? 'Publié sur la boutique' : 'Brouillon · non publié';

    if (loadingProduct) {
        return <DashboardLayout><p className="text-sm text-[#666]">Chargement du produit…</p></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <nav className="text-[13px] text-[#666] mb-3" aria-label="Fil d'Ariane">
                <Link to="/dashboard/products" className="hover:underline">Produits</Link> / <b className="font-medium text-[#111]">{isNew ? 'Nouveau produit' : 'Modifier'}</b>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111] truncate">{title}</h1>
                    <p className="mt-1 text-sm text-[#666]">{statusLine}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <Link to="/dashboard/products" className={buttonClass('secondary')}>Annuler</Link>
                    <button type="button" disabled={saving} onClick={() => save(false)} className={buttonClass('secondary')}>
                        {form.is_active ? 'Repasser en brouillon' : 'Enregistrer le brouillon'}
                    </button>
                    <button type="button" disabled={saving} onClick={() => save(true)} className={buttonClass('primary')}>
                        {saving ? 'Enregistrement…' : form.is_active ? 'Enregistrer' : 'Publier'}
                    </button>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <Notice>{error}</Notice>
                <Notice tone="success">{success}</Notice>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-5 items-start">
                <div className="space-y-5 min-w-0">
                    <Panel title="Informations">
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="p-name" className={labelClass}>Nom du produit</label>
                                <input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${fieldClass} w-full`} />
                            </div>
                            <div>
                                <label htmlFor="p-category" className={labelClass}>Catégorie</label>
                                <select id="p-category" value={form.category_id} onChange={(e) => changeCategory(e.target.value)} className={`${fieldClass} w-full`}>
                                    <option value="">Choisir…</option>
                                    {groupedCategories.map(({ parent, children }) => (
                                        children.length ? (
                                            <optgroup key={parent.id} label={parent.name}>
                                                <option value={parent.id}>{parent.name}</option>
                                                {children.map((child) => <option key={child.id} value={child.id}>{parent.name} › {child.name}</option>)}
                                            </optgroup>
                                        ) : (
                                            <option key={parent.id} value={parent.id}>{parent.name}</option>
                                        )
                                    ))}
                                </select>
                            </div>
                            <div>
                                <span className={labelClass}>Type de produit</span>
                                <div className="h-10 flex items-center gap-2.5">
                                    {type ? <Badge>{type.name}</Badge> : <Badge tone="warning">Aucun</Badge>}
                                    <span className="text-[12.5px] text-[#6b6b6b]">{type ? 'défini par la catégorie' : <Link to="/dashboard/categories" className="underline">à définir dans Catégories</Link>}</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="p-price" className={labelClass}>Prix de base (FCFA)</label>
                                <input id="p-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`${fieldClass} w-full tabular-nums`} />
                            </div>
                            <div>
                                <label htmlFor="p-sku" className={labelClass}>Référence <span className="font-normal text-[#767676]">(facultatif)</span></label>
                                <input id="p-sku" value={form.sku} maxLength={64} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ex. MK-COL-001" className={`${fieldClass} w-full`} />
                            </div>
                            {!usesVariants && (
                                <div>
                                    <label htmlFor="p-stock" className={labelClass}>Stock</label>
                                    <input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={`${fieldClass} w-full tabular-nums`} />
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <label htmlFor="p-description" className={labelClass}>Description</label>
                                <textarea id="p-description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez le produit…" className={`${fieldClass} w-full h-auto py-2.5 resize-y`} />
                            </div>
                            <fieldset className="sm:col-span-2">
                                <legend className={labelClass}>Fiche technique <span className="font-normal text-[#767676]">(matière, coupe, fabrication…)</span></legend>
                                <ul className="space-y-2">
                                    {form.specs.map((spec, index) => (
                                        <li key={index} className="flex gap-2">
                                            <input value={spec.label} aria-label={`Caractéristique ${index + 1}`} placeholder="Matière" onChange={(e) => setForm({ ...form, specs: form.specs.map((s, i) => (i === index ? { ...s, label: e.target.value } : s)) })} className={`${fieldClass} w-40 shrink-0`} />
                                            <input value={spec.value} aria-label={`Valeur ${index + 1}`} placeholder="Wax 100 % coton" onChange={(e) => setForm({ ...form, specs: form.specs.map((s, i) => (i === index ? { ...s, value: e.target.value } : s)) })} className={`${fieldClass} flex-1 min-w-0`} />
                                            <button type="button" onClick={() => setForm({ ...form, specs: form.specs.filter((_, i) => i !== index) })} className="p-2 text-[#666] hover:text-[#b42318]" aria-label="Retirer la ligne">
                                                <X className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button type="button" onClick={() => setForm({ ...form, specs: [...form.specs, { label: '', value: '' }] })} className={`${buttonClass('secondary', 'sm')} mt-2`}>
                                    <Plus className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
                                    Ajouter une ligne
                                </button>
                            </fieldset>
                        </div>
                    </Panel>

                    {typeAttributes.length > 0 && legacyVariants.length === 0 && (
                        <Panel title="Options du produit" action={<span className="text-[13px] text-[#6b6b6b]">Proposées selon le type « {type.name} »</span>}>
                            <div className="p-5 space-y-5">
                                {typeAttributes.map((attribute) => (
                                    <fieldset key={attribute.id}>
                                        <legend className={labelClass}>{attribute.name}</legend>
                                        <div className="flex flex-wrap">
                                            {attribute.values.map((value) => {
                                                const on = (selectedValues[attribute.slug] ?? []).includes(value.value);
                                                return (
                                                    <button
                                                        key={value.id}
                                                        type="button"
                                                        aria-pressed={on}
                                                        onClick={() => toggleValue(attribute.slug, value.value)}
                                                        className={`inline-flex items-center gap-1.5 h-7 px-2.5 mr-1.5 mb-1.5 rounded text-[12.5px] transition-colors ${on ? 'bg-[#111] text-white' : 'bg-[#f2f2f2] text-[#333] hover:bg-[#e8e8e8]'}`}
                                                    >
                                                        {on && <Check className="w-3 h-3" strokeWidth={2.4} aria-hidden="true" />}
                                                        {value.hex && <i className="w-3 h-3 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.2)]" style={{ background: value.hex }} aria-hidden="true" />}
                                                        {value.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                ))}
                                <p className="text-[12.5px] text-[#666]">Cochez au moins une valeur par option pour générer les variantes. Sans option cochée, le produit est vendu sans variante.</p>
                            </div>
                        </Panel>
                    )}

                    {legacyVariants.length > 0 && (
                        <Notice tone="info">
                            Les variantes de ce produit ne correspondent pas {type ? `au type « ${type.name} »` : 'à un type de produit'} :
                            elles restent modifiables ci-dessous (stock, prix, activation), mais leurs options ne peuvent pas être régénérées.
                            Pour les recréer, choisissez un type adapté dans Catégories et menu.
                        </Notice>
                    )}

                    {usesVariants && (
                        <Panel
                            title={combos.length ? 'Variantes générées' : 'Variantes'}
                            action={combos.length > 0 && (
                                <span className="text-[13px] text-[#6b6b6b]">
                                    {typeAttributes.map((a) => `${(selectedValues[a.slug] ?? []).length} ${a.name.toLowerCase()}`).join(' × ')} = {combos.length} variante{combos.length > 1 ? 's' : ''}
                                </span>
                            )}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            {combos.length
                                                ? typeAttributes.map((a) => <th key={a.id} scope="col" className={cth}>{a.name}</th>)
                                                : <th scope="col" className={cth}>Options</th>}
                                            <th scope="col" className={cth}>Référence</th>
                                            <th scope="col" className={`${cth} text-right`}>Prix</th>
                                            <th scope="col" className={`${cth} text-right`}>Stock</th>
                                            <th scope="col" className={cth}>Photo</th>
                                            <th scope="col" className={cth}>Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(combos.length ? combos : legacyVariants).map((entry, index) => {
                                            const isCombo = combos.length > 0;
                                            const row = isCombo ? rowFor(entry) : entry;
                                            const update = (patch) => (isCombo
                                                ? setRow(entry, patch)
                                                : setLegacyVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v))));
                                            const attrs = isCombo ? entry : entry.attributes;
                                            const label = variantLabel(attrs) || 'Variante';
                                            const preview = row.preview ?? (row.image_path ? resolveMediaUrl(row.image_path) : null);
                                            return (
                                                <tr key={isCombo ? comboKey(entry, slugs) : entry.id}>
                                                    {isCombo
                                                        ? typeAttributes.map((a) => {
                                                            const hex = a.values.find((v) => v.value === entry[a.slug])?.hex;
                                                            return (
                                                                <td key={a.id} className={ctd}>
                                                                    <span className="flex items-center gap-2">
                                                                        {hex && <i className="w-3.5 h-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.2)]" style={{ background: hex }} aria-hidden="true" />}
                                                                        {entry[a.slug]}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })
                                                        : <td className={ctd}>{label}</td>}
                                                    <td className={ctd}>
                                                        <input value={row.sku} maxLength={64} onChange={(e) => update({ sku: e.target.value })} placeholder="Auto" aria-label={`Référence ${label}`} className={`${fieldClass} w-full min-w-[92px] h-9 px-2.5`} />
                                                    </td>
                                                    <td className={`${ctd} text-right`}>
                                                        <input type="number" min={0} value={row.price} onChange={(e) => update({ price: e.target.value })} placeholder={form.price || '0'} aria-label={`Prix ${label}`} className={`${fieldClass} w-[84px] h-9 px-2.5 text-right tabular-nums`} />
                                                    </td>
                                                    <td className={`${ctd} text-right`}>
                                                        <input type="number" min={0} value={row.stock} onChange={(e) => update({ stock: e.target.value })} aria-label={`Stock ${label}`} className={`${fieldClass} w-[68px] h-9 px-2.5 text-right tabular-nums`} />
                                                    </td>
                                                    <td className={ctd}>
                                                        <label title={preview ? 'Changer la photo' : 'Ajouter une photo'} className="relative w-10 h-10 rounded border border-[#d4d4d4] bg-white grid place-items-center overflow-hidden cursor-pointer hover:border-[#111] focus-within:outline focus-within:outline-2 focus-within:outline-[#111]">
                                                            {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-[#666]" strokeWidth={1.6} aria-hidden="true" />}
                                                            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Photo ${label}`} onChange={(e) => { const file = e.target.files?.[0] ?? null; update({ imageFile: file, preview: file ? URL.createObjectURL(file) : null }); }} />
                                                        </label>
                                                    </td>
                                                    <td className={ctd}>
                                                        <Switch label={`Activer ${label}`} checked={row.is_active} onChange={(v) => update({ is_active: v })} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="px-5 py-3 text-[12.5px] text-[#666]">Prix vide : la variante suit le prix de base. Les variantes désactivées ne sont plus proposées au client.</p>
                        </Panel>
                    )}
                </div>

                <div className="space-y-5 min-w-0">
                    <Panel title="Photos">
                        <div className="p-5 grid grid-cols-2 gap-2.5">
                            {existingImages.map((url) => (
                                <div key={url} className="relative">
                                    <img src={resolveMediaUrl(url)} alt="" className="w-full aspect-[3/4] object-cover rounded-sm" />
                                    <button type="button" onClick={() => setExistingImages((prev) => prev.filter((u) => u !== url))} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-[#111] hover:bg-white" aria-label="Retirer la photo">
                                        <X className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                            {newImages.map(({ url }) => (
                                <div key={url} className="relative">
                                    <img src={url} alt="" className="w-full aspect-[3/4] object-cover rounded-sm" />
                                    <button type="button" onClick={() => setNewImages((prev) => prev.filter((img) => img.url !== url))} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-[#111] hover:bg-white" aria-label="Retirer la photo">
                                        <X className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-[3/4] grid place-items-center text-center text-[13px] text-[#767676] bg-[#f3f3f3] border border-dashed border-[#cfcfcf] rounded-sm cursor-pointer hover:bg-[#ececec]">
                                <span>
                                    <ImagePlus className="w-5 h-5 mx-auto mb-1" strokeWidth={1.6} aria-hidden="true" />
                                    Ajouter
                                </span>
                                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => addImages(e.target.files)} />
                            </label>
                        </div>
                        <p className="px-5 pb-4 -mt-2 text-[12.5px] text-[#666]">La première photo est l'image principale. JPEG, PNG ou WebP, 4 Mo maximum.</p>
                    </Panel>

                    <Panel title="Visibilité">
                        <div className="p-5 grid gap-3.5">
                            <Switch showLabel label="Actif sur la boutique" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
                            <Switch showLabel label="Mis en avant (Pièces phares)" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
                            <Switch showLabel label="Badge « Nouveau »" checked={form.is_new} onChange={(v) => setForm({ ...form, is_new: v })} />
                        </div>
                    </Panel>

                    <Panel title="Aperçu côté client">
                        <div className="p-5 text-sm space-y-2">
                            {combos.length > 0 ? (
                                <>
                                    <p className="text-[#6b6b6b]">Le client choisira :</p>
                                    {typeAttributes.map((a) => (
                                        <p key={a.id}>{a.name} : <b className="font-semibold">{(selectedValues[a.slug] ?? []).join(' · ')}</b></p>
                                    ))}
                                </>
                            ) : (
                                <p className="text-[#6b6b6b]">{usesVariants ? 'Variantes existantes conservées.' : 'Produit vendu sans option.'}</p>
                            )}
                            {product?.slug && product.is_active && (
                                <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 pt-1 text-[13px] font-medium text-[#111] hover:underline">
                                    Voir la fiche produit
                                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                                </a>
                            )}
                        </div>
                    </Panel>
                </div>
            </div>
        </DashboardLayout>
    );
}
