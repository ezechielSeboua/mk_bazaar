import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Folder, FolderOpen, ImagePlus, Info, Pencil, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDashboardData, extractList } from '../../contexts/DashboardDataContext';
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    reorderCategories,
    updateCategory,
} from '../../services/category';
import { getProductTypes } from '../../services/catalog';
import { resolveMediaUrl } from '../../config/env';
import { Badge, Drawer, Notice, PageHeader, Panel, Switch, Tip } from '../../components/admin/AdminUI';
import { buttonClass, fieldClass, labelClass, td, th } from '../../components/admin/adminFormat';

/** Au-delà, les catégories du menu passent dans l'onglet « Plus » (Category::MENU_LIMIT). */
const MENU_LIMIT = 5;

const EMPTY_FORM = {
    name: '',
    description: '',
    parent_id: '',
    product_type_id: '',
    is_active: true,
    show_in_menu: true,
};

const byMenuOrder = (a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0) || a.id - b.id;

/** Envoie un champ booléen ou vide comme Laravel l'attend en multipart. */
const toFormData = (values, imageFile) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'boolean') data.append(key, value ? '1' : '0');
        else data.append(key, value ?? '');
    });
    if (imageFile) data.append('image_path', imageFile);
    return data;
};

function CategoryForm({ form, setForm, parents, productTypes, editing, hasChildren, imagePreview, onImage }) {
    const parent = parents.find((p) => String(p.id) === String(form.parent_id));
    const inheritedType = parent?.product_type?.name;
    const isChild = Boolean(form.parent_id);

    return (
        <div className="space-y-5">
            <div>
                <label htmlFor="cat-name" className={labelClass}>Nom</label>
                <input id="cat-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${fieldClass} w-full`} />
            </div>

            <div>
                <label htmlFor="cat-parent" className={labelClass}>Emplacement</label>
                <select
                    id="cat-parent"
                    value={form.parent_id}
                    disabled={hasChildren}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className={`${fieldClass} w-full`}
                >
                    <option value="">Catégorie principale</option>
                    {parents.filter((p) => p.id !== editing?.id).map((p) => (
                        <option key={p.id} value={p.id}>Sous-catégorie de « {p.name} »</option>
                    ))}
                </select>
                {hasChildren && <p className="mt-1.5 text-[12.5px] text-[#666]">Elle contient des sous-catégories : elle reste une catégorie principale.</p>}
            </div>

            <div>
                <label htmlFor="cat-type" className={labelClass}>Type de produit</label>
                <select id="cat-type" value={form.product_type_id} onChange={(e) => setForm({ ...form, product_type_id: e.target.value })} className={`${fieldClass} w-full`}>
                    <option value="">
                        {isChild
                            ? (inheritedType ? `Hérité du parent (${inheritedType})` : 'Aucun')
                            : 'Défini par sous-catégorie'}
                    </option>
                    {productTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                <p className="mt-1.5 text-[12.5px] text-[#666]">Détermine les options proposées au client (taille, couleur, longueur…) et les filtres du catalogue.</p>
            </div>

            <div>
                <label htmlFor="cat-description" className={labelClass}>Description <span className="font-normal text-[#767676]">(facultatif)</span></label>
                <textarea id="cat-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${fieldClass} w-full h-auto py-2.5 resize-none`} />
            </div>

            <div>
                <span className={labelClass}>Visuel</span>
                <label className="flex items-center gap-4 border border-dashed border-[#cfcfcf] rounded p-3.5 cursor-pointer hover:bg-[#fafafa]">
                    {imagePreview ? (
                        <img src={imagePreview} alt="" className="w-16 h-20 object-cover rounded-sm" />
                    ) : (
                        <span className="w-16 h-20 rounded-sm bg-[#f1f1f1] grid place-items-center text-[#999]"><ImagePlus className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" /></span>
                    )}
                    <span className="flex-1 text-[12.5px] text-[#666]">
                        <b className="block text-sm font-medium text-[#111]">{imagePreview ? 'Remplacer le visuel' : 'Ajouter un visuel'}</b>
                        JPEG, PNG ou WebP · 4 Mo maximum
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onImage(e.target.files?.[0] ?? null)} />
                </label>
            </div>

            <div className="space-y-3 pt-1">
                <Switch showLabel label="Active sur la boutique" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
                {!isChild && (
                    <div>
                        <Switch showLabel label="Afficher dans le menu" checked={form.show_in_menu} onChange={(v) => setForm({ ...form, show_in_menu: v })} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    const { categories, setCategories } = useDashboardData();
    const [productTypes, setProductTypes] = useState([]);
    const [error, setError] = useState(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        getProductTypes().then((res) => { if (res?.success) setProductTypes(res.data ?? []); });
    }, []);

    const refresh = async () => {
        const res = await getAllCategories();
        if (res?.success) setCategories(extractList(res));
    };

    // Arbre : catégories principales dans l'ordre du menu, sous-catégories en dessous.
    const { parents, childrenOf } = useMemo(() => {
        const roots = categories.filter((c) => !c.parent_id).sort(byMenuOrder);
        const map = {};
        categories.filter((c) => c.parent_id).forEach((c) => { (map[c.parent_id] ??= []).push(c); });
        Object.values(map).forEach((list) => list.sort(byMenuOrder));
        return { parents: roots, childrenOf: map };
    }, [categories]);

    const menuPosition = useMemo(() => {
        const positions = {};
        parents.filter((p) => p.show_in_menu && p.is_active).forEach((p, index) => { positions[p.id] = index; });
        return positions;
    }, [parents]);

    const childCount = categories.length - parents.length;

    const openCreate = (parentId = '') => {
        setEditing(null);
        setForm({ ...EMPTY_FORM, parent_id: parentId ? String(parentId) : '' });
        setImageFile(null);
        setImagePreview(null);
        setFormError(null);
        setDrawerOpen(true);
    };

    const openEdit = (category) => {
        setEditing(category);
        setForm({
            name: category.name ?? '',
            description: category.description ?? '',
            parent_id: category.parent_id ? String(category.parent_id) : '',
            product_type_id: category.product_type_id ? String(category.product_type_id) : '',
            is_active: Boolean(category.is_active),
            show_in_menu: Boolean(category.show_in_menu),
        });
        setImageFile(null);
        setImagePreview(category.image_path ? resolveMediaUrl(category.image_path) : null);
        setFormError(null);
        setDrawerOpen(true);
    };

    const onImage = (file) => {
        setImageFile(file);
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    const save = async (event) => {
        event?.preventDefault();
        if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        setSaving(true);
        setFormError(null);
        const values = { ...form, name: form.name.trim() };
        if (values.parent_id) values.show_in_menu = false;
        const res = editing
            ? await updateCategory(editing.id, toFormData(values, imageFile))
            : await createCategory(toFormData(values, imageFile));
        setSaving(false);
        if (!res?.success) {
            const firstError = res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null;
            setFormError(firstError || res?.error || "L'enregistrement a échoué.");
            return;
        }
        setDrawerOpen(false);
        await refresh();
    };

    const toggle = async (category, key, value) => {
        setBusyId(category.id);
        setError(null);
        setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, [key]: value } : c)));
        const res = await updateCategory(category.id, toFormData({ [key]: value }));
        if (!res?.success) {
            setError(res?.error || 'La modification a échoué.');
            await refresh();
        }
        setBusyId(null);
    };

    const move = async (siblings, index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= siblings.length) return;
        const reordered = [...siblings];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        const positions = Object.fromEntries(reordered.map((c, i) => [c.id, i]));
        setCategories((prev) => prev.map((c) => (c.id in positions ? { ...c, menu_order: positions[c.id] } : c)));
        const res = await reorderCategories(reordered.map((c) => c.id));
        if (!res?.success) {
            setError(res?.error || "L'ordre n'a pas pu être enregistré.");
            await refresh();
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        const res = await deleteCategory(toDelete.id);
        setDeleting(false);
        if (res?.success) {
            setCategories((prev) => prev.filter((c) => c.id !== toDelete.id));
            setToDelete(null);
        } else {
            setToDelete(null);
            setError(res?.error || 'La suppression a échoué.');
        }
    };

    const typeBadge = (category, isChild) => {
        if (category.product_type?.name) return <Badge>{category.product_type.name}</Badge>;
        if (isChild) {
            const parentType = parents.find((p) => p.id === category.parent_id)?.product_type?.name;
            return parentType ? <span className="text-[12.5px] text-[#6b6b6b]">Hérité · {parentType}</span> : <span className="text-[12.5px] text-[#b42318]">Aucun type</span>;
        }
        return <span className="text-[12.5px] text-[#6b6b6b]">{childrenOf[category.id]?.length ? 'Défini par sous-catégorie' : 'Aucun type'}</span>;
    };

    const orderButtons = (siblings, index, name) => (
        <span className="inline-flex flex-col -my-1 mr-1">
            <button type="button" onClick={() => move(siblings, index, -1)} disabled={index === 0} className="p-0.5 text-[#999] hover:text-[#111] disabled:opacity-30" aria-label={`Monter « ${name} »`}>
                <ArrowUp className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(siblings, index, 1)} disabled={index === siblings.length - 1} className="p-0.5 text-[#999] hover:text-[#111] disabled:opacity-30" aria-label={`Descendre « ${name} »`}>
                <ArrowDown className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
            </button>
        </span>
    );

    const actions = (category) => (
        <div className="flex justify-end gap-1">
            {!category.parent_id && (
                <button type="button" onClick={() => openCreate(category.id)} className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]" aria-label={`Ajouter une sous-catégorie à « ${category.name} »`} title="Ajouter une sous-catégorie">
                    <Plus className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                </button>
            )}
            <button type="button" onClick={() => openEdit(category)} className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]" aria-label={`Modifier « ${category.name} »`} title="Modifier">
                <Pencil className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setToDelete(category)} className="p-1.5 rounded text-[#666] hover:text-[#b42318] hover:bg-[#fdeaea]" aria-label={`Supprimer « ${category.name} »`} title="Supprimer">
                <Trash2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
            </button>
        </div>
    );

    const statusBadge = (category) => (
        <button type="button" onClick={() => toggle(category, 'is_active', !category.is_active)} disabled={busyId === category.id} title="Cliquer pour changer" className="rounded-full">
            <Badge tone={category.is_active ? 'success' : 'neutral'} dot>{category.is_active ? 'Active' : 'Inactive'}</Badge>
        </button>
    );

    return (
        <DashboardLayout>
            <PageHeader
                title="Catégories et menu"
                subtitle={`${parents.length} catégorie${parents.length > 1 ? 's' : ''} principale${parents.length > 1 ? 's' : ''} · ${childCount} sous-catégorie${childCount > 1 ? 's' : ''}`}
                actions={
                    <button type="button" onClick={() => openCreate()} className={buttonClass('primary')}>
                        <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                        Nouvelle catégorie
                    </button>
                }
            />

            <Tip icon={Info}>
                Seules les <b>catégories principales</b> cochées « Dans le menu » apparaissent dans l'en-tête, dans l'ordre ci-dessous
                (flèches pour réordonner). Au-delà de {MENU_LIMIT}, les suivantes passent automatiquement dans un onglet « Plus ».
                Les sous-catégories s'affichent dans le menu déroulant.
            </Tip>

            {error && <div className="mb-4"><Notice>{error}</Notice></div>}

            <Panel>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th scope="col" className={th}>Catégorie</th>
                                <th scope="col" className={th}>Type de produit</th>
                                <th scope="col" className={`${th} text-right`}>Produits</th>
                                <th scope="col" className={th}>Dans le menu</th>
                                <th scope="col" className={th}>Statut</th>
                                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {parents.map((parent, index) => {
                                const children = childrenOf[parent.id] ?? [];
                                const position = menuPosition[parent.id];
                                return [
                                    <tr key={parent.id} className="bg-[#fcfcfc]">
                                        <td className={td}>
                                            <span className="flex items-center gap-2">
                                                {orderButtons(parents, index, parent.name)}
                                                {children.length ? <FolderOpen className="w-4 h-4 text-[#666]" strokeWidth={1.6} aria-hidden="true" /> : <Folder className="w-4 h-4 text-[#666]" strokeWidth={1.6} aria-hidden="true" />}
                                                <b className="font-semibold">{parent.name}</b>
                                            </span>
                                        </td>
                                        <td className={td}>{typeBadge(parent, false)}</td>
                                        <td className={`${td} text-right tabular-nums`}>{parent.total_products_count ?? parent.products_count ?? 0}</td>
                                        <td className={td}>
                                            <span className="flex items-center gap-2.5">
                                                <Switch label={`Afficher « ${parent.name} » dans le menu`} checked={Boolean(parent.show_in_menu)} disabled={busyId === parent.id} onChange={(v) => toggle(parent, 'show_in_menu', v)} />
                                                {position !== undefined && position >= MENU_LIMIT && <span className="text-[12.5px] text-[#6b6b6b]">Onglet « Plus »</span>}
                                            </span>
                                        </td>
                                        <td className={td}>{statusBadge(parent)}</td>
                                        <td className={td}>{actions(parent)}</td>
                                    </tr>,
                                    ...children.map((child, childIndex) => (
                                        <tr key={child.id}>
                                            <td className={`${td} pl-[62px]`}>
                                                <span className="flex items-center">
                                                    <span className="text-[#bbb] mr-2" aria-hidden="true">└</span>
                                                    {orderButtons(children, childIndex, child.name)}
                                                    {child.name}
                                                </span>
                                            </td>
                                            <td className={td}>{typeBadge(child, true)}</td>
                                            <td className={`${td} text-right tabular-nums`}>{child.products_count ?? 0}</td>
                                            <td className={`${td} text-[12.5px] text-[#6b6b6b]`}>Menu déroulant</td>
                                            <td className={td}>{statusBadge(child)}</td>
                                            <td className={td}>{actions(child)}</td>
                                        </tr>
                                    )),
                                ];
                            })}
                            {categories.length === 0 && (
                                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#666]">Aucune catégorie. Créez la première.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editing ? `Modifier « ${editing.name} »` : 'Nouvelle catégorie'}
                footer={
                    <div className="flex justify-end gap-2.5">
                        <button type="button" onClick={() => setDrawerOpen(false)} className={buttonClass('secondary')}>Annuler</button>
                        <button type="button" onClick={save} disabled={saving} className={buttonClass('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                }
            >
                <form onSubmit={save} className="space-y-5">
                    <Notice>{formError}</Notice>
                    <CategoryForm
                        form={form}
                        setForm={setForm}
                        parents={parents}
                        productTypes={productTypes}
                        editing={editing}
                        hasChildren={Boolean(editing && childrenOf[editing.id]?.length)}
                        imagePreview={imagePreview}
                        onImage={onImage}
                    />
                </form>
            </Drawer>

            <ConfirmDialog
                open={Boolean(toDelete)}
                title="Supprimer la catégorie"
                message={toDelete ? `Supprimer « ${toDelete.name} » ? Une catégorie qui contient des produits ou des sous-catégories ne peut pas être supprimée.` : ''}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
                loading={deleting}
            />
        </DashboardLayout>
    );
}
