<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->integer('price');
            $table->integer('old_price')->nullable();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->json('image_path')->nullable();
            // $table->integer('stock')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('featured')->default(false);
            $table->timestamps();

            $table->index('category_id');
            // $table->index('in_stock');
            $table->index('featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
