import { motion } from 'framer-motion';

export function DashboardSpinner({ message = 'Chargement…' }) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <svg className="w-6 h-6 text-stone-400 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-stone-500 text-sm">{message}</p>
            </div>
        </div>
    );
}

export function DashboardTableSkeleton({ rows = 3, cols = 5 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <motion.tr
                    key={i}
                    className="border-b border-stone-100"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                    {Array.from({ length: cols }).map((__, j) => (
                        <td key={j} className="py-4 px-6">
                            <div className="h-4 bg-stone-200 rounded w-full max-w-[120px]" />
                        </td>
                    ))}
                </motion.tr>
            ))}
        </>
    );
}
