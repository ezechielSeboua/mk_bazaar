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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            // Clé étrangère vers la table users (nullable si tu acceptes les commandes d'invités)
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('order_number')->unique(); // Ex: 'MK-A4E2-171822454'
            
            // Localisation et livraison
            $table->string('delivery_location'); // Ex: 'Abidjan, Cocody'
            $table->integer('delivery_fee')->default(0); // Prix en centimes
            $table->text('detailed_address'); // Précisions adresse et téléphone
            
            // Prix total de la commande
            $table->integer('total_price')->default(0); // En centimes
            
            // Statut de la commande
            $table->string('status')->default('pending'); // 'pending', 'processing', 'completed', 'cancelled'
            
            $table->timestamps(); // Gère automatiquement created_at (qui remplace ta colonne date) et updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};