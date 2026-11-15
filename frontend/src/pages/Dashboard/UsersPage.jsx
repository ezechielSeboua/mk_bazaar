import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { createUser, deleteUser, updateUser } from '../../services/users';
import { resolveMediaUrl } from '../../config/env';
import { Badge, Drawer, Notice, PageHeader, Pagination, Panel, Switch, Tabs } from '../../components/admin/AdminUI';
import { buttonClass, fieldClass, formatDate, labelClass, td, th } from '../../components/admin/adminFormat';

const PER_PAGE = 20;
const EMPTY_FORM = { id: null, name: '', email: '', phone: '', password: '', is_admin: false };

const initials = (name = '') =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

const firstError = (res, fallback) =>
    (res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null) || res?.error || fallback;

export default function UsersPage() {
    const { users, setUsers } = useDashboardData();
    const { user: currentUser } = useAuth();

    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);

    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const admins = users.filter((u) => u.is_admin).length;
    const clients = users.length - admins;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return [...users]
            .filter((u) => tab === 'all' || (tab === 'admins' ? u.is_admin : !u.is_admin))
            .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || (u.phone ?? '').includes(q))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [users, tab, search]);

    const lastPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, lastPage);
    const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const save = async () => {
        if (!form.name.trim() || !form.email.trim()) { setFormError('Le nom et l\'e-mail sont obligatoires.'); return; }
        if (!form.id && form.password.length < 8) { setFormError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
        if (form.id && form.password && form.password.length < 8) { setFormError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }

        const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, is_admin: form.is_admin };
        if (form.password) payload.password = form.password;

        setSaving(true);
        setFormError(null);
        const res = form.id ? await updateUser(form.id, payload) : await createUser(payload);
        setSaving(false);
        if (!res?.success) { setFormError(firstError(res, "L'enregistrement a échoué.")); return; }

        setUsers((prev) => (form.id
            ? prev.map((u) => (u.id === form.id ? { ...u, ...res.data, orders_count: u.orders_count } : u))
            : [{ ...res.data, orders_count: 0 }, ...prev]));
        setForm(null);
    };

    const confirmDelete = async () => {
        setDeleting(true);
        const res = await deleteUser(toDelete.id);
        setDeleting(false);
        if (res?.success) setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
        else setError(firstError(res, 'La suppression a échoué.'));
        setToDelete(null);
    };

    return (
        <DashboardLayout>
            <PageHeader
                title="Clients et utilisateurs"
                subtitle={`${users.length} compte${users.length > 1 ? 's' : ''} · ${admins} administrateur${admins > 1 ? 's' : ''}`}
                actions={
                    <button type="button" onClick={() => { setFormError(null); setForm(EMPTY_FORM); }} className={buttonClass('primary')}>
                        <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                        Ajouter un utilisateur
                    </button>
                }
            />

            {error && <div className="mb-4"><Notice>{error}</Notice></div>}

            <Panel>
                <Tabs
                    label="Filtrer par rôle"
                    value={tab}
                    onChange={(v) => { setTab(v); setPage(1); }}
                    items={[
                        { value: 'all', label: 'Tous', count: users.length },
                        { value: 'clients', label: 'Clients', count: clients },
                        { value: 'admins', label: 'Administrateurs', count: admins },
                    ]}
                />
                <div className="px-5 py-3.5 border-b border-[#ececec]">
                    <label className="flex items-center gap-2.5 h-10 px-3 border border-[#e0e0e0] rounded bg-[#fafafa] text-[#767676] w-full sm:w-[320px] focus-within:border-[#111] focus-within:bg-white">
                        <Search className="w-4 h-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                        <span className="sr-only">Rechercher</span>
                        <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Nom, e-mail ou téléphone…" className="w-full bg-transparent text-[13.5px] text-[#111] placeholder:text-[#767676] outline-none" />
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th scope="col" className={th}>Nom</th>
                                <th scope="col" className={th}>E-mail</th>
                                <th scope="col" className={th}>Téléphone</th>
                                <th scope="col" className={th}>Rôle</th>
                                <th scope="col" className={`${th} text-right`}>Commandes</th>
                                <th scope="col" className={th}>Inscription</th>
                                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((u) => (
                                <tr key={u.id} className="hover:bg-[#fafafa]">
                                    <td className={td}>
                                        <span className="flex items-center gap-3">
                                            {u.avatar ? (
                                                <img src={resolveMediaUrl(u.avatar)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <span className="w-8 h-8 rounded-full bg-[#111] text-white grid place-items-center text-[11px] font-semibold shrink-0" aria-hidden="true">{initials(u.name)}</span>
                                            )}
                                            <span className="font-medium text-[#111]">{u.name}</span>
                                            {u.id === currentUser?.id && <span className="text-[12px] text-[#767676]">(vous)</span>}
                                        </span>
                                    </td>
                                    <td className={`${td} text-[#444]`}>{u.email}</td>
                                    <td className={`${td} text-[#6b6b6b] whitespace-nowrap`}>{u.phone || '—'}</td>
                                    <td className={td}><Badge tone={u.is_admin ? 'info' : 'neutral'}>{u.is_admin ? 'Administrateur' : 'Client'}</Badge></td>
                                    <td className={`${td} text-right tabular-nums`}>{u.orders_count ?? 0}</td>
                                    <td className={`${td} text-[#6b6b6b] whitespace-nowrap`}>{formatDate(u.created_at)}</td>
                                    <td className={td}>
                                        <div className="flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => { setFormError(null); setForm({ id: u.id, name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '', password: '', is_admin: Boolean(u.is_admin) }); }}
                                                className="p-1.5 rounded text-[#666] hover:text-[#111] hover:bg-[#f1f1f1]"
                                                aria-label={`Modifier ${u.name}`}
                                            >
                                                <Pencil className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                            </button>
                                            {u.id !== currentUser?.id && (
                                                <button type="button" onClick={() => setToDelete(u)} className="p-1.5 rounded text-[#666] hover:text-[#b42318] hover:bg-[#fdeaea]" aria-label={`Supprimer ${u.name}`}>
                                                    <Trash2 className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pageItems.length === 0 && (
                                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#666]">Aucun compte ne correspond.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={currentPage} lastPage={lastPage} total={filtered.length} perPage={PER_PAGE} onChange={setPage} noun={filtered.length > 1 ? 'comptes' : 'compte'} />
            </Panel>

            <Drawer
                open={Boolean(form)}
                onClose={() => setForm(null)}
                title={form?.id ? `Modifier ${form.name}` : 'Ajouter un utilisateur'}
                footer={
                    <div className="flex justify-end gap-2.5">
                        <button type="button" onClick={() => setForm(null)} className={buttonClass('secondary')}>Annuler</button>
                        <button type="button" onClick={save} disabled={saving} className={buttonClass('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                }
            >
                {form && (
                    <div className="space-y-5">
                        <Notice>{formError}</Notice>
                        <div>
                            <label htmlFor="u-name" className={labelClass}>Nom complet</label>
                            <input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${fieldClass} w-full`} />
                        </div>
                        <div>
                            <label htmlFor="u-email" className={labelClass}>Adresse e-mail</label>
                            <input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${fieldClass} w-full`} />
                        </div>
                        <div>
                            <label htmlFor="u-phone" className={labelClass}>Téléphone WhatsApp <span className="font-normal text-[#767676]">(facultatif)</span></label>
                            <input id="u-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 00 00 00 00" className={`${fieldClass} w-full`} />
                        </div>
                        <div>
                            <label htmlFor="u-password" className={labelClass}>{form.id ? 'Nouveau mot de passe' : 'Mot de passe'} {form.id && <span className="font-normal text-[#767676]">(laisser vide pour ne pas changer)</span>}</label>
                            <input id="u-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${fieldClass} w-full`} />
                            <p className="mt-1.5 text-[12.5px] text-[#666]">8 caractères minimum.</p>
                        </div>
                        <Switch
                            showLabel
                            label="Accès administrateur au back-office"
                            checked={form.is_admin}
                            disabled={form.id === currentUser?.id}
                            onChange={(v) => setForm({ ...form, is_admin: v })}
                        />
                        {form.id === currentUser?.id && <p className="-mt-3 text-[12.5px] text-[#666]">Vous ne pouvez pas retirer vos propres droits.</p>}
                    </div>
                )}
            </Drawer>

            <ConfirmDialog
                open={Boolean(toDelete)}
                title="Supprimer le compte"
                message={`Supprimer le compte de ${toDelete?.name ?? ''} ? Ses commandes sont conservées, sans lien avec un compte.`}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
                loading={deleting}
            />
        </DashboardLayout>
    );
}
