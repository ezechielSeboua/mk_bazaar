import { useMemo } from 'react';
import { Ruler, Check, AlertCircle } from 'lucide-react';

// Palette de repli pour les couleurs récurrentes de MK BAZAAR
const COLOR_MAP = {
  original: { hex: '#c07b5a', bg: 'bg-[#c07b5a]', border: 'border-[#a5684a]' },
  indigo: { hex: '#1e3a8a', bg: 'bg-[#1e3a8a]', border: 'border-blue-900' },
  terre: { hex: '#78350f', bg: 'bg-[#78350f]', border: 'border-amber-900' },
  noir: { hex: '#18181b', bg: 'bg-stone-900', border: 'border-stone-950' },
  black: { hex: '#18181b', bg: 'bg-stone-900', border: 'border-stone-950' },
  blanc: { hex: '#f4f4f5', bg: 'bg-stone-100', border: 'border-stone-300' },
  white: { hex: '#f4f4f5', bg: 'bg-stone-100', border: 'border-stone-300' },
  ocre: { hex: '#d97706', bg: 'bg-amber-600', border: 'border-amber-700' },
  vert: { hex: '#065f46', bg: 'bg-emerald-800', border: 'border-emerald-900' },
  bordeaux: { hex: '#881337', bg: 'bg-rose-900', border: 'border-rose-950' },
  rose: { hex: '#f43f5e', bg: 'bg-rose-500', border: 'border-rose-600' },
  bleu: { hex: '#2563eb', bg: 'bg-blue-600', border: 'border-blue-700' },
};

function getSwatchStyle(colorName) {
  if (!colorName) return { bg: 'bg-stone-200', border: 'border-stone-300' };
  const key = String(colorName).trim().toLowerCase();
  return COLOR_MAP[key] || { bg: 'bg-stone-400', border: 'border-stone-500' };
}

