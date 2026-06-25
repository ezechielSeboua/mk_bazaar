<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reset any negative stock values before applying UNSIGNED constraints
        DB::table('product_variants')->where('stock', '<', 0)->update(['stock' => 0]);
        DB::table('products')->where('stock', '<', 0)->update(['stock' => 0]);

        Schema::table('product_variants', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0)->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('delivery_fee')->default(0)->change();
            $table->unsignedBigInteger('total_price')->default(0)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->change();
            $table->unsignedBigInteger('price')->change();
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->integer('stock')->default(0)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock')->default(0)->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->integer('delivery_fee')->default(0)->change();
            $table->integer('total_price')->default(0)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->integer('quantity')->change();
            $table->integer('price')->change();
        });
    }
};
