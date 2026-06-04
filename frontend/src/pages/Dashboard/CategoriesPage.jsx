import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    createCategory,
    updateCategory,
    deleteCategory
} from '../../services/category';
import { useDashboardData } from '../../contexts/DashboardDataContext';

/* ---------- Icônes SVG ---------- */
function ColonIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2.5" />
            <circle cx="12" cy="18" r="2.5" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

// Variantes d'animation
const tableRow = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.05, duration: 0.3 },
    }),
};

// Composant de ligne squelette
function SkeletonRow() {
    return (
        <motion.tr
            className="border-b border-stone-100"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
            <td className="py-4 px-6"><div className="h-4 w-32 bg-stone-200 rounded" /></td>
            <td className="py-4 px-6"><div className="h-4 w-24 bg-stone-200 rounded" /></td>
            <td className="py-4 px-6"><div className="h-4 w-48 bg-stone-200 rounded" /></td>
            <td className="py-4 px-6"><div className="h-4 w-20 bg-stone-200 rounded" /></td>
        </motion.tr>
    );
}

export default function CategoriesPage() {
    const { categories, setCategories, isLoading } = useDashboardData();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
    });
    const [errors, setErrors] = useState({});
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const menuRef = useRef(null);

    // États pour la confirmation de suppression
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nom requis';
        if (!formData.slug.trim()) newErrors.slug = 'Slug requis';
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
        setApiError(null);
        setSuccessMessage(null);

        try {
            let result;
            if (editingId) {
                result = await updateCategory(editingId, formData);
                if (result.success) {
                    setCategories(categories.map(c => c.id === editingId ? result.data : c));
                    setSuccessMessage('Catégorie mise à jour');
                    setEditingId(null);
                }
            } else {
                result = await createCategory(formData);
                if (result.success) {
                    setCategories([...categories, result.data.data || result.data]);
                    setSuccessMessage('Catégorie créée');
                }
            }

            if (result?.success) {
                setFormData({ name: '', slug: '', description: '' });
                setShowForm(false);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setApiError(result?.error || 'Erreur API');
            }
        } catch (err) {
            setApiError('Erreur inattendue');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (category) => {
        setFormData(category);
        setEditingId(category.id);
        setShowForm(true);
        setOpenMenuId(null);
    };

    // Demande de suppression : ouvre la modale de confirmation
    const requestDelete = (category) => {
        setConfirmDelete({ show: true, id: category.id, name: category.name });
        setOpenMenuId(null);
    };

    // Suppression effective après confirmation
    const handleDelete = async () => {
        const id = confirmDelete.id;
        if (!id) return;
        setDeletingId(id);
        try {
            const result = await deleteCategory(id);
            if (result.success) {
                setCategories(categories.filter(c => c.id !== id));
                setSuccessMessage('Catégorie supprimée');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setApiError(result?.error || 'Erreur lors de la suppression');
            }
        } catch (err) {
            setApiError('Erreur inattendue');
        } finally {
            setDeletingId(null);
            setConfirmDelete({ show: false, id: null, name: "" });
        }
    };

    const toggleMenu = (id) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Messages */}
                <AnimatePresence>
                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-50 border border-red-200 p-3 text-red-700 text-sm"
                        >
                            {apiError}
                        </motion.div>
                    )}
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-green-50 border border-green-200 p-3 text-green-700 text-sm"
                        >
                            {successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div>
                        <h1 className="text-3xl font-light uppercase tracking-tight">Catégories</h1>
                        <p className="text-stone-600 text-sm mt-1">
                            {isLoading && categories.length === 0 ? (
                                <span className="inline-block w-20 h-4 bg-stone-200 rounded animate-pulse" />
                            ) : (
                                <motion.span
                                    key={categories.length}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {categories.length} catégorie(s)
                                </motion.span>
                            )}
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-black text-[#F9F9F7] px-6 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
                        >
                            + Ajouter une catégorie
                        </button>
                    )}
                </motion.div>

                {/* Formulaire */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <h2 className="text-lg font-medium uppercase tracking-wider mb-6">
                                    {editingId ? 'Éditer la catégorie' : 'Nouvelle catégorie'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Nom *</label>
                                            <input
                                                type="text" name="name" value={formData.name} onChange={handleChange}
                                                className={`w-full px-3 py-2 border text-sm ${errors.name ? 'border-red-400' : 'border-stone-300'}`}
                                            />
                                            {errors.name && <p className="text-red-600 text-[10px] mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Slug *</label>
                                            <input
                                                type="text" name="slug" value={formData.slug} onChange={handleChange}
                                                className={`w-full px-3 py-2 border text-sm ${errors.slug ? 'border-red-400' : 'border-stone-300'}`}
                                            />
                                            {errors.slug && <p className="text-red-600 text-[10px] mt-1">{errors.slug}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Description</label>
                                        <textarea
                                            name="description" value={formData.description} onChange={handleChange}
                                            rows="3" className="w-full px-3 py-2 border border-stone-300 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" disabled={isSubmitting}
                                            className="bg-black text-[#F9F9F7] px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 disabled:opacity-50">
                                            {isSubmitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
                                        </button>
                                        <button type="button" onClick={() => { setShowForm(false); setErrors({}); }}
                                            className="border border-stone-300 px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50">
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tableau */}
                <motion.div
                    className="bg-white border border-stone-200 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Nom</th>
                                    <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Slug</th>
                                    <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Description</th>
                                    <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && categories.length === 0 ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-stone-400 text-sm">
                                            Aucune catégorie pour le moment.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category, index) => (
                                        <motion.tr
                                            key={category.id}
                                            className="border-b border-stone-100 hover:bg-stone-50"
                                            custom={index}
                                            variants={tableRow}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <td className="py-4 px-6 font-medium">{category.name}</td>
                                            <td className="py-4 px-6 text-stone-600">{category.slug}</td>
                                            <td className="py-4 px-6 text-stone-600 text-[13px]">{category.description}</td>
                                            <td className="py-4 px-6 relative overflow-visible">
                                                <button
                                                    onClick={() => toggleMenu(category.id)}
                                                    className="text-stone-500 hover:text-stone-800 p-1 rounded transition-colors"
                                                >
                                                    <ColonIcon />
                                                </button>
                                                {openMenuId === category.id && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute right-6 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-lg z-50 py-1"
                                                    >
                                                        <button
                                                            onClick={() => handleEdit(category)}
                                                            className="w-full text-left px-4 py-2 text-[13px] hover:bg-stone-100 transition-colors flex items-center gap-2"
                                                        >
                                                            <EditIcon /> Éditer
                                                        </button>
                                                        <button
                                                            onClick={() => requestDelete(category)}
                                                            className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <TrashIcon /> Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Confirmation de suppression */}
                <ConfirmDialog
                    open={confirmDelete.show}
                    title="Confirmer la suppression"
                    message={
                        <>
                            Voulez-vous vraiment supprimer la catégorie <span className="font-semibold text-black">"{confirmDelete.name}"</span> ? Cette action est irréversible.
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