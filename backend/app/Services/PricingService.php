<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use Illuminate\Support\Collection;

/**
 * Seule source de vérité pour le prix payé par le client.
 *
 * Règles :
 *  - `price` (produit ou variante) est le prix de base ;
 *  - une seule promotion par article, sans cumul : la plus avantageuse pour le client ;
 *  - le prix final n'est jamais négatif.
 *
 * Enregistré en singleton : les promotions actives sont chargées une fois par requête.
 */
class PricingService
{
    private ?Collection $activePromotions = null;

    public function activePromotions(): Collection
    {
        return $this->activePromotions ??= Promotion::currentlyActive()
            ->with(['products:id', 'variants:id'])
            ->get();
    }

    /** Oublie le cache (utile après la création ou la modification d'une promotion). */
    public function flush(): void
    {
        $this->activePromotions = null;
    }

    /**
     * Prix d'un article vendable : une variante, ou un produit sans variante.
     *
     * @return array{base_price:int, final_price:int, discount:int, discount_percent:int, promotion:?array, promotion_id:?int}
     */
    public function priceFor(Product $product, ?ProductVariant $variant = null): array
    {
        $base = (int) ($variant?->price ?? $product->price);

        $best         = null;
        $bestDiscount = 0;

        foreach ($this->activePromotions() as $promotion) {
            if (!$promotion->appliesTo($product, $variant)) {
                continue;
            }
            $discount = $promotion->discountFor($base);
            if ($discount > $bestDiscount) {
                $bestDiscount = $discount;
                $best         = $promotion;
            }
        }

        return [
            'base_price'       => $base,
            'final_price'      => $base - $bestDiscount,
            'discount'         => $bestDiscount,
            'discount_percent' => $base > 0 ? (int) round($bestDiscount * 100 / $base) : 0,
            'promotion'        => $best?->summary(),
            'promotion_id'     => $best?->id,
        ];
    }

    /**
     * Ajoute `pricing` au produit et à chacune de ses variantes chargées.
     *
     * Pour un produit à variantes, `pricing` reprend la variante la moins chère
     * (prix final) et `from` indique si les prix varient (« dès 20 750 FCFA »).
     * Nécessite les relations `category` et `variants` chargées.
     */
    public function decorate(Product $product): Product
    {
        $variants = $product->relationLoaded('variants') ? $product->variants : collect();

        if ($variants->isEmpty()) {
            $price = $this->publicPricing($this->priceFor($product));
            $product->setAttribute('pricing', $price + [
                'from'          => false,
                'has_promotion' => $price['discount'] > 0,
            ]);

            return $product;
        }

        $prices = [];
        foreach ($variants as $variant) {
            $price = $this->publicPricing($this->priceFor($product, $variant));
            $variant->setAttribute('pricing', $price);
            $prices[] = $price;
        }

        $cheapest = collect($prices)->sortBy('final_price')->first();
        $finals   = array_unique(array_column($prices, 'final_price'));

        $product->setAttribute('pricing', $cheapest + [
            'from'          => count($finals) > 1,
            'has_promotion' => collect($prices)->contains(fn ($p) => $p['discount'] > 0),
        ]);

        return $product;
    }

    /** @param iterable<Product> $products */
    public function decorateMany(iterable $products): void
    {
        foreach ($products as $product) {
            $this->decorate($product);
        }
    }

    /** Retire les champs internes avant exposition. */
    private function publicPricing(array $price): array
    {
        unset($price['promotion_id']);

        return $price;
    }
}
