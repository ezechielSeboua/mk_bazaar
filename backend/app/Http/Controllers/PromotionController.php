<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Promotion;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Promotions (écran « Promotions et bandeaux ») et page publique « Offres ».
 */
class PromotionController extends Controller
{
    /** Résolu à chaque appel : les instances de contrôleur peuvent être réutilisées entre requêtes. */
    private function pricing(): PricingService
    {
        return app(PricingService::class);
    }

    /**
     * Liste admin. `?status=active|scheduled|ended|inactive`.
     * `counts` alimente le sous-titre « 2 promotions actives · 1 programmée ».
     */
    public function index(Request $request): JsonResponse
    {
        $query = Promotion::with([
            'category:id,name,slug',
            'products:id,name,slug',
            'variants:id,product_id,attributes',
            'variants.product:id,name',
        ])->latest();

        match ($request->input('status')) {
            'active'    => $query->currentlyActive(),
            'scheduled' => $query->scheduled(),
            'ended'     => $query->ended(),
            'inactive'  => $query->where('is_active', false)->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now())),
            default     => null,
        };

        $promotions = $query->get();

        $all = Promotion::get(['id', 'is_active', 'starts_at', 'ends_at']);

        return response()->json([
            'promotions' => $promotions,
            'counts'     => [
                'all'       => $all->count(),
                'active'    => $all->where('status', 'active')->count(),
                'scheduled' => $all->where('status', 'scheduled')->count(),
                'ended'     => $all->where('status', 'ended')->count(),
                'inactive'  => $all->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function show(Promotion $promotion): JsonResponse
    {
        return response()->json($promotion->load([
            'category:id,name,slug',
            'products:id,name,slug',
            'variants:id,product_id,attributes',
            'variants.product:id,name',
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePromotion($request);

        $promotion = DB::transaction(function () use ($validated) {
            $promotion = Promotion::create($this->attributesFrom($validated));
            $this->syncTargets($promotion, $validated);

            return $promotion;
        });

        return $this->show($promotion);
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        $validated = $this->validatePromotion($request, $promotion);

        DB::transaction(function () use ($promotion, $validated) {
            $promotion->update($this->attributesFrom($validated));
            $this->syncTargets($promotion, $validated);
        });

        return $this->show($promotion->refresh());
    }

    /**
     * Les commandes passées gardent leur remise : la ligne de commande perd
     * seulement le lien vers la promotion.
     */
    public function destroy(Promotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json(['message' => 'Promotion supprimée.']);
    }

    /**
     * Page publique « Offres » : promotions en cours affichées dans les offres,
     * produits remisés (avec `pricing`) et prochaine opération programmée.
     */
    public function offers(): JsonResponse
    {
        $promotions = $this->pricing()->activePromotions()->where('show_in_offers', true);

        $categoryIds = $promotions->where('target_type', Promotion::TARGET_CATEGORY)->pluck('category_id')->filter()->unique();
        $categoryIds = $categoryIds->merge(Category::whereIn('parent_id', $categoryIds)->pluck('id'))->unique();
        $productIds  = $promotions->where('target_type', Promotion::TARGET_PRODUCTS)->flatMap->products->pluck('id');
        $variantIds  = $promotions->where('target_type', Promotion::TARGET_VARIANTS)->flatMap->variants->pluck('id');

        $products = Product::where('is_active', true)
            ->where(fn ($q) => $q
                ->whereIn('category_id', $categoryIds->all() ?: [0])
                ->orWhereIn('id', $productIds->all() ?: [0])
                ->orWhereHas('variants', fn ($v) => $v->whereIn('id', $variantIds->all() ?: [0])))
            ->with(['category', 'variants' => fn ($q) => $q->where('is_active', true)])
            ->get();

        $this->pricing()->decorateMany($products);

        // Seuls les articles réellement remisés par une promotion visible dans les offres
        $visibleIds = $promotions->pluck('id');
        $products = $products->filter(function (Product $product) use ($visibleIds) {
            $prices = $product->variants->isEmpty()
                ? [$product->pricing]
                : $product->variants->pluck('pricing')->all();

            return collect($prices)->contains(fn ($p) => $p['promotion'] && $visibleIds->contains($p['promotion']['id']));
        })->values();

        $upcoming = Promotion::scheduled()->where('show_in_offers', true)->orderBy('starts_at')->first();

        return response()->json([
            'promotions' => $promotions->map->summary()->values(),
            'products'   => $products,
            'upcoming'   => $upcoming?->summary(),
        ]);
    }

    private function validatePromotion(Request $request, ?Promotion $promotion = null): array
    {
        $required = $promotion ? 'sometimes' : 'required';

        $validated = $request->validate([
            'name'               => "{$required}|string|max:255",
            'discount_type'      => [$required, Rule::in([Promotion::TYPE_PERCENTAGE, Promotion::TYPE_FIXED])],
            'discount_value'     => "{$required}|integer|min:1",
            'target_type'        => [$required, Rule::in([Promotion::TARGET_CATEGORY, Promotion::TARGET_PRODUCTS, Promotion::TARGET_VARIANTS])],
            'category_id'        => 'nullable|integer|exists:categories,id',
            'product_ids'        => 'nullable|array|max:500',
            'product_ids.*'      => 'integer|distinct|exists:products,id',
            'variant_ids'        => 'nullable|array|max:500',
            'variant_ids.*'      => 'integer|distinct|exists:product_variants,id',
            'starts_at'          => 'nullable|date',
            'ends_at'            => 'nullable|date',
            'is_active'          => 'sometimes|boolean',
            'show_strikethrough' => 'sometimes|boolean',
            'show_in_offers'     => 'sometimes|boolean',
        ]);

        // Contrôles croisés sur l'état final (valeurs reçues sinon valeurs actuelles)
        $final = fn (string $key) => array_key_exists($key, $validated) ? $validated[$key] : $promotion?->{$key};

        $type   = $final('discount_type');
        $value  = $final('discount_value');
        $target = $final('target_type');
        $starts = $final('starts_at');
        $ends   = $final('ends_at');

        $errors = [];

        if ($type === Promotion::TYPE_PERCENTAGE && $value > 90) {
            $errors['discount_value'][] = 'Une remise en pourcentage ne peut pas dépasser 90 %.';
        }
        if ($starts && $ends && strtotime((string) $ends) < strtotime((string) $starts)) {
            $errors['ends_at'][] = 'La date de fin doit suivre la date de début.';
        }

        $targetsChanged = $promotion === null
            || array_intersect(array_keys($validated), ['target_type', 'category_id', 'product_ids', 'variant_ids']);

        if ($targetsChanged) {
            // Cible sans sélection : on regarde ce qui est reçu, sinon ce qui est déjà lié
            $hasProducts = array_key_exists('product_ids', $validated)
                ? !empty($validated['product_ids'])
                : (bool) $promotion?->products()->exists();
            $hasVariants = array_key_exists('variant_ids', $validated)
                ? !empty($validated['variant_ids'])
                : (bool) $promotion?->variants()->exists();

            if ($target === Promotion::TARGET_CATEGORY && empty($final('category_id'))) {
                $errors['category_id'][] = 'Choisissez la catégorie concernée.';
            } elseif ($target === Promotion::TARGET_PRODUCTS && !$hasProducts) {
                $errors['product_ids'][] = 'Choisissez au moins un produit.';
            } elseif ($target === Promotion::TARGET_VARIANTS && !$hasVariants) {
                $errors['variant_ids'][] = 'Choisissez au moins une variante.';
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $validated;
    }

    private function attributesFrom(array $validated): array
    {
        $data = collect($validated)->except(['product_ids', 'variant_ids'])->all();

        // La cible catégorie est la seule à utiliser category_id
        if (($validated['target_type'] ?? null) && $validated['target_type'] !== Promotion::TARGET_CATEGORY) {
            $data['category_id'] = null;
        }

        return $data;
    }

    /** Ne garde que les liaisons correspondant à la cible choisie. */
    private function syncTargets(Promotion $promotion, array $validated): void
    {
        $target = $promotion->target_type;

        if ($target === Promotion::TARGET_PRODUCTS) {
            if (array_key_exists('product_ids', $validated)) {
                $promotion->products()->sync($validated['product_ids'] ?? []);
            }
            $promotion->variants()->detach();
        } elseif ($target === Promotion::TARGET_VARIANTS) {
            if (array_key_exists('variant_ids', $validated)) {
                $promotion->variants()->sync($validated['variant_ids'] ?? []);
            }
            $promotion->products()->detach();
        } else {
            $promotion->products()->detach();
            $promotion->variants()->detach();
        }
    }
}