export default function ProductVariantSelector({
  variants = [],
  selectedVariant,
  onSelectVariant,
  onOpenSizeGuide,
}) {
  if (!variants || variants.length === 0) return null;

  // 1. Extraire les dimensions disponibles (Couleur, Taille/Pointure)
  const { colors, sizes, hasColorDim, hasSizeDim, colorKey, sizeKey } = useMemo(() => {
    let foundColorKey = null;
    let foundSizeKey = null;

    const colorSet = new Set();
    const sizeSet = new Set();

    variants.forEach((v) => {
      if (!v.attributes || typeof v.attributes !== 'object') return;
      Object.entries(v.attributes).forEach(([k, val]) => {
        const lowerK = k.toLowerCase();
        if (['couleur', 'color'].includes(lowerK)) {
          foundColorKey = k;
          if (val) colorSet.add(val);
        } else if (['taille', 'size', 'pointure'].includes(lowerK)) {
          foundSizeKey = k;
          if (val) sizeSet.add(val);
        }
      });
    });

    return {
      colors: Array.from(colorSet),
      sizes: Array.from(sizeSet),
      hasColorDim: Boolean(foundColorKey && colorSet.size > 0),
      hasSizeDim: Boolean(foundSizeKey && sizeSet.size > 0),
      colorKey: foundColorKey,
      sizeKey: foundSizeKey,
    };
  }, [variants]);

  // Valeurs actuellement sélectionnées
  const currentColor = selectedVariant?.attributes?.[colorKey] || colors[0] || null;
  const currentSize = selectedVariant?.attributes?.[sizeKey] || sizes[0] || null;

  // 2. Gestion du changement de couleur
  const handleColorChange = (newColor) => {
    // Essayer de trouver la variante avec la même taille
    let target = variants.find(
      (v) =>
        v.attributes?.[colorKey] === newColor &&
        v.attributes?.[sizeKey] === currentSize &&
        v.stock > 0
    );

    // Si épuisée dans cette taille, prendre la première taille disponible pour cette couleur
    if (!target) {
      target = variants.find(
        (v) => v.attributes?.[colorKey] === newColor && v.stock > 0
      );
    }

    // Sinon n'importe quelle variante de cette couleur
    if (!target) {
      target = variants.find((v) => v.attributes?.[colorKey] === newColor);
    }

    if (target) {
      onSelectVariant(target);
    }
  };

  // 3. Gestion du changement de taille
  const handleSizeChange = (newSize) => {
    // Trouver la variante avec la couleur courante et cette taille
    let target = variants.find(
      (v) =>
        v.attributes?.[sizeKey] === newSize &&
        v.attributes?.[colorKey] === currentColor
    );

    // Si non trouvée, première variante ayant cette taille
    if (!target) {
      target = variants.find((v) => v.attributes?.[sizeKey] === newSize);
    }

    if (target) {
      onSelectVariant(target);
    }
  };

  // Vérifier la disponibilité d'une taille pour la couleur courante
  const isSizeAvailableForCurrentColor = (size) => {
    if (!hasColorDim) {
      const v = variants.find((v) => v.attributes?.[sizeKey] === size);
      return v ? v.stock > 0 : false;
    }
    const match = variants.find(
      (v) =>
        v.attributes?.[sizeKey] === size &&
        v.attributes?.[colorKey] === currentColor
    );
    return match ? match.stock > 0 : false;
  };

  // Trouver la remise éventuelle pour la taille courante
  const getDiscountForSize = (size) => {
    const match = variants.find(
      (v) =>
        v.attributes?.[sizeKey] === size &&
        v.attributes?.[colorKey] === currentColor
    );
    if (match?.old_price && match.old_price > match.price) {
      return Math.round(((match.old_price - match.price) / match.old_price) * 100);
    }
    return null;
  };

  // Repli : si les attributs ne contiennent ni couleur ni taille (cas générique rare)
  if (!hasColorDim && !hasSizeDim) {
    return (
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-[0.2em] font-bold block text-stone-800">
          Options disponibles :
        </label>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const isSelected = selectedVariant?.id === v.id;
            const label = Object.values(v.attributes || {}).join(' · ') || `Option #${v.id}`;
            const outOfStock = v.stock <= 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={outOfStock}
                onClick={() => onSelectVariant(v)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'border-stone-950 bg-stone-950 text-white shadow-sm'
                    : outOfStock
                    ? 'border-stone-100 bg-stone-50 text-stone-300 line-through cursor-not-allowed'
                    : 'border-stone-200 text-stone-800 hover:border-stone-400 bg-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-1">
      {/* 1. DIMENSION COULEUR */}
      {hasColorDim && colors.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">
              Couleur : <span className="text-stone-950 font-semibold">{currentColor}</span>
            </span>
            <span className="text-[10px] text-stone-400 font-light">
              {colors.length} couleurs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {colors.map((colorName) => {
              const isSelected = currentColor === colorName;
              const swatch = getSwatchStyle(colorName);

              // Trouver une photo miniature de cette couleur si disponible
              const sampleVariant = variants.find(
                (v) => v.attributes?.[colorKey] === colorName && v.image_path
              );

              return (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => handleColorChange(colorName)}
                  title={`Sélectionner couleur ${colorName}`}
                  aria-label={`Couleur ${colorName}`}
                  className={`group relative w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center p-0.5 ${
                    isSelected
                      ? 'ring-2 ring-stone-950 ring-offset-2 ring-offset-[#F9F9F7] scale-105'
                      : 'hover:scale-105 hover:ring-1 hover:ring-stone-400 hover:ring-offset-1'
                  }`}
                >
                  <span
                    className={`w-full h-full rounded-full border shadow-inner flex items-center justify-center overflow-hidden ${
                      swatch.bg
                    } ${swatch.border}`}
                  >
                    {sampleVariant?.image_path ? (
                      <img
                        src={sampleVariant.image_path}
                        alt={colorName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : null}

                    {isSelected && !sampleVariant?.image_path && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          ['blanc', 'white'].includes(colorName.toLowerCase())
                            ? 'text-stone-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </span>

                  {/* Tooltip discret au survol */}
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                    {colorName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DIMENSION TAILLE / POINTURE */}
      {hasSizeDim && sizes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">
              {sizeKey === 'pointure' ? 'Pointure' : 'Taille'} :{' '}
              <span className="text-stone-950 font-semibold">{currentSize}</span>
            </span>

            {onOpenSizeGuide && (
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="inline-flex items-center gap-1.5 text-[11px] text-stone-600 hover:text-stone-950 underline underline-offset-4 font-medium transition-colors cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Guide des tailles</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {sizes.map((size) => {
              const isSelected = String(currentSize) === String(size);
              const isAvailable = isSizeAvailableForCurrentColor(size);
              const discount = getDiscountForSize(size);

              return (
                <button
                  key={String(size)}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleSizeChange(size)}
                  aria-label={`${sizeKey} ${size}${!isAvailable ? ' (épuisé)' : ''}`}
                  className={`relative py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all duration-200 text-center select-none ${
                    isSelected
                      ? 'border-stone-950 bg-stone-950 text-white shadow-md scale-[1.02]'
                      : isAvailable
                      ? 'border-stone-200 bg-white text-stone-800 hover:border-stone-950 hover:bg-stone-50'
                      : 'border-stone-100 bg-stone-50/80 text-stone-300 cursor-not-allowed overflow-hidden'
                  }`}
                >
                  <span>{size}</span>

                  {/* Ligne diagonale élégante si rupture */}
                  {!isAvailable && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-[120%] h-[1px] bg-stone-300 rotate-[-25deg]" />
                    </span>
                  )}

                  {/* Badge de remise sur la variante */}
                  {discount && isAvailable && (
                    <span
                      className={`absolute -top-1.5 -right-1 text-[8px] font-mono font-bold px-1 py-0.2 rounded-full ${
                        isSelected ? 'bg-white text-stone-950' : 'bg-rose-600 text-white'
                      }`}
                    >
                      -{discount}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ALERTE STOCK LIMITÉ SUR LA COMBINAISON SÉLECTIONNÉE */}
      {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium">
            Forte demande : plus que <strong>{selectedVariant.stock} pièces</strong> disponibles dans cette option !
          </span>
        </div>
      )}
    </div>
  );
}

