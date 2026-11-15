<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** Envoyée, en attente de validation. */
    public const STATUS_PENDING   = 'pending';
    /** Validée avec le client, en traitement. */
    public const STATUS_CONFIRMED = 'confirmed';
    /** En livraison. */
    public const STATUS_SHIPPING  = 'shipping';
    /** Livrée : seul statut compté comme encaissé. */
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_SHIPPING,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    /** Commandes ni livrées ni annulées. */
    public const IN_PROGRESS_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_SHIPPING,
    ];

    protected $fillable = [
        'user_id',
        'customer_name',
        'customer_phone',
        'order_number',
        'delivery_location',
        'delivery_fee',
        'discount_total',
        'detailed_address',
        'total_price',
        'status',
    ];

    protected $casts = [
        'user_id'        => 'integer',
        'delivery_fee'   => 'integer',
        'discount_total' => 'integer',
        'total_price'    => 'integer',
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
