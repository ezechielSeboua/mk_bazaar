<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remises figées au moment de la commande.
 *
 * order_items.price reste le prix unitaire réellement payé (remise déduite) ;
 * order_items.discount est la remise unitaire accordée, et promotion_id la
 * promotion qui l'a produite (pour l'écran Finances).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_total')->default(0)->after('delivery_fee');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedInteger('discount')->default(0)->after('price');
            $table->foreignId('promotion_id')->nullable()->after('product_variant_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('promotion_id');
            $table->dropColumn('discount');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('discount_total');
        });
    }
};
