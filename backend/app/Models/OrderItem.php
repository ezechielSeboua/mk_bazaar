<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_variant_id',
        'promotion_id',
        'quantity',
        'price',
        'discount',
    ];

    /**
     * price    : prix unitaire payé (remise déduite), figé à la commande.
     * discount : remise unitaire accordée, figée à la commande.
     */
    protected $casts = [
        'order_id'           => 'integer',
        'product_id'         => 'integer',
        'product_variant_id' => 'integer',
        'promotion_id'       => 'integer',
        'quantity'           => 'integer',
        'price'              => 'integer',
        'discount'           => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }
}
