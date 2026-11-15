<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Produits du catalogue bijoux (data/catalogue.php), photos sur Cloudinary.
 *
 * Variantes = valeurs du 1er attribut du type (finition, couleur, pierre ;
 * chacune avec sa photo) × tailles de la catégorie (2e attribut). Les stocks
 * sont tirés de façon reproductible, avec quelques ruptures pour les tests.
 */
class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026); // stocks identiques à chaque exécution

        $data = CatalogueData::get();
        $categories = Category::with('productType.variationAttributes', 'parent.productType.variationAttributes')->get()->keyBy('name');
        $defaultSizes = $this->defaultSizes($data['categories']);
        $variants = 0;

        foreach ($data['products'] as $index => $definition) {
            $category = $categories[$definition['category']];
            $type = $category->effectiveProductType();
            [$optionAttribute, $sizeAttribute] = array_pad($type->variationAttributes->pluck('slug')->all(), 2, null);

            $optionImages = array_map([CatalogueData::class, 'image'], array_values($definition['options']));
            $gallery = array_map([CatalogueData::class, 'image'], $definition['gallery'] ?? []);

            $product = Product::create([
                'name' => $definition['name'],
                'slug' => Str::slug($definition['name']),
                'sku' => sprintf('MK-%03d', $index + 1),
                'description' => $definition['description'],
                'specs' => $this->specs($definition, $category),
                'price' => $definition['price'],
                'stock' => 0,
                'category_id' => $category->id,
                'is_active' => true,
                'featured' => $definition['featured'] ?? false,
                'is_new' => $definition['is_new'] ?? false,
                'image_path' => array_values(array_unique([...$optionImages, ...$gallery])),
            ]);

            $sizes = $sizeAttribute ? ($definition['sizes'] ?? $defaultSizes[$definition['category']] ?? []) : [null];
            $optionIndex = 0;
            foreach ($definition['options'] as $value => $imageKey) {
                $optionIndex++;
                foreach ($sizes as $sizeIndex => $size) {
                    $attributes = [$optionAttribute => $value];
                    if ($size !== null) {
                        $attributes[$sizeAttribute] = $size;
                    }
                    $product->variants()->create([
                        'sku' => sprintf('MK-%03d-%02d%02d', $index + 1, $optionIndex, $sizeIndex + 1),
                        'attributes' => $attributes,
                        'price' => null, // suit le prix du produit
                        'stock' => $this->stock(),
                        'is_active' => true,
                        'image_path' => CatalogueData::image($imageKey),
                    ]);
                    $variants++;
                }
            }
        }

        $this->command?->info('✅ ' . count($data['products']) . " produits, {$variants} variantes.");
    }

    /** Tailles par défaut de chaque catégorie (nom => valeurs). */
    private function defaultSizes(array $categories): array
    {
        $sizes = [];
        foreach ($categories as $category) {
            if (isset($category['sizes'])) {
                $sizes[$category['name']] = $category['sizes'];
            }
            foreach ($category['children'] ?? [] as $child) {
                if (isset($child['sizes'])) {
                    $sizes[$child['name']] = $child['sizes'];
                }
            }
        }
        return $sizes;
    }

    /** Environ 1 variante sur 9 en rupture, 1 sur 6 en stock faible. */
    private function stock(): int
    {
        $roll = mt_rand(1, 18);
        return match (true) {
            $roll <= 2 => 0,
            $roll <= 5 => mt_rand(1, 3),
            default => mt_rand(4, 25),
        };
    }

    private function specs(array $definition, Category $category): array
    {
        $parent = $category->parent?->name ?? $category->name;
        $material = match ($parent) {
            'Bracelets' => str_contains($definition['name'], 'Cuir') ? 'Cuir tressé et acier inoxydable' : (str_contains($definition['name'], 'Gourmette') ? 'Acier inoxydable' : 'Cordon tressé et acier'),
            'Parures' => 'Acier inoxydable doré',
            default => 'Acier inoxydable',
        };

        return array_values(array_filter([
            ['label' => 'Matière', 'value' => $material],
            in_array($parent, ['Bagues', 'Alliances'], true) && str_contains($definition['description'], 'zircon')
                ? ['label' => 'Pierres', 'value' => 'Zircons'] : null,
            ['label' => 'Entretien', 'value' => "Éviter le contact avec l'eau et les parfums"],
        ]));
    }
}
