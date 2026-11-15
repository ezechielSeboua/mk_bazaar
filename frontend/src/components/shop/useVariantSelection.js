import { useMemo, useState } from 'react';
import { activeVariants, humanizeAttribute } from './shopUtils';

/**
 * Sélection d'options (taille, couleur, finition, longueur…) générique.
 *
 * - Ordre et libellés des attributs : ceux du type de produit (`product.product_type`,
 *   renvoyé par la fiche produit), sinon ceux trouvés dans les variantes.
 * - Une valeur est « disponible » s'il existe une variante active en stock qui
 *   la porte, compatible avec les autres choix déjà faits.
 */
export default function useVariantSelection(product) {
    const variants = useMemo(() => activeVariants(product), [product]);

    const attributes = useMemo(() => {
        const typeAttributes = product?.product_type?.variation_attributes ?? [];
        const usedKeys = [];
        variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => { if (!usedKeys.includes(k)) usedKeys.push(k); }));

        const ordered = [
            ...typeAttributes.filter((a) => usedKeys.includes(a.slug)).map((a) => a.slug),
            ...usedKeys.filter((k) => !typeAttributes.some((a) => a.slug === k)),
        ];

        return ordered.map((slug) => {
            const meta = typeAttributes.find((a) => a.slug === slug);
            const present = [];
            variants.forEach((v) => {
                const value = v.attributes?.[slug];
                if (value && !present.includes(value)) present.push(value);
            });
            const typeOrder = meta?.values?.map((v) => v.value) ?? [];
            const values = [...typeOrder.filter((v) => present.includes(v)), ...present.filter((v) => !typeOrder.includes(v))];
            return {
                slug,
                name: meta?.name ?? humanizeAttribute(slug),
                family: meta?.family ?? (slug === 'couleur' ? 'color' : 'size'),
                values: values.map((value) => ({
                    value,
                    hex: meta?.values?.find((v) => v.value === value)?.hex ?? null,
                    image: variants.find((v) => v.attributes?.[slug] === value && v.image_path)?.image_path ?? null,
                })),
            };
        });
    }, [product, variants]);

    // Présélection : première variante en stock (ou la première tout court)
    const initial = useMemo(() => {
        const first = variants.find((v) => (v.stock ?? 0) > 0) ?? variants[0];
        return first ? { ...first.attributes } : {};
    }, [variants]);

    const [chosen, setChosen] = useState(null);
    const selection = chosen ?? initial;

    const matches = (variant, partial) =>
        Object.entries(partial).every(([slug, value]) => !value || variant.attributes?.[slug] === value);

    const isAvailable = (slug, value) => {
        const others = Object.fromEntries(Object.entries(selection).filter(([k]) => k !== slug));
        return variants.some((v) => (v.stock ?? 0) > 0 && v.attributes?.[slug] === value && matches(v, others));
    };

    const select = (slug, value) => {
        const next = { ...selection, [slug]: value };
        // Si la combinaison n'existe pas, on garde le choix et on recale les autres options.
        if (!variants.some((v) => matches(v, next))) {
            const fallback = variants.find((v) => v.attributes?.[slug] === value && (v.stock ?? 0) > 0)
                ?? variants.find((v) => v.attributes?.[slug] === value);
            setChosen(fallback ? { ...fallback.attributes } : next);
            return;
        }
        setChosen(next);
    };

    const selectedVariant = attributes.length
        ? variants.find((v) => attributes.every((a) => v.attributes?.[a.slug] === selection[a.slug])) ?? null
        : null;

    return {
        variants,
        attributes,
        selection,
        select,
        isAvailable,
        selectedVariant,
        hasVariants: variants.length > 0,
        reset: () => setChosen(null),
    };
}
