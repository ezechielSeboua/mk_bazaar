import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    createCategory,
    updateCategory,
    deleteCategory
} from '../../services/category';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { resolveMediaUrl } from '../../config/env';

/* ---------- Icônes SVG (inchangé) ---------- */
function ColonIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg className="w-6 h-6 text-stone-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
    );
}

const tableRow = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.03, duration: 0.25, ease: "easeOut" },
    }),
};

function SkeletonRow() {
    return (
        <motion.tr
            className="border-b border-stone-100"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
            <td className="py-4 px-4 md:px-6"><div className="h-4 w-32 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-4 px-4 md:px-6"><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-4 px-4 md:px-6"><div className="h-4 w-48 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-4 px-4 md:px-6"><div className="h-10 w-10 bg-stone-100 rounded animate-pulse" /></td>
            <td className="py-4 px-4 md:px-6"><div className="h-5 w-14 bg-stone-100 rounded-full animate-pulse" /></td>
            <td className="py-4 px-4 md:px-6"><div className="h-8 w-8 bg-stone-100 rounded-full animate-pulse ml-auto" /></td>
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
        is_active: true,
    });
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSlugManual, setIsSlugManual] = useState(false);

    const [errors, setErrors] = useState({});
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // pour le portail
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    const fileInputRef = useRef(null);
    const formRef = useRef(null);
    const menuButtonRef = useRef(null);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });
    const [deletingId, setDeletingId] = useState(null);

    // Fermeture du menu contextuel (clic extérieur)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuButtonRef.current &&
                !menuButtonRef.current.contains(event.target)
            ) {
                const portal = document.getElementById('menu-portal-cat');
                if (portal && !portal.contains(event.target)) {
                    setOpenMenuId(null);
                } else if (!portal) {
                    setOpenMenuId(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'slug') {
            setIsSlugManual(value.trim() !== "");
        }

        setFormData((prev) => {
            const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
            if (name === 'name' && !editingId && !isSlugManual) {
                newData.slug = generateSlug(value);
            }
            return newData;
        });
    };

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nom requis';
        if (!formData.slug.trim()) newErrors.slug = 'Slug requis';
        return newErrors;
    };

    const resetForm = () => {
        setFormData({ name: '', slug: '', description: '', is_active: true });
        setImageFile(null);
        setImagePreview(null);
        setIsSlugManual(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setEditingId(null);
        setErrors({});
        setShowForm(false);
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

        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('slug', formData.slug);
        dataToSend.append('description', formData.description);
        dataToSend.append('is_active', formData.is_active ? '1' : '0');
        
        if (imageFile) {
            dataToSend.append('image_path', imageFile);
        }

        try {
            let result;
            if (editingId) {
                dataToSend.append('_method', 'PUT');
                result = await updateCategory(editingId, dataToSend); 
                
                if (result.success) {
                    const updatedData = result.data?.data || result.data;
                    setCategories(categories.map(c => c.id === editingId ? updatedData : c));
                    triggerNotification('Catégorie mise à jour avec succès');
                    resetForm();
                }
            } else {
                result = await createCategory(dataToSend);
                if (result.success) {
                    const createdData = result.data?.data || result.data;
                    setCategories([...categories, createdData]);
                    triggerNotification('Catégorie créée avec succès');
                    resetForm();
                }
            }

            if (!result?.success) {
                setApiError(result?.error || 'Une erreur est survenue lors de la communication avec le serveur.');
            }
        } catch (err) {
            setApiError('Erreur de connexion réseau inattendue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const triggerNotification = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 4000);
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            is_active: category.is_active === 1 || category.is_active === true,
        });
        
        setImagePreview(category.image_path || null);
        setImageFile(null);
        setIsSlugManual(true);
        setEditingId(category.id);
        setShowForm(true);
        setOpenMenuId(null);
        
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDelete = async () => {
        const id = confirmDelete.id;
        if (!id) return;
        setDeletingId(id);
        try {
            const result = await deleteCategory(id);
            if (result.success) {
                setCategories(categories.filter(c => c.id !== id));
                triggerNotification('Catégorie supprimée définitivement');
            } else {
                setApiError(result?.error || 'Impossible de supprimer cette catégorie.');
            }
        } catch (err) {
            setApiError('Erreur système lors du traitement de la suppression.');
        } finally {
            setDeletingId(null);
            setConfirmDelete({ show: false, id: null, name: "" });
        }
    };

    // Gestion du menu contextuel avec portail
    const handleMenuToggle = (categoryId, event) => {
        event.stopPropagation();
        if (openMenuId === categoryId) {
            setOpenMenuId(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 4,
                left: rect.right - 160, // largeur w-36 = 144px ≈ 160 pour marge
            });
            setOpenMenuId(categoryId);
        }
    };

    const requestDelete = (category) => {
        setConfirmDelete({ show: true, id: category.id, name: category.name });
        setOpenMenuId(null);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-[1600px] mx-auto relative px-1">
                
                {/* Notification Floating System */}
                <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
                    <AnimatePresence>
                        {apiError && (
                            <motion.div
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                className="pointer-events-auto bg-stone-900 border border-red-500 text-red-200 p-4 rounded text-xs tracking-wide uppercase font-medium shadow-xl"
                            >
                                <div className="flex justify-between items-start">
                                    <span>{apiError}</span>
                                    <button onClick={() => setApiError(null)} className="ml-2 text-stone-400 hover:text-white">✕</button>
                                </div>
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                className="pointer-events-auto bg-black text-[#F9F9F7] border border-stone-800 p-4 rounded text-xs tracking-wide uppercase font-medium shadow-xl"
                            >
                                {successMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-5">
                    <div>
                        <h1 className="text-xl md:text-2xl font-light uppercase tracking-wider text-stone-900">Catégories</h1>
                        <p className="text-stone-500 text-xs mt-1">
                            {isLoading && categories.length === 0 ? (
                                <span className="inline-block w-16 h-3 bg-stone-100 rounded animate-pulse" />
                            ) : (
                                <span>{categories.length} entité(s) enregistrée(s)</span>
                            )}
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-black text-[#F9F9F7] px-5 py-2.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-stone-800 transition-all active:scale-[0.98]"
                        >
                            + Nouvelle catégorie
                        </button>
                    )}
                </div>

                {/* Interactive Form Section */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            ref={formRef}
                            initial={{ opacity: 0, y: -15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="bg-white border border-stone-200 shadow-sm rounded-lg p-5 md:p-6"
                        >
                            {/* … le reste du formulaire, inchangé … */}
                            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">
                                {editingId ? 'Modification de la fiche' : 'Création de fiche'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-stone-700 block mb-2">Nom complet *</label>
                                        <input
                                            type="text" name="name" value={formData.name} onChange={handleChange}
                                            className={`w-full px-3 py-2.5 border text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-black'}`}
                                            placeholder="Ex: Électronique, Mobilier..."
                                        />
                                        {errors.name && <p className="text-red-500 text-[10px] mt-1.5 uppercase font-medium tracking-wide">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-stone-700 block mb-2">Lien URL (Slug) *</label>
                                        <input
                                            type="text" name="slug" value={formData.slug} onChange={handleChange}
                                            className={`w-full px-3 py-2.5 border text-sm focus:outline-none transition-colors ${errors.slug ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-black'}`}
                                            placeholder="Ex: electronique-de-salon"
                                        />
                                        {errors.slug && <p className="text-red-500 text-[10px] mt-1.5 uppercase font-medium tracking-wide">{errors.slug}</p>}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-700 block mb-2">Description descriptive</label>
                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange}
                                        rows="2" className="w-full px-3 py-2.5 border border-stone-300 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                                        placeholder="Description facultative de la gamme de produits..."
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-700 block mb-2">Image d'illustration</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`group relative border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                                            isDragOver ? 'border-black bg-stone-50' : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-400'
                                        }`}
                                    >
                                        <input
                                            type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden"
                                        />
                                        
                                        {imagePreview ? (
                                            <div className="flex items-center gap-5 w-full">
                                                <div className="w-16 h-16 rounded overflow-hidden border border-stone-200 bg-white shadow-sm flex-shrink-0">
                                                    <img src={imagePreview.startsWith('blob:') ? imagePreview : resolveMediaUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-medium text-stone-900">Image sélectionnée</p>
                                                    <p className="text-[11px] text-stone-500 mt-0.5">Cliquez ou glissez à nouveau pour remplacer.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadIcon />
                                                <div className="text-center">
                                                    <p className="text-xs font-medium text-stone-800">Glissez-déposez un fichier ici, ou <span className="underline font-bold">parcourez</span></p>
                                                    <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">Format WebP, JPG, PNG jusqu'à 2 Mo</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-2.5 pt-1">
                                    <input
                                        type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange}
                                        className="w-4 h-4 rounded border-stone-300 text-black focus:ring-transparent checked:bg-black accent-black cursor-pointer"
                                    />
                                    <label htmlFor="is_active" className="text-xs font-semibold uppercase tracking-wider text-stone-700 select-none cursor-pointer">
                                        Rendre cette catégorie visible sur le catalogue
                                    </label>
                                </div>

                                <div className="flex gap-3 border-t border-stone-100 pt-5 mt-2">
                                    <button type="submit" disabled={isSubmitting}
                                        className="bg-black text-[#F9F9F7] px-5 py-2.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-stone-800 disabled:opacity-40 transition-colors">
                                        {isSubmitting ? 'Opération en cours...' : editingId ? 'Valider les modifications' : 'Enregistrer la catégorie'}
                                    </button>
                                    <button type="button" onClick={resetForm}
                                        className="border border-stone-300 text-stone-700 px-5 py-2.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-stone-50 hover:text-black transition-colors">
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table View Component */}
                <motion.div
                    className="bg-white border border-stone-200 rounded-lg shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50/70 border-b border-stone-200">
                                    <th className="py-3 px-4 md:px-6 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Nom</th>
                                    <th className="py-3 px-4 md:px-6 font-bold uppercase text-[10px] text-stone-500 tracking-wider">Identifiant URL</th>
                                    <th className="py-3 px-4 md:px-6 font-bold uppercase text-[10px] text-stone-500 tracking-wider hidden md:table-cell">Description</th>
                                    <th className="py-3 px-4 md:px-6 font-bold uppercase text-[10px] text-stone-500 tracking-wider w-16 text-center">Visuel</th>
                                    <th className="py-3 px-4 md:px-6 font-bold uppercase text-[10px] text-stone-500 tracking-wider w-24">Statut</th>
                                    <th className="py-3 px-4 md:px-6 font-bold uppercase text-[10px] text-stone-500 tracking-wider w-16 text-right">Actions</th>
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
                                        <td colSpan="6" className="py-14 text-center text-stone-400 text-xs uppercase tracking-widest bg-stone-50/20">
                                            Aucune donnée disponible pour le moment.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category, index) => (
                                        <motion.tr
                                            key={category.id}
                                            className="group border-b border-stone-100 hover:bg-stone-50/40 transition-colors"
                                            custom={index}
                                            variants={tableRow}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <td className="py-4 px-4 md:px-6 font-medium text-stone-900 text-xs md:text-sm">{category.name}</td>
                                            <td className="py-4 px-4 md:px-6 text-stone-500 font-mono text-[11px]">{category.slug}</td>
                                            <td className="py-4 px-4 md:px-6 text-stone-500 text-xs hidden md:table-cell max-w-xs truncate">{category.description || '—'}</td>
                                            <td className="py-4 px-4 md:px-6 text-center">
                                                <div className="w-9 h-9 border border-stone-200 rounded bg-stone-100 mx-auto overflow-hidden shadow-sm">
                                                    {category.image_path ? (
                                                        <img src={resolveMediaUrl(category.image_path)} alt={category.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-400 uppercase font-bold">N/A</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 md:px-6">
                                                <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded ${
                                                    (category.is_active === 1 || category.is_active === true) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-500'
                                                }`}>
                                                    {(category.is_active === 1 || category.is_active === true) ? 'Activé' : 'Masqué'}
                                                </span>
                                            </td>
                                            
                                            {/* Bouton d'action sans menu imbriqué */}
                                            <td className="py-4 px-4 md:px-6 text-right relative">
                                                <button
                                                    ref={openMenuId === category.id ? menuButtonRef : null}
                                                    onClick={(e) => handleMenuToggle(category.id, e)}
                                                    className="p-1 text-stone-400 hover:text-black hover:bg-stone-100 rounded-full transition-all inline-flex items-center justify-center"
                                                >
                                                    <ColonIcon />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Menu contextuel via Portail */}
                {openMenuId &&
                    createPortal(
                        <motion.div
                            id="menu-portal-cat"
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            transition={{ duration: 0.12 }}
                            className="fixed z-[100] w-36 bg-white border border-stone-200 rounded shadow-xl py-1 text-left overflow-hidden"
                            style={{ top: menuPosition.top, left: menuPosition.left }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const category = categories.find(c => c.id === openMenuId);
                                    if (category) handleEdit(category);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs hover:bg-stone-50 transition-colors flex items-center gap-2 text-stone-700 hover:text-black font-medium"
                            >
                                <EditIcon /> Éditer
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const category = categories.find(c => c.id === openMenuId);
                                    if (category) requestDelete(category);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium border-t border-stone-50"
                            >
                                <TrashIcon /> Supprimer
                            </button>
                        </motion.div>,
                        document.body
                    )
                }

                {/* Modale de confirmation de suppression */}
                <ConfirmDialog
                    open={confirmDelete.show}
                    title="Demande de suppression"
                    message={
                        <>
                            Êtes-vous certain de vouloir supprimer la catégorie <span className="font-bold text-black">"{confirmDelete.name}"</span> ? Tous les produits associés perdront leur liaison d'arborescence.
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