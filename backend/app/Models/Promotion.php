<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Promotion extends Model
{
    public const TYPE_PERCENTAGE = 'percentage';
    public const TYPE_FIXED      = 'fixed';

    public const TARGET_CATEGORY = 'category';
    public const TARGET_PRODUCTS = 'products';
    public const TARGET_VARIANTS = 'variants';

    protected $fillable = [
        'name',
        'discount_type',
        'discount_value',
        'target_type',
        'category_id',
        'starts_at',
        'ends_at',
        'is_active',
        'show_strikethrough',
        'show_in_offers',
    ];

    /** Valeurs par défaut (identiques à la base) pour un modèle tout juste créé. */
    protected $attributes = [
        'is_active'          => true,
        'show_strikethrough' => true,
        'show_in_offers'     => true,
    ];

    protected $casts = [
        'discount_value'     => 'integer',
        'category_id'        => 'integer',
        'starts_at'          => 'datetime',
        'ends_at'            => 'datetime',
        'is_active'          => 'boolean',
        'show_strikethrough' => 'boolean',
        'show_in_offers'     => 'boolean',
    ];

    protected $appends = ['status'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'promotion_product');
    }

    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(ProductVariant::class, 'promotion_variant');
    }

    /** Promotions en cours : actives et dans leur période. */
    public function scopeCurrentlyActive(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now));
    }

    public function scopeScheduled(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('starts_at', '>', now());
    }

    public function scopeEnded(Builder $query): Builder
    {
        return $query->where('ends_at', '<', now());
    }

    /** active | scheduled | ended | inactive */
    public function getStatusAttribute(): string
    {
        $now = now();

        if ($this->ends_at && $this->ends_at->lt($now)) {
            return 'ended';
        }
        if (!$this->is_active) {
            return 'inactive';
        }
        if ($this->starts_at && $this->starts_at->gt($now)) {
            return 'scheduled';
        }

        return 'active';
    }

    /** Remise unitaire (FCFA) sur un prix de base, jamais supérieure au prix. */
    public function discountFor(int $basePrice): int
    {
        $discount = $this->discount_type === self::TYPE_PERCENTAGE
            ? (int) round($basePrice * $this->discount_value / 100)
            : $this->discount_value;

        return max(0, min($discount, $basePrice));
    }

    /**
     * La promotion s'applique-t-elle à cet article ?
     * Nécessite `category` chargé sur le produit et `products`/`variants` sur la promotion.
     */
    public function appliesTo(Product $product, ?ProductVariant $variant = null): bool
    {
        return match ($this->target_type) {
            self::TARGET_CATEGORY => $this->category_id !== null && (
                $product->category_id === $this->category_id
                || $product->category?->parent_id === $this->category_id
            ),
            self::TARGET_PRODUCTS => $this->products->contains('id', $product->id),
            self::TARGET_VARIANTS => $variant !== null && $this->variants->contains('id', $variant->id),
            default               => false,
        };
    }

    /** Résumé exposé au client avec le prix d'un article. */
    public function summary(): array
    {
        return [
            'id'                 => $this->id,
            'name'               => $this->name,
            'discount_type'      => $this->discount_type,
            'discount_value'     => $this->discount_value,
            'starts_at'          => $this->starts_at?->toIso8601String(),
            'ends_at'            => $this->ends_at?->toIso8601String(),
            'show_strikethrough' => $this->show_strikethrough,
        ];
    }
}
