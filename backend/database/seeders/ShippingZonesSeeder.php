<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class ShippingZonesSeeder extends Seeder
{
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'shipping_zones'],
            ['value' => [
                ['id' => 1,  'name' => 'Abobo',                    'price' => 1500],
                ['id' => 2,  'name' => 'Adjamé',                   'price' => 1000],
                ['id' => 3,  'name' => 'Attécoubé',                'price' => 1500],
                ['id' => 4,  'name' => 'Cocody',                   'price' => 2000],
                ['id' => 5,  'name' => 'Koumassi',                 'price' => 1500],
                ['id' => 6,  'name' => 'Marcory',                  'price' => 1500],
                ['id' => 7,  'name' => 'Plateau',                  'price' => 2000],
                ['id' => 8,  'name' => 'Port-Bouët',               'price' => 2000],
                ['id' => 9,  'name' => 'Treichville',              'price' => 1500],
                ['id' => 10, 'name' => 'Yopougon',                 'price' => 1500],
                ['id' => 11, 'name' => 'Expédition (hors Abidjan)', 'price' => 3000],
            ]]
        );
    }
}
