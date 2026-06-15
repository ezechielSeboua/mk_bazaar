<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // Clé étrangère vers la commande parente (on supprime les lignes si la commande est supprimée)
            $table->foreignId('order_id')->constrained()->onDelete('cascade');

            // Clé étrangère vers la variante du produit (on empêche la suppression de la variante si elle est dans une commande)
            // $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('restrict'); // POur eviter de supprimer un produit tant qu'il à des variants
            $table->foreignId('product_variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();

            $table->integer('quantity'); // Quantité achetée
            $table->integer('price'); // Prix unitaire en centimes figé au moment de l'achat

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
