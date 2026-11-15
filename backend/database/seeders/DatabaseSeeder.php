<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Catalogue de test « bijoux » (photos sur Cloudinary, voir data/catalogue.php).
     * Prérequis : php artisan catalogue:prepare-images && php artisan catalogue:upload-images
     * (le manifeste data/catalogue-images.json est versionné : inutile de renvoyer les photos).
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CatalogStructureSeeder::class, // types et attributs avant les catégories
            CategorySeeder::class,
            ProductsSeeder::class,
            ShippingZonesSeeder::class,
            DemoContentSeeder::class,      // promotions avant les commandes (remises)
            OrderSeeder::class,
        ]);
    }
}
