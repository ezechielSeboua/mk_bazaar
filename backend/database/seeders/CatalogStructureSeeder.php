<?php

namespace Database\Seeders;

use App\Models\ProductAttribute;
use App\Models\ProductType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Attributs de variation et types de produit du catalogue bijoux
 * (définis dans data/catalogue.php). Idempotent.
 */
class CatalogStructureSeeder extends Seeder
{
    public function run(): void
    {
        $data = CatalogueData::get();

        $attributes = [];
        foreach ($data['attributes'] as $slug => $definition) {
            $attribute = ProductAttribute::updateOrCreate(
                ['slug' => $slug],
                ['name' => $definition['name'], 'family' => $definition['family']],
            );
            $position = 0;
            foreach ($definition['values'] as $value => $hex) {
                $attribute->values()->updateOrCreate(['value' => (string) $value], ['hex' => $hex, 'sort_order' => $position++]);
            }
            $attributes[$slug] = $attribute;
        }

        foreach ($data['types'] as $name => $definition) {
            $type = ProductType::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'guide_label' => $definition['guide'], 'show_as_filter' => true],
            );
            $sync = [];
            foreach ($definition['attributes'] as $position => $slug) {
                $sync[$attributes[$slug]->id] = ['position' => $position];
            }
            $type->variationAttributes()->sync($sync);
        }

        $this->command?->info('✅ ' . count($data['attributes']) . ' attributs et ' . count($data['types']) . ' types de produit.');
    }
}
