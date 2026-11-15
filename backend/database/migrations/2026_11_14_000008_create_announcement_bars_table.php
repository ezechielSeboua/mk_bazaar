<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Bandeaux d'annonce affichés à tour de rôle en haut du site.
 * Reprend le contenu de l'ancien réglage `promo_banner` ({enabled, text}).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcement_bars', function (Blueprint $table) {
            $table->id();
            $table->string('message');
            $table->string('link')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $legacy = DB::table('settings')->where('key', 'promo_banner')->value('value');
        $legacy = $legacy ? json_decode($legacy, true) : null;

        if (is_array($legacy) && trim((string) ($legacy['text'] ?? '')) !== '') {
            DB::table('announcement_bars')->insert([
                'message'    => mb_substr(trim($legacy['text']), 0, 255),
                'is_active'  => (bool) ($legacy['enabled'] ?? false),
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_bars');
    }
};
