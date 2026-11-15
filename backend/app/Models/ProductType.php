<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Type de produit (Vêtement, Chaussures, Collier / chaîne…) : définit les
 * attributs de variation proposés au client et les filtres du catalogue.
 */
class ProductType extends Model
{
    protected $fillable = ['name', 'slug', 'guide_label', 'show_as_filter'];

    protected $casts = [
        'show_as_filter' => 'boolean',
    ];

    /**
     * Attributs de variation, dans l'ordre (attribut 1, attribut 2…).
     * Nommée ainsi car `attributes` est réservé par Eloquent.
     */
    public function variationAttributes(): BelongsToMany
    {
        return $this->belongsToMany(ProductAttribute::class, 'product_type_attribute')
            ->withPivot('position')
            ->orderByPivot('position');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }
}
