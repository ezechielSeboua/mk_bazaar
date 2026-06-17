<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'customer_name',
        'customer_phone',
        'order_number',
        'delivery_location',
        'delivery_fee',
        'detailed_address',
        'total_price',
        'status',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'delivery_fee' => 'integer',
        'total_price' => 'integer',
    ];

    /**
     * Relation avec l'utilisateur qui a passé la commande.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec les multiples articles contenus dans cette commande.
     * C'est cette relation qui remplace l'ancien champ JSON 'products'.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}