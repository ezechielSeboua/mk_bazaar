<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_variant_id', // On pointe directement sur la variante sélectionnée !
        'quantity',           // Quantité achetée
        'price',              // Prix unitaire AU MOMENT DE L'ACHAT (en centimes)
    ];

    protected $casts = [
        'order_id' => 'integer',
        'product_variant_id' => 'integer',
        'quantity' => 'integer',
        'price' => 'integer',
    ];

    /**
     * Relation vers la commande parente.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relation vers la variante achetée.
     * Permet à Laravel de retrouver le nom du produit, la taille, la couleur, etc.
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}