<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'attributes',
        'price',
        'old_price',
        'stock',
        'image_path',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'attributes' => 'array',
        'price'      => 'integer',
        'old_price'  => 'integer',
        'stock'      => 'integer',
    ];

    /**
     * Relation inverse : Une variante appartient à un produit principal.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    
}