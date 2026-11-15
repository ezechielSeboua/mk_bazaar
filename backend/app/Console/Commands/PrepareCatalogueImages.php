<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Renomme et convertit les photos du catalogue de test.
 *
 * images/<n>.jpeg  →  images-catalogue/<clé>.webp (1 200 px de large au plus)
 * Les noms viennent de database/seeders/data/catalogue.php (clé `images`).
 * Le dossier source n'est jamais modifié.
 */
class PrepareCatalogueImages extends Command
{
    protected $signature = 'catalogue:prepare-images
        {source? : Dossier des photos d\'origine (défaut : ../images)}
        {target? : Dossier de sortie (défaut : ../images-catalogue)}
        {--width=1200 : Largeur maximale}
        {--quality=82 : Qualité WebP (0-100)}';

    protected $description = 'Renomme et convertit en WebP les photos du catalogue de test';

    public function handle(): int
    {
        if (!function_exists('imagewebp')) {
            $this->error("L'extension GD avec WebP est requise.");
            return self::FAILURE;
        }

        $source = rtrim($this->argument('source') ?? base_path('../images'), '/\\');
        $target = rtrim($this->argument('target') ?? base_path('../images-catalogue'), '/\\');
        $maxWidth = (int) $this->option('width');
        $quality = (int) $this->option('quality');
        $mapping = (require database_path('seeders/data/catalogue.php'))['images'];

        $done = 0;
        $bytes = 0;
        foreach ($mapping as $number => $key) {
            $from = "{$source}/{$number}.jpeg";
            if (!is_file($from)) {
                $this->warn("Introuvable : {$from}");
                continue;
            }

            $image = @imagecreatefromjpeg($from);
            if (!$image) {
                $this->warn("Illisible : {$from}");
                continue;
            }

            $width = imagesx($image);
            $height = imagesy($image);
            if ($width > $maxWidth) {
                $newHeight = (int) round($height * $maxWidth / $width);
                $resized = imagecreatetruecolor($maxWidth, $newHeight);
                imagecopyresampled($resized, $image, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $resized;
            }

            $to = "{$target}/{$key}.webp";
            if (!is_dir(dirname($to))) {
                mkdir(dirname($to), 0777, true);
            }
            imagewebp($image, $to, $quality);
            imagedestroy($image);

            $bytes += filesize($to);
            $done++;
        }

        $this->info(sprintf('%d photos converties dans %s (%.1f Mo).', $done, $target, $bytes / 1048576));

        return $done === count($mapping) ? self::SUCCESS : self::FAILURE;
    }
}
