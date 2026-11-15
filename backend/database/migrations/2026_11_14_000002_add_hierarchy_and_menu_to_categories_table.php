<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sous-catégories, type de produit et menu (écran « Catégories et menu »).
 *
 * Un seul niveau d'imbrication : une sous-catégorie a un parent qui, lui, n'en a pas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')
                ->constrained('categories')->nullOnDelete();
            $table->foreignId('product_type_id')->nullable()->after('parent_id')
                ->constrained('product_types')->nullOnDelete();
            $table->boolean('show_in_menu')->default(false)->after('is_active');
            $table->unsignedSmallInteger('menu_order')->default(0)->after('show_in_menu');

            $table->index(['parent_id', 'menu_order']);
        });

        // Les catégories existantes sont toutes de premier niveau : elles restent
        // visibles dans le menu, dans leur ordre de création.
        $ids = DB::table('categories')->orderBy('id')->pluck('id');
        foreach ($ids as $position => $id) {
            DB::table('categories')->where('id', $id)->update([
                'show_in_menu' => true,
                'menu_order'   => $position,
            ]);
        }
    }

    public function down(): void
    {
        // Clés étrangères d'abord : l'index composite sert aussi à celle de parent_id.
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['product_type_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['parent_id', 'menu_order']);
            $table->dropColumn(['parent_id', 'product_type_id', 'show_in_menu', 'menu_order']);
        });
    }
};
