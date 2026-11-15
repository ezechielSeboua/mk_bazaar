<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Attribut de variation (Couleur, Taille vêtement, Longueur…).
 * Son `slug` est la clé utilisée dans le JSON `product_variants.attributes`.
 */
class ProductAttribute extends Model
{
    public const FAMILIES = ['color', 'size', 'other'];

    /** Format d'un slug : sert de clé de chemin JSON dans les requêtes SQL. */
    public const SLUG_PATTERN = '/^[a-z][a-z0-9_]{0,49}$/';

    protected $fillable = ['name', 'slug', 'family'];

    public function values(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class)->orderBy('sort_order')->orderBy('id');
    }

    public function productTypes(): BelongsToMany
    {
        return $this->belongsToMany(ProductType::class, 'product_type_attribute')->withPivot('position');
    }
}
