import React from 'react';

export default function ProductCard({ product }) {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

  return (
    <a
      href={`/products/${product.slug}`}
      className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
    >
      {primaryImage && (
        <img
          src={primaryImage.path}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
        <p className="text-orange-500 font-bold text-sm">{product.price} FCFA</p>
        {!product.in_stock && (
          <p className="text-red-500 text-xs mt-1">Épuisé</p>
        )}
      </div>
    </a>
  );
}
