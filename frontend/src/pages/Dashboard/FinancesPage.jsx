import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import { DashboardCardSkeleton, DashboardTableSkeleton } from '../../components/DashboardSkeletons';

// Icônes
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function FinancesPage() {
  const { orders, isLoading, error } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const showInitialLoad = isLoading && orders.length === 0;
  const filteredOrders = useMemo(() => {
    let results = orders ? [...orders] : [];

    // Filtre de statut
    if (statusFilter !== 'Tous') {
      results = results.filter(order => order.status === statusFilter);
    }

    // Filtre de recherche textuelle via 'order_number'
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      results = results.filter(order => {
        const orderNumber = (order.order_number || '').toLowerCase();
        return orderNumber.includes(term);
      });
    }

    // Filtre par plage de dates (created_at)
    if (startDate || endDate) {
      results = results.filter(order => {
        if (!order.created_at) return false;
        const orderDateStr = order.created_at.substring(0, 10);

        if (startDate && orderDateStr < startDate) return false;
        if (endDate && orderDateStr > endDate) return false;
        return true;
      });
    }

    // Tri des résultats
    results.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'desc' 
          ? new Date(b.created_at) - new Date(a.created_at) 
          : new Date(a.created_at) - new Date(b.created_at);
      } else if (sortConfig.key === 'amount') {
        // 'total_price' contient déjà la livraison, le tri est direct
        const totalA = a.total_price || 0;
        const totalB = b.total_price || 0;
        return sortConfig.direction === 'desc' ? totalB - totalA : totalA - totalB;
      }
      return 0;
    });

    return results;
  }, [orders, searchTerm, statusFilter, startDate, endDate, sortConfig]);

  // 2. Calcul complet et dynamique des KPIs synchronisés (CORRECTION LOGIQUE BRUT VS TOTAL)
  const financialMetrics = useMemo(() => {
    let totalRevenueWithDelivery = 0;
    let totalRevenueBrut = 0;
    let totalPendingWithDelivery = 0;
    let totalPendingBrut = 0;
    let lostRevenue = 0;

    filteredOrders.forEach(o => {
      const total = o.total_price || 0; // Contient la livraison (ex: 17500)
      const delivery = o.delivery_fee || 0; // (ex: 1500)
      const brut = total - delivery; // Vrai brut calculé (ex: 16000)

      if (o.status === 'completed' || o.status === 'delivered') {
        totalRevenueWithDelivery += total;
        totalRevenueBrut += brut;
      } else if (o.status === 'pending') {
        totalPendingWithDelivery += total;
        totalPendingBrut += brut;
      } else if (o.status === 'cancelled') {
        lostRevenue += brut; // Perte sur la valeur marchande (sans livraison)
      }
    });

    return { 
      totalRevenueBrut, 
      totalRevenueWithDelivery, 
      totalPendingWithDelivery,
      totalPendingBrut,
      lostRevenue,
      grandTotalActivity: totalRevenueWithDelivery + totalPendingWithDelivery
    };
  }, [filteredOrders]);

  // Formateurs
  const formatFCFA = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount).replace('XOF', 'FCFA');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('Tous');
    setStartDate('');
    setEndDate('');
    setSortConfig({ key: 'date', direction: 'desc' });
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'Tous' || startDate || endDate;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight text-black">
            Suivi Financier
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Analyse approfondie des revenus réels, encaissements en attente, frais de livraison et pertes.
          </p>
        </motion.div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {showInitialLoad ? (
          <DashboardCardSkeleton count={4} />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Chiffre d'Affaires Encaissé */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Revenus Encaissés
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xl font-semibold text-black mt-3">
                {formatFCFA(financialMetrics.totalRevenueWithDelivery)}
              </p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-2 border-t border-stone-100 text-xs text-stone-500">
              <span>Dont brut :</span>
              <span className="font-medium text-stone-700">{formatFCFA(financialMetrics.totalRevenueBrut)}</span>
            </div>
          </motion.div>

          {/* Somme En Attente */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  En Attente de Livraison
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <p className="text-xl font-semibold text-amber-600 mt-3">
                {formatFCFA(financialMetrics.totalPendingWithDelivery)}
              </p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-2 border-t border-stone-100 text-xs text-stone-500">
              <span>Dont brut :</span>
              <span className="font-medium text-stone-700">{formatFCFA(financialMetrics.totalPendingBrut)}</span>
            </div>
          </motion.div>

          {/* Pertes d'Annulation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Pertes d'Annulation
                </span>
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <p className="text-xl font-semibold text-red-600 mt-3">
                {formatFCFA(financialMetrics.lostRevenue)}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 text-xs text-stone-400">
              Valeur marchande perdue
            </div>
          </motion.div>

          {/* Activité Globale */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Volume d'Affaires Global
                </span>
                <span className="w-2 h-2 rounded-full bg-stone-900" />
              </div>
              <p className="text-xl font-semibold text-stone-900 mt-3">
                {formatFCFA(financialMetrics.grandTotalActivity)}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-100 text-xs text-stone-400">
              Encaissé + En attente cumulés
            </div>
          </motion.div>
        </div>
        )}

        {/* Bloc Filtres */}
        <motion.div
          className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex flex-col gap-4">
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
                    placeholder="Ex: MK-960332..."
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Statut */}
              <div className="w-full lg:w-40">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
                >
                  <option value="Tous">Tous</option>
                  <option value="completed">Livré</option>
                  <option value="pending">En attente</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {/* Tri */}
              <div className="w-full lg:w-44">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  Trier par
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortConfig({ key: 'date', direction: sortConfig.key === 'date' ? (sortConfig.direction === 'desc' ? 'asc' : 'desc') : 'desc' })}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                      sortConfig.key === 'date' ? 'bg-black text-white border-black' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-white'
                    }`}
                  >
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => setSortConfig({ key: 'amount', direction: sortConfig.key === 'amount' ? (sortConfig.direction === 'desc' ? 'asc' : 'desc') : 'desc' })}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                      sortConfig.key === 'amount' ? 'bg-black text-white border-black' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-white'
                    }`}
                  >
                    Montant {sortConfig.key === 'amount' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:w-48">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  Date début
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon />
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-2">
                  Date fin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon />
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all outline-none"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full sm:w-auto flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-base font-medium text-black">Flux de trésorerie & Commandes</h3>
            <span className="px-2.5 py-1 text-xs bg-stone-100 text-stone-700 rounded-full font-medium">
              {filteredOrders.length} Transaction{filteredOrders.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-[11px] font-medium text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  <th className="py-3 px-6">N° Commande</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Statut</th>
                  <th className="py-3 px-6 text-right">Montant Brut</th>
                  <th className="py-3 px-6 text-right">Total (+ Livraison)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {showInitialLoad ? (
                  <DashboardTableSkeleton rows={5} cols={5} />
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => {
                    const amountTotal = order.total_price || 0; 
                    const deliveryFee = order.delivery_fee || 0;
                    const amountBrut = amountTotal - deliveryFee; // Correction directe dans le tableau également

                    return (
                      <motion.tr
                        key={order.id || index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-stone-50/70 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono text-xs text-stone-600 font-medium">
                          {order.order_number || `#${order.id}`}
                        </td>
                        <td className="py-4 px-6 text-stone-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' || order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {order.status === 'completed' || order.status === 'delivered' ? 'Livré' :
                             order.status === 'pending' ? 'En attente' : 'Annulé'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-stone-600">
                          {formatFCFA(amountBrut)}
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-stone-900">
                          {formatFCFA(amountTotal)}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-stone-400 text-sm">
                      Aucune transaction ne correspond aux critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}