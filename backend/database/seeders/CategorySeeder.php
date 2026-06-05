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
                'icon'        => '👗',
            ],
            [
                'name'        => 'Ensembles',
                'description' => 'Ensembles deux et trois pièces pour femmes et hommes.',
                'icon'        => '🧥',
            ],
            [
                'name'        => 'Accessoires',
                'description' => 'Ceintures, foulards, chapeaux et petits accessoires de mode.',
                'icon'        => '🧣',
            ],
            [
                'name'        => 'Chaussures',
                'description' => 'Sandales, babouches et chaussures artisanales.',
                'icon'        => '👡',
            ],
            [
                'name'        => 'Bijoux',
                'description' => 'Colliers, bracelets et boucles d\'oreilles artisanaux.',
                'icon'        => '💍',
            ],
            [
                'name'        => 'Sacs',
                'description' => 'Sacs à main, sacs de soirée et totes en matières naturelles.',
                'icon'        => '👜',
            ],
            [
                'name'        => 'Hauts',
                'description' => 'Tops, chemises et blouses en wax, bazin et bogolan.',
                'icon'        => '👚',
            ],
            [
                'name'        => 'Pantalons',
                'description' => 'Pantalons larges, slim et shorts en tissus traditionnels.',
                'icon'        => '👖',
            ],
        ];

        foreach ($categories as $data) {
            Category::updateOrCreate(
                ['slug' => Str::slug($data['name'])],
                [
                    'name'        => $data['name'],
                    'slug'        => Str::slug($data['name']),
                    'description' => $data['description'],
                    'icon'        => $data['icon'],
                ]
            );
        }

        $this->command->info('✅  ' . count($categories) . ' catégories seedées avec succès.');
    }
}