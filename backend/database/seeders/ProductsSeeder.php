<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CategorySeeder::class);

        $robes = Category::where('slug', 'robes')->firstOrFail();
        $ensembles = Category::where('slug', 'ensembles')->firstOrFail();
        $accessoires = Category::where('slug', 'accessoires')->firstOrFail();
        $chaussures = Category::where('slug', 'chaussures')->firstOrFail();
        $bijoux = Category::where('slug', 'bijoux')->firstOrFail();
        $sacs = Category::where('slug', 'sacs')->firstOrFail();
        $hauts = Category::where('slug', 'hauts')->firstOrFail();
        $pantalons = Category::where('slug', 'pantalons')->firstOrFail();

        $products = [
            // Robes
            ['name' => 'Robe Wax Royale', 'description' => 'Robe longue en wax, coupe trapèze.', 'price' => 25000, 'category' => $robes, 'in_stock' => true, 'featured' => true, 'images' => ['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800', 'https://images.unsplash.com/photo-1614093302611-8efc673d7a31?w=800']],
            ['name' => 'Robe Bazin Étoile', 'description' => 'Robe droite en bazin blanc.', 'price' => 32000, 'category' => $robes, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800', 'https://images.unsplash.com/photo-1621351187428-2b827e85c292?w=800', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800']],
            ['name' => 'Robe Soirée Satin', 'description' => 'Robe de soirée élégante.', 'price' => 50000, 'category' => $robes, 'in_stock' => true, 'featured' => true, 'images' => ['https://images.unsplash.com/photo-1595777457583-95e059d50a58?w=800', 'https://images.unsplash.com/photo-1574347209171-6c703f47e30d?w=800', 'https://images.unsplash.com/photo-1574238466100-34907951e7a5?w=800']],
            ['name' => 'Robe Été Fleurie', 'description' => 'Robe légère imprimée.', 'price' => 15000, 'category' => $robes, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', 'https://images.unsplash.com/photo-1533174072545-e74b9770544f?w=800', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800']],
            ['name' => 'Robe Casual Lin', 'description' => 'Robe simple en lin naturel.', 'price' => 18000, 'category' => $robes, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800', 'https://images.unsplash.com/photo-1496747611176-843277e1755a?w=800', 'https://images.unsplash.com/photo-1523381294911-3d3ce9d044f1?w=800']],

            // Ensembles
            ['name' => 'Ensemble Bogolan Chic', 'description' => 'Veste et pantalon bogolan.', 'price' => 55000, 'category' => $ensembles, 'in_stock' => true, 'featured' => true, 'images' => ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800', 'https://images.unsplash.com/photo-1549492423-44122396131c?w=800', 'https://images.unsplash.com/photo-1524504388940-b1c1726653e1?w=800']],
            ['name' => 'Ensemble Wax Festif', 'description' => 'Haut et jupe en wax.', 'price' => 30000, 'category' => $ensembles, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800', 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800', 'https://images.unsplash.com/photo-1555529721-71e81395561a?w=800']],
            ['name' => 'Ensemble Sport urbain', 'description' => 'Tenue confortable en coton.', 'price' => 25000, 'category' => $ensembles, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', 'https://images.unsplash.com/photo-1539136788836-569c37803e7e?w=800']],
            ['name' => 'Tailleur Bureau Classique', 'description' => 'Ensemble formel élégant.', 'price' => 45000, 'category' => $ensembles, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800']],
            ['name' => 'Ensemble Estival Lin', 'description' => 'Look frais pour l’été.', 'price' => 22000, 'category' => $ensembles, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1523381294911-3d3ce9d044f1?w=800', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', 'https://images.unsplash.com/photo-1520639888713-78b113471f54?w=800']],

            // Accessoires
            ['name' => 'Ceinture Cuir Tan', 'description' => 'Cuir tanné végétal.', 'price' => 12000, 'category' => $accessoires, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800', 'https://images.unsplash.com/photo-1604537466158-719b7970f84a?w=800', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800']],
            ['name' => 'Foulard Soie Imprimé', 'description' => 'Accessoire coloré.', 'price' => 5000, 'category' => $accessoires, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1584030235339-44585c5483f9?w=800', 'https://images.unsplash.com/photo-1544641662-e64e52f55e09?w=800', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800']],
            ['name' => 'Lunettes Soleil Rétro', 'description' => 'Design intemporel.', 'price' => 8000, 'category' => $accessoires, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1511499767150-a48a23760031?w=800', 'https://images.unsplash.com/photo-1577803645773-f9647b595059?w=800', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800']],
            ['name' => 'Chapeau Paille Large', 'description' => 'Protection estivale.', 'price' => 7000, 'category' => $accessoires, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=800', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', 'https://images.unsplash.com/photo-1520639888713-78b113471f54?w=800']],
            ['name' => 'Écharpe Laine Douce', 'description' => 'Chaleur et style.', 'price' => 6000, 'category' => $accessoires, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1555529721-71e81395561a?w=800', 'https://images.unsplash.com/photo-1605342735737-152b19280145?w=800', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800']],

            // Bijoux
            ['name' => 'Collier Perles Artisan', 'description' => 'Perles recyclées.', 'price' => 8500, 'category' => $bijoux, 'in_stock' => true, 'featured' => true, 'images' => ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', 'https://images.unsplash.com/photo-1515562141207-7a88fb7be338?w=800']],
            ['name' => 'Bracelet Bronze Ash', 'description' => 'Bronze coulé main.', 'price' => 9500, 'category' => $bijoux, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1573408301185-9519e96f5fc2?w=800', 'https://images.unsplash.com/photo-1515562141207-7a88fb7be338?w=800', 'https://images.unsplash.com/photo-1590559880193-97992762a043?w=800']],
            ['name' => 'Boucles Or Créoles', 'description' => 'Bijou éclatant.', 'price' => 12000, 'category' => $bijoux, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800']],
            ['name' => 'Bague Argent Ciselé', 'description' => 'Détails fins.', 'price' => 15000, 'category' => $bijoux, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1605100804763-247f67b3577e?w=800', 'https://images.unsplash.com/photo-1609250291996-f5763220580c?w=800', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800']],
            ['name' => 'Pendentif Ethnique', 'description' => 'Design unique.', 'price' => 11000, 'category' => $bijoux, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1602173574767-373e16091004?w=800', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800']],

            // Sacs
            ['name' => 'Sac Raphia Tressé', 'description' => 'Fait main.', 'price' => 15000, 'category' => $sacs, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800']],
            ['name' => 'Tote Bag Wax', 'description' => 'Sac réversible.', 'price' => 11000, 'category' => $sacs, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800']],
            ['name' => 'Pochette Cuir Chic', 'description' => 'Idéal soirée.', 'price' => 13000, 'category' => $sacs, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 'https://images.unsplash.com/photo-1590874103328-e6361e039ef1?w=800', 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800']],
            ['name' => 'Sac Bandoulière', 'description' => 'Style urbain.', 'price' => 20000, 'category' => $sacs, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1590874103328-e6361e039ef1?w=800', 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800']],
            ['name' => 'Grand Sac Cabas', 'description' => 'Pratique voyage.', 'price' => 25000, 'category' => $sacs, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800', 'https://images.unsplash.com/photo-1590874103328-e6361e039ef1?w=800', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800']],

            // Chaussures
            ['name' => 'Sandales Wax Été', 'description' => 'Légères et confort.', 'price' => 18000, 'category' => $chaussures, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', 'https://images.unsplash.com/photo-1520639888713-78b113471f54?w=800', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d60?w=800']],
            ['name' => 'Babouches Brodées', 'description' => 'Cuir souple.', 'price' => 22000, 'category' => $chaussures, 'in_stock' => false, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800', 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=800', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800']],
            ['name' => 'Escarpins Élégance', 'description' => 'Talon classique.', 'price' => 30000, 'category' => $chaussures, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d60?w=800', 'https://images.unsplash.com/photo-1520639888713-78b113471f54?w=800']],
            ['name' => 'Baskets Toile Urbaine', 'description' => 'Confort quotidien.', 'price' => 12000, 'category' => $chaussures, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800']],
            ['name' => 'Bottines Cuir', 'description' => 'Boots hiver.', 'price' => 35000, 'category' => $chaussures, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'https://images.unsplash.com/photo-1608234803780-95b80155694b?w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800']],

            // Hauts
            ['name' => 'Chemise Bazin Homme', 'description' => 'Bleu indigo riche.', 'price' => 20000, 'category' => $hauts, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800']],
            ['name' => 'Top Wax Noué', 'description' => 'Top court sexy.', 'price' => 14000, 'category' => $hauts, 'in_stock' => true, 'featured' => true, 'images' => ['https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800']],
            ['name' => 'Chemisier Soie', 'description' => 'Fluide et léger.', 'price' => 18000, 'category' => $hauts, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1598554747436-c9293d6a5d9e?w=800', 'https://images.unsplash.com/photo-1520639888713-78b113471f54?w=800', 'https://images.unsplash.com/photo-1590874103328-e6361e039ef1?w=800']],
            ['name' => 'T-shirt Coton Uni', 'description' => 'Basique essentiel.', 'price' => 5000, 'category' => $hauts, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800']],
            ['name' => 'Pull Laine Hiver', 'description' => 'Douceur garantie.', 'price' => 15000, 'category' => $hauts, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800', 'https://images.unsplash.com/photo-1555529721-71e81395561a?w=800', 'https://images.unsplash.com/photo-1605342735737-152b19280145?w=800']],

            // Pantalons
            ['name' => 'Pantalon Bogolan Large', 'description' => 'Teint naturellement.', 'price' => 28000, 'category' => $pantalons, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800', 'https://images.unsplash.com/photo-1549492423-44122396131c?w=800', 'https://images.unsplash.com/photo-1555529721-71e81395561a?w=800']],
            ['name' => 'Short Wax Cargo', 'description' => 'Style décontracté.', 'price' => 16000, 'category' => $pantalons, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800', 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800', 'https://images.unsplash.com/photo-1555529721-71e81395561a?w=800']],
            ['name' => 'Jean Slim Brut', 'description' => 'Coupe parfaite.', 'price' => 19000, 'category' => $pantalons, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'https://images.unsplash.com/photo-1584370848010-d7fe6bcacd94?w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800']],
            ['name' => 'Pantalon Toile Droite', 'description' => 'Sobre et polyvalent.', 'price' => 14000, 'category' => $pantalons, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800', 'https://images.unsplash.com/photo-1584370848010-d7fe6bcacd94?w=800', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800']],
            ['name' => 'Legging Sport Premium', 'description' => 'Matière technique.', 'price' => 9000, 'category' => $pantalons, 'in_stock' => true, 'featured' => false, 'images' => ['https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?w=800', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', 'https://images.unsplash.com/photo-1539136788836-569c37803e7e?w=800']],
        ];

        $seeded = 0;
        foreach ($products as $data) {
            $imagePaths = $this->downloadImages($data['images']);
            Product::updateOrCreate(
                ['slug' => Str::slug($data['name'])],
                [
                    'name'        => $data['name'],
                    'slug'        => Str::slug($data['name']),
                    'description' => $data['description'],
                    'price'       => $data['price'],
                    'category_id' => $data['category']->id,
                    'in_stock'    => $data['in_stock'],
                    'featured'    => $data['featured'],
                    'image_path'  => $imagePaths,
                ]
            );
            $seeded++;
            $this->command->line(" → <info>{$data['name']}</info> (" . count($imagePaths) . " images)");
        }

        $this->command->info("✅ {$seeded} produits seedés avec succès.");
    }

    private function downloadImages(array $urls): array
    {
        $paths = [];
        $context = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
            'http' => ['timeout' => 15, 'header' => 'User-Agent: Mozilla/5.0']
        ]);

        foreach ($urls as $url) {
            try {
                $body = @file_get_contents($url, false, $context);
                if ($body === false) continue;
                $filename = 'products/' . Str::uuid() . '.jpg';
                Storage::disk('public')->put($filename, $body);
                $paths[] = 'storage/' . $filename;
            } catch (\Exception $e) {}
        }
        return $paths;
    }
}