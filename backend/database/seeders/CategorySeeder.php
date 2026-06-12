<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Robes',
                'description' => 'Robes longues, courtes et mi-longues en tissus africains.',
                'image_path'  => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
            ],
            [
                'name'        => 'Ensembles',
                'description' => 'Ensembles deux et trois pièces pour femmes et hommes.',
                'image_path'  => 'https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?w=500',
            ],
            [
                'name'        => 'Accessoires',
                'description' => 'Ceintures, foulards, chapeaux et petits accessoires de mode.',
                'image_path'  => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500',
            ],
            [
                'name'        => 'Chaussures',
                'description' => 'Sandales, babouches et chaussures artisanales.',
                'image_path'  => 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500',
            ],
            [
                'name'        => 'Bijoux',
                'description' => 'Colliers, bracelets et boucles d\'oreilles artisanaux.',
                'image_path'  => 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
            ],
            [
                'name'        => 'Sacs',
                'description' => 'Sacs à main, sacs de soirée et totes en matières naturelles.',
                'image_path'  => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
            ],
            [
                'name'        => 'Hauts',
                'description' => 'Tops, chemises et blouses en wax, bazin et bogolan.',
                'image_path'  => 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500',
            ],
            [
                'name'        => 'Pantalons',
                'description' => 'Pantalons larges, slim et shorts en tissus traditionnels.',
                'image_path'  => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
            ],
        ];

        foreach ($categories as $data) {
            Category::updateOrCreate(
                ['slug' => Str::slug($data['name'])], // Condition unique
                [
                    'name'        => $data['name'],
                    'description' => $data['description'],
                    'image_path'  => $data['image_path'],
                    'is_active'   => true, // Active par défaut pour tes tests
                ]
            );
        }

        $this->command->info('✅ ' . count($categories) . ' catégories seedées avec succès.');
    }
}