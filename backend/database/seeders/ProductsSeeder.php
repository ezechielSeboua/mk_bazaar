<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        // On s'assure d'avoir les catégories avant d'insérer les produits
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
            // ===================== ROBES =====================
            [
                'name' => 'Robe Wax Royale',
                'description' => 'Robe longue en wax, coupe trapèze.',
                'price' => 25000,
                'category' => $robes,
                'featured' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800',
                    'https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800',
                ],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800'],
                ]
            ],
            [
                'name' => 'Robe Bazin Étoile',
                'description' => 'Robe droite en bazin blanc.',
                'price' => 32000,
                'category' => $robes,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800'],
                ]
            ],
            [
                'name' => 'Robe Soirée Satin',
                'description' => 'Robe de soirée élégante.',
                'price' => 50000,
                'category' => $robes,
                'featured' => true,
                'images' => ['https://images.unsplash.com/photo-1595777457583-95e059d50a58?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1595777457583-95e059d50a58?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
                ]
            ],
            [
                'name' => 'Robe Été Fleurie',
                'description' => 'Robe légère imprimée.',
                'price' => 15000,
                'category' => $robes,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800'],
                ]
            ],
            [
                'name' => 'Robe Casual Lin',
                'description' => 'Robe simple en lin naturel.',
                'price' => 18000,
                'category' => $robes,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1594938298603-c8148c4b4e36?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800'],
                ]
            ],

            // ===================== ENSEMBLES =====================
            [
                'name' => 'Ensemble Bogolan Chic',
                'description' => 'Veste et pantalon bogolan.',
                'price' => 55000,
                'category' => $ensembles,
                'featured' => true,
                'images' => ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
                ]
            ],
            [
                'name' => 'Ensemble Wax Festif',
                'description' => 'Haut et jupe en wax.',
                'price' => 30000,
                'category' => $ensembles,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
                ]
            ],
            [
                'name' => 'Ensemble Sport urbain',
                'description' => 'Tenue confortable en coton.',
                'price' => 25000,
                'category' => $ensembles,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1523381294911-3d3ce9d044f1?w=800'],
                ]
            ],
            [
                'name' => 'Tailleur Bureau Classique',
                'description' => 'Ensemble formel élégant.',
                'price' => 45000,
                'category' => $ensembles,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
                ]
            ],
            [
                'name' => 'Ensemble Estival Lin',
                'description' => 'Look frais pour l’été.',
                'price' => 22000,
                'category' => $ensembles,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1523381294911-3d3ce9d044f1?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1523381294911-3d3ce9d044f1?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
                ]
            ],

            // ===================== ACCESSOIRES =====================
            [
                'name' => 'Ceinture Cuir Tan',
                'description' => 'Cuir tanné végétal.',
                'price' => 12000,
                'category' => $accessoires,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1584030235339-44585c5483f9?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=800'],
                ]
            ],
            [
                'name' => 'Foulard Soie Imprimé',
                'description' => 'Accessoire coloré.',
                'price' => 5000,
                'category' => $accessoires,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1584030235339-44585c5483f9?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1584030235339-44585c5483f9?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=800'],
                ]
            ],
            [
                'name' => 'Lunettes Soleil Rétro',
                'description' => 'Design intemporel.',
                'price' => 8000,
                'category' => $accessoires,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1511499767150-a48a23760031?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1511499767150-a48a23760031?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1584030235339-44585c5483f9?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=800'],
                ]
            ],
            [
                'name' => 'Chapeau Paille Large',
                'description' => 'Protection estivale.',
                'price' => 7000,
                'category' => $accessoires,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1584030235339-44585c5483f9?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1511499767150-a48a23760031?w=800'],
                ]
            ],

            // ===================== BIJOUX =====================
            [
                'name' => 'Collier Perles Artisan',
                'description' => 'Perles recyclées.',
                'price' => 8500,
                'category' => $bijoux,
                'featured' => true,
                'images' => ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1573408301185-9519e96f5fc2?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
                ]
            ],
            [
                'name' => 'Bracelet Bronze Ash',
                'description' => 'Bronze coulé main.',
                'price' => 9500,
                'category' => $bijoux,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1573408301185-9519e96f5fc2?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1573408301185-9519e96f5fc2?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
                ]
            ],
            [
                'name' => 'Boucles Or Créoles',
                'description' => 'Bijou éclatant.',
                'price' => 12000,
                'category' => $bijoux,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1573408301185-9519e96f5fc2?w=800'],
                ]
            ],

            // ===================== SACS =====================
            [
                'name' => 'Sac Raphia Tressé',
                'description' => 'Fait main.',
                'price' => 15000,
                'category' => $sacs,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
                ]
            ],
            [
                'name' => 'Tote Bag Wax',
                'description' => 'Sac réversible.',
                'price' => 11000,
                'category' => $sacs,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
                ]
            ],
            [
                'name' => 'Pochette Cuir Chic',
                'description' => 'Idéal soirée.',
                'price' => 13000,
                'category' => $sacs,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
                ]
            ],

            // ===================== CHAUSSURES =====================
            [
                'name' => 'Sandales Wax Été',
                'description' => 'Légères et confort.',
                'price' => 18000,
                'category' => $chaussures,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800'],
                ]
            ],
            [
                'name' => 'Babouches Brodées',
                'description' => 'Cuir souple.',
                'price' => 22000,
                'category' => $chaussures,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800'],
                ]
            ],
            [
                'name' => 'Baskets Toile Urbaine',
                'description' => 'Confort quotidien.',
                'price' => 12000,
                'category' => $chaussures,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
                ]
            ],

            // ===================== HAUTS =====================
            [
                'name' => 'Chemise Bazin Homme',
                'description' => 'Bleu indigo riche.',
                'price' => 20000,
                'category' => $hauts,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
                ]
            ],
            [
                'name' => 'Top Wax Noué',
                'description' => 'Top court sexy.',
                'price' => 14000,
                'category' => $hauts,
                'featured' => true,
                'images' => ['https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800'],
                ]
            ],

            // ===================== PANTALONS =====================
            [
                'name' => 'Pantalon Bogolan Large',
                'description' => 'Teint naturellement.',
                'price' => 28000,
                'category' => $pantalons,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800'],
                ]
            ],
            [
                'name' => 'Short Wax Cargo',
                'description' => 'Style décontracté.',
                'price' => 16000,
                'category' => $pantalons,
                'featured' => false,
                'images' => ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800'],
                'variant_images' => [
                    'Original' => ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800'],
                    'Indigo'   => ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
                    'Terre'    => ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'],
                ]
            ],
        ];

        $seeded = 0;
        foreach ($products as $data) {
            $imagePaths = $this->downloadImages($data['images']);
            
            // 1. Création ou mise à jour du produit parent
            $product = Product::updateOrCreate(
                ['slug' => Str::slug($data['name'])],
                [
                    'name'        => $data['name'],
                    'description' => $data['description'],
                    'price'       => $data['price'],
                    'category_id' => $data['category']->id,
                    'featured'    => $data['featured'],
                    'image_path'  => $imagePaths,
                ]
            );

            // 2. Génération automatique des variantes avec images spécifiques
            $variantImages = $data['variant_images'] ?? [];
            $this->seedVariantsForProduct($product, $data['category']->slug, $imagePaths, $variantImages);

            $seeded++;
            $this->command->line(" → <info>{$data['name']}</info> (Produit + ses déclinaisons et stocks générés)");
        }

        $this->command->info("✅ {$seeded} produits avec variantes seedés avec succès !");
    }

    /**
     * Génère des déclinaisons de variantes selon la catégorie.
     * Chaque variante reçoit une image réelle et différente basée sur la couleur.
     */
    private function seedVariantsForProduct(Product $product, string $categorySlug, array $productImages = [], array $variantImages = []): void
    {
        if ($categorySlug === 'chaussures') {
            $sizes = ['39', '41', '43'];
            $attributeName = 'pointure';
        } elseif (in_array($categorySlug, ['accessoires', 'bijoux', 'sacs'])) {
            $sizes = ['Unique'];
            $attributeName = 'taille';
        } else {
            $sizes = ['M', 'L', 'XL'];
            $attributeName = 'taille';
        }

        $couleurs = ['Original', 'Indigo', 'Terre'];
        $variantIndex = 0;

        foreach ($sizes as $size) {
            foreach ($couleurs as $index => $couleur) {
                if ($index > 0 && $size === 'XL') continue;

                // Récupérer les images spécifiques à cette couleur
                $colorImages = $variantImages[$couleur] ?? $productImages;
                // Si le tableau est vide, fallback ultime
                if (empty($colorImages)) {
                    $variantImage = null;
                } else {
                    $imageIndex = $variantIndex % count($colorImages);
                    $variantImage = $colorImages[$imageIndex];
                }

                ProductVariant::create([
                    'product_id' => $product->id,
                    'attributes' => [
                        $attributeName => $size,
                        'couleur'      => $couleur,
                    ],
                    'price'      => $product->price,
                    'old_price'  => rand(0, 1) ? $product->price + 5000 : null,
                    'stock'      => rand(5, 30),
                    'image_path' => $variantImage,
                ]);

                $variantIndex++;
            }
        }
    }

    private function downloadImages(array $urls): array
    {
        return $urls;
    }
}