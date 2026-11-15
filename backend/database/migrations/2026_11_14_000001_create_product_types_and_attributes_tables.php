<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Types de produit et attributs de variation (écran « Attributs et types »).
 *
 * Un attribut (Couleur, Taille vêtement, Longueur…) porte une liste de valeurs.
 * Un type de produit (Vêtement, Collier / chaîne…) regroupe les attributs qui
 * génèrent ses variantes. Le `slug` d'un attribut est la clé utilisée dans le
 * JSON `product_variants.attributes` (ex. {"taille": "M", "couleur": "Indigo"}).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 50)->unique();
            $table->string('family', 20)->default('other'); // color | size | other
            $table->timestamps();
        });

        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_attribute_id')->constrained()->cascadeOnDelete();
            $table->string('value', 100);
            $table->string('hex', 7)->nullable(); // pastille de couleur / finition
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['product_attribute_id', 'value']);
        });

        Schema::create('product_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->string('guide_label', 100)->nullable(); // ex. « Guide des longueurs »
            $table->boolean('show_as_filter')->default(true);
            $table->timestamps();
        });

        Schema::create('product_type_attribute', function (Blueprint $table) {
            $table->foreignId('product_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_attribute_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position')->default(0);

            $table->primary(['product_type_id', 'product_attribute_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_type_attribute');
        Schema::dropIfExists('product_types');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('product_attributes');
    }
};
