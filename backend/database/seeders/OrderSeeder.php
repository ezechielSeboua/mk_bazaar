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

        $guestNames  = ['Koffi Atta', 'Adjoua Brou', 'Yao Kouassi', 'Amenan Djè', 'Kouadio N\'Goran'];
        $guestPhones = ['+225 0701020304', '+225 0756781234', '+225 0712345678', '+225 0787654321', '+225 0723456789'];

        for ($i = 1; $i <= 15; $i++) {

            $user     = ($users->isNotEmpty() && rand(0, 1)) ? $users->random() : null;
            $location = $locations[array_rand($locations)];

            $order = Order::create([
                'user_id'           => $user?->id,
                'customer_name'     => $user ? $user->name  : $guestNames[array_rand($guestNames)],
                'customer_phone'    => $user ? ($user->phone ?? $guestPhones[array_rand($guestPhones)]) : $guestPhones[array_rand($guestPhones)],
                'order_number'      => 'MK-' . strtoupper(Str::random(4)) . '-' . (time() - rand(1000, 86400)),
                'delivery_location' => $location['name'],
                'delivery_fee'      => $location['fee'],
                'detailed_address'  => 'Cité ' . rand(1, 20) . ', Appt ' . rand(10, 99),
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
                    'product_id'         => $variant->product_id,
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