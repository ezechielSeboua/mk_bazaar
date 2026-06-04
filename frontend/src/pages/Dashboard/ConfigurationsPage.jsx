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

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function ConfigurationsPage() {
  const { shippingZones, setShippingZones, isLoading } = useDashboardData();
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  const handleUpdatePrice = (id, newPrice) => {
    setShippingZones((zones) =>
        zones.map((z) => (z.id === id ? { ...z, price: Number(newPrice) || 0 } : z)),
    );
  };

  const handleUpdateZoneName = (id, newName) => {
    setShippingZones((zones) =>
        zones.map((z) => (z.id === id ? { ...z, name: newName } : z)),
    );
  };

  const handleAddZone = () => {
    setShippingZones((zones) => [
      ...zones,
      {
        id: Date.now(),
        name: 'Nouvelle zone de livraison',
        price: 1000,
      },
    ]);
  };

  const handleDeleteZone = (id) => {
    setShippingZones((zones) => zones.filter((z) => z.id !== id));
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

  const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardPageLoader label="Chargement des configurations…" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
              Gérez les zones et tarifs de livraison affichés sur chaque fiche produit.
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

        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm max-w-4xl"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-base font-medium text-black flex items-center gap-2">
                <TruckIcon /> Zones de livraison
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Ces options apparaissent dans le sélecteur de livraison sur ProductDetails.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadDefaultZones}
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors"
              >
                Zones par défaut
              </button>
              <button
                type="button"
                onClick={handleAddZone}
                className="px-4 py-2 bg-stone-100 text-stone-900 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
              >
                + Ajouter une zone
              </button>
            </div>
          </div>

          {shippingZones.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm border border-dashed border-stone-200 rounded-lg">
              Aucune zone configurée. Chargez les zones par défaut ou ajoutez-en une.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {shippingZones.map((zone) => (
                <div key={zone.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-1">
                      Zone / Commune
                    </label>
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => handleUpdateZoneName(zone.id, e.target.value)}
                      className="w-full text-sm font-medium text-stone-900 border border-stone-200 rounded-lg px-3 py-2 focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-1">
                        Tarif
                      </label>
                      <div className="relative rounded-lg w-36">
                        <input
                          type="number"
                          min="0"
                          value={zone.price}
                          onChange={(e) => handleUpdatePrice(zone.id, e.target.value)}
                          className="w-full text-sm rounded-lg border border-stone-200 pr-12 py-2 text-right focus:border-black focus:ring-1 focus:ring-black"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-xs text-stone-400 font-medium">FCFA</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteZone(zone.id)}
                      className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                      aria-label="Supprimer la zone"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveShippingTariffs}
              disabled={isSaving || shippingZones.length === 0}
              className="px-5 py-2.5 bg-stone-900 text-white font-medium text-sm rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les tarifs'}
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
