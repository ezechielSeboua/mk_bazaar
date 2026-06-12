<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'attributes',   // Tableau JSON contenant les options (ex: {"taille": "M", "couleur": "Rouge"})
        'price',        // Prix spécifique à la variante (nullable : si null, on prend le prix du produit)
        'old_price',    // Prix barré spécifique à la variante (nullable)
        'stock',        // Le stock précis pour CETTE combinaison
    ];

    protected $casts = [
        'product_id' => 'integer',
        'attributes' => 'array',   // Transtypé automatiquement en tableau PHP / JSON en base
        'price' => 'integer',
        'old_price' => 'integer',
        'stock' => 'integer',
    ];

    /**
     * Relation inverse : Une variante appartient à un produit principal.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    
}