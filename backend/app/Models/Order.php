<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',             // ID de l'utilisateur (nullable si tu autorises les commandes invités)
        'order_number',        // Numéro de commande unique (ex: MK-2026-00001)
        'delivery_location',   // Ville / Zone de livraison (ex: Abidjan, Cocody)
        'delivery_fee',        // Frais de livraison (en centimes)
        'detailed_address',    // Adresse précise, numéro de téléphone, consignes
        'total_price',         // Montant total final payé (en centimes)
        'status',              // Statut (ex: 'pending', 'processing', 'delivered', 'cancelled')
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