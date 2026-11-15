<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Reprise des prix barrés (`old_price`) en promotions.
 *
 * Pour chaque article vendable (variante, ou produit sans variante) dont le prix
 * barré dépasse le prix actuel :
 *   - le prix de base devient l'ancien prix barré ;
 *   - une promotion « Prix barré · <produit> » sans date de fin applique l'écart.
 * Le prix affiché au client reste donc identique.
 *
 * Les colonnes `old_price` sont vidées mais conservées ; elles seront supprimées
 * dans une migration ultérieure, une fois le frontend adapté.
 */
return new class extends Migration
{
    private const PREFIX = 'Prix barré · ';

    public function up(): void
    {
        DB::transaction(function () {
            $now = now();

            foreach (DB::table('products')->orderBy('id')->get(['id', 'name', 'price', 'old_price']) as $product) {
                $variants = DB::table('product_variants')
                    ->where('product_id', $product->id)
                    ->get(['id', 'price', 'old_price']);

                if ($variants->isEmpty()) {
                    if ($product->old_price && $product->old_price > $product->price) {
                        $promotionId = $this->createPromotion($product->name, $product->old_price - $product->price, 'products', $now);
                        DB::table('promotion_product')->insert(['promotion_id' => $promotionId, 'product_id' => $product->id]);
                        DB::table('products')->where('id', $product->id)->update(['price' => $product->old_price]);
                    }
                    continue;
                }

                // Variantes regroupées par montant de remise : une promotion par écart.
                $groups = [];
                foreach ($variants as $variant) {
                    $current = $variant->price ?? $product->price;
                    $old     = $variant->old_price ?? ($variant->price === null ? $product->old_price : null);

                    if ($old && $old > $current) {
                        $groups[$old - $current][] = ['id' => $variant->id, 'old' => $old];
                    }
                }

                foreach ($groups as $discount => $rows) {
                    $promotionId = $this->createPromotion($product->name, (int) $discount, 'variants', $now);
                    foreach ($rows as $row) {
                        DB::table('promotion_variant')->insert(['promotion_id' => $promotionId, 'product_variant_id' => $row['id']]);
                        DB::table('product_variants')->where('id', $row['id'])->update(['price' => $row['old']]);
                    }
                }
            }

            DB::table('products')->update(['old_price' => null]);
            DB::table('product_variants')->update(['old_price' => null]);
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            $promotions = DB::table('promotions')->where('name', 'like', self::PREFIX . '%')->get();

            foreach ($promotions as $promotion) {
                $discount = (int) $promotion->discount_value;

                $productIds = DB::table('promotion_product')->where('promotion_id', $promotion->id)->pluck('product_id');
                foreach (DB::table('products')->whereIn('id', $productIds)->get(['id', 'price']) as $product) {
                    DB::table('products')->where('id', $product->id)->update([
                        'old_price' => $product->price,
                        'price'     => max(0, $product->price - $discount),
                    ]);
                }

                $variantIds = DB::table('promotion_variant')->where('promotion_id', $promotion->id)->pluck('product_variant_id');
                foreach (DB::table('product_variants')->whereIn('id', $variantIds)->get(['id', 'price']) as $variant) {
                    DB::table('product_variants')->where('id', $variant->id)->update([
                        'old_price' => $variant->price,
                        'price'     => max(0, $variant->price - $discount),
                    ]);
                }

                DB::table('promotions')->where('id', $promotion->id)->delete();
            }
        });
    }

    private function createPromotion(string $productName, int $discount, string $target, $now): int
    {
        return DB::table('promotions')->insertGetId([
            'name'               => mb_substr(self::PREFIX . $productName, 0, 255),
            'discount_type'      => 'fixed',
            'discount_value'     => $discount,
            'target_type'        => $target,
            'is_active'          => true,
            'show_strikethrough' => true,
            'show_in_offers'     => true,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
    }
};
