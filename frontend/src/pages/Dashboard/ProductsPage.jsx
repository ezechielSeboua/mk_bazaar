import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/product";
import { useDashboardData } from "../../contexts/DashboardDataContext";
import { resolveMediaUrl } from "../../config/env";

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
    <svg
      className="w-4 h-4"
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

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
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

// Nouvelles icônes pour les filtres
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4L7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

// Ligne squelette animée
function SkeletonRow() {
  return (
    <motion.tr
      className="border-b border-stone-100"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    >
      <td className="py-4 px-6"><div className="w-10 h-10 bg-stone-200 rounded" /></td>
      <td className="py-4 px-6"><div className="h-4 w-32 bg-stone-200 rounded" /></td>
      <td className="py-4 px-6"><div className="h-4 w-20 bg-stone-200 rounded" /></td>
      <td className="py-4 px-6"><div className="h-4 w-16 bg-stone-200 rounded" /></td>
      <td className="py-4 px-6"><div className="h-5 w-16 bg-stone-200 rounded-full" /></td>
      <td className="py-4 px-6"><div className="h-5 w-12 bg-stone-200 rounded-full" /></td>
      <td className="py-4 px-6"><div className="h-4 w-12 bg-stone-200 rounded" /></td>
    </motion.tr>
  );
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category_id: "",
  in_stock: true,
  featured: false,
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export default function ProductsPage() {
  const { products, setProducts, categories, isLoading } = useDashboardData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const menuRef = useRef(null);

  // États pour la confirmation de suppression
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });
  const [deletingId, setDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  const hasActiveFilters = searchQuery || categoryFilter || stockFilter || featuredFilter;

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (query) {
        const name = (product.name || "").toLowerCase();
        const slug = (product.slug || "").toLowerCase();
        if (!name.includes(query) && !slug.includes(query)) return false;
      }

      if (categoryFilter && String(product.category_id) !== categoryFilter) {
        return false;
      }

      if (stockFilter === "in_stock" && !product.in_stock) return false;
      if (stockFilter === "out_of_stock" && product.in_stock) return false;

      if (featuredFilter === "yes" && !product.featured) return false;
      if (featuredFilter === "no" && product.featured) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, featuredFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setStockFilter("");
    setFeaturedFilter("");
  };

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
    let newValue = type === "checkbox" ? checked : value;

    if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        slug: generateSlug(newValue),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nom requis";
    if (!formData.slug.trim()) newErrors.slug = "Slug requis";
    if (!formData.description.trim()) newErrors.description = "Description requise";
    if (!formData.price) newErrors.price = "Prix requis";
    if (!formData.category_id) newErrors.category_id = "Catégorie requise";
    if (!editingId && selectedFiles.length === 0) newErrors.images = "Au moins une image requise pour un nouveau produit";
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
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("slug", formData.slug);
      fd.append("description", formData.description);
      fd.append("price", parseInt(formData.price, 10));
      fd.append("category_id", parseInt(formData.category_id, 10));
      fd.append("in_stock", formData.in_stock ? 1 : 0);
      fd.append("featured", formData.featured ? 1 : 0);

      selectedFiles.forEach((file) => {
        fd.append("image_path[]", file);
      });

      let result;
      if (editingId) {
        result = await updateProduct(editingId, fd);
        if (result.success) {
          setProducts(products.map((p) => (p.id === editingId ? result.data : p)));
          setSuccessMessage("Produit mis à jour");
          setEditingId(null);
        }
      } else {
        result = await createProduct(fd);
        if (result.success) {
          setProducts([...products, result.data]);
          setSuccessMessage("Produit créé");
        }
      }

      if (result?.success) {
        setFormData(EMPTY_FORM);
        setSelectedFiles([]);
        setExistingImages([]);
        setShowForm(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setApiError(result?.error || "Erreur API");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setApiError("Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: product.price || "",
      category_id: product.category_id || "",
      in_stock: product.in_stock ?? true,
      featured: product.featured ?? false,
    });
    const existingImages = (product.image_path || []).map((path, idx) => ({
      id: idx,
      url: path,
    }));
    setExistingImages(existingImages);
    setSelectedFiles([]);
    setEditingId(product.id);
    setShowForm(true);
    setOpenMenuId(null);
  };

  // Demande de suppression : ouvre la modale de confirmation
  const requestDelete = (product) => {
    setConfirmDelete({ show: true, id: product.id, name: product.name });
    setOpenMenuId(null);
  };

  // Suppression effective après confirmation
  const handleDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;
    setDeletingId(id);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts(products.filter((p) => p.id !== id));
        setSuccessMessage("Produit supprimé");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setApiError(result?.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      setApiError("Erreur inattendue");
    } finally {
      setDeletingId(null);
      setConfirmDelete({ show: false, id: null, name: "" });
    }
  };

  const handleDeleteImage = async (imageId) => {
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    setSelectedFiles([]);
    setExistingImages([]);
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : "—";
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
            <h1 className="text-3xl font-light uppercase tracking-tight">
              Produits
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              {isLoading && products.length === 0 ? (
                <span className="inline-block w-20 h-4 bg-stone-200 rounded animate-pulse" />
              ) : (
                <motion.span
                  key={`${filteredProducts.length}-${products.length}`}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {hasActiveFilters
                    ? `${filteredProducts.length} sur ${products.length} produit(s)`
                    : `${products.length} produit(s)`}
                </motion.span>
              )}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-[#F9F9F7] px-6 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
            >
              + Ajouter un produit
            </button>
          )}
        </motion.div>

        {/* ======================== */}
        {/* FILTRES – NOUVEAU STYLE  */}
        {/* ======================== */}
        {!showForm && (
          <motion.div
            className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              {/* Recherche */}
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom ou slug..."
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div className="w-full lg:w-48">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <TagIcon />
                    Catégorie
                  </span>
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-4 pr-8 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none appearance-none bg-no-repeat"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center' }}
                >
                  <option value="">Toutes</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock */}
              <div className="w-full lg:w-40">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <PackageIcon />
                    Stock
                  </span>
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full pl-4 pr-8 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none appearance-none bg-no-repeat"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center' }}
                >
                  <option value="">Tous</option>
                  <option value="in_stock">En stock</option>
                  <option value="out_of_stock">Rupture</option>
                </select>
              </div>

              {/* Mis en avant */}
              <div className="w-full lg:w-40">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <StarIcon />
                    Mis en avant
                  </span>
                </label>
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="w-full pl-4 pr-8 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none appearance-none bg-no-repeat"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center' }}
                >
                  <option value="">Tous</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>

              {/* Bouton Réinitialiser */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full lg:w-auto flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>
          </motion.div>
        )}

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
                  {editingId ? "Éditer le produit" : "Nouveau produit"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Nom *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        className={`w-full px-3 py-2 border text-sm ${errors.name ? "border-red-400" : "border-stone-300"}`} />
                      {errors.name && <p className="text-red-600 text-[10px] mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Slug *</label>
                      <input type="text" name="slug" value={formData.slug} onChange={handleChange}
                        className={`w-full px-3 py-2 border text-sm ${errors.slug ? "border-red-400" : "border-stone-300"}`}
                        placeholder="Auto-généré à partir du nom" />
                      {errors.slug && <p className="text-red-600 text-[10px] mt-1">{errors.slug}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Catégorie *</label>
                      <select name="category_id" value={formData.category_id} onChange={handleChange}
                        className={`w-full px-3 py-2 border text-sm ${errors.category_id ? "border-red-400" : "border-stone-300"}`}>
                        <option value="">Sélectionner...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.category_id && <p className="text-red-600 text-[10px] mt-1">{errors.category_id}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Prix (FCFA) *</label>
                      <input type="number" name="price" value={formData.price} onChange={handleChange} min="0"
                        className={`w-full px-3 py-2 border text-sm ${errors.price ? "border-red-400" : "border-stone-300"}`} />
                      {errors.price && <p className="text-red-600 text-[10px] mt-1">{errors.price}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Description *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
                      className={`w-full px-3 py-2 border text-sm resize-none ${errors.description ? "border-red-400" : "border-stone-300"}`} />
                    {errors.description && <p className="text-red-600 text-[10px] mt-1">{errors.description}</p>}
                  </div>

                  {/* Images existantes (mode édition) */}
                  {editingId && existingImages.length > 0 && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">Images actuelles</label>
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img src={resolveMediaUrl(img.url)} alt="" className="w-20 h-20 object-cover rounded border border-stone-200" />
                            <button type="button" onClick={() => handleDeleteImage(img.id)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload nouvelles images */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
                      {editingId ? "Ajouter des images" : "Images"}
                    </label>
                    <input type="file" multiple accept="image/*"
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                      className="w-full px-3 py-2 border border-stone-300 text-sm text-stone-600 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-[10px] file:uppercase file:tracking-wider file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer" />
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedFiles.map((file, i) => (
                          <img key={i} src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded border border-stone-200" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={isSubmitting}
                      className="bg-black text-[#F9F9F7] px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 disabled:opacity-50">
                      {isSubmitting ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
                    </button>
                    <button type="button" onClick={handleCancel}
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
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Image</th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Nom</th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Catégorie</th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Prix</th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Stock</th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Featured</th>
                  <th className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && products.length === 0 ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-stone-400 text-sm">
                      Aucun produit pour le moment.
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-stone-400 text-sm">
                      Aucun produit ne correspond aux filtres.
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="block mx-auto mt-2 text-[11px] uppercase tracking-wider text-stone-600 hover:text-black underline"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const firstImage = product.image_path?.[0];
                    return (
                      <motion.tr
                        key={product.id}
                        className="border-b border-stone-100 hover:bg-stone-50"
                        custom={index}
                        variants={tableRow}
                        initial="hidden"
                        animate="visible"
                      >
                        <td className="py-4 px-6">
                          <div className="w-10 h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                            {firstImage ? (
                              <img
                                src={resolveMediaUrl(firstImage)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-5 h-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="2" width="20" height="20" rx="2" />
                                <circle cx="8.5" cy="10" r="2.5" />
                                <path d="M21 15l-4-4-8 8-3-2" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium">{product.name}</td>
                        <td className="py-4 px-6 text-stone-600">
                          {product.category?.name || getCategoryName(product.category_id)}
                        </td>
                        <td className="py-4 px-6 font-medium">{product.price} FCFA</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded text-[10px] font-bold ${product.in_stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {product.in_stock ? "En stock" : "Rupture"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {product.featured ? (
                            <span className="px-3 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Oui</span>
                          ) : (
                            <span className="px-3 py-1 rounded text-[10px] font-bold bg-stone-100 text-stone-500">Non</span>
                          )}
                        </td>
                        <td className="py-4 px-6 relative overflow-visible">
                          <button onClick={() => toggleMenu(product.id)}
                            className="text-stone-500 hover:text-stone-800 p-1 rounded transition-colors">
                            <ColonIcon />
                          </button>
                          {openMenuId === product.id && (
                            <div ref={menuRef}
                              className="absolute right-6 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-lg z-50 py-1">
                              <button onClick={() => handleEdit(product)}
                                className="w-full text-left px-4 py-2 text-[13px] hover:bg-stone-100 transition-colors flex items-center gap-2">
                                <EditIcon /> Éditer
                              </button>
                              <button onClick={() => requestDelete(product)}
                                className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                                <TrashIcon /> Supprimer
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
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
              Voulez-vous vraiment supprimer le produit <span className="font-semibold text-black">"{confirmDelete.name}"</span> ? Cette action est irréversible.
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