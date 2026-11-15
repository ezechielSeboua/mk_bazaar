<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AnnouncementBar extends Model
{
    protected $fillable = ['message', 'link', 'starts_at', 'ends_at', 'is_active', 'sort_order'];

    /** Valeurs par défaut (identiques à la base) pour un modèle tout juste créé. */
    protected $attributes = [
        'is_active'  => true,
        'sort_order' => 0,
    ];

    protected $casts = [
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['status'];

    /** Bandeaux à afficher maintenant, dans l'ordre. */
    public function scopeVisible(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /** displayed | scheduled | ended | inactive */
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

        return 'displayed';
    }
}
