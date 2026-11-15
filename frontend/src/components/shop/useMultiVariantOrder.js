import { useMemo, useState } from 'react';
import useVariantSelection from './useVariantSelection';
import { addToCart, getPricing } from './shopUtils';

/** « Marron · M » pour une ligne de commande. */
export const variantLineLabel = (variant) => Object.values(variant?.attributes ?? {}).filter(Boolean).join(' · ') || 'Article';

export const lineKey = (variant) => (variant ? `v${variant.id}` : 'product');

/**
 * État d'une commande multi-variantes (modèle « variations et quantités ») :
 * - `groupAttributes` (couleur, finition…) se choisissent par vignettes ;
 * - `rowAttribute` (taille, pointure, longueur…) donne une ligne par valeur,
 *   chacune avec sa quantité ;
 * - les quantités sont conservées quand on change de vignette.
 *
 * Partagé entre la fiche produit (en ligne) et le panneau latéral.
 */
export default function useMultiVariantOrder(product, initialSelection = null) {
    const { attributes, variants } = useVariantSelection(product);
    const rowAttribute = attributes[attributes.length - 1] ?? null;
    const groupAttributes = useMemo(() => attributes.slice(0, -1), [attributes]);

    const [group, setGroupState] = useState(() => {
        const first = variants.find((v) => (v.stock ?? 0) > 0) ?? variants[0];
        const base = initialSelection ?? first?.attributes ?? {};
        return Object.fromEntries(groupAttributes.map((a) => [a.slug, base[a.slug] ?? a.values[0]?.value]));
    });
    const [quantities, setQuantities] = useState({});

    const matchesGroup = (variant, selection) =>
        groupAttributes.every((a) => variant.attributes?.[a.slug] === selection[a.slug]);

    const rows = useMemo(() => {
        if (!variants.length) {
            return [{ key: 'product', label: 'Quantité', variant: null, stock: product.stock ?? 0, pricing: getPricing(product) }];
        }
        if (!rowAttribute) {
            return variants.map((v) => ({ key: lineKey(v), label: 'Quantité', variant: v, stock: v.stock ?? 0, pricing: getPricing(product, v) }));
        }
        return rowAttribute.values
            .map(({ value }) => {
                const variant = variants.find((v) => matchesGroup(v, group) && v.attributes?.[rowAttribute.slug] === value);
                return variant ? { key: lineKey(variant), label: value, variant, stock: variant.stock ?? 0, pricing: getPricing(product, variant) } : null;
            })
            .filter(Boolean);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variants, rowAttribute, group, product]);

    const lines = useMemo(() => {
        const byKey = Object.fromEntries(variants.map((v) => [lineKey(v), v]));
        return Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([key, quantity]) => {
                const variant = key === 'product' ? null : byKey[key] ?? null;
                return { key, variant, quantity, pricing: getPricing(product, variant) };
            });
    }, [quantities, variants, product]);

    const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.pricing.final_price * l.quantity, 0);

    /** Image de la vignette en cours (photo d'une variante correspondante). */
    const groupImage = variants.find((v) => matchesGroup(v, group) && v.image_path)?.image_path ?? null;

    return {
        product,
        variants,
        attributes,
        rowAttribute,
        groupAttributes,
        group,
        setGroup: (slug, value) => setGroupState((prev) => ({ ...prev, [slug]: value })),
        rows,
        quantities,
        setQuantity: (key, qty) => setQuantities((prev) => ({ ...prev, [key]: qty })),
        lines,
        totalQuantity,
        subtotal,
        groupImage,
        /** Nombre d'articles choisis portant cette valeur (badge des vignettes). */
        countFor: (slug, value) => lines.filter((l) => l.variant?.attributes?.[slug] === value).reduce((s, l) => s + l.quantity, 0),
        addAllToCart: () => {
            lines.forEach((l) => addToCart({ product, variant: l.variant, quantity: l.quantity }));
            setQuantities({});
        },
        reset: () => setQuantities({}),
    };
}
