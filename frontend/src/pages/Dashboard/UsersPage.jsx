import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { DashboardTableSkeleton } from "../../components/DashboardSkeletons";
import {
  createUser,
  updateUser,
  deleteUser,
} from "../../services/users";
import { useDashboardData } from "../../contexts/DashboardDataContext";

/* ---------- Icônes SVG ---------- */
function ColonIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
    </svg>
  );
}

function EditIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function TrashIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function UsersPage() {
  const { users, setUsers, isLoading } = useDashboardData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    is_admin: false,
  });
  const [errors, setErrors] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue;
    if (type === "checkbox") {
      newValue = checked;
    } else if (name === "is_admin") {
      newValue = value === "1";
    } else {
      newValue = value;
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email invalide";
    if (!editingId && !formData.password.trim())
      newErrors.password = "Mot de passe requis pour un nouvel utilisateur";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        is_admin: formData.is_admin ? true : false,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (editingId) {
        const updated = await updateUser(editingId, payload);
        if (updated.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingId ? { ...u, ...payload } : u)),
          );
        }
      } else {
        const created = await createUser(payload);
        if (created.success) {
          setUsers((prev) => [...prev, created.data]);
        }
      }

      setFormData({ name: "", email: "", password: "", is_admin: false });
      setEditingId(null);
      setShowForm(false);
      setErrors({});
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      is_admin: user.is_admin === 1 || user.is_admin === true, // conversion
    });
    setEditingId(user.id);
    setShowForm(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?"))
      return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error(error);
    }
    setOpenMenuId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", is_admin: false });
    setErrors({});
  };

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light uppercase tracking-tight">
              Utilisateurs
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              {isLoading && users.length === 0 ? (
                <span className="inline-block w-24 h-4 bg-stone-200 rounded animate-pulse" />
              ) : (
                `${users.length} utilisateurs`
              )}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-[#F9F9F7] px-6 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900"
            >
              + Ajouter un utilisateur
            </button>
          )}
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <h2 className="text-lg font-medium uppercase tracking-wider mb-6">
              {editingId ? "Éditer l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border text-sm ${
                      errors.name ? "border-red-400" : "border-stone-300"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-[10px] mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border text-sm ${
                      errors.email ? "border-red-400" : "border-stone-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-[10px] mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
                    Rôle
                  </label>
                  <select
                    name="is_admin"
                    value={formData.is_admin ? "1" : "0"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 text-sm"
                  >
                    <option value="0">Client</option>
                    <option value="1">Administrateur(trice)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
                    Mot de passe {!editingId && "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingId
                        ? "Laisser vide pour conserver le mot de passe"
                        : ""
                    }
                    className={`w-full px-3 py-2 border text-sm ${
                      errors.password ? "border-red-400" : "border-stone-300"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-600 text-[10px] mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-[#F9F9F7] px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Enregistrement..."
                    : editingId
                      ? "Mettre à jour"
                      : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-stone-300 px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste */}
        <div className="bg-white border border-stone-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">
                    Nom
                  </th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">
                    Rôle
                  </th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">
                    Date d'inscription
                  </th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && users.length === 0 ? (
                  <DashboardTableSkeleton rows={4} cols={5} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-stone-400 text-sm">
                      Aucun utilisateur
                    </td>
                  </tr>
                ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-stone-100 hover:bg-stone-50"
                  >
                    <td className="py-4 px-6 font-medium">{user.name}</td>
                    <td className="py-4 px-6 text-stone-600">{user.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          user.is_admin
                            ? "bg-purple-100 text-purple-800"
                            : "bg-stone-100 text-stone-800"
                        }`}
                      >
                        {user.is_admin ? "Administrateur" : "Client"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-600">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td className="py-4 px-6 relative overflow-visible">
                      <button
                        onClick={() => toggleMenu(user.id)}
                        className="text-stone-500 hover:text-stone-800 p-1 rounded transition-colors"
                        title="Actions"
                      >
                        <ColonIcon />
                      </button>
                      {openMenuId === user.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-6 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-lg z-50 py-1"
                        >
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-full text-left px-4 py-2 text-[13px] hover:bg-stone-100 transition-colors flex items-center gap-2"
                          >
                            <EditIcon className="w-4 h-4" />
                            Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
