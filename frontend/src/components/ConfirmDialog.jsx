import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/**
 * Boîte de confirmation du back-office (maquette « Retail premium »).
 * `tone="danger"` (défaut) pour une suppression, `"default"` pour une action neutre.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Supprimer",
  tone = "danger",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape" && !loading) onCancel?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 font-admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onCancel?.()}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={title ? "confirm-title" : undefined}
            aria-describedby="confirm-message"
            className="bg-white rounded shadow-xl p-6 w-full max-w-sm"
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.97 }}
            onClick={(event) => event.stopPropagation()}
          >
            {title && <h2 id="confirm-title" className="text-lg font-semibold tracking-[-0.02em] text-[#111] mb-2">{title}</h2>}
            <p id="confirm-message" className="text-sm text-[#555] leading-relaxed mb-6">{message}</p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="h-10 px-4 rounded border border-[#d4d4d4] bg-white text-[13px] font-semibold text-[#111] hover:bg-[#f5f5f5] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                autoFocus
                className={`h-10 px-4 rounded text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-50 ${
                  tone === "danger" ? "bg-[#b42318] hover:bg-[#912018]" : "bg-[#111] hover:bg-[#333]"
                }`}
              >
                {loading && <Spinner />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
