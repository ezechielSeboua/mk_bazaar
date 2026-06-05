// pages/Dashboard/OrdersPage.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { DashboardTableSkeleton } from '../../components/DashboardSkeletons';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { updateOrder } from '../../services/order';
import { resolveMediaUrl } from '../../config/env';

/* ---------- Icônes SVG ---------- */
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

const STATUS_OPTIONS = ['Tous', 'pending', 'completed', 'cancelled'];

const translateStatus = (status) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'completed': return 'Livrée';
    case 'cancelled': return 'Annulée';
    default: return status;
  }
};

/* ---------- Bloc de filtres réutilisable ---------- */
function FiltersBlock({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateSort,
  setDateSort,
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="N° de commande ou adresse..."
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
            />
          </div>
        </div>

        {/* Filtre statut */}
        <div className="w-full lg:w-48">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'Tous' ? 'Tous' : translateStatus(opt)}
              </option>
            ))}
          </select>
        </div>

        {/* Tri par date */}
        <div className="w-full lg:w-44">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
            Tri
          </label>
          <button
            onClick={() => setDateSort(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 hover:bg-white transition-colors"
          >
            <span>
              {dateSort === 'desc' ? 'Récent → Ancien' : 'Ancien → Récent'}
            </span>
            <ChevronDownIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page principale ---------- */
export default function OrdersPage() {
  const { orders, setOrders, isLoading } = useDashboardData();
  const showInitialLoad = isLoading && orders.length === 0;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [dateSort, setDateSort] = useState('desc');
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // pour mobile

  const hasActiveFilters = searchTerm || statusFilter !== 'Tous';

  const filteredCommands = useMemo(() => {
    let results = [...orders];

    if (statusFilter !== 'Tous') {
      results = results.filter(cmd => cmd.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      results = results.filter(cmd =>
        cmd.order_number.toLowerCase().includes(term) ||
        (cmd.delivery_location && cmd.delivery_location.toLowerCase().includes(term)) ||
        (cmd.detailed_address && cmd.detailed_address.toLowerCase().includes(term))
      );
    }

    results.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return results;
  }, [orders, searchTerm, statusFilter, dateSort]);

  const openDetailModal = (cmd) => {
    setSelectedCommand(cmd);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCommand(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedCommand) return;
    setIsUpdating(true);

    const response = await updateOrder(selectedCommand.id, { status: newStatus });

    if (response.success) {
      setOrders(prevOrders =>
        prevOrders.map(o => o.id === selectedCommand.id ? { ...o, status: newStatus } : o)
      );
      setSelectedCommand(prev => ({ ...prev, status: newStatus }));
    } else {
      alert("Erreur lors de la mise à jour du statut");
    }
    setIsUpdating(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight">Commandes</h1>
            <p className="text-stone-600 text-sm mt-1">
              {showInitialLoad ? (
                <span className="inline-block w-32 h-4 bg-stone-200 rounded animate-pulse" />
              ) : (
                `${filteredCommands.length} commande(s) trouvée(s)`
              )}
            </p>
          </div>
        </motion.div>

        {/* Filtres – version desktop (toujours visible) */}
        <div className="hidden lg:block">
          <FiltersBlock
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateSort={dateSort}
            setDateSort={setDateSort}
          />
        </div>

        {/* Filtres – version mobile (repliable) */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-white text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <FilterIcon />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 rounded-full bg-[#c07b5a]" />
            )}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4"
              >
                <FiltersBlock
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateSort={dateSort}
                  setDateSort={setDateSort}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tableau */}
        <motion.div
          className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-3 md:px-6 font-bold uppercase text-[10px] tracking-wider">Commande</th>
                  <th className="text-left py-3 px-3 md:px-6 font-bold uppercase text-[10px] tracking-wider">Date</th>
                  <th className="text-left py-3 px-3 md:px-6 font-bold uppercase text-[10px] tracking-wider">Livraison</th>
                  <th className="text-left py-3 px-3 md:px-6 font-bold uppercase text-[10px] tracking-wider">Total</th>
                  <th className="text-left py-3 px-3 md:px-6 font-bold uppercase text-[10px] tracking-wider">Statut</th>
                  <th className="text-left py-3 px-3 md:px-6 font-bold uppercase text-[10px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showInitialLoad ? (
                  <DashboardTableSkeleton rows={5} cols={6} />
                ) : filteredCommands.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-stone-400 text-sm">
                      Aucune commande trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredCommands.map((cmd, idx) => (
                    <motion.tr
                      key={cmd.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                    >
                      <td className="py-3 md:py-4 px-3 md:px-6 font-medium text-stone-700 text-xs md:text-sm">
                        {cmd.order_number}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6 text-stone-600 text-xs md:text-sm">
                        {new Date(cmd.date).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6">
                        <span className="text-stone-700 text-xs md:text-sm">{cmd.delivery_location || '—'}</span>
                        {cmd.detailed_address && (
                          <span className="text-xs text-stone-500 block truncate max-w-[120px] md:max-w-[150px]">
                            {cmd.detailed_address}
                          </span>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6 font-medium text-xs md:text-sm">
                        {cmd.total_price?.toLocaleString()} FCFA
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6">
                        <span className={`inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] font-bold ${getStatusBadge(cmd.status)}`}>
                          {translateStatus(cmd.status)}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6">
                        <button
                          onClick={() => openDetailModal(cmd)}
                          className="text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                          title="Voir détails"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modale détails commande – ajustements mobiles */}
        <AnimatePresence>
          {isModalOpen && selectedCommand && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={closeModal}
              />
              <motion.div
                className="relative bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6 z-10"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-base md:text-lg font-medium uppercase tracking-wider">
                    Détails commande {selectedCommand.order_number}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Livraison</p>
                    <p className="text-sm font-medium">{selectedCommand.delivery_location || 'Non spécifiée'}</p>
                    <p className="text-xs md:text-sm text-stone-600">{selectedCommand.detailed_address || 'Aucun détail'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Date</p>
                    <p className="text-sm">
                      {new Date(selectedCommand.date).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mb-4 md:mb-6">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">Statut</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(selectedCommand.status)}`}>
                    {translateStatus(selectedCommand.status)}
                  </span>
                </div>

                {/* Produits commandés avec images */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-2">
                    Produits commandés
                  </p>

                  <div className="border border-stone-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                      <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                          <th className="text-left py-2 px-2 md:px-4 text-[10px] font-bold uppercase tracking-wider">Image</th>
                          <th className="text-left py-2 px-2 md:px-4 text-[10px] font-bold uppercase tracking-wider">Produit</th>
                          <th className="text-center py-2 px-2 md:px-4 text-[10px] font-bold uppercase tracking-wider">Prix unit.</th>
                          <th className="text-center py-2 px-2 md:px-4 text-[10px] font-bold uppercase tracking-wider">Qté</th>
                          <th className="text-right py-2 px-2 md:px-4 text-[10px] font-bold uppercase tracking-wider">Sous-total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedCommand.products || []).map((prod, i) => {
                          const firstImage = prod.image_path;
                          const imageUrl = Array.isArray(firstImage) ? firstImage[0] : firstImage;
                          return (
                            <tr key={i} className="border-b border-stone-100 last:border-b-0">
                              {/* Mon image {prod.image_path?.[0]} */}
                              <td className="py-2 px-2 md:px-4">

                                <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                                  {imageUrl ? (
                                    <img
                                      src={resolveMediaUrl(imageUrl)}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <rect x="2" y="2" width="20" height="20" rx="2" />
                                      <circle cx="8.5" cy="10" r="2.5" />
                                      <path d="M21 15l-4-4-8 8-3-2" />
                                    </svg>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2 md:px-4 font-medium">{prod.name}</td>
                              <td className="py-2 px-2 md:px-4 text-center">{prod.unit_price?.toLocaleString()} FCFA</td>
                              <td className="py-2 px-2 md:px-4 text-center">{prod.quantity}</td>
                              <td className="py-2 px-2 md:px-4 text-right font-medium">
                                {(prod.unit_price * prod.quantity).toLocaleString()} FCFA
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-stone-50">
                          <td colSpan="4" className="py-2 px-2 md:px-4 text-right font-bold text-[10px] uppercase tracking-wider">
                            Total
                          </td>
                          <td className="py-2 px-2 md:px-4 text-right font-bold">
                            {selectedCommand.total?.toLocaleString()} FCFA
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4 md:mt-6 pt-4 border-t border-stone-100">
                  <div className="flex flex-wrap gap-2">
                    {selectedCommand.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange('completed')}
                        disabled={isUpdating}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Marquer Livrée
                      </button>
                    )}
                    {selectedCommand.status !== 'cancelled' && (
                      <button
                        onClick={() => handleStatusChange('cancelled')}
                        disabled={isUpdating}
                        className="flex-1 sm:flex-none bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="border border-stone-300 px-4 py-2 rounded-lg text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}