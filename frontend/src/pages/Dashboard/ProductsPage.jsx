import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Tag,
  Package,
  Star,
  Pencil,
  Trash2,
  MoreVertical,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProducts,
} from "../../services/product";
import { useDashboardData } from "../../contexts/DashboardDataContext";
import { resolveMediaUrl } from "../../config/env";

/* ─── Constantes ────────────────────────────────────────────────── */

const EMPTY_VARIANT = {
  id: null,
  price: "",
  old_price: "",
  stock: "",
  taille: "",
  couleur: "",
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  price: "",
  old_price: "",
  category_id: "",
  is_active: true,
  featured: false,
};

const ITEMS_PER_PAGE = 10;

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

/* ─── Sous-composants ───────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <motion.tr
      className="border-b border-stone-100"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    >
      {[
        "w-8",
        "w-24",
        "w-20",
        "w-14",
        "w-8",
        "w-10",
        "w-10",
        "w-10",
        "w-10",
      ].map((wClass, i) => (
        <td key={i} className="py-3 px-2 md:py-4 md:px-4">
          <div className={`h-4 ${wClass} bg-stone-200 rounded`} />
        </td>
      ))}
    </motion.tr>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Page précédente"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 text-xs rounded ${
            page === currentPage
              ? "bg-black text-white"
              : "hover:bg-stone-100 text-stone-700"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Page suivante"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────────── */

