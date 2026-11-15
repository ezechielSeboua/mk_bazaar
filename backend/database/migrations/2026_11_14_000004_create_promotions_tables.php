<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Promotions (écran « Promotions et bandeaux »).
 *
 * Une promotion cible soit une catégorie (et ses sous-catégories), soit une
 * sélection de produits, soit une sélection de variantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('discount_type', 16);   // percentage | fixed
            $table->unsignedInteger('discount_value'); // % ou FCFA
            $table->string('target_type', 16);     // category | products | variants
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('show_strikethrough')->default(true);
            $table->boolean('show_in_offers')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'starts_at', 'ends_at']);
        });

        Schema::create('promotion_product', function (Blueprint $table) {
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            $table->primary(['promotion_id', 'product_id']);
        });

        Schema::create('promotion_variant', function (Blueprint $table) {
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();

            $table->primary(['promotion_id', 'product_variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_variant');
        Schema::dropIfExists('promotion_product');
        Schema::dropIfExists('promotions');
    }
};
