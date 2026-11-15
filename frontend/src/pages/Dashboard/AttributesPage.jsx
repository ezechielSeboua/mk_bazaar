import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    createAttribute,
    createProductType,
    deleteAttribute,
    deleteProductType,
    getAttributes,
    getProductTypes,
    updateAttribute,
    updateProductType,
} from '../../services/catalog';
import { Badge, Drawer, Notice, PageHeader, Panel, Switch, Skeleton } from '../../components/admin/AdminUI';
import { buttonClass, fieldClass, labelClass, td, th } from '../../components/admin/adminFormat';

const FAMILY_LABEL = { color: 'Couleur', size: 'Taille', other: 'Autre' };
const MAX_TYPE_ATTRIBUTES = 3;
const NEW_TYPE = { id: null, name: '', guide_label: '', show_as_filter: true, attribute_ids: [] };

const firstError = (res, fallback) =>
    (res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null) || res?.error || fallback;

/** « 36 → 46 » pour une suite numérique, sinon les premières valeurs. */
const valuesSummary = (values = []) => {
    const list = values.map((v) => v.value);
    if (list.length === 0) return 'Aucune valeur';
    const numeric = list.every((v) => /^\d+([.,]\d+)?$/.test(v));
    if (numeric && list.length > 3) return `${list[0]} → ${list[list.length - 1]}`;
    return list.length > 6 ? `${list.slice(0, 6).join(', ')}… (${list.length})` : list.join(', ');
};

const toDraft = (type) => ({
    id: type.id,
    name: type.name,
    guide_label: type.guide_label ?? '',
    show_as_filter: type.show_as_filter,
    attribute_ids: (type.variation_attributes ?? []).map((a) => a.id),
});

function Chip({ children }) {
    return <span className="inline-flex items-center h-7 px-2.5 mr-1.5 mb-1.5 rounded bg-[#f2f2f2] text-[12.5px] text-[#333]">{children}</span>;
}

/* ------------------------------------------------------------- Éditeur de type */

function TypeEditor({ draft, setDraft, attributes, onSave, onDelete, saving, error }) {
    const slots = Math.min(MAX_TYPE_ATTRIBUTES, Math.max(2, draft.attribute_ids.length + 1));

    const setSlot = (index, value) => {
        const ids = [...draft.attribute_ids];
        if (value) ids[index] = Number(value); else ids.splice(index, 1);
        setDraft({ ...draft, attribute_ids: ids.filter(Boolean).filter((id, i, arr) => arr.indexOf(id) === i) });
    };

    return (
        <Panel
            title={draft.id ? `Type « ${draft.name || '…'} »` : 'Nouveau type'}
            action={draft.id && (
                <button type="button" onClick={onDelete} className={`${buttonClass('ghost', 'sm')} text-[#b42318] hover:bg-[#fdeaea]`}>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                    Supprimer
                </button>
            )}
        >
            <form onSubmit={onSave} className="px-5 py-[18px] space-y-4">
                <Notice>{error}</Notice>
                <div>
                    <label htmlFor="type-name" className={labelClass}>Nom du type</label>
                    <input id="type-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex. Collier / chaîne" className={`${fieldClass} w-full`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: slots }, (_, index) => (
                        <div key={index}>
                            <label htmlFor={`type-attr-${index}`} className={labelClass}>Attribut de variation {index + 1}</label>
                            <select
                                id={`type-attr-${index}`}
                                value={draft.attribute_ids[index] ?? ''}
                                onChange={(e) => setSlot(index, e.target.value)}
                                disabled={index > draft.attribute_ids.length}
                                className={`${fieldClass} w-full`}
                            >
                                <option value="">{index === 0 ? 'Aucun (produit sans option)' : 'Aucun'}</option>
                                {attributes
                                    .filter((a) => a.id === draft.attribute_ids[index] || !draft.attribute_ids.includes(a.id))
                                    .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    ))}
                    <div>
                        <label htmlFor="type-guide" className={labelClass}>Guide associé</label>
                        <input id="type-guide" value={draft.guide_label ?? ''} onChange={(e) => setDraft({ ...draft, guide_label: e.target.value })} placeholder="Ex. Guide des longueurs" className={`${fieldClass} w-full`} />
                    </div>
                    <div>
                        <span className={labelClass}>Afficher comme filtre</span>
                        <div className="h-10 flex items-center">
                            <Switch showLabel label="Oui, dans le catalogue" checked={Boolean(draft.show_as_filter)} onChange={(v) => setDraft({ ...draft, show_as_filter: v })} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={saving} className={buttonClass('primary')}>{saving ? 'Enregistrement…' : draft.id ? 'Enregistrer' : 'Créer le type'}</button>
                </div>
            </form>
        </Panel>
    );
}

