/*
 * Formats et classes partagés du back-office (maquette « Retail premium »).
 */

/** 26500 → « 26 500 FCFA » (espaces normales, pas d'insécables fines). */
export const formatFCFA = (value) =>
    `${Math.round(Number(value) || 0).toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA`;

/** 26 500 → « 27 k » ; 1 250 000 → « 1,3 M ». Pour les étiquettes de graphique. */
export const formatCompact = (value) => {
    const n = Number(value) || 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')} M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
    return String(n);
};

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    value ? new Date(value).toLocaleDateString('fr-FR', options) : '—';

/** Classes de bouton partagées (lien ou bouton). */
export const buttonClass = (variant = 'primary', size = 'md') => {
    const base = 'inline-flex items-center justify-center gap-2 rounded font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] disabled:opacity-50 disabled:cursor-not-allowed';
    const sizes = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-10 px-3.5 text-[13px]', lg: 'h-11 px-5 text-sm' };
    const variants = {
        primary: 'bg-[#111] text-white hover:bg-[#333]',
        secondary: 'bg-white text-[#111] border border-[#d4d4d4] hover:bg-[#f5f5f5]',
        ghost: 'text-[#444] hover:bg-[#f1f1f1]',
    };
    return `${base} ${sizes[size]} ${variants[variant]}`;
};

/** Champ de formulaire (input, select). */
export const fieldClass = 'h-10 px-3.5 border border-[#d9d9d9] rounded bg-white text-[13.5px] text-[#111] outline-none focus:border-[#111] transition-colors';

/** Libellé de champ. */
export const labelClass = 'block text-[13px] font-medium text-[#222] mb-1.5';

/** Télécharge un CSV (séparateur « ; », BOM UTF-8 pour Excel). */
export const downloadCsv = (filename, header, rows) => {
    const escape = (value) => {
        const text = value === null || value === undefined ? '' : String(value);
        return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const content = [header, ...rows].map((row) => row.map(escape).join(';')).join('\n');
    const blob = new Blob([String.fromCharCode(0xfeff) + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/** Libellé lisible des attributs d'une variante : « M · Original ». */
export const variantLabel = (attributes) =>
    Object.values(attributes ?? {}).filter(Boolean).join(' · ');

/** Numéro utilisable dans un lien tel: ou wa.me (chiffres uniquement), sinon null. */
export const phoneDigits = (phone) => {
    if (!phone || !/^[\d\s+().-]{6,20}$/.test(phone)) return null;
    return phone.replace(/\D/g, '');
};

/** En-têtes et cellules de tableau homogènes. */
export const th = 'text-left text-[12.5px] font-medium text-[#666] px-5 py-[11px] bg-[#fafafa] border-b border-[#ececec] whitespace-nowrap';
export const td = 'px-5 py-[13px] border-b border-[#f0f0f0] align-middle';
