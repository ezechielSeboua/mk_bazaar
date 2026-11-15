<?php

namespace App\Console\Commands;

use Cloudinary\Cloudinary as CloudinarySDK;
use Illuminate\Console\Command;
use Throwable;

/**
 * Envoie les photos du catalogue de test sur Cloudinary, une seule fois.
 *
 * images-catalogue/<clé>.webp  →  Cloudinary « mk-bazaar/catalogue/<clé> »
 * Les URL obtenues sont écrites dans database/seeders/data/catalogue-images.json
 * (fichier versionné) : les seeders s'en servent en local comme en production,
 * sans renvoyer les photos. Relancer la commande ne renvoie que les photos
 * absentes du fichier (ou toutes avec --force).
 */
class UploadCatalogueImages extends Command
{
    protected $signature = 'catalogue:upload-images
        {dir? : Dossier des photos converties (défaut : ../images-catalogue)}
        {--force : Renvoyer aussi les photos déjà présentes dans le manifeste}';

    protected $description = 'Envoie les photos du catalogue de test sur Cloudinary et écrit le manifeste des URL';

    public const MANIFEST = 'seeders/data/catalogue-images.json';
    private const FOLDER = 'mk-bazaar/catalogue';

    public function handle(): int
    {
        $url = config('services.cloudinary.url');
        if (!$url) {
            $this->error('CLOUDINARY_URL est absent du fichier .env.');
            return self::FAILURE;
        }

        $dir = rtrim($this->argument('dir') ?? base_path('../images-catalogue'), '/\\');
        $keys = array_values((require database_path('seeders/data/catalogue.php'))['images']);
        $manifestPath = database_path(self::MANIFEST);
        $manifest = is_file($manifestPath) ? json_decode(file_get_contents($manifestPath), true) ?? [] : [];

        $cloudinary = new CloudinarySDK($url);
        $sent = 0;
        $skipped = 0;
        $failed = [];

        $bar = $this->output->createProgressBar(count($keys));
        foreach ($keys as $key) {
            $bar->advance();

            if (!$this->option('force') && isset($manifest[$key])) {
                $skipped++;
                continue;
            }

            $file = "{$dir}/{$key}.webp";
            if (!is_file($file)) {
                $failed[$key] = 'fichier introuvable (lancer catalogue:prepare-images)';
                continue;
            }

            try {
                $result = $cloudinary->uploadApi()->upload($file, [
                    'public_id' => self::FOLDER . '/' . $key,
                    'overwrite' => true,
                    'resource_type' => 'image',
                ]);
                $manifest[$key] = $result['secure_url'];
                $sent++;
                // Écrit au fur et à mesure : une coupure ne fait pas tout renvoyer.
                $this->writeManifest($manifestPath, $manifest);
            } catch (Throwable $e) {
                $failed[$key] = $e->getMessage();
            }
        }
        $bar->finish();
        $this->newLine(2);

        $this->info("{$sent} photo(s) envoyée(s), {$skipped} déjà présente(s).");
        foreach ($failed as $key => $reason) {
            $this->warn("Échec {$key} : {$reason}");
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    private function writeManifest(string $path, array $manifest): void
    {
        ksort($manifest);
        file_put_contents($path, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
    }
}