/* -------------------------------------------------------- Éditeur d'attribut */

function AttributeForm({ form, setForm, isNew }) {
    const updateValue = (index, patch) => {
        const values = [...form.values];
        values[index] = { ...values[index], ...patch };
        setForm({ ...form, values });
    };
    const moveValue = (index, delta) => {
        const values = [...form.values];
        const target = index + delta;
        if (target < 0 || target >= values.length) return;
        [values[index], values[target]] = [values[target], values[index]];
        setForm({ ...form, values });
    };

    return (
        <div className="space-y-5">
            <div>
                <label htmlFor="attr-name" className={labelClass}>Nom</label>
                <input id="attr-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Longueur" className={`${fieldClass} w-full`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="attr-family" className={labelClass}>Famille</label>
                    <select id="attr-family" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} className={`${fieldClass} w-full`}>
                        {Object.entries(FAMILY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="attr-slug" className={labelClass}>Identifiant</label>
                    <input
                        id="attr-slug"
                        value={form.slug}
                        disabled={!isNew}
                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        placeholder="Généré depuis le nom"
                        className={`${fieldClass} w-full disabled:bg-[#f5f5f5] disabled:text-[#666]`}
                    />
                </div>
            </div>
            {!isNew && <p className="-mt-3 text-[12.5px] text-[#666]">L'identifiant est enregistré dans les variantes : il ne change plus après la création.</p>}

            <fieldset>
                <legend className={labelClass}>Valeurs proposées</legend>
                <ul className="space-y-2">
                    {form.values.map((value, index) => (
                        <li key={value.id ?? `new-${index}`} className="flex items-center gap-2">
                            <span className="inline-flex flex-col">
                                <button type="button" onClick={() => moveValue(index, -1)} disabled={index === 0} className="p-0.5 text-[#999] hover:text-[#111] disabled:opacity-30" aria-label={`Monter ${value.value || 'la valeur'}`}>
                                    <ArrowUp className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => moveValue(index, 1)} disabled={index === form.values.length - 1} className="p-0.5 text-[#999] hover:text-[#111] disabled:opacity-30" aria-label={`Descendre ${value.value || 'la valeur'}`}>
                                    <ArrowDown className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                                </button>
                            </span>
                            {form.family === 'color' && (
                                <input
                                    type="color"
                                    value={value.hex || '#cccccc'}
                                    onChange={(e) => updateValue(index, { hex: e.target.value })}
                                    className="w-10 h-10 p-1 border border-[#d9d9d9] rounded bg-white shrink-0"
                                    aria-label={`Couleur de ${value.value || 'la valeur'}`}
                                />
                            )}
                            <input
                                value={value.value}
                                onChange={(e) => updateValue(index, { value: e.target.value })}
                                placeholder="Valeur"
                                aria-label={`Valeur ${index + 1}`}
                                className={`${fieldClass} flex-1 min-w-0`}
                            />
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, values: form.values.filter((_, i) => i !== index) })}
                                className="p-2 text-[#666] hover:text-[#b42318]"
                                aria-label={`Retirer ${value.value || 'la valeur'}`}
                            >
                                <X className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
                <button type="button" onClick={() => setForm({ ...form, values: [...form.values, { value: '', hex: null }] })} className={`${buttonClass('secondary', 'sm')} mt-3`}>
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
                    Ajouter une valeur
                </button>
                <p className="mt-2 text-[12.5px] text-[#666]">Renommer une valeur met à jour les variantes qui l'utilisent. Une valeur utilisée ne peut pas être retirée.</p>
            </fieldset>
        </div>
    );
}

/* --------------------------------------------------------------------- Page */

export default function AttributesPage() {
    const [types, setTypes] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState(NEW_TYPE);
    const [typeSaving, setTypeSaving] = useState(false);
    const [typeError, setTypeError] = useState(null);
    const [typeToDelete, setTypeToDelete] = useState(null);

    const [attrForm, setAttrForm] = useState(null);
    const [attrSaving, setAttrSaving] = useState(false);
    const [attrError, setAttrError] = useState(null);
    const [attrToDelete, setAttrToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        const [typesRes, attrsRes] = await Promise.all([getProductTypes(), getAttributes()]);
        if (typesRes?.success) setTypes(typesRes.data ?? []);
        if (attrsRes?.success) setAttributes(attrsRes.data ?? []);
        if (!typesRes?.success || !attrsRes?.success) setPageError('Impossible de charger les types et attributs.');
        setLoading(false);
        return typesRes?.data ?? [];
    }, []);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getProductTypes(), getAttributes()]).then(([typesRes, attrsRes]) => {
            if (cancelled) return;
            const list = typesRes?.success ? (typesRes.data ?? []) : [];
            setTypes(list);
            if (attrsRes?.success) setAttributes(attrsRes.data ?? []);
            if (!typesRes?.success || !attrsRes?.success) setPageError('Impossible de charger les types et attributs.');
            setLoading(false);
            const first = [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'))[0];
            if (first) {
                setSelectedId(first.id);
                setDraft(toDraft(first));
            }
        });
        return () => { cancelled = true; };
    }, []);

    const selectType = (type) => {
        setSelectedId(type.id);
        setDraft(toDraft(type));
        setTypeError(null);
    };

    const saveType = async (event) => {
        event.preventDefault();
        if (!draft.name.trim()) { setTypeError('Le nom est obligatoire.'); return; }
        setTypeSaving(true);
        setTypeError(null);
        const payload = { name: draft.name.trim(), guide_label: draft.guide_label || null, show_as_filter: draft.show_as_filter, attribute_ids: draft.attribute_ids };
        const res = draft.id ? await updateProductType(draft.id, payload) : await createProductType(payload);
        setTypeSaving(false);
        if (!res?.success) { setTypeError(firstError(res, "L'enregistrement a échoué.")); return; }
        await load();
        setSelectedId(res.data.id);
        setDraft(toDraft(res.data));
    };

    const confirmDeleteType = async () => {
        setDeleting(true);
        const res = await deleteProductType(typeToDelete.id);
        setDeleting(false);
        setTypeToDelete(null);
        if (!res?.success) { setTypeError(firstError(res, 'La suppression a échoué.')); return; }
        const list = await load();
        if (list[0]) selectType(list[0]); else { setSelectedId(null); setDraft(NEW_TYPE); }
    };

    const openAttribute = (attribute = null) => {
        setAttrError(null);
        setAttrForm(attribute
            ? { id: attribute.id, name: attribute.name, slug: attribute.slug, family: attribute.family, values: attribute.values.map((v) => ({ id: v.id, value: v.value, hex: v.hex })) }
            : { id: null, name: '', slug: '', family: 'size', values: [{ value: '', hex: null }] });
    };

    const saveAttribute = async () => {
        if (!attrForm.name.trim()) { setAttrError('Le nom est obligatoire.'); return; }
        const values = attrForm.values
            .filter((v) => v.value.trim())
            .map((v) => ({ ...(v.id ? { id: v.id } : {}), value: v.value.trim(), hex: attrForm.family === 'color' ? (v.hex || null) : null }));
        const payload = { name: attrForm.name.trim(), family: attrForm.family, values };
        if (!attrForm.id && attrForm.slug) payload.slug = attrForm.slug;

        setAttrSaving(true);
        setAttrError(null);
        const res = attrForm.id ? await updateAttribute(attrForm.id, payload) : await createAttribute(payload);
        setAttrSaving(false);
        if (!res?.success) { setAttrError(firstError(res, "L'enregistrement a échoué.")); return; }
        setAttrForm(null);
        await load();
    };

    const confirmDeleteAttribute = async () => {
        setDeleting(true);
        const res = await deleteAttribute(attrToDelete.id);
        setDeleting(false);
        setAttrToDelete(null);
        if (!res?.success) { setPageError(firstError(res, 'La suppression a échoué.')); return; }
        await load();
    };

    const sortedTypes = useMemo(() => [...types].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [types]);

    return (
        <DashboardLayout>
            <PageHeader
                title="Attributs et types de produit"
                subtitle="Chaque type de produit définit les options proposées au client (taille, couleur, longueur…) et les filtres du catalogue."
                actions={
                    <>
                        <button type="button" onClick={() => openAttribute()} className={buttonClass('secondary')}>
                            <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                            Nouvel attribut
                        </button>
                        <button type="button" onClick={() => { setSelectedId(null); setDraft(NEW_TYPE); setTypeError(null); }} className={buttonClass('primary')}>
                            <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                            Nouveau type
                        </button>
                    </>
                }
            />

            {pageError && <div className="mb-4"><Notice>{pageError}</Notice></div>}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-5 items-start">
                <Panel title="Types de produit" action={<span className="text-[13px] text-[#6b6b6b]">{types.length} type{types.length > 1 ? 's' : ''}</span>}>
                    {loading && (
                        <div className="divide-y divide-[#f1f1f1]" aria-hidden="true">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-5 py-4 space-y-2">
                                    <Skeleton className="h-3.5 w-28" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            ))}
                        </div>
                    )}
                    {sortedTypes.map((type) => {
                        const active = type.id === selectedId;
                        return (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => selectType(type)}
                                aria-pressed={active}
                                className={`w-full text-left flex justify-between items-center gap-4 px-5 py-3.5 border-b border-[#f0f0f0] last:border-b-0 transition-colors ${
                                    active ? 'bg-[#fafafa] shadow-[inset_3px_0_0_#111]' : 'hover:bg-[#fafafa]'
                                }`}
                            >
                                <span className="min-w-0">
                                    <b className="text-sm font-semibold text-[#111]">{type.name}</b>
                                    <span className="block mt-2">
                                        {(type.variation_attributes ?? []).map((a) => <Chip key={a.id}>{a.name}</Chip>)}
                                        {!(type.variation_attributes ?? []).length && <span className="text-[12.5px] text-[#767676]">Sans option</span>}
                                    </span>
                                </span>
                                <span className="text-[12.5px] text-[#6b6b6b] whitespace-nowrap">
                                    {type.categories_count ?? 0} catégorie{(type.categories_count ?? 0) > 1 ? 's' : ''}
                                </span>
                            </button>
                        );
                    })}
                </Panel>

                <div className="space-y-5 min-w-0">
                    <TypeEditor
                        draft={draft}
                        setDraft={setDraft}
                        attributes={attributes}
                        onSave={saveType}
                        onDelete={() => setTypeToDelete(draft)}
                        saving={typeSaving}
                        error={typeError}
                    />

                    <Panel title="Attributs" action={<span className="text-[13px] text-[#6b6b6b]">{attributes.length} attribut{attributes.length > 1 ? 's' : ''}</span>}>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th scope="col" className={th}>Attribut</th>
                                        <th scope="col" className={th}>Famille</th>
                                        <th scope="col" className={th}>Valeurs</th>
                                        <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attributes.map((attribute) => (
                                        <tr key={attribute.id} className="hover:bg-[#fafafa]">
                                            <td className={`${td} font-medium`}>{attribute.name}</td>
                                            <td className={td}><Badge>{FAMILY_LABEL[attribute.family] ?? attribute.family}</Badge></td>
                                            <td className={`${td} text-[#6b6b6b]`}>
                                                <span className="flex flex-wrap items-center gap-1.5">
                                                    {attribute.family === 'color' && attribute.values.slice(0, 6).map((v) => v.hex && (
                                                        <i key={v.id} className="w-3.5 h-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]" style={{ background: v.hex }} title={v.value} aria-hidden="true" />
                                                    ))}
                                                    {valuesSummary(attribute.values)}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <div className="flex justify-end gap-1">
                                                    <button type="button" onClick={() => openAttribute(attribute)} className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]" aria-label={`Modifier ${attribute.name}`}>
                                                        <Pencil className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                    </button>
                                                    <button type="button" onClick={() => setAttrToDelete(attribute)} className="p-1.5 rounded text-[#666] hover:text-[#b42318] hover:bg-[#fdeaea]" aria-label={`Supprimer ${attribute.name}`}>
                                                        <Trash2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
            </div>

            <Drawer
                open={Boolean(attrForm)}
                onClose={() => setAttrForm(null)}
                title={attrForm?.id ? `Modifier « ${attrForm.name} »` : 'Nouvel attribut'}
                footer={
                    <div className="flex justify-end gap-2.5">
                        <button type="button" onClick={() => setAttrForm(null)} className={buttonClass('secondary')}>Annuler</button>
                        <button type="button" onClick={saveAttribute} disabled={attrSaving} className={buttonClass('primary')}>{attrSaving ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                }
            >
                {attrForm && (
                    <div className="space-y-5">
                        <Notice>{attrError}</Notice>
                        <AttributeForm form={attrForm} setForm={setAttrForm} isNew={!attrForm.id} />
                    </div>
                )}
            </Drawer>

            <ConfirmDialog
                open={Boolean(typeToDelete)}
                title="Supprimer le type"
                message={`Supprimer le type « ${typeToDelete?.name ?? ''} » ? Il doit d'abord être retiré des catégories qui l'utilisent.`}
                onConfirm={confirmDeleteType}
                onCancel={() => setTypeToDelete(null)}
                loading={deleting}
            />
            <ConfirmDialog
                open={Boolean(attrToDelete)}
                title="Supprimer l'attribut"
                message={`Supprimer « ${attrToDelete?.name ?? ''} » ? Impossible s'il est utilisé par un type ou par des variantes.`}
                onConfirm={confirmDeleteAttribute}
                onCancel={() => setAttrToDelete(null)}
                loading={deleting}
            />
        </DashboardLayout>
    );
}
