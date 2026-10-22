import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Scissors, ShieldAlert, RotateCcw, Truck } from 'lucide-react';

export default function ProductAccordions({ description = '', categoryName = '' }) {
  const [openIndex, setOpenIndex] = useState(0); // Premier accordéon ouvert par défaut

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const sections = [
    {
      id: 'details',
      title: 'Description & Savoir-faire',
      icon: Sparkles,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
          <p>{description || 'Pièce issue des collections MK BAZAAR, façonnée avec des matières soigneusement sélectionnées pour leur tombé impeccable et leur confort absolu.'}</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-stone-500">
            <li>Coupe étudiée pour sublimer la silhouette au quotidien ou lors de vos réceptions.</li>
            <li>Finitions intérieures gansées et coutures renforcées.</li>
            <li>Création artisanale limitée en série numérotée.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'care',
      title: 'Matières & Conseils d’entretien',
      icon: Scissors,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
          <p>
            <strong>Composition :</strong> Tissu wax et cotonnades d'exception de premier choix (100% coton naturel).
          </p>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 space-y-1.5 text-xs">
            <p className="font-semibold text-stone-900">Recommandations de préservation :</p>
            <ul className="list-disc pl-4 space-y-0.5 text-stone-600 font-light">
              <li>Lavage délicat à la main ou en machine à 30°C maximum.</li>
              <li>Laver avec des teintes similaires, sans agent blanchissant.</li>
              <li>Séchage naturel sur cintre à l'ombre (éviter le sèche-linge).</li>
              <li>Repassage doux sur l'envers pour préserver l'éclat des couleurs.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Livraison & Échange sous 48h',
      icon: Truck,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
              <span className="font-bold text-stone-950 block mb-0.5">Abidjan</span>
              <span className="text-stone-500 font-light">Livraison express en 24h à 48h à domicile ou au bureau.</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
              <span className="font-bold text-stone-950 block mb-0.5">Villes de l'intérieur</span>
              <span className="text-stone-500 font-light">Expédition sécurisée par car / point relais sous 48h à 72h.</span>
            </div>
          </div>
          <p className="text-xs text-stone-500 font-light">
            🔄 <strong>Échange serein :</strong> Si la taille ne vous convient pas parfaitement, nous procédons à l'échange sous 48h après réception sur simple message WhatsApp.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="divide-y divide-stone-200/80 border-y border-stone-200/80 mt-8">
      {sections.map((section, index) => {
        const isOpen = openIndex === index;
        const Icon = section.icon;

        return (
          <div key={section.id} className="py-4">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between text-left group"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-stone-400 group-hover:text-stone-950 transition-colors" />
                <span className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-stone-900 group-hover:text-stone-700 transition-colors">
                  {section.title}
                </span>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-stone-950' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-1">{section.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

