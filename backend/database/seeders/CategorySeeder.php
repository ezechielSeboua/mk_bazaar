<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ProductType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catégories du catalogue bijoux : 5 catégories principales dans le menu,
 * sous-catégories typées (data/catalogue.php). Visuels sur Cloudinary.
 */
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $types = ProductType::pluck('id', 'name');
        $order = 0;

        foreach (CatalogueData::get()['categories'] as $definition) {
            $parent = $this->upsert($definition, null, $order++, $types);

            foreach ($definition['children'] ?? [] as $childOrder => $child) {
                $this->upsert($child, $parent->id, $childOrder, $types);
            }
        }

        $this->command?->info('✅ ' . Category::count() . ' catégories.');
    }

    private function upsert(array $definition, ?int $parentId, int $order, $types): Category
    {
        return Category::updateOrCreate(
            ['slug' => Str::slug($definition['name'])],
            [
                'name' => $definition['name'],
                'parent_id' => $parentId,
                'product_type_id' => isset($definition['type']) ? $types[$definition['type']] : null,
                'description' => $definition['description'] ?? null,
                'image_path' => isset($definition['image']) ? CatalogueData::image($definition['image']) : null,
                'is_active' => true,
                'show_in_menu' => $parentId === null,
                'menu_order' => $order,
            ],
        );
    }
}
