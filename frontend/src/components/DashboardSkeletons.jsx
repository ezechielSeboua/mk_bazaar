import { motion } from 'framer-motion';

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

export function DashboardCardSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white p-5 rounded-xl border border-stone-200 h-32 animate-pulse"
                />
            ))}
        </div>
    );
}

export function DashboardPageLoader({ label = 'Chargement…' }) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-t-transparent border-black rounded-full animate-spin" />
                <p className="text-stone-500 text-sm">{label}</p>
            </div>
        </div>
    );
}
