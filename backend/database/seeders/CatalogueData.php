<?php

namespace Database\Seeders;

use App\Console\Commands\UploadCatalogueImages;
use RuntimeException;

/**
 * Accès aux données du catalogue de test (data/catalogue.php) et aux URL
 * Cloudinary de ses photos (data/catalogue-images.json).
 */
class CatalogueData
{
    private static ?array $data = null;
    private static ?array $urls = null;

    public static function get(): array
    {
        return self::$data ??= require __DIR__ . '/data/catalogue.php';
    }

    /** URL Cloudinary d'une photo, par sa clé (ex. « bagues-homme/chevaliere-carree-dore »). */
    public static function image(string $key): string
    {
        if (self::$urls === null) {
            $path = database_path(UploadCatalogueImages::MANIFEST);
            if (!is_file($path)) {
                throw new RuntimeException(
                    "Manifeste des photos absent ({$path}). Lancez d'abord : php artisan catalogue:prepare-images && php artisan catalogue:upload-images"
                );
            }
            self::$urls = json_decode(file_get_contents($path), true) ?? [];
        }

        return self::$urls[$key]
            ?? throw new RuntimeException("Photo « {$key} » absente du manifeste : relancez php artisan catalogue:upload-images");
    }
}
