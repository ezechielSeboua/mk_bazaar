import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '../../constants/orderStatus';

/*
 * Briques visuelles du back-office (maquette « Retail premium ») :
 * cartes blanches à bord fin, rayon 4 px, typo Inter, accents noirs.
 */

export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111]">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-[#666]">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
        </div>
    );
}

export function Panel({ title, action, children, className = '' }) {
    return (
        <section className={`bg-white border border-[#ececec] rounded min-w-0 ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#ececec]">
                    {title && <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#111]">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

export function SeeAllLink({ to, children = 'Tout voir' }) {
    return (
        <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#111] hover:underline">
            {children}
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
        </Link>
    );
}

export function KpiCard({ label, value, hint, tone = 'default', loading = false }) {
    return (
        <div className="bg-white border border-[#ececec] rounded px-5 py-[18px] min-w-0">
            <p className="text-[13px] text-[#666]">{label}</p>
            {loading ? (
                <div className="h-7 w-32 my-2 bg-[#f1f1f1] rounded animate-pulse" />
            ) : (
                <p className={`text-2xl font-semibold tracking-[-0.01em] tabular-nums mt-2 mb-1.5 truncate ${tone === 'danger' ? 'text-[#b42318]' : 'text-[#111]'}`}>
                    {value}
                </p>
            )}
            {hint && <div className="text-[12.5px] text-[#666]">{hint}</div>}
        </div>
    );
}

/** Pastille de statut de commande. */
export function OrderStatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium whitespace-nowrap ${ORDER_STATUS_TONE[status] ?? 'bg-[#f1f1f1] text-[#444]'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
            {ORDER_STATUS_LABEL[status] ?? status}
        </span>
    );
}

/** Groupe de boutons exclusifs (7 jours / 30 jours / 12 mois). */
export function SegmentedControl({ options, value, onChange, label }) {
    return (
        <div role="group" aria-label={label} className="inline-flex border border-[#e0e0e0] rounded overflow-hidden">
            {options.map((option, index) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                        className={`h-[38px] px-3.5 text-[13.5px] transition-colors ${index > 0 ? 'border-l border-[#e0e0e0]' : ''} ${
                            active ? 'bg-[#f1f1f1] text-[#111] font-semibold' : 'bg-white text-[#555] hover:bg-[#fafafa]'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Onglets soulignés (filtres par statut). `items` : [{ value, label, count? }]. */
export function Tabs({ items, value, onChange, label }) {
    return (
        <div role="tablist" aria-label={label} className="flex gap-1 px-3 border-b border-[#ececec] overflow-x-auto">
            {items.map((item) => {
                const active = item.value === value;
                return (
                    <button
                        key={item.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.value)}
                        className={`px-3.5 py-2.5 -mb-px text-sm whitespace-nowrap border-b-2 transition-colors ${
                            active ? 'border-[#111] text-[#111] font-semibold' : 'border-transparent text-[#666] hover:text-[#111]'
                        }`}
                    >
                        {item.label}
                        {item.count !== undefined && ` (${item.count})`}
                    </button>
                );
            })}
        </div>
    );
}

/** Pied de tableau : « Affichage de 1 à 25 sur 80 » + numéros de page. */
export function Pagination({ page, lastPage, total, perPage, onChange, disabled = false, noun = 'résultats' }) {
    if (!total) return null;
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push(`gap-${p}`);
            acc.push(p);
            return acc;
        }, []);

    const cell = 'min-w-8 h-8 px-2 grid place-items-center rounded border text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between px-5 py-3 text-[13px] text-[#666]">
            <span>Affichage de {from} à {to} sur {total} {noun}</span>
            {lastPage > 1 && (
                <nav className="flex gap-1.5" aria-label="Pagination">
                    <button type="button" className={`${cell} border-[#e0e0e0] bg-white text-[#111]`} onClick={() => onChange(page - 1)} disabled={disabled || page <= 1} aria-label="Page précédente">
                        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                    </button>
                    {pages.map((p) =>
                        typeof p === 'string' ? (
                            <span key={p} className="px-1 self-center">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onChange(p)}
                                disabled={disabled}
                                aria-current={p === page ? 'page' : undefined}
                                className={`${cell} ${p === page ? 'bg-[#111] border-[#111] text-white' : 'bg-white border-[#e0e0e0] text-[#111] hover:bg-[#f5f5f5]'}`}
                            >
                                {p}
                            </button>
                        ),
                    )}
                    <button type="button" className={`${cell} border-[#e0e0e0] bg-white text-[#111]`} onClick={() => onChange(page + 1)} disabled={disabled || page >= lastPage} aria-label="Page suivante">
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                    </button>
                </nav>
            )}
        </div>
    );
}

/** Panneau latéral (détail d'une commande, formulaire d'édition…). */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-xl' }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 font-admin">
                    <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className={`absolute inset-y-0 right-0 w-full ${width} bg-white shadow-xl flex flex-col`}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.22 }}
                    >
                        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#ececec]">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111] truncate">{title}</h2>
                                {subtitle && <div className="mt-1 text-[13px] text-[#666]">{subtitle}</div>}
                            </div>
                            <button type="button" onClick={onClose} className="p-2 -mr-2 text-[#666] hover:text-[#111]" aria-label="Fermer">
                                <X className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                        {footer && <footer className="px-6 py-4 border-t border-[#ececec] bg-[#fafafa]">{footer}</footer>}
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}

/** Interrupteur accessible (role="switch"). */
export function Switch({ checked, onChange, label, disabled = false, showLabel = false }) {
    return (
        <label className={`inline-flex items-center gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={showLabel ? undefined : label}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative w-[34px] h-5 rounded-full shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] ${checked ? 'bg-[#111]' : 'bg-[#cfcfcf]'}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} aria-hidden="true" />
            </button>
            {showLabel && <span className="text-sm text-[#222]">{label}</span>}
        </label>
    );
}

/** Pastille neutre ou d'état : tone = neutral | success | warning | danger | info. */
export function Badge({ tone = 'neutral', dot = false, children }) {
    const tones = {
        neutral: 'bg-[#f1f1f1] text-[#444]',
        success: 'bg-[#e7f6ec] text-[#166534]',
        warning: 'bg-[#fff4e0] text-[#8a4b00]',
        danger: 'bg-[#fdeaea] text-[#b42318]',
        info: 'bg-[#e8f0fe] text-[#1d4ed8]',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
            {children}
        </span>
    );
}

/** Encadré d'aide gris (icône info + texte). */
export function Tip({ icon: Icon, children }) {
    return (
        <div className="flex gap-2.5 bg-[#f6f6f5] rounded px-3.5 py-3 text-[13px] text-[#444] leading-[1.45] mb-4">
            {Icon && <Icon className="w-4 h-4 mt-px shrink-0 text-[#666]" strokeWidth={1.6} aria-hidden="true" />}
            <span>{children}</span>
        </div>
    );
}

/** Message d'erreur ou de succès en ligne. */
export function Notice({ tone = 'error', children }) {
    if (!children) return null;
    const tones = {
        error: 'bg-[#fdeaea] text-[#b42318] border-[#f5c2c0]',
        success: 'bg-[#e7f6ec] text-[#166534] border-[#b7e4c7]',
        info: 'bg-[#f1f1f1] text-[#444] border-[#e0e0e0]',
    };
    return (
        <p role={tone === 'error' ? 'alert' : 'status'} className={`text-[13px] border rounded px-3 py-2 ${tones[tone]}`}>
            {children}
        </p>
    );
}