export default function ProductsPage() {
  const { products, setProducts, categories, isLoading } = useDashboardData();

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Variantes
  const [variants, setVariants] = useState([]);

  // Feedback
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const successTimerRef = useRef(null);

  const previewUrlsRef = useRef([]);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  const nameInputRef = useRef(null);

  // Menu contextuel
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuContainerRef = useRef(null);

  // Suppression individuelle
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    name: "",
  });
  const [deletingId, setDeletingId] = useState(null);

  // Suppression en masse
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filtres visibles sur mobile ?
  const [showFilters, setShowFilters] = useState(false);

  /* ── Nettoyage ── */
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(URL.revokeObjectURL);
      clearTimeout(successTimerRef.current);
    };
  }, []);

  /* ── Fermer le formulaire avec Escape ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showForm) {
        resetForm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  /* ── Focus automatique quand le formulaire s'ouvre ── */
  useEffect(() => {
    if (showForm && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showForm]);

  /* ── Fermeture du menu au clic extérieur ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Filtres ── */
  const hasActiveFilters =
    searchQuery || categoryFilter || activeFilter || featuredFilter;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (
        q &&
        !p.name?.toLowerCase().includes(q) &&
        !p.slug?.toLowerCase().includes(q)
      )
        return false;
      if (categoryFilter && String(p.category_id) !== categoryFilter)
        return false;
      if (activeFilter === "yes" && !p.is_active) return false;
      if (activeFilter === "no" && p.is_active) return false;
      if (featuredFilter === "yes" && !p.featured) return false;
      if (featuredFilter === "no" && p.featured) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, activeFilter, featuredFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safePage]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("");
    setActiveFilter("");
    setFeaturedFilter("");
  }, []);

  /* ── Sélection multiple ── */
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filteredProducts]);

  /* ── Helpers feedback ── */
  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  /* ── Gestion des variantes ── */
  const addVariant = () => {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT }]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /* ── Formulaire principal ── */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
      ...(name === "name" && { slug: generateSlug(newValue) }),
    }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  }, []);

  const handleFilesChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    setPreviewUrls((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return files.map(URL.createObjectURL);
    });
    setSelectedFiles(files);
  }, []);

  const validateForm = useCallback(() => {
    const e = {};
    if (!formData.name.trim()) e.name = "Nom requis";
    if (!formData.slug.trim()) e.slug = "Slug requis";
    if (!formData.description.trim()) e.description = "Description requise";
    if (!formData.price) e.price = "Prix requis";
    if (!formData.category_id) e.category_id = "Catégorie requise";
    if (!editingId && selectedFiles.length === 0)
      e.images = "Au moins une image requise";

    // Validation des variantes
    if (variants.length === 0) {
      e.variants = "Au moins une variante requise";
    } else {
      const invalid = variants.some((v) => {
        const price = parseInt(v.price, 10);
        const stock = parseInt(v.stock, 10);
        return (
          v.price === "" ||
          isNaN(price) ||
          price < 0 ||
          v.stock === "" ||
          isNaN(stock) ||
          stock < 0
        );
      });
      if (invalid) {
        e.variants = "Prix et stock doivent être des nombres valides (entiers positifs)";
      }
    }
    return e;
  }, [formData, editingId, selectedFiles, variants]);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setVariants([]);
    setErrors({});
    setPreviewUrls((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return [];
    });
    setSelectedFiles([]);
    setExistingImages([]);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const newErrors = validateForm();
      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
      setApiError(null);

      try {
        const fd = new FormData();
        // Champs de base
        Object.entries({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          price: parseInt(formData.price, 10),
          old_price: formData.old_price ? parseInt(formData.old_price, 10) : "",
          category_id: parseInt(formData.category_id, 10),
          is_active: formData.is_active ? 1 : 0,
          featured: formData.featured ? 1 : 0,
        }).forEach(([k, v]) => {
          if (v !== "") fd.append(k, v);
        });

        // Images
        selectedFiles.forEach((f) => fd.append("image_path[]", f));
        if (editingId) {
          existingImages.forEach((img) =>
            fd.append("existing_images[]", img.url),
          );
        }

        // Variantes : conversion explicite en entiers
        variants.forEach((v, index) => {
          if (v.id) fd.append(`variants[${index}][id]`, v.id);
          fd.append(`variants[${index}][price]`, parseInt(v.price, 10));
          if (v.old_price) fd.append(`variants[${index}][old_price]`, parseInt(v.old_price, 10));
          fd.append(`variants[${index}][stock]`, parseInt(v.stock, 10));
          if (v.taille) fd.append(`variants[${index}][attributes][taille]`, v.taille);
          if (v.couleur) fd.append(`variants[${index}][attributes][couleur]`, v.couleur);
        });

        const result = editingId
          ? await updateProduct(editingId, fd)
          : await createProduct(fd);

        if (result?.success) {
          setProducts((prev) =>
            editingId
              ? prev.map((p) => (p.id === editingId ? result.data : p))
              : [...prev, result.data],
          );
          showSuccess(editingId ? "Produit mis à jour" : "Produit créé");
          resetForm();
        } else {
          setApiError(result?.error || "Erreur API");
        }
      } catch {
        setApiError("Erreur inattendue");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      editingId,
      selectedFiles,
      existingImages,
      variants,
      validateForm,
      resetForm,
      setProducts,
      showSuccess,
    ],
  );

  /* ── Actions tableau ── */
  const handleEdit = useCallback((product) => {
    setFormData({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: product.price || "",
      old_price: product.old_price || "",
      category_id: product.category_id || "",
      is_active: product.is_active ?? true,
      featured: product.featured ?? false,
    });
    setExistingImages(
      (product.image_path || []).map((url, id) => ({ id, url })),
    );
    setPreviewUrls((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return [];
    });
    setSelectedFiles([]);
    const existingVariants = (product.variants || []).map((v) => ({
      id: v.id,
      price: v.price || "",
      old_price: v.old_price || "",
      stock: v.stock || "",
      taille: v.attributes?.taille || "",
      couleur: v.attributes?.couleur || "",
    }));
    setVariants(existingVariants);
    setEditingId(product.id);
    setShowForm(true);
    setOpenMenuId(null);
  }, []);

  const requestDelete = useCallback((product) => {
    setConfirmDelete({ show: true, id: product.id, name: product.name });
    setOpenMenuId(null);
  }, []);

  const handleDelete = useCallback(async () => {
    const { id } = confirmDelete;
    if (!id) return;
    setDeletingId(id);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showSuccess("Produit supprimé");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setApiError(result?.error || "Erreur lors de la suppression");
      }
    } catch {
      setApiError("Erreur inattendue");
    } finally {
      setDeletingId(null);
      setConfirmDelete({ show: false, id: null, name: "" });
    }
  }, [confirmDelete, setProducts, showSuccess]);

  /* ── Suppression en masse ── */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    setApiError(null);
    const ids = Array.from(selectedIds);

    try {
      const result = await deleteProducts(ids);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        showSuccess(`${ids.length} produit(s) supprimé(s)`);
        setSelectedIds(new Set());
      } else {
        setApiError(result?.error || "Erreur lors de la suppression groupée");
      }
    } catch {
      setApiError("Erreur inattendue lors de la suppression groupée");
    } finally {
      setIsBulkDeleting(false);
      setConfirmBulkDelete(false);
    }
  };

  const handleDeleteImage = useCallback((imageId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  /* ─── Rendu ─────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Messages */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              key="err"
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
              key="ok"
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight">
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
          <div className="flex items-center gap-2 sm:gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmBulkDelete(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium rounded transition-colors"
              >
                Supprimer ({selectedIds.size})
              </button>
            )}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-black text-[#F9F9F7] px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
              >
                + Ajouter
              </button>
            )}
          </div>
        </motion.div>

        {/* Bouton Filtres (mobile) */}
        {!showForm && (
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-white text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 rounded-full bg-[#c07b5a]" />
              )}
            </button>
          </div>
        )}

        {/* Filtres (desktop toujours visibles, mobile conditionnel) */}
        {!showForm && (
          <div className="hidden lg:block">
            <FiltersBlock
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              featuredFilter={featuredFilter}
              setFeaturedFilter={setFeaturedFilter}
              categories={categories}
              hasActiveFilters={hasActiveFilters}
              resetFilters={resetFilters}
            />
          </div>
        )}

        <AnimatePresence>
          {!showForm && showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden lg:hidden"
            >
              <FiltersBlock
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                featuredFilter={featuredFilter}
                setFeaturedFilter={setFeaturedFilter}
                categories={categories}
                hasActiveFilters={hasActiveFilters}
                resetFilters={resetFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulaire */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-medium uppercase tracking-wider">
                    {editingId ? "Éditer le produit" : "Nouveau produit"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-stone-400 hover:text-stone-600 p-1 rounded"
                    title="Fermer (Échap)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nom *" error={errors.name}>
                      <input
                        ref={nameInputRef}
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputCls(errors.name)}
                      />
                    </Field>
                    <Field label="Slug *" error={errors.slug}>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="Auto-généré"
                        className={inputCls(errors.slug)}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Catégorie *" error={errors.category_id}>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className={inputCls(errors.category_id)}
                      >
                        <option value="">Sélectionner...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Prix (FCFA) *" error={errors.price}>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        className={inputCls(errors.price)}
                      />
                    </Field>
                    <Field label="Ancien prix (FCFA)" error={errors.old_price}>
                      <input
                        type="number"
                        name="old_price"
                        value={formData.old_price}
                        onChange={handleChange}
                        min="0"
                        placeholder="Optionnel"
                        className={inputCls()}
                      />
                    </Field>
                  </div>

                  <Field label="Description *" error={errors.description}>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className={`${inputCls(errors.description)} resize-none`}
                    />
                  </Field>

                  {/* Variantes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <FilterLabel>Variantes *</FilterLabel>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="text-xs flex items-center gap-1 text-stone-600 hover:text-black border border-stone-300 rounded px-2 py-1"
                        title="Ajouter une déclinaison (taille/couleur)"
                      >
                        <Plus className="w-3 h-3" /> Ajouter une variante
                      </button>
                    </div>
                    {errors.variants && (
                      <p className="text-red-600 text-[10px] mb-2">
                        {errors.variants}
                      </p>
                    )}
                    <div className="space-y-3">
                      {variants.length === 0 && (
                        <p className="text-xs text-stone-400">
                          Aucune variante ajoutée.
                        </p>
                      )}
                      {variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-start bg-stone-50/70 border border-stone-200 rounded-lg p-3 relative"
                        >
                          <div>
                            <label className="text-[10px] uppercase font-bold block mb-1">
                              Prix *
                            </label>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "price",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-stone-300 text-xs"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold block mb-1">
                              Ancien prix
                            </label>
                            <input
                              type="number"
                              value={v.old_price}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "old_price",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-stone-300 text-xs"
                              min="0"
                              placeholder="Optionnel"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold block mb-1">
                              Stock *
                            </label>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "stock",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-stone-300 text-xs"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold block mb-1">
                              Taille
                            </label>
                            <input
                              type="text"
                              value={v.taille}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "taille",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-stone-300 text-xs"
                              placeholder="S, M, L..."
                            />
                          </div>
                          <div className="relative">
                            <label className="text-[10px] uppercase font-bold block mb-1">
                              Couleur
                            </label>
                            <input
                              type="text"
                              value={v.couleur}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "couleur",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-stone-300 text-xs"
                              placeholder="Rouge..."
                            />
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600"
                              title="Supprimer cette variante"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Images existantes */}
                  {editingId && existingImages.length > 0 && (
                    <div>
                      <FilterLabel>Images actuelles</FilterLabel>
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={resolveMediaUrl(img.url)}
                              alt=""
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border border-stone-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Retirer cette image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload */}
                  <Field
                    label={editingId ? "Ajouter des images" : "Images *"}
                    error={errors.images}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFilesChange}
                      className="w-full px-3 py-2 border border-stone-300 text-sm text-stone-600 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-[10px] file:uppercase file:tracking-wider file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                    />
                    {previewUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {previewUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border border-stone-200"
                          />
                        ))}
                      </div>
                    )}
                  </Field>

                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="rounded border-stone-300 text-black focus:ring-black"
                      />
                      Produit actif
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="rounded border-stone-300 text-black focus:ring-black"
                      />
                      Mettre en avant
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-black text-[#F9F9F7] px-4 sm:px-6 py-2 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {isSubmitting && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {isSubmitting
                        ? "Enregistrement..."
                        : editingId
                          ? "Mettre à jour"
                          : "Créer"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="border border-stone-300 px-4 sm:px-6 py-2 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50"
                    >
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
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-2 md:px-4 w-8 md:w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-stone-500 hover:text-black"
                      title={
                        selectedIds.size === filteredProducts.length
                          ? "Tout désélectionner"
                          : "Tout sélectionner"
                      }
                    >
                      {selectedIds.size === filteredProducts.length &&
                      filteredProducts.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  {[
                    "Image",
                    "Nom",
                    "Catégorie",
                    "Prix",
                    "Variantes",
                    "Actif",
                    "Featured",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-2 md:px-4 font-bold uppercase text-[10px] tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
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
                  <EmptyRow
                    colSpan={9}
                    message="Aucun produit pour le moment."
                  />
                ) : filteredProducts.length === 0 ? (
                  <EmptyRow
                    colSpan={9}
                    message="Aucun produit ne correspond aux filtres."
                  >
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="block mx-auto mt-2 text-[11px] uppercase tracking-wider text-stone-600 hover:text-black underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </EmptyRow>
                ) : (
                  paginatedProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      className="border-b border-stone-100 hover:bg-stone-50"
                      custom={index}
                      variants={tableRow}
                      initial="hidden"
                      animate="visible"
                    >
                      <td className="py-3 px-2 md:px-4">
                        <button
                          onClick={() => toggleSelect(product.id)}
                          className="text-stone-500 hover:text-black"
                          title={
                            selectedIds.has(product.id)
                              ? "Désélectionner"
                              : "Sélectionner"
                          }
                        >
                          {selectedIds.has(product.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                          {product.image_path?.[0] ? (
                            <img
                              src={resolveMediaUrl(product.image_path[0])}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 md:px-4 font-medium">
                        {product.name}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-stone-600">
                        {product.category?.name ??
                          categories.find((c) => c.id === product.category_id)
                            ?.name ??
                          "—"}
                      </td>
                      <td className="py-3 px-2 md:px-4 font-medium">
                        {product.old_price && (
                          <span className="line-through text-stone-400 mr-1">
                            {product.old_price} FCFA
                          </span>
                        )}
                        {product.price} FCFA
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-medium">
                          {product.variants?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <Badge
                          on={product.is_active}
                          onLabel="Oui"
                          offLabel="Non"
                          onCls="bg-green-100 text-green-800"
                          offCls="bg-stone-100 text-stone-500"
                        />
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <Badge
                          on={product.featured}
                          onLabel="Oui"
                          offLabel="Non"
                          onCls="bg-blue-100 text-blue-800"
                          offCls="bg-stone-100 text-stone-500"
                        />
                      </td>
                      <td className="py-3 px-2 md:px-4 relative overflow-visible">
                        <button
                          onClick={() =>
                            setOpenMenuId((id) =>
                              id === product.id ? null : product.id,
                            )
                          }
                          className="text-stone-500 hover:text-stone-800 p-1 rounded transition-colors"
                          title="Plus d'actions"
                        >
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        {openMenuId === product.id && (
                          <div className="absolute right-0 md:right-4 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-lg z-50 py-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="w-full text-left px-4 py-2 text-[13px] hover:bg-stone-100 transition-colors flex items-center gap-2"
                              title="Modifier ce produit"
                            >
                              <Pencil className="w-4 h-4" /> Éditer
                            </button>
                            <button
                              onClick={() => requestDelete(product)}
                              className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                              title="Supprimer ce produit"
                            >
                              <Trash2 className="w-4 h-4" /> Supprimer
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

          {/* Pagination enrichie */}
          {!isLoading && filteredProducts.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-200 bg-stone-50/50">
              <span className="text-xs text-stone-500">
                Page {safePage} sur {totalPages} · {filteredProducts.length}{" "}
                produit(s)
              </span>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </motion.div>

        {/* Confirmation individuelle */}
        <ConfirmDialog
          open={confirmDelete.show}
          title="Confirmer la suppression"
          message={
            <>
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold text-black">
                "{confirmDelete.name}"
              </span>{" "}
              ? Cette action est irréversible.
            </>
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete({ show: false, id: null, name: "" })}
          loading={deletingId === confirmDelete.id}
        />

        {/* Confirmation groupée */}
        <ConfirmDialog
          open={confirmBulkDelete}
          title="Supprimer plusieurs produits"
          message={
            <>
              Vous allez supprimer définitivement{" "}
              <span className="font-semibold text-black">
                {selectedIds.size} produit(s)
              </span>
              . Cette action est irréversible.
            </>
          }
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmBulkDelete(false)}
          loading={isBulkDeleting}
        />
      </div>
    </DashboardLayout>
  );
}

/* ─── Sous-composants utilitaires ──────────────────────────────── */

function FiltersBlock({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  activeFilter,
  setActiveFilter,
  featuredFilter,
  setFeaturedFilter,
  categories,
  hasActiveFilters,
  resetFilters,
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1 min-w-0">
          <FilterLabel>Rechercher</FilterLabel>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom ou slug..."
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
            />
          </div>
        </div>

        <FilterSelect
          label="Catégorie"
          icon={<Tag className="w-4 h-4 text-stone-400" />}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full lg:w-48"
        >
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Actif"
          icon={<Package className="w-4 h-4 text-stone-400" />}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full lg:w-36"
        >
          <option value="">Tous</option>
          <option value="yes">Oui</option>
          <option value="no">Non</option>
        </FilterSelect>

        <FilterSelect
          label="Mis en avant"
          icon={<Star className="w-4 h-4 text-stone-400" />}
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          className="w-full lg:w-40"
        >
          <option value="">Tous</option>
          <option value="yes">Oui</option>
          <option value="no">Non</option>
        </FilterSelect>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="w-full lg:w-auto flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

function FilterLabel({ children }) {
  return (
    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
      {children}
    </label>
  );
}

function FilterSelect({ label, icon, value, onChange, className, children }) {
  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
  return (
    <div className={className}>
      <FilterLabel>
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </FilterLabel>
      <select
        value={value}
        onChange={onChange}
        className="w-full pl-4 pr-8 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none appearance-none bg-no-repeat"
        style={{
          backgroundImage: chevron,
          backgroundPosition: "right 0.75rem center",
        }}
      >
        {children}
      </select>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-red-600 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (hasError) =>
  `w-full px-3 py-2 border text-sm ${hasError ? "border-red-400" : "border-stone-300"}`;

function Badge({ on, onLabel, offLabel, onCls, offCls }) {
  return (
    <span
      className={`px-2 py-0.5 md:px-3 md:py-1 rounded text-[10px] font-bold ${on ? onCls : offCls}`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

function EmptyRow({ colSpan, message, children }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-12 text-center text-stone-400 text-sm"
      >
        {message}
        {children}
      </td>
    </tr>
  );
}