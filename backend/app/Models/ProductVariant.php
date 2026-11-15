<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'attributes',
        'price',
        'stock',
        'is_active',
        'image_path',
    ];

    /** Remplacé par les promotions (colonne vidée, supprimée plus tard). */
    protected $hidden = ['old_price'];

    /** Valeur par défaut (identique à la base) pour un modèle tout juste créé. */
    protected $attributes = [
        'is_active' => true,
    ];

    protected $casts = [
        'product_id' => 'integer',
        'attributes' => 'array',
        'price'      => 'integer',
        'stock'      => 'integer',
        'is_active'  => 'boolean',
    ];

    /**
     * Relation inverse : Une variante appartient à un produit principal.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function promotions(): BelongsToMany
    {
        return $this->belongsToMany(Promotion::class, 'promotion_variant');
    }
}
