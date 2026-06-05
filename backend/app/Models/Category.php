<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
    ];

    /**
     * Définit la clé de routage par défaut pour Laravel.
     * Cela permet de lier automatiquement les routes au 'slug' plutôt qu'à l'id.
     */
    // public function getRouteKeyName(): string
    // {
    //     return 'slug';
    // }

    /**
     * Relation avec les produits.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}