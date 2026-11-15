<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'sku',
        'description',
        'specs',
        'price',
        'stock',
        'rating',
        'category_id',
        'is_active',
        'featured',
        'is_new',
        'image_path',
    ];

    /**
     * `old_price` est remplacé par les promotions (colonne vidée, supprimée plus tard).
     * Le prix affiché au client est exposé dans `pricing` (voir PricingService).
     */
    protected $hidden = ['old_price'];

    protected $casts = [
        'category_id' => 'integer',
        'price'       => 'integer',
        'stock'       => 'integer',
        'rating'      => 'float',
        'is_active'   => 'boolean',
        'featured'    => 'boolean',
        'is_new'      => 'boolean',
        'image_path'  => 'array',
        'specs'       => 'array',
    ];

    // Exposé au frontend : true si le produit (sans variante) a du stock
    public function getInStockAttribute(): bool
    {
        return $this->stock > 0;
    }

    /**
     * Définit la clé de routage par défaut pour Laravel (Slug).
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Relation avec la catégorie.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relation avec les variantes.
     * C'est ici (dans ProductVariant) que se trouve désormais le champ 'stock'.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function promotions(): BelongsToMany
    {
        return $this->belongsToMany(Promotion::class, 'promotion_product');
    }
}
