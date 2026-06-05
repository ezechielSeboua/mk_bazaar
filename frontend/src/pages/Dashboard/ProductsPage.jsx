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

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category_id: "",
  in_stock: true,
  featured: false,
};

const ITEMS_PER_PAGE = 10; // Nombre de produits par page

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
      {["w-10", "w-32", "w-20", "w-16", "w-16", "w-12", "w-12"].map(
        (wClass, i) => (
          <td key={i} className="py-4 px-6">
            <div className={`h-4 ${wClass} bg-stone-200 rounded`} />
          </td>
        ),
      )}
    </motion.tr>
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

  // Feedback
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const successTimerRef = useRef(null);

  // Référence pour nettoyage des previews
  const previewUrlsRef = useRef([]);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

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
  const [stockFilter, setStockFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Nettoyage ── */
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(URL.revokeObjectURL);
      clearTimeout(successTimerRef.current);
    };
  }, []);

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
    searchQuery || categoryFilter || stockFilter || featuredFilter;

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
      if (stockFilter === "in_stock" && !p.in_stock) return false;
      if (stockFilter === "out_of_stock" && p.in_stock) return false;
      if (featuredFilter === "yes" && !p.featured) return false;
      if (featuredFilter === "no" && p.featured) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, featuredFilter]);

  // Réinitialiser la page quand les filtres ou les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  // Produits paginés (après filtrage)
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages); // éviter de dépasser si la taille diminue
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safePage]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("");
    setStockFilter("");
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

  // La sélection est déjà réinitialisée dans le useEffect sur filteredProducts (ci-dessous)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filteredProducts]);

  /* ── Helpers feedback ── */
  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  /* ── Formulaire ── */
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
    return e;
  }, [formData, editingId, selectedFiles]);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
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
        Object.entries({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          price: parseInt(formData.price, 10),
          category_id: parseInt(formData.category_id, 10),
          in_stock: formData.in_stock ? 1 : 0,
          featured: formData.featured ? 1 : 0,
        }).forEach(([k, v]) => fd.append(k, v));

        selectedFiles.forEach((f) => fd.append("image_path[]", f));

        if (editingId) {
          existingImages.forEach((img) =>
            fd.append("existing_images[]", img.url),
          );
        }

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
      category_id: product.category_id || "",
      in_stock: product.in_stock ?? true,
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
      <div className="space-y-6">
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
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmBulkDelete(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-[11px] uppercase tracking-wider font-medium rounded transition-colors"
              >
                Supprimer ({selectedIds.size})
              </button>
            )}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-black text-[#F9F9F7] px-6 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
              >
                + Ajouter un produit
              </button>
            )}
          </div>
        </motion.div>

        {/* Filtres */}
        {!showForm && (
          <motion.div
            className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
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
                label="Stock"
                icon={<Package className="w-4 h-4 text-stone-400" />}
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full lg:w-40"
              >
                <option value="">Tous</option>
                <option value="in_stock">En stock</option>
                <option value="out_of_stock">Rupture</option>
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
          </motion.div>
        )}

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
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h2 className="text-lg font-medium uppercase tracking-wider mb-6">
                  {editingId ? "Éditer le produit" : "Nouveau produit"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nom *" error={errors.name}>
                      <input
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
                        placeholder="Auto-généré à partir du nom"
                        className={inputCls(errors.slug)}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                              className="w-20 h-20 object-cover rounded border border-stone-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                            className="w-20 h-20 object-cover rounded border border-stone-200"
                          />
                        ))}
                      </div>
                    )}
                  </Field>

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
                      onClick={resetForm}
                      className="border border-stone-300 px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50"
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
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-stone-500 hover:text-black"
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
                    "Stock",
                    "Featured",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider"
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
                    colSpan={8}
                    message="Aucun produit pour le moment."
                  />
                ) : filteredProducts.length === 0 ? (
                  <EmptyRow
                    colSpan={8}
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
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleSelect(product.id)}
                          className="text-stone-500 hover:text-black"
                        >
                          {selectedIds.has(product.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-10 h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                          {product.image_path?.[0] ? (
                            <img
                              src={resolveMediaUrl(product.image_path[0])}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium">{product.name}</td>
                      <td className="py-4 px-6 text-stone-600">
                        {product.category?.name ??
                          categories.find((c) => c.id === product.category_id)
                            ?.name ??
                          "—"}
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {product.price} FCFA
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          on={product.in_stock}
                          onLabel="En stock"
                          offLabel="Rupture"
                          onCls="bg-green-100 text-green-800"
                          offCls="bg-red-100 text-red-800"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          on={product.featured}
                          onLabel="Oui"
                          offLabel="Non"
                          onCls="bg-blue-100 text-blue-800"
                          offCls="bg-stone-100 text-stone-500"
                        />
                      </td>
                      <td
                        className="py-4 px-6 relative overflow-visible"
                        ref={
                          openMenuId === product.id ? menuContainerRef : null
                        }
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId((id) =>
                              id === product.id ? null : product.id,
                            )
                          }
                          className="text-stone-500 hover:text-stone-800 p-1 rounded transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === product.id && (
                          <div className="absolute right-6 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-lg z-50 py-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="w-full text-left px-4 py-2 text-[13px] hover:bg-stone-100 transition-colors flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" /> Éditer
                            </button>
                            <button
                              onClick={() => requestDelete(product)}
                              className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
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

          {/* Pagination */}
          {!isLoading && filteredProducts.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50/50">
              <span className="text-xs text-stone-500">
                Page {safePage} sur {totalPages} · {filteredProducts.length}{" "}
                produit(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-300 rounded text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-300 rounded text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
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

/* ─── Micro-composants utilitaires ──────────────────────────────── */

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
      className={`px-3 py-1 rounded text-[10px] font-bold ${on ? onCls : offCls}`}
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


// import { useState, useEffect, useRef, useMemo, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Search,
//   Tag,
//   Package,
//   Star,
//   Pencil,
//   Trash2,
//   MoreVertical,
//   RotateCcw,
//   CheckSquare,
//   Square,
// } from "lucide-react";
// import DashboardLayout from "../../components/DashboardLayout";
// import ConfirmDialog from "../../components/ConfirmDialog";
// import {
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   deleteProducts,
// } from "../../services/product";
// import { useDashboardData } from "../../contexts/DashboardDataContext";
// import { resolveMediaUrl } from "../../config/env";

// /* ─── Constantes ────────────────────────────────────────────────── */

// const EMPTY_FORM = {
//   name: "",
//   slug: "",
//   description: "",
//   price: "",
//   category_id: "",
//   in_stock: true,
//   featured: false,
// };

// const generateSlug = (name) =>
//   name
//     .toLowerCase()
//     .trim()
//     .replace(/[^\w\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-");

// const tableRow = {
//   hidden: { opacity: 0, x: -10 },
//   visible: (i) => ({
//     opacity: 1,
//     x: 0,
//     transition: { delay: i * 0.05, duration: 0.3 },
//   }),
// };

// /* ─── Sous-composants ───────────────────────────────────────────── */

// function SkeletonRow() {
//   return (
//     <motion.tr
//       className="border-b border-stone-100"
//       animate={{ opacity: [0.6, 1, 0.6] }}
//       transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
//     >
//       {["w-10", "w-32", "w-20", "w-16", "w-16", "w-12", "w-12"].map(
//         (wClass, i) => (
//           <td key={i} className="py-4 px-6">
//             <div className={`h-4 ${wClass} bg-stone-200 rounded`} />
//           </td>
//         ),
//       )}
//     </motion.tr>
//   );
// }

// /* ─── Page principale ───────────────────────────────────────────── */

// export default function ProductsPage() {
//   const { products, setProducts, categories, isLoading } = useDashboardData();

//   // Formulaire
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [formData, setFormData] = useState(EMPTY_FORM);
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [previewUrls, setPreviewUrls] = useState([]);
//   const [existingImages, setExistingImages] = useState([]);

//   // Feedback
//   const [apiError, setApiError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState(null);
//   const successTimerRef = useRef(null);

//   // Référence pour nettoyage des previews
//   const previewUrlsRef = useRef([]);
//   useEffect(() => {
//     previewUrlsRef.current = previewUrls;
//   }, [previewUrls]);

//   // Menu contextuel
//   const [openMenuId, setOpenMenuId] = useState(null);
//   const menuContainerRef = useRef(null);

//   // Suppression individuelle
//   const [confirmDelete, setConfirmDelete] = useState({
//     show: false,
//     id: null,
//     name: "",
//   });
//   const [deletingId, setDeletingId] = useState(null);

//   // Suppression en masse
//   const [selectedIds, setSelectedIds] = useState(new Set());
//   const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
//   const [isBulkDeleting, setIsBulkDeleting] = useState(false);

//   // Filtres
//   const [searchQuery, setSearchQuery] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("");
//   const [stockFilter, setStockFilter] = useState("");
//   const [featuredFilter, setFeaturedFilter] = useState("");

//   /* ── Nettoyage ── */
//   useEffect(() => {
//     return () => {
//       previewUrlsRef.current.forEach(URL.revokeObjectURL);
//       clearTimeout(successTimerRef.current);
//     };
//   }, []);

//   /* ── Fermeture du menu au clic extérieur ── */
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         menuContainerRef.current &&
//         !menuContainerRef.current.contains(e.target)
//       ) {
//         setOpenMenuId(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ── Filtres ── */
//   const hasActiveFilters =
//     searchQuery || categoryFilter || stockFilter || featuredFilter;

//   const filteredProducts = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     return products.filter((p) => {
//       if (
//         q &&
//         !p.name?.toLowerCase().includes(q) &&
//         !p.slug?.toLowerCase().includes(q)
//       )
//         return false;
//       if (categoryFilter && String(p.category_id) !== categoryFilter)
//         return false;
//       if (stockFilter === "in_stock" && !p.in_stock) return false;
//       if (stockFilter === "out_of_stock" && p.in_stock) return false;
//       if (featuredFilter === "yes" && !p.featured) return false;
//       if (featuredFilter === "no" && p.featured) return false;
//       return true;
//     });
//   }, [products, searchQuery, categoryFilter, stockFilter, featuredFilter]);

//   const resetFilters = useCallback(() => {
//     setSearchQuery("");
//     setCategoryFilter("");
//     setStockFilter("");
//     setFeaturedFilter("");
//   }, []);

//   /* ── Sélection multiple ── */
//   const toggleSelectAll = () => {
//     if (selectedIds.size === filteredProducts.length) {
//       setSelectedIds(new Set());
//     } else {
//       setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
//     }
//   };

//   const toggleSelect = (id) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) {
//         next.delete(id);
//       } else {
//         next.add(id);
//       }
//       return next;
//     });
//   };

//   // Réinitialiser la sélection quand les filtres changent
//   useEffect(() => {
//     setSelectedIds(new Set());
//   }, [filteredProducts]);

//   /* ── Helpers feedback ── */
//   const showSuccess = useCallback((msg) => {
//     setSuccessMessage(msg);
//     clearTimeout(successTimerRef.current);
//     successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
//   }, []);

//   /* ── Formulaire ── */
//   const handleChange = useCallback((e) => {
//     const { name, value, type, checked } = e.target;
//     const newValue = type === "checkbox" ? checked : value;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: newValue,
//       ...(name === "name" && { slug: generateSlug(newValue) }),
//     }));
//     setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
//   }, []);

//   const handleFilesChange = useCallback((e) => {
//     const files = Array.from(e.target.files);
//     setPreviewUrls((prev) => {
//       prev.forEach(URL.revokeObjectURL);
//       return files.map(URL.createObjectURL);
//     });
//     setSelectedFiles(files);
//   }, []);

//   const validateForm = useCallback(() => {
//     const e = {};
//     if (!formData.name.trim()) e.name = "Nom requis";
//     if (!formData.slug.trim()) e.slug = "Slug requis";
//     if (!formData.description.trim()) e.description = "Description requise";
//     if (!formData.price) e.price = "Prix requis";
//     if (!formData.category_id) e.category_id = "Catégorie requise";
//     if (!editingId && selectedFiles.length === 0)
//       e.images = "Au moins une image requise";
//     return e;
//   }, [formData, editingId, selectedFiles]);

//   const resetForm = useCallback(() => {
//     setShowForm(false);
//     setEditingId(null);
//     setFormData(EMPTY_FORM);
//     setErrors({});
//     setPreviewUrls((prev) => {
//       prev.forEach(URL.revokeObjectURL);
//       return [];
//     });
//     setSelectedFiles([]);
//     setExistingImages([]);
//   }, []);

//   const handleSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();
//       const newErrors = validateForm();
//       if (Object.keys(newErrors).length) {
//         setErrors(newErrors);
//         return;
//       }

//       setIsSubmitting(true);
//       setApiError(null);

//       try {
//         const fd = new FormData();
//         Object.entries({
//           name: formData.name,
//           slug: formData.slug,
//           description: formData.description,
//           price: parseInt(formData.price, 10),
//           category_id: parseInt(formData.category_id, 10),
//           in_stock: formData.in_stock ? 1 : 0,
//           featured: formData.featured ? 1 : 0,
//         }).forEach(([k, v]) => fd.append(k, v));

//         selectedFiles.forEach((f) => fd.append("image_path[]", f));

//         if (editingId) {
//           existingImages.forEach((img) =>
//             fd.append("existing_images[]", img.url),
//           );
//         }

//         const result = editingId
//           ? await updateProduct(editingId, fd)
//           : await createProduct(fd);

//         if (result?.success) {
//           setProducts((prev) =>
//             editingId
//               ? prev.map((p) => (p.id === editingId ? result.data : p))
//               : [...prev, result.data],
//           );
//           showSuccess(editingId ? "Produit mis à jour" : "Produit créé");
//           resetForm();
//         } else {
//           setApiError(result?.error || "Erreur API");
//         }
//       } catch {
//         setApiError("Erreur inattendue");
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [
//       formData,
//       editingId,
//       selectedFiles,
//       existingImages,
//       validateForm,
//       resetForm,
//       setProducts,
//       showSuccess,
//     ],
//   );

//   /* ── Actions tableau ── */
//   const handleEdit = useCallback((product) => {
//     setFormData({
//       name: product.name || "",
//       slug: product.slug || "",
//       description: product.description || "",
//       price: product.price || "",
//       category_id: product.category_id || "",
//       in_stock: product.in_stock ?? true,
//       featured: product.featured ?? false,
//     });
//     setExistingImages(
//       (product.image_path || []).map((url, id) => ({ id, url })),
//     );
//     setPreviewUrls((prev) => {
//       prev.forEach(URL.revokeObjectURL);
//       return [];
//     });
//     setSelectedFiles([]);
//     setEditingId(product.id);
//     setShowForm(true);
//     setOpenMenuId(null);
//   }, []);

//   const requestDelete = useCallback((product) => {
//     setConfirmDelete({ show: true, id: product.id, name: product.name });
//     setOpenMenuId(null);
//   }, []);

//   const handleDelete = useCallback(async () => {
//     const { id } = confirmDelete;
//     if (!id) return;
//     setDeletingId(id);
//     try {
//       const result = await deleteProduct(id);
//       if (result.success) {
//         setProducts((prev) => prev.filter((p) => p.id !== id));
//         showSuccess("Produit supprimé");
//         // Retirer également l'ID de la sélection si présent
//         setSelectedIds((prev) => {
//           const next = new Set(prev);
//           next.delete(id);
//           return next;
//         });
//       } else {
//         setApiError(result?.error || "Erreur lors de la suppression");
//       }
//     } catch {
//       setApiError("Erreur inattendue");
//     } finally {
//       setDeletingId(null);
//       setConfirmDelete({ show: false, id: null, name: "" });
//     }
//   }, [confirmDelete, setProducts, showSuccess]);

//   /* ── Suppression en masse ── */
//   const handleBulkDelete = async () => {
//     if (selectedIds.size === 0) return;
//     setIsBulkDeleting(true);
//     setApiError(null);
//     const ids = Array.from(selectedIds);

//     try {
//       const result = await deleteProducts(ids);
//       if (result.success) {
//         setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
//         showSuccess(`${ids.length} produit(s) supprimé(s)`);
//         setSelectedIds(new Set());
//       } else {
//         setApiError(result?.error || "Erreur lors de la suppression groupée");
//       }
//     } catch {
//       setApiError("Erreur inattendue lors de la suppression groupée");
//     } finally {
//       setIsBulkDeleting(false);
//       setConfirmBulkDelete(false);
//     }
//   };

//   const handleDeleteImage = useCallback((imageId) => {
//     setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
//   }, []);

//   /* ─── Rendu ─────────────────────────────────────────────────── */
//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         {/* Messages */}
//         <AnimatePresence>
//           {apiError && (
//             <motion.div
//               key="err"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0 }}
//               className="bg-red-50 border border-red-200 p-3 text-red-700 text-sm"
//             >
//               {apiError}
//             </motion.div>
//           )}
//           {successMessage && (
//             <motion.div
//               key="ok"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0 }}
//               className="bg-green-50 border border-green-200 p-3 text-green-700 text-sm"
//             >
//               {successMessage}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Header */}
//         <motion.div
//           className="flex items-center justify-between"
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           <div>
//             <h1 className="text-3xl font-light uppercase tracking-tight">
//               Produits
//             </h1>
//             <p className="text-stone-600 text-sm mt-1">
//               {isLoading && products.length === 0 ? (
//                 <span className="inline-block w-20 h-4 bg-stone-200 rounded animate-pulse" />
//               ) : (
//                 <motion.span
//                   key={`${filteredProducts.length}-${products.length}`}
//                   initial={{ scale: 1.2 }}
//                   animate={{ scale: 1 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   {hasActiveFilters
//                     ? `${filteredProducts.length} sur ${products.length} produit(s)`
//                     : `${products.length} produit(s)`}
//                 </motion.span>
//               )}
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             {selectedIds.size > 0 && (
//               <button
//                 onClick={() => setConfirmBulkDelete(true)}
//                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-[11px] uppercase tracking-wider font-medium rounded transition-colors"
//               >
//                 Supprimer ({selectedIds.size})
//               </button>
//             )}
//             {!showForm && (
//               <button
//                 onClick={() => setShowForm(true)}
//                 className="bg-black text-[#F9F9F7] px-6 py-3 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 transition-colors"
//               >
//                 + Ajouter un produit
//               </button>
//             )}
//           </div>
//         </motion.div>

//         {/* Filtres */}
//         {!showForm && (
//           <motion.div
//             className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3, delay: 0.1 }}
//           >
//             <div className="flex flex-col lg:flex-row lg:items-end gap-4">
//               <div className="flex-1 min-w-0">
//                 <FilterLabel>Rechercher</FilterLabel>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     placeholder="Nom ou slug..."
//                     className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
//                   />
//                 </div>
//               </div>

//               <FilterSelect
//                 label="Catégorie"
//                 icon={<Tag className="w-4 h-4 text-stone-400" />}
//                 value={categoryFilter}
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//                 className="w-full lg:w-48"
//               >
//                 <option value="">Toutes</option>
//                 {categories.map((c) => (
//                   <option key={c.id} value={String(c.id)}>
//                     {c.name}
//                   </option>
//                 ))}
//               </FilterSelect>

//               <FilterSelect
//                 label="Stock"
//                 icon={<Package className="w-4 h-4 text-stone-400" />}
//                 value={stockFilter}
//                 onChange={(e) => setStockFilter(e.target.value)}
//                 className="w-full lg:w-40"
//               >
//                 <option value="">Tous</option>
//                 <option value="in_stock">En stock</option>
//                 <option value="out_of_stock">Rupture</option>
//               </FilterSelect>

//               <FilterSelect
//                 label="Mis en avant"
//                 icon={<Star className="w-4 h-4 text-stone-400" />}
//                 value={featuredFilter}
//                 onChange={(e) => setFeaturedFilter(e.target.value)}
//                 className="w-full lg:w-40"
//               >
//                 <option value="">Tous</option>
//                 <option value="yes">Oui</option>
//                 <option value="no">Non</option>
//               </FilterSelect>

//               {hasActiveFilters && (
//                 <button
//                   type="button"
//                   onClick={resetFilters}
//                   className="w-full lg:w-auto flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors whitespace-nowrap"
//                 >
//                   <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
//                 </button>
//               )}
//             </div>
//           </motion.div>
//         )}

//         {/* Formulaire */}
//         <AnimatePresence>
//           {showForm && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               transition={{ duration: 0.3 }}
//               className="overflow-hidden"
//             >
//               <div className="bg-white border border-stone-200 rounded-lg p-6">
//                 <h2 className="text-lg font-medium uppercase tracking-wider mb-6">
//                   {editingId ? "Éditer le produit" : "Nouveau produit"}
//                 </h2>
//                 <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
//                   <div className="grid grid-cols-2 gap-4">
//                     <Field label="Nom *" error={errors.name}>
//                       <input
//                         type="text"
//                         name="name"
//                         value={formData.name}
//                         onChange={handleChange}
//                         className={inputCls(errors.name)}
//                       />
//                     </Field>
//                     <Field label="Slug *" error={errors.slug}>
//                       <input
//                         type="text"
//                         name="slug"
//                         value={formData.slug}
//                         onChange={handleChange}
//                         placeholder="Auto-généré à partir du nom"
//                         className={inputCls(errors.slug)}
//                       />
//                     </Field>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <Field label="Catégorie *" error={errors.category_id}>
//                       <select
//                         name="category_id"
//                         value={formData.category_id}
//                         onChange={handleChange}
//                         className={inputCls(errors.category_id)}
//                       >
//                         <option value="">Sélectionner...</option>
//                         {categories.map((c) => (
//                           <option key={c.id} value={c.id}>
//                             {c.name}
//                           </option>
//                         ))}
//                       </select>
//                     </Field>
//                     <Field label="Prix (FCFA) *" error={errors.price}>
//                       <input
//                         type="number"
//                         name="price"
//                         value={formData.price}
//                         onChange={handleChange}
//                         min="0"
//                         className={inputCls(errors.price)}
//                       />
//                     </Field>
//                   </div>

//                   <Field label="Description *" error={errors.description}>
//                     <textarea
//                       name="description"
//                       value={formData.description}
//                       onChange={handleChange}
//                       rows="3"
//                       className={`${inputCls(errors.description)} resize-none`}
//                     />
//                   </Field>

//                   {/* Images existantes */}
//                   {editingId && existingImages.length > 0 && (
//                     <div>
//                       <FilterLabel>Images actuelles</FilterLabel>
//                       <div className="flex flex-wrap gap-2">
//                         {existingImages.map((img) => (
//                           <div key={img.id} className="relative group">
//                             <img
//                               src={resolveMediaUrl(img.url)}
//                               alt=""
//                               className="w-20 h-20 object-cover rounded border border-stone-200"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => handleDeleteImage(img.id)}
//                               className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Upload */}
//                   <Field
//                     label={editingId ? "Ajouter des images" : "Images *"}
//                     error={errors.images}
//                   >
//                     <input
//                       type="file"
//                       multiple
//                       accept="image/*"
//                       onChange={handleFilesChange}
//                       className="w-full px-3 py-2 border border-stone-300 text-sm text-stone-600 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-[10px] file:uppercase file:tracking-wider file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
//                     />
//                     {previewUrls.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mt-2">
//                         {previewUrls.map((url, i) => (
//                           <img
//                             key={i}
//                             src={url}
//                             alt=""
//                             className="w-20 h-20 object-cover rounded border border-stone-200"
//                           />
//                         ))}
//                       </div>
//                     )}
//                   </Field>

//                   <div className="flex gap-3 pt-4">
//                     <button
//                       type="submit"
//                       disabled={isSubmitting}
//                       className="bg-black text-[#F9F9F7] px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-900 disabled:opacity-50"
//                     >
//                       {isSubmitting
//                         ? "Enregistrement..."
//                         : editingId
//                           ? "Mettre à jour"
//                           : "Créer"}
//                     </button>
//                     <button
//                       type="button"
//                       onClick={resetForm}
//                       className="border border-stone-300 px-6 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50"
//                     >
//                       Annuler
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Tableau */}
//         <motion.div
//           className="bg-white border border-stone-200 rounded-lg"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//         >
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-stone-50 border-b border-stone-200">
//                 <tr>
//                   <th className="py-3 px-4 w-10">
//                     <button
//                       onClick={toggleSelectAll}
//                       className="text-stone-500 hover:text-black"
//                     >
//                       {selectedIds.size === filteredProducts.length &&
//                       filteredProducts.length > 0 ? (
//                         <CheckSquare className="w-4 h-4" />
//                       ) : (
//                         <Square className="w-4 h-4" />
//                       )}
//                     </button>
//                   </th>
//                   {[
//                     "Image",
//                     "Nom",
//                     "Catégorie",
//                     "Prix",
//                     "Stock",
//                     "Featured",
//                     "Actions",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       className="text-left py-3 px-6 font-bold uppercase text-[10px] tracking-wider"
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {isLoading && products.length === 0 ? (
//                   <>
//                     <SkeletonRow />
//                     <SkeletonRow />
//                     <SkeletonRow />
//                   </>
//                 ) : products.length === 0 ? (
//                   <EmptyRow
//                     colSpan={8}
//                     message="Aucun produit pour le moment."
//                   />
//                 ) : filteredProducts.length === 0 ? (
//                   <EmptyRow
//                     colSpan={8}
//                     message="Aucun produit ne correspond aux filtres."
//                   >
//                     {hasActiveFilters && (
//                       <button
//                         type="button"
//                         onClick={resetFilters}
//                         className="block mx-auto mt-2 text-[11px] uppercase tracking-wider text-stone-600 hover:text-black underline"
//                       >
//                         Réinitialiser les filtres
//                       </button>
//                     )}
//                   </EmptyRow>
//                 ) : (
//                   filteredProducts.map((product, index) => (
//                     <motion.tr
//                       key={product.id}
//                       className="border-b border-stone-100 hover:bg-stone-50"
//                       custom={index}
//                       variants={tableRow}
//                       initial="hidden"
//                       animate="visible"
//                     >
//                       <td className="py-4 px-4">
//                         <button
//                           onClick={() => toggleSelect(product.id)}
//                           className="text-stone-500 hover:text-black"
//                         >
//                           {selectedIds.has(product.id) ? (
//                             <CheckSquare className="w-4 h-4" />
//                           ) : (
//                             <Square className="w-4 h-4" />
//                           )}
//                         </button>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="w-10 h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
//                           {product.image_path?.[0] ? (
//                             <img
//                               src={resolveMediaUrl(product.image_path[0])}
//                               alt={product.name}
//                               className="w-full h-full object-cover"
//                             />
//                           ) : (
//                             <Package className="w-5 h-5 text-stone-400" />
//                           )}
//                         </div>
//                       </td>
//                       <td className="py-4 px-6 font-medium">{product.name}</td>
//                       <td className="py-4 px-6 text-stone-600">
//                         {product.category?.name ??
//                           categories.find((c) => c.id === product.category_id)
//                             ?.name ??
//                           "—"}
//                       </td>
//                       <td className="py-4 px-6 font-medium">
//                         {product.price} FCFA
//                       </td>
//                       <td className="py-4 px-6">
//                         <Badge
//                           on={product.in_stock}
//                           onLabel="En stock"
//                           offLabel="Rupture"
//                           onCls="bg-green-100 text-green-800"
//                           offCls="bg-red-100 text-red-800"
//                         />
//                       </td>
//                       <td className="py-4 px-6">
//                         <Badge
//                           on={product.featured}
//                           onLabel="Oui"
//                           offLabel="Non"
//                           onCls="bg-blue-100 text-blue-800"
//                           offCls="bg-stone-100 text-stone-500"
//                         />
//                       </td>
//                       <td
//                         className="py-4 px-6 relative overflow-visible"
//                         ref={
//                           openMenuId === product.id ? menuContainerRef : null
//                         }
//                       >
//                         <button
//                           onClick={() =>
//                             setOpenMenuId((id) =>
//                               id === product.id ? null : product.id,
//                             )
//                           }
//                           className="text-stone-500 hover:text-stone-800 p-1 rounded transition-colors"
//                         >
//                           <MoreVertical className="w-5 h-5" />
//                         </button>
//                         {openMenuId === product.id && (
//                           <div className="absolute right-6 top-full mt-1 w-40 bg-white border border-stone-200 rounded shadow-lg z-50 py-1">
//                             <button
//                               onClick={() => handleEdit(product)}
//                               className="w-full text-left px-4 py-2 text-[13px] hover:bg-stone-100 transition-colors flex items-center gap-2"
//                             >
//                               <Pencil className="w-4 h-4" /> Éditer
//                             </button>
//                             <button
//                               onClick={() => requestDelete(product)}
//                               className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
//                             >
//                               <Trash2 className="w-4 h-4" /> Supprimer
//                             </button>
//                           </div>
//                         )}
//                       </td>
//                     </motion.tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </motion.div>

//         {/* Confirmation individuelle */}
//         <ConfirmDialog
//           open={confirmDelete.show}
//           title="Confirmer la suppression"
//           message={
//             <>
//               Voulez-vous vraiment supprimer{" "}
//               <span className="font-semibold text-black">
//                 "{confirmDelete.name}"
//               </span>{" "}
//               ? Cette action est irréversible.
//             </>
//           }
//           onConfirm={handleDelete}
//           onCancel={() => setConfirmDelete({ show: false, id: null, name: "" })}
//           loading={deletingId === confirmDelete.id}
//         />

//         {/* Confirmation groupée */}
//         <ConfirmDialog
//           open={confirmBulkDelete}
//           title="Supprimer plusieurs produits"
//           message={
//             <>
//               Vous allez supprimer définitivement{" "}
//               <span className="font-semibold text-black">
//                 {selectedIds.size} produit(s)
//               </span>
//               . Cette action est irréversible.
//             </>
//           }
//           onConfirm={handleBulkDelete}
//           onCancel={() => setConfirmBulkDelete(false)}
//           loading={isBulkDeleting}
//         />
//       </div>
//     </DashboardLayout>
//   );
// }

// /* ─── Micro-composants utilitaires ──────────────────────────────── */

// function FilterLabel({ children }) {
//   return (
//     <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
//       {children}
//     </label>
//   );
// }

// function FilterSelect({ label, icon, value, onChange, className, children }) {
//   const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
//   return (
//     <div className={className}>
//       <FilterLabel>
//         <span className="inline-flex items-center gap-1.5">
//           {icon}
//           {label}
//         </span>
//       </FilterLabel>
//       <select
//         value={value}
//         onChange={onChange}
//         className="w-full pl-4 pr-8 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none appearance-none bg-no-repeat"
//         style={{
//           backgroundImage: chevron,
//           backgroundPosition: "right 0.75rem center",
//         }}
//       >
//         {children}
//       </select>
//     </div>
//   );
// }

// function Field({ label, error, children }) {
//   return (
//     <div>
//       <label className="text-[10px] uppercase tracking-wider font-bold block mb-2">
//         {label}
//       </label>
//       {children}
//       {error && <p className="text-red-600 text-[10px] mt-1">{error}</p>}
//     </div>
//   );
// }

// const inputCls = (hasError) =>
//   `w-full px-3 py-2 border text-sm ${hasError ? "border-red-400" : "border-stone-300"}`;

// function Badge({ on, onLabel, offLabel, onCls, offCls }) {
//   return (
//     <span
//       className={`px-3 py-1 rounded text-[10px] font-bold ${on ? onCls : offCls}`}
//     >
//       {on ? onLabel : offLabel}
//     </span>
//   );
// }

// function EmptyRow({ colSpan, message, children }) {
//   return (
//     <tr>
//       <td
//         colSpan={colSpan}
//         className="py-12 text-center text-stone-400 text-sm"
//       >
//         {message}
//         {children}
//       </td>
//     </tr>
//   );
// }






