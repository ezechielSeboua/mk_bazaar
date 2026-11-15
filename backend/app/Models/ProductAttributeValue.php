<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAttributeValue extends Model
{
    protected $fillable = ['product_attribute_id', 'value', 'hex', 'sort_order'];

    protected $casts = [
        'product_attribute_id' => 'integer',
        'sort_order'           => 'integer',
    ];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(ProductAttribute::class, 'product_attribute_id');
    }
}
