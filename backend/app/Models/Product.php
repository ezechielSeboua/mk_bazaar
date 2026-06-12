<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',          // Prix par défaut (en centimes)
        'old_price',      // Prix d'origine avant promo (en centimes, nullable)
        'category_id',
        'is_active',      // Statut de publication (brouillon/en ligne)
        'featured',       // Mis en avant sur la page d'accueil
        'image_path',     // Tableau de liens vers les images du produit
    ];

    protected $casts = [
        'price' => 'integer',
        'old_price' => 'integer',
        'is_active' => 'boolean',
        'featured' => 'boolean',
        'image_path' => 'array',
    ];

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
}