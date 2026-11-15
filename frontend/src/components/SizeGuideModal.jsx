import { useState, useEffect } from 'react';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, HelpCircle } from 'lucide-react';

const CLOTHING_SIZES = [
  { size: 'XS', fr: '34', chest: '80 - 84', waist: '60 - 64', hips: '86 - 90', length: '138' },
  { size: 'S',  fr: '36', chest: '84 - 88', waist: '64 - 68', hips: '90 - 94', length: '140' },
  { size: 'M',  fr: '38', chest: '88 - 92', waist: '68 - 72', hips: '94 - 98', length: '142' },
  { size: 'L',  fr: '40', chest: '92 - 96', waist: '72 - 76', hips: '98 - 102', length: '144' },
  { size: 'XL', fr: '42', chest: '96 - 102', waist: '76 - 82', hips: '102 - 108', length: '145' },
  { size: 'XXL',fr: '44', chest: '102 - 108', waist: '82 - 88', hips: '108 - 114', length: '146' },
];

const SHOE_SIZES = [
  { eu: '38', foot: '24.0 cm' },
  { eu: '39', foot: '24.5 cm' },
  { eu: '40', foot: '25.0 cm' },
  { eu: '41', foot: '25.5 cm' },
  { eu: '42', foot: '26.0 cm' },
  { eu: '43', foot: '26.5 cm' },
  { eu: '44', foot: '27.0 cm' },
];

export default function SizeGuideModal({ isOpen, onClose, defaultTab = 'vetements' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useBodyScrollLock(isOpen);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          aria-label="Guide des tailles"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-900">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-stone-950">
                  Guide des tailles
                </h2>
                <p className="text-xs text-stone-500 font-light">
                  Mesures indicatives en centimètres pour les créations MK BAZAAR
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-950 transition-colors"
              aria-label="Fermer le guide des tailles"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Onglets */}
          <div className="flex px-6 pt-4 gap-4 border-b border-stone-100">
            <button
              onClick={() => setActiveTab('vetements')}
              className={`pb-3 text-xs uppercase tracking-widest font-bold transition-all relative ${
                activeTab === 'vetements'
                  ? 'text-stone-950 border-b-2 border-stone-950'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Vêtements (Robes, Ensembles)
            </button>
            <button
              onClick={() => setActiveTab('chaussures')}
              className={`pb-3 text-xs uppercase tracking-widest font-bold transition-all relative ${
                activeTab === 'chaussures'
                  ? 'text-stone-950 border-b-2 border-stone-950'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Chaussures & Sandales
            </button>
          </div>

          {/* Contenu Défilant */}
          <div className="p-6 overflow-y-auto space-y-6">
            {activeTab === 'vetements' ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-3.5">Taille</th>
                        <th className="py-3 px-3.5">Équiv. FR</th>
                        <th className="py-3 px-3.5">Poitrine (cm)</th>
                        <th className="py-3 px-3.5">Taille (cm)</th>
                        <th className="py-3 px-3.5">Bassin (cm)</th>
                        <th className="py-3 px-3.5">Longueur (cm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-light text-stone-700">
                      {CLOTHING_SIZES.map((row) => (
                        <tr key={row.size} className="hover:bg-stone-50/50 transition-colors">
                          <td className="py-3 px-3.5 font-bold text-stone-950">{row.size}</td>
                          <td className="py-3 px-3.5">{row.fr}</td>
                          <td className="py-3 px-3.5 font-mono">{row.chest}</td>
                          <td className="py-3 px-3.5 font-mono">{row.waist}</td>
                          <td className="py-3 px-3.5 font-mono">{row.hips}</td>
                          <td className="py-3 px-3.5 font-mono">{row.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs">
                    <HelpCircle className="w-4 h-4 text-[#c07b5a]" />
                    <span>Comment bien mesurer ?</span>
                  </div>
                  <ul className="text-xs text-stone-600 font-light space-y-1 pl-6 list-disc">
                    <li><strong>Tour de poitrine :</strong> mesurez horizontalement au niveau de la pointe des seins.</li>
                    <li><strong>Tour de taille :</strong> mesurez au creux de votre taille naturelle, sans serrer.</li>
                    <li><strong>Tour de bassin :</strong> mesurez à l'endroit le plus large de vos hanches.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Pointure EU</th>
                        <th className="py-3 px-4">Longueur du pied recommandée</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-light text-stone-700">
                      {SHOE_SIZES.map((row) => (
                        <tr key={row.eu} className="hover:bg-stone-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-stone-950">{row.eu}</td>
                          <td className="py-3 px-4 font-mono">{row.foot}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  💡 Nos souliers taillent normalement. Si vous hésitez entre deux pointures, nous vous recommandons de choisir la pointure au-dessus pour un confort idéal.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-stone-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors shadow-sm"
            >
              Compris
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

