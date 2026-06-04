import { motion, AnimatePresence } from "framer-motion";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, confirmLabel = "Supprimer" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-lg shadow-xl p-6 w-96" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
            {title && <h3 className="text-lg font-medium uppercase tracking-wider mb-4">{title}</h3>}
            <p className="text-sm text-stone-600 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={onCancel} disabled={loading} className="border border-stone-300 px-4 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-stone-50 disabled:opacity-50">
                Annuler
              </button>
              <button onClick={onConfirm} disabled={loading} className="bg-red-600 text-white px-4 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <><Spinner /> {confirmLabel}...</> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}