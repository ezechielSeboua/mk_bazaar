<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Référence (SKU), badge « Nouveau », fiche technique et activation par variante.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku', 64)->nullable()->unique()->after('slug');
            // Fiche technique : [{"label": "Matière", "value": "Wax 100 % coton"}, …]
            $table->json('specs')->nullable()->after('description');
            $table->boolean('is_new')->default(false)->after('featured');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('sku', 64)->nullable()->unique()->after('product_id');
            $table->boolean('is_active')->default(true)->after('stock');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropColumn(['sku', 'is_active']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropColumn(['sku', 'specs', 'is_new']);
        });
    }
};
