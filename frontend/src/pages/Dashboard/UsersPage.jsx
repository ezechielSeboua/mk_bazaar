import { useState, useEffect, useRef, useCallback } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import { DashboardTableSkeleton } from "../../components/DashboardSkeletons";
import { createUser, updateUser, deleteUser } from "../../services/users";
import { useDashboardData } from "../../contexts/DashboardDataContext";
import { useAuth } from "../../contexts/AuthContext";

/* ─── Constantes ─────────────────────────────────────────────────── */

const EMPTY_FORM = { name: "", email: "", password: "", is_admin: false };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit", month: "short", year: "numeric",
});

/* ─── Micro-composants ───────────────────────────────────────────── */

function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider font-bold block">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-red-600 text-[10px] mt-1 animate-[fadeIn_0.2s_ease-out]">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError) =>
  `w-full px-3 py-2 border text-sm transition-colors duration-200 focus:outline-none focus:border-stone-950 ${
    hasError ? "border-red-400 bg-red-50/30" : "border-stone-300"
  }`;

/* ─── Page ───────────────────────────────────────────────────────── */

export default function UsersPage() {
  const { users, setUsers, isLoading } = useDashboardData();
  const { user: currentUser } = useAuth();

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const successTimerRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });
  const [deletingId, setDeletingId] = useState(null);

  // Menu contextuel
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuContainerRef = useRef(null);

  /* ── Fermeture menu au clic extérieur ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Afficher un message de succès temporaire ── */
  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Nettoyage du timer
  useEffect(() => {
    return () => clearTimeout(successTimerRef.current);
  }, []);

  /* ── Formulaire ── */

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox"
      ? checked
      : name === "is_admin"
        ? value === "1"
        : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => prev[name] ? { ...prev, [name]: "" } : prev);
  }, []);

  const validateForm = useCallback(() => {
    const e = {};
    if (!formData.name.trim()) e.name = "Le nom est requis";
    if (!formData.email.trim()) e.email = "L'email est requis";
    else if (!EMAIL_RE.test(formData.email)) e.email = "Email invalide";
    if (!editingId && !formData.password.trim())
      e.password = "Mot de passe requis pour un nouvel utilisateur";
    return e;
  }, [formData, editingId]);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        is_admin: Boolean(formData.is_admin),
        ...(formData.password.trim() && { password: formData.password }),
      };

      if (editingId) {
        const result = await updateUser(editingId, payload);
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingId ? { ...u, ...payload } : u))
          );
          showSuccess("Utilisateur mis à jour avec succès.");
          resetForm();
        } else {
          setApiError(result?.error || "Erreur lors de la mise à jour");
        }
      } else {
        const result = await createUser(payload);
        if (result.success) {
          setUsers((prev) => [...prev, result.data]);
          showSuccess("Utilisateur créé avec succès.");
          resetForm();
        } else {
          setApiError(result?.error || "Erreur lors de la création");
        }
      }
    } catch (err) {
      console.error(err);
      setApiError("Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingId, validateForm, resetForm, setUsers, showSuccess]);

  const handleEdit = useCallback((user) => {
    setFormData({
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      is_admin: user.is_admin === 1 || user.is_admin === true,
    });
    setEditingId(user.id);
    setShowForm(true);
    setOpenMenuId(null);
  }, []);

  /* ── Suppression ── */
  const requestDelete = useCallback((user) => {
    setConfirmDelete({ show: true, id: user.id, name: user.name });
    setOpenMenuId(null);
  }, []);

  const handleDelete = useCallback(async () => {
    const { id } = confirmDelete;
    if (!id) return;
    setDeletingId(id);
    try {
      const result = await deleteUser(id);
      if (result?.success !== false) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showSuccess("Utilisateur supprimé.");
      } else {
        setApiError(result?.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      setApiError("Erreur inattendue");
    } finally {
      setDeletingId(null);
      setConfirmDelete({ show: false, id: null, name: "" });
    }
  }, [confirmDelete, setUsers, showSuccess]);

  /* ─── Rendu ─────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      {/* Keyframes CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes tableFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="space-y-4 md:space-y-6">

        {/* Erreur API */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 p-3 text-red-700 text-sm animate-[slideDown_0.25s_ease-out]">
            {apiError}
          </div>
        )}

        {/* Message de succès */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 p-3 text-green-700 text-sm animate-[slideDown_0.25s_ease-out]">
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
              Utilisateurs
            </h1>
            <p className="text-stone-600 text-sm mt-1 transition-all duration-300">
              {isLoading && users.length === 0
                ? <span className="inline-block w-24 h-4 bg-stone-200 rounded animate-pulse" />
                : `${users.length} utilisateur(s)`
              }
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="self-start sm:self-auto bg-black text-[#F9F9F7] px-4 py-2.5 sm:px-6 sm:py-3 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-all duration-200 active:scale-[0.98] animate-[fadeIn_0.2s_ease-out]"
            >
              + Ajouter un utilisateur
            </button>
          )}
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-6 shadow-sm origin-top animate-[slideDown_0.28s_cubic-bezier(0.16,1,0.3,1)]">
            <h2 className="text-base sm:text-lg font-medium uppercase tracking-wider mb-4 sm:mb-6 text-stone-800">
              {editingId ? "Éditer l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nom complet *" error={errors.name}>
                  <input type="text" name="name" value={formData.name}
                    onChange={handleChange} className={inputCls(errors.name)} />
                </Field>
                <Field label="Email *" error={errors.email}>
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} className={inputCls(errors.email)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Rôle">
                  <select name="is_admin" value={formData.is_admin ? "1" : "0"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 text-sm transition-colors focus:outline-none focus:border-stone-950"
                  >
                    <option value="0">Client</option>
                    <option value="1">Administrateur(trice)</option>
                  </select>
                </Field>
                <Field label={`Mot de passe${!editingId ? " *" : ""}`} error={errors.password}>
                  <input type="password" name="password" value={formData.password}
                    onChange={handleChange}
                    placeholder={editingId ? "Laisser vide pour conserver" : ""}
                    className={inputCls(errors.password)} />
                </Field>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSubmitting}
                  className="bg-black text-[#F9F9F7] px-4 sm:px-6 py-2 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
                </button>
                <button type="button" onClick={resetForm}
                  className="border border-stone-300 px-4 sm:px-6 py-2 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau */}
        <div
          className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden animate-[tableFadeIn_0.45s_ease-out]"
          key={users.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {["Nom", "Email", "Rôle", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-2 md:px-4 font-bold uppercase text-[10px] tracking-wider text-stone-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading && users.length === 0 ? (
                  <DashboardTableSkeleton rows={4} cols={5} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-stone-400 text-sm animate-[fadeIn_0.3s_ease-out]">
                      Aucun utilisateur
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    return (
                      <tr key={user.id} className="hover:bg-stone-50/80 transition-colors duration-150">
                        <td className="py-3 px-2 md:py-4 md:px-4 font-medium text-stone-900 truncate max-w-[120px] sm:max-w-none">
                          {user.name}
                        </td>
                        <td className="py-3 px-2 md:py-4 md:px-4 text-stone-600 truncate max-w-[150px] sm:max-w-none">
                          {user.email}
                        </td>
                        <td className="py-3 px-2 md:py-4 md:px-4">
                          <span className={`inline-block px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] font-bold tracking-wide ${
                            user.is_admin
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : "bg-stone-100 text-stone-800"
                          }`}>
                            {user.is_admin ? "Admin" : "Client"}
                          </span>
                        </td>
                        <td className="py-3 px-2 md:py-4 md:px-4 text-stone-600 whitespace-nowrap">
                          {user.created_at ? DATE_FMT.format(new Date(user.created_at)) : "—"}
                        </td>

                        {/* Menu contextuel */}
                        <td className="py-3 px-2 md:py-4 md:px-4 relative overflow-visible"
                          ref={openMenuId === user.id ? menuContainerRef : null}
                        >
                          <button
                            onClick={() => setOpenMenuId((id) => id === user.id ? null : user.id)}
                            className={`p-1 rounded transition-all duration-150 ${
                              openMenuId === user.id ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openMenuId === user.id && (
                            <div className="absolute right-0 md:right-4 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-xl z-50 py-1 origin-top-right animate-[scaleIn_0.15s_cubic-bezier(0.16,1,0.3,1)]">
                              <button onClick={() => handleEdit(user)}
                                className="w-full text-left px-4 py-2 text-[13px] text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5 text-stone-400" /> Éditer
                              </button>
                              {!isSelf && (
                                <button onClick={() => requestDelete(user)}
                                  className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50/60 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" /> Supprimer
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation suppression */}
        <ConfirmDialog
          open={confirmDelete.show}
          title="Confirmer la suppression"
          message={
            <>
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold text-black">"{confirmDelete.name}"</span>
              {" "}? Cette action est irréversible.
            </>
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete({ show: false, id: null, name: "" })}
          loading={deletingId === confirmDelete.id}
        />
      </div>
    </DashboardLayout>
  );
}