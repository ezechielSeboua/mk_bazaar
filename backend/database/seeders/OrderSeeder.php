<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $variants = ProductVariant::with('product')->get();

        if ($variants->isEmpty()) {
            $this->command->error('❌ Impossible de générer des commandes : aucune variante de produit trouvée.');
            return;
        }

        $users = User::all();

        $locations = [
            ['name' => 'Abidjan, Cocody', 'fee' => 1500],
            ['name' => 'Abidjan, Yopougon', 'fee' => 2000],
            ['name' => 'Abidjan, Marcory', 'fee' => 1500],
            ['name' => 'Abidjan, Koumassi', 'fee' => 2000],
            ['name' => 'Abidjan, Plateau', 'fee' => 1000],
        ];

        $statuses = ['pending', 'processing', 'completed', 'cancelled'];

        for ($i = 1; $i <= 15; $i++) {
            
            $userId = (rand(0, 1) && $users->isNotEmpty()) ? $users->random()->id : null;
            $location = $locations[array_rand($locations)];

            $order = Order::create([
                'user_id'           => $userId,
                'order_number'      => 'MK-' . strtoupper(Str::random(4)) . '-' . (time() - rand(1000, 86400)),
                'delivery_location' => $location['name'],
                'delivery_fee'      => $location['fee'],
                'detailed_address'  => 'Cité ' . rand(1, 20) . ', Appt ' . rand(10, 99) . ' - Tel: +225 07' . rand(10000000, 99999999),
                'total_price'       => 0, 
                'status'            => $statuses[array_rand($statuses)],
                'created_at'        => now()->subDays(rand(0, 30)), 
            ]);

            // --- LA CORRECTION EST ICI ---
            $numberOfItems = rand(1, 3);
            // .take() mélangé à .shuffle() garantit qu'on récupère toujours une COLLECTION, qu'il y ait 1, 2 ou 3 éléments.
            $randomVariants = $variants->shuffle()->take($numberOfItems);
            
            $calculatedTotal = 0;

            foreach ($randomVariants as $variant) {
                $qty = rand(1, 2);
                $unitPrice = $variant->price ?? $variant->product->price;
                
                $order->items()->create([
                    'product_variant_id' => $variant->id,
                    'quantity'           => $qty,
                    'price'              => $unitPrice,
                ]);

                $calculatedTotal += ($unitPrice * $qty);
            }

            $order->update([
                'total_price' => $calculatedTotal + $location['fee']
            ]);
        }

        $this->command->info('✅ 15 commandes de test générées avec succès.');
    }
}