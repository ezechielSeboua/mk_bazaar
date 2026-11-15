import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { resolveMediaUrl } from '../../config/env';
import { colorHex, formatFCFA, showStrikethrough } from './shopUtils';
import { variantLineLabel } from './useMultiVariantOrder';

/*
 * Affichage de la sélection multiple (vignettes + lignes avec quantités) et
 * de son pied (sous-total, boutons). L'état vient de useMultiVariantOrder.
 */

function Stepper({ value, max, onChange, label }) {
    return (
        <div className="inline-flex items-center gap-1.5 shrink-0" role="group" aria-label={label}>
            <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} className="w-10 h-10 rounded-full grid place-items-center bg-[#f1f1f1] text-[#111] disabled:text-[#bbb] disabled:bg-[#f5f5f5]" aria-label="Diminuer">
                <Minus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                max={max}
                value={value}
                onChange={(e) => onChange(Math.max(0, Math.min(max, parseInt(e.target.value || '0', 10) || 0)))}
                aria-label={`${label} : quantité`}
                className="w-11 h-10 text-center text-[15px] tabular-nums bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="w-10 h-10 rounded-full grid place-items-center border border-[#d9d9d9] text-[#111] disabled:text-[#bbb] disabled:border-[#eee]" aria-label="Augmenter">
                <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
            </button>
        </div>
    );
}

/** Vignettes (couleur, finition…) puis une ligne par taille avec sa quantité. */
export function MultiVariantPicker({ order, guideLabel = null, onGuide = null }) {
    const { product, variants, groupAttributes, rowAttribute, group, setGroup, rows, quantities, setQuantity, countFor } = order;

    return (
        <div>
            {groupAttributes.map((attribute) => {
                const withImages = attribute.values.some((v) => v.image);
                return (
                    <div key={attribute.slug} className="pb-5">
                        <p className="text-[15px] font-semibold mb-3">
                            {attribute.name} : <span className="font-normal">{group[attribute.slug]}</span>
                        </p>
                        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={attribute.name}>
                            {attribute.values.map(({ value, hex, image }) => {
                                if (!variants.some((v) => v.attributes?.[attribute.slug] === value)) return null;
                                const active = group[attribute.slug] === value;
                                const count = countFor(attribute.slug, value);
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setGroup(attribute.slug, value)}
                                        title={value}
                                        className={`relative w-[72px] h-[72px] sm:w-[78px] sm:h-[78px] rounded-lg bg-[#f5f5f5] grid place-items-center overflow-hidden transition-shadow ${active ? 'ring-2 ring-[#111]' : 'hover:ring-1 hover:ring-[#bbb]'}`}
                                    >
                                        {withImages && image ? (
                                            <img src={resolveMediaUrl(image)} alt={value} className="w-full h-full object-cover" />
                                        ) : attribute.family === 'color' ? (
                                            <span className="flex flex-col items-center gap-1.5">
                                                <span className="w-8 h-8 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]" style={{ background: colorHex(value, hex) }} aria-hidden="true" />
                                                <span className="text-[11px] text-[#444] px-1 truncate max-w-[70px]">{value}</span>
                                            </span>
                                        ) : (
                                            <span className="text-[13px] font-medium px-1 text-center">{value}</span>
                                        )}
                                        {count > 0 && (
                                            <span className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-[#111] text-white text-[11px] font-semibold grid place-items-center">{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {rowAttribute && (
                <div className="flex justify-between items-center mb-3">
                    <p className="text-[15px] font-semibold">{rowAttribute.name}</p>
                    {guideLabel && onGuide && <button type="button" onClick={onGuide} className="text-[13px] underline">{guideLabel}</button>}
                </div>
            )}
            <ul className="space-y-3.5">
                {rows.map((row) => {
                    const qty = quantities[row.key] ?? 0;
                    const soldOut = row.stock <= 0;
                    return (
                        <li key={row.key} className="flex items-center gap-3 sm:gap-4">
                            <span className={`min-w-[52px] h-11 px-3.5 rounded-lg grid place-items-center text-[15px] ${qty > 0 ? 'ring-2 ring-[#111] ring-inset' : 'bg-[#f5f5f5]'} ${soldOut ? 'text-[#aaa] line-through' : ''}`}>
                                {row.label}
                            </span>
                            <span className="ml-auto text-right tabular-nums">
                                {showStrikethrough(row.pricing) && <s className="block text-[12.5px] text-[#767676]">{formatFCFA(row.pricing.base_price)}</s>}
                                <span className="text-[15px] sm:text-base">{formatFCFA(row.pricing.final_price)}</span>
                                {soldOut ? <span className="block text-[12px] text-[#b42318]">Épuisé</span>
                                    : row.stock <= 3 && <span className="block text-[12px] text-[#8a4b00]">Plus que {row.stock}</span>}
                            </span>
                            <Stepper value={qty} max={Math.max(0, row.stock)} onChange={(v) => setQuantity(row.key, v)} label={`${product.name} ${row.label}`} />
                        </li>
                    );
                })}
            </ul>
            {rows.length === 0 && <p className="text-sm text-[#666]">Aucune variante disponible pour ce choix.</p>}
        </div>
    );
}

/** Sous-total dépliable et boutons « Ajouter au panier » / « Commander sur WhatsApp ». */
export function MultiVariantActions({ order, onAddToCart, onWhatsApp, feedback = null }) {
    const [open, setOpen] = useState(false);
    const { lines, totalQuantity, subtotal } = order;

    return (
        <div>
            {open && lines.length > 0 && (
                <ul className="mb-3 max-h-40 overflow-y-auto space-y-1.5 text-[13.5px]">
                    {lines.map((l) => (
                        <li key={l.key} className="flex justify-between gap-4">
                            <span className="text-[#444]">{variantLineLabel(l.variant)} × {l.quantity}</span>
                            <span className="tabular-nums">{formatFCFA(l.pricing.final_price * l.quantity)}</span>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex justify-between items-center mb-4">
                <span className="text-[17px] font-semibold">Sous-total</span>
                <button type="button" onClick={() => setOpen((v) => !v)} disabled={!lines.length} className="flex items-center gap-2 text-[19px] font-semibold tabular-nums" aria-expanded={open} aria-label="Afficher le détail du sous-total">
                    {formatFCFA(subtotal)}
                    {lines.length > 0 && (open ? <ChevronDown className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" /> : <ChevronUp className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />)}
                </button>
            </div>
            <p className="sr-only" aria-live="polite">{feedback || `${totalQuantity} article${totalQuantity > 1 ? 's' : ''} sélectionné${totalQuantity > 1 ? 's' : ''}`}</p>
            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={onAddToCart} disabled={!totalQuantity} className="h-14 rounded-full bg-[#111] text-white text-[14px] sm:text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#333] disabled:opacity-40">
                    <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.8} aria-hidden="true" /> {feedback || 'Ajouter au panier'}
                </button>
                <button type="button" onClick={onWhatsApp} disabled={!totalQuantity} className="h-14 rounded-full border-2 border-[#1f8f4e] text-[#1f8f4e] text-[14px] sm:text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1f8f4e] hover:text-white disabled:opacity-40">
                    <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} aria-hidden="true" /> Commander sur WhatsApp
                </button>
            </div>
            {!totalQuantity && <p className="mt-2.5 text-[12.5px] text-[#666] text-center">Indiquez une quantité pour au moins une option.</p>}
        </div>
    );
}
