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
            $table->string('order_number')->unique(); // Ex: 'CMD-004'
            $table->date('date');
            
            // Nouveaux champs alignés avec le Front (Exit total et address)
            $table->string('delivery_location')->nullable(); // Correspond à selectedCommune.commune
            $table->integer('delivery_fee')->default(0);      // Correspond à deliveryPrice
            $table->text('detailed_address')->nullable();     // Correspond à addressDetail
            $table->integer('total_price')->default(0);       // Correspond à totalAmount
            
            $table->string('status')->default('pending');     // 'pending', 'cancelled', 'completed'
            $table->json('products');                         // Tableau d'objets produits avec image_path
            $table->timestamps();
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