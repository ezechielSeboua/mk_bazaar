<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Services\PricingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Commandes de test sur le catalogue bijoux : communes de livraison de la
 * boutique, prix et remises calculés par PricingService (comme en vrai),
 * statuts répartis sur tout le parcours, sur les 45 derniers jours.
 */
class OrderSeeder extends Seeder
{
    private const COUNT = 20;

    public function run(): void
    {
        mt_srand(4242);

        $variants = ProductVariant::with('product.category')->where('stock', '>', 0)->get();
        if ($variants->isEmpty()) {
            $this->command?->error('Aucune variante en stock : lancez ProductsSeeder avant OrderSeeder.');
            return;
        }

        $zones = Setting::where('key', 'shipping_zones')->value('value') ?? [];
        if (!$zones) {
            $this->command?->error('Aucune zone de livraison : lancez ShippingZonesSeeder avant OrderSeeder.');
            return;
        }

        $pricing = app(PricingService::class);
        $admin = User::where('is_admin', true)->first();
        $guests = [
            ['Koffi Atta', '0701020304'], ['Adjoua Brou', '0756781234'], ['Yao Kouassi', '0712345678'],
            ['Amenan Djè', '0787654321'], ["Kouadio N'Goran", '0723456789'], ['Aya Koné', '0545112233'],
        ];
        // Répartition des statuts sur le parcours de la maquette
        $statuses = [
            Order::STATUS_PENDING, Order::STATUS_PENDING, Order::STATUS_PENDING, Order::STATUS_PENDING, Order::STATUS_PENDING,
            Order::STATUS_CONFIRMED, Order::STATUS_CONFIRMED, Order::STATUS_CONFIRMED,
            Order::STATUS_SHIPPING, Order::STATUS_SHIPPING,
            Order::STATUS_DELIVERED, Order::STATUS_DELIVERED, Order::STATUS_DELIVERED, Order::STATUS_DELIVERED,
            Order::STATUS_DELIVERED, Order::STATUS_DELIVERED, Order::STATUS_DELIVERED,
            Order::STATUS_CANCELLED, Order::STATUS_CANCELLED, Order::STATUS_CANCELLED,
        ];

        for ($i = 0; $i < self::COUNT; $i++) {
            $zone = $zones[mt_rand(0, count($zones) - 1)];
            $byAdmin = $admin && $i % 5 === 0;
            [$name, $phone] = $guests[mt_rand(0, count($guests) - 1)];
            $date = now()->subDays(mt_rand(0, 45))->subMinutes(mt_rand(0, 1400));

            $order = Order::create([
                'user_id' => $byAdmin ? $admin->id : null,
                'customer_name' => $byAdmin ? $admin->name : $name,
                'customer_phone' => $byAdmin ? ($admin->phone ?: $phone) : $phone,
                'order_number' => 'MK-' . strtoupper(Str::random(4)) . '-' . $date->timestamp,
                'delivery_location' => $zone['name'],
                'delivery_fee' => (int) $zone['price'],
                'detailed_address' => 'Quartier ' . mt_rand(1, 30) . ', près de la pharmacie',
                'total_price' => 0,
                'status' => $statuses[$i % count($statuses)],
            ]);
            $order->forceFill(['created_at' => $date, 'updated_at' => $date])->save();

            $itemsTotal = 0;
            $discountTotal = 0;
            foreach ($variants->random(mt_rand(1, 3)) as $variant) {
                $quantity = mt_rand(1, 2);
                $price = $pricing->priceFor($variant->product, $variant);
                $order->items()->create([
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'promotion_id' => $price['promotion_id'],
                    'quantity' => $quantity,
                    'price' => $price['final_price'],
                    'discount' => $price['discount'],
                ]);
                $itemsTotal += $price['final_price'] * $quantity;
                $discountTotal += $price['discount'] * $quantity;
            }

            $order->update([
                'total_price' => $itemsTotal + (int) $zone['price'],
                'discount_total' => $discountTotal,
            ]);
        }

        $this->command?->info('✅ ' . self::COUNT . ' commandes de test.');
    }
}
