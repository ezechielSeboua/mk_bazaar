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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            
            // LA LIGNE CRITIQUE : Doit être "product_id"
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            
            $table->json('attributes'); // Stocke les couples taille/couleur
            $table->integer('price')->nullable();
            $table->integer('old_price')->nullable();
            $table->integer('stock')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};