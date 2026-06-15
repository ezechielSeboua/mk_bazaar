import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from '../../contexts/DashboardDataContext';
import dashboardService from '../../services/dashboard';
import { DashboardPageLoader } from '../../components/DashboardSkeletons';
import {
    DEFAULT_SHIPPING_ZONES,
    validateShippingZones,
} from '../../utils/shippingZones';
import { setCatalogShippingZones } from '../../utils/catalogCache';

/* ---------- Icônes SVG ---------- */
function TruckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ---------- Formulaire d'ajout/modification ---------- */
function ZoneForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom de la zone est obligatoire.');
      return;
    }
    if (!price || Number(price) < 0) {
      setError('Un tarif valide est requis.');
      return;
    }
    onSave({
      id: initial?.id || Date.now(),
      name: name.trim(),
      price: Number(price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-1">
            Nom de la zone
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Ex: Cocody, Yopougon..."
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
          />
        </div>
        <div className="sm:w-40">
          <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-1">
            Tarif (FCFA)
          </label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setError(''); }}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
        >
          {initial ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

/* ---------- Page principale ---------- */
export default function ConfigurationsPage() {
  const { shippingZones, setShippingZones, isLoading } = useDashboardData();
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  // Gestion du formulaire (ajout / modification)
  const [editingZone, setEditingZone] = useState(null); // null = pas de formulaire, objet = modification
  const [showAddForm, setShowAddForm] = useState(false); // distinct pour l'ajout

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // Ajout d'une zone (depuis le formulaire)
  const handleAddZone = (newZone) => {
    setShippingZones((prev) => [newZone, ...prev]);
    setShowAddForm(false);
    showStatus('success', 'Zone ajoutée (non sauvegardée). Enregistrez les tarifs pour confirmer.');
  };

  // Modification d'une zone
  const handleUpdateZone = (updatedZone) => {
    setShippingZones((prev) =>
      prev.map((z) => (z.id === updatedZone.id ? updatedZone : z))
    );
    setEditingZone(null);
    showStatus('success', 'Zone modifiée (non sauvegardée). Enregistrez les tarifs pour confirmer.');
  };

  // Suppression
  const handleDeleteZone = (id) => {
    setShippingZones((prev) => prev.filter((z) => z.id !== id));
    if (editingZone?.id === id) setEditingZone(null);
  };

  const loadDefaultZones = () => {
    setShippingZones(DEFAULT_SHIPPING_ZONES.map((zone) => ({ ...zone })));
    showStatus('success', 'Zones par défaut chargées. Enregistrez pour les appliquer.');
  };

  const saveShippingTariffs = async () => {
    const validationError = validateShippingZones(shippingZones);
    if (validationError) {
      showStatus('error', validationError);
      return;
    }

    const payload = shippingZones.map(({ id, name, price }) => ({
      id,
      name: name.trim(),
      price: Number(price),
    }));

    try {
      setIsSaving(true);
      await dashboardService.updateShippingZones(payload);
      setShippingZones(payload);
      setCatalogShippingZones(payload);
      showStatus('success', 'Tarifs enregistrés — visibles sur les fiches produit.');
    } catch (err) {
      showStatus('error', err.message || 'Erreur de sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardPageLoader label="Chargement des configurations…" />
      </DashboardLayout>
    );
  }

  console.log("shippingZones:", shippingZones);
  

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* En-tête + message de statut */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tight text-black">
              Configurations
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              Gérez les zones et tarifs de livraison.
            </p>
          </motion.div>

          <AnimatePresence>
            {statusMessage.text && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`px-4 py-2.5 text-xs font-medium rounded-xl border shadow-sm ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}
              >
                {statusMessage.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="max-w-4xl space-y-4 sm:space-y-6">
          {/* Section formulaire d'ajout (conditionnelle) */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                    <PlusIcon /> Nouvelle zone de livraison
                  </h3>
                  <ZoneForm
                    initial={null}
                    onSave={handleAddZone}
                    onCancel={() => setShowAddForm(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section formulaire de modification (conditionnelle) */}
          <AnimatePresence>
            {editingZone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                    <EditIcon /> Modifier la zone
                  </h3>
                  <ZoneForm
                    initial={editingZone}
                    onSave={handleUpdateZone}
                    onCancel={() => setEditingZone(null)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tableau des zones */}
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b border-stone-100">
              <h3 className="text-base font-medium flex items-center gap-2">
                <TruckIcon /> Zones de livraison ({shippingZones.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadDefaultZones}
                  className="px-3 sm:px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors"
                >
                  Zones par défaut
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-3 sm:px-4 py-2 bg-stone-100 text-stone-900 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                >
                  <PlusIcon /> Ajouter
                </button>
              </div>
            </div>

            {shippingZones.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-sm border border-dashed border-stone-200 rounded-lg mx-4 sm:mx-6 my-4">
                Aucune zone configurée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-left py-3 px-4 sm:px-6 font-bold uppercase text-[10px] tracking-wider text-stone-500">
                        Zone / Commune
                      </th>
                      <th className="text-right py-3 px-4 sm:px-6 font-bold uppercase text-[10px] tracking-wider text-stone-500">
                        Tarif
                      </th>
                      <th className="text-center py-3 px-4 sm:px-6 font-bold uppercase text-[10px] tracking-wider text-stone-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {shippingZones.map((zone) => (
                      <tr key={zone.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4 sm:px-6 font-medium text-stone-800">
                          {zone.name}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right tabular-nums">
                          {zone.price.toLocaleString()} FCFA
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setEditingZone(zone)}
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bouton Enregistrer */}
            <div className="p-4 sm:p-6 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={saveShippingTariffs}
                disabled={isSaving || shippingZones.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 text-white font-medium text-sm rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les tarifs'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}