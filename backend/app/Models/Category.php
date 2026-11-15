<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    /** Au-delà, les catégories du menu passent dans l'onglet « Plus ». */
    public const MENU_LIMIT = 5;

    protected $fillable = [
        'parent_id',
        'product_type_id',
        'name',
        'slug',
        'description',
        'image_path',
        'is_active',
        'show_in_menu',
        'menu_order',
    ];

    /**
     * Transtypage des attributs pour l'API.
     */
    protected $casts = [
        'parent_id'       => 'integer',
        'product_type_id' => 'integer',
        'is_active'       => 'boolean',
        'show_in_menu'    => 'boolean',
        'menu_order'      => 'integer',
    ];

    /**
     * Définit la clé de routage par défaut pour Laravel.
     * Cela permet de lier automatiquement les routes au 'slug' plutôt qu'à l'id.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Relation avec les produits.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('menu_order')->orderBy('id');
    }

    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    /**
     * Type de produit effectif : celui de la catégorie, sinon celui de son parent.
     */
    public function effectiveProductType(): ?ProductType
    {
        return $this->productType ?? $this->parent?->productType;
    }

    /**
     * Identifiants de la catégorie et de ses sous-catégories.
     */
    public function selfAndChildrenIds(): array
    {
        return array_merge([$this->id], $this->children()->pluck('id')->all());
    }
}
