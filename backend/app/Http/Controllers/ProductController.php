<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Cloudinary\Cloudinary as CloudinarySDK;

class ProductController extends Controller
{
    /** Résolu à chaque appel : les instances de contrôleur peuvent être réutilisées entre requêtes. */
    private function pricing(): PricingService
    {
        return app(PricingService::class);
    }

    /**
     * Récupérer les produits (Filtres, tri et pagination)
     *
     * Filtres : category_slug | category_id (sous-catégories incluses), in_stock,
     * min_price, max_price, size, color, attr[<slug>]=<valeur>, search (nom,
     * description, référence), featured, is_new, on_sale.
     * Admin : include_inactive=1 pour voir les produits et variantes désactivés.
     *
     * Chaque produit et chaque variante exposent `pricing` (prix final, remise, promotion).
     */
    public function index(Request $request): JsonResponse
    {
        $withInactive = $request->boolean('include_inactive') && $this->requestIsAdmin();

        $query = Product::query()->with(['category', 'variants' => $this->variantScope($withInactive)]);

        if (!$withInactive) {
            $query->where('is_active', true);
        } elseif ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filtrage par catégorie (Slug ou ID), sous-catégories comprises
        if ($request->filled('category_slug') || $request->filled('category_id')) {
            $category = $request->filled('category_slug')
                ? Category::where('slug', $request->category_slug)->first()
                : Category::find($request->category_id);

            $query->whereIn('category_id', $category ? $category->selfAndChildrenIds() : []);
        }

        // Nouveau filtre de stock basé sur la table des variantes
        if ($request->has('in_stock')) {
            // En stock : une variante active en stock, ou un produit sans variante en stock
            $inStock = fn ($q) => $q
                ->whereHas('variants', fn ($v) => $v->where('is_active', true)->where('stock', '>', 0))
                ->orWhere(fn ($p) => $p->whereDoesntHave('variants')->where('stock', '>', 0));

            $request->boolean('in_stock') ? $query->where($inStock) : $query->whereNot($inStock);
        }

        // Filtrage par prix minimum et maximum (prix de base)
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (int) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (int) $request->max_price);
        }

        // Filtres d'attributs : attr[taille]=M&attr[finition]=Doré (variantes actives en stock)
        $attributeFilters = (array) $request->input('attr', []);
        // Anciens paramètres, conservés pour compatibilité
        if ($request->filled('color')) {
            $attributeFilters['couleur'] = $request->color;
        }

        foreach ($attributeFilters as $slug => $value) {
            if (!is_string($slug) || !preg_match(ProductAttribute::SLUG_PATTERN, $slug) || !is_scalar($value) || $value === '') {
                continue; // la clé sert de chemin JSON : on n'accepte que des slugs valides
            }
            $query->whereHas('variants', fn ($q) => $q
                ->where('is_active', true)
                ->where('stock', '>', 0)
                ->where("attributes->{$slug}", (string) $value));
        }

        if ($request->filled('size')) {
            $size = $request->size;
            $query->whereHas('variants', function ($q) use ($size) {
                $q->where('is_active', true)
                  ->where('stock', '>', 0)
                  ->where(function ($sub) use ($size) {
                      $sub->where('attributes->taille', $size)
                          ->orWhere('attributes->pointure', $size);
                  });
            });
        }

        // Recherche textuelle (nom, description, référence produit ou variante)
        if ($request->filled('search')) {
            $search = '%' . substr($request->search, 0, 100) . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $search)
                                       ->orWhere('description', 'like', $search)
                                       ->orWhere('sku', 'like', $search)
                                       ->orWhereHas('variants', fn ($v) => $v->where('sku', 'like', $search)));
        }

        if ($request->has('featured')) {
            $query->where('featured', $request->boolean('featured'));
        }
        if ($request->has('is_new')) {
            $query->where('is_new', $request->boolean('is_new'));
        }

        // Produits concernés par une promotion en cours
        if ($request->boolean('on_sale')) {
            $this->scopeOnSale($query);
        }

        // Tri des données
        if ($request->filled('sort')) {
            match ($request->sort) {
                'newest'     => $query->latest(),
                'price_low'  => $query->orderBy('price', 'asc'),
                'price_high' => $query->orderBy('price', 'desc'),
                default      => null,
            };
        }

        $perPage = min(max((int) $request->input('per_page', 12), 1), 500);

        $page = $query->paginate($perPage);
        $this->pricing()->decorateMany($page->getCollection());

        return response()->json($page);
    }

    /**
     * Afficher un seul produit complet (via ID ou Slug)
     */
    public function show($idOrSlug): JsonResponse
    {
        $withInactive = $this->requestIsAdmin();

        $query = Product::query()
            ->where(is_numeric($idOrSlug) ? 'id' : 'slug', $idOrSlug)
            ->with([
                'category.parent',
                'category.productType.variationAttributes.values',
                'category.parent.productType.variationAttributes.values',
                'variants' => $this->variantScope($withInactive),
            ]);

        if (!$withInactive) {
            $query->where('is_active', true);
        }

        $product = $query->firstOrFail();

        // Type effectif : options proposées au client et libellé du guide
        $product->setAttribute('product_type', $product->category?->effectiveProductType());
        $product->category?->unsetRelation('productType');
        $product->category?->parent?->unsetRelation('productType');

        $this->pricing()->decorate($product);

        return response()->json($product);
    }

    /**
     * Récupérer les produits mis en avant pour la Home
     */
    public function featured(): JsonResponse
    {
        $products = Product::where('featured', true)
            ->where('is_active', true)
            ->with(['category', 'variants' => $this->variantScope(false)])
            ->limit(8)
            ->get();

        $this->pricing()->decorateMany($products);

        return response()->json($products);
    }

    /** Variantes visibles : actives seulement, sauf pour l'admin. */
    private function variantScope(bool $withInactive): \Closure
    {
        return fn ($q) => $withInactive ? $q : $q->where('is_active', true);
    }

    /** Restreint aux produits visés par au moins une promotion en cours. */
    private function scopeOnSale($query): void
    {
        $promotions = $this->pricing()->activePromotions();

        $categoryIds = $promotions->where('target_type', Promotion::TARGET_CATEGORY)->pluck('category_id')->filter()->unique();
        $categoryIds = $categoryIds->merge(Category::whereIn('parent_id', $categoryIds)->pluck('id'))->unique();
        $productIds  = $promotions->where('target_type', Promotion::TARGET_PRODUCTS)->flatMap->products->pluck('id');
        $variantIds  = $promotions->where('target_type', Promotion::TARGET_VARIANTS)->flatMap->variants->pluck('id');

        $query->where(fn ($q) => $q
            ->whereIn('category_id', $categoryIds->all() ?: [0])
            ->orWhereIn('id', $productIds->all() ?: [0])
            ->orWhereHas('variants', fn ($v) => $v->whereIn('id', $variantIds->all() ?: [0])));
    }

    /**
     * Créer un nouveau produit et ses variantes optionnelles (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $this->assertValidVariants($validated['variants'] ?? [], (int) $validated['category_id']);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        // Gestion des images
        $paths = [];
        if ($request->hasFile('image_path')) {
            $files = $request->file('image_path');
            $files = is_array($files) ? $files : [$files];

            foreach ($files as $file) {
                if ($file->isValid()) {
                    $paths[] = $this->cloudinaryUpload($file, 'products');
                }
            }
        }
        $validated['image_path'] = $paths;

        // 1. Création du produit principal
        $product = Product::create($validated);

        // 2. Création des variantes associées si présentes
        if (!empty($validated['variants'])) {
            foreach ($validated['variants'] as $index => $variantData) {
                if ($request->hasFile("variants.{$index}.image")) {
                    $file = $request->file("variants.{$index}.image");
                    if ($file->isValid()) {
                        $variantData['image_path'] = $this->cloudinaryUpload($file, 'variants');
                    }
                }
                $product->variants()->create($variantData);
            }
        }

        return response()->json($this->pricing()->decorate($product->load(['category', 'variants'])), 201);
    }

    /**
     * Mettre à jour un produit et ses variantes via ID ou Slug (Admin)
     */
    public function update(Request $request, $idOrSlug): JsonResponse
    {
        $product = Product::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        $validated = $request->validate($this->rules($product));
        if (array_key_exists('variants', $validated)) {
            $this->assertValidVariants($validated['variants'] ?? [], (int) ($validated['category_id'] ?? $product->category_id), $product);
        }

        if (isset($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Gestion du remplacement de la galerie d'images
        $hasNewFiles = $request->hasFile('image_path');
        // sync_images=1 : la galerie finale est exactement existing_images + nouveaux fichiers
        // (permet de retirer toutes les photos, un tableau vide n'existant pas en multipart).
        $hasExistingImages = $request->has('existing_images') || $request->boolean('sync_images');

        if ($hasNewFiles || $hasExistingImages) {
            $existingToKeep = $request->input('existing_images', []);

            // Supprimer uniquement les images qui ne sont plus conservées
            foreach (($product->image_path ?? []) as $imageUrl) {
                if (!in_array($imageUrl, $existingToKeep)) {
                    $this->cloudinaryDelete($imageUrl);
                }
            }

            $newImages = array_values($existingToKeep);

            if ($hasNewFiles) {
                $files = $request->file('image_path');
                $files = is_array($files) ? $files : [$files];
                foreach ($files as $file) {
                    if ($file->isValid()) {
                        $newImages[] = $this->cloudinaryUpload($file, 'products');
                    }
                }
            }

            $validated['image_path'] = $newImages;
        }

        // MODIFICATION : On encapsule les modifications en base de données dans une Transaction
        DB::transaction(function () use ($product, $validated, $request) {

            // 1. Mise à jour du produit principal
            $product->update($validated);

            // 2. Gestion et synchronisation des variantes
            // clear_variants=1 : le produit n'a plus de variantes (tableau vide impossible en multipart).
            if ($request->boolean('clear_variants') && !$request->has('variants')) {
                foreach ($product->variants as $variant) {
                    if ($variant->image_path) {
                        $this->cloudinaryDelete($variant->image_path);
                    }
                    $variant->delete();
                }
            }

            if ($request->has('variants')) {
                $activeVariantIds = [];

                foreach ($validated['variants'] as $index => $variantData) {
                    // Gestion de l'image de la variante
                    if ($request->hasFile("variants.{$index}.image")) {
                        $file = $request->file("variants.{$index}.image");
                        if ($file->isValid()) {
                            // Supprimer l'ancienne image si la variante existe déjà
                            if (!empty($variantData['id'])) {
                                $old = $product->variants()->find($variantData['id']);
                                if ($old && $old->image_path) {
                                    $this->cloudinaryDelete($old->image_path);
                                }
                            }
                            $variantData['image_path'] = $this->cloudinaryUpload($file, 'variants');
                        }
                    }

                    if (!empty($variantData['id'])) {
                        $variant = $product->variants()->findOrFail($variantData['id']);
                        $variant->update($variantData);
                        $activeVariantIds[] = $variant->id;
                    } else {
                        $newVariant = $product->variants()->create($variantData);
                        $activeVariantIds[] = $newVariant->id;
                    }
                }

                // Supprimer les variantes (et leurs images) absentes du payload
                $removed = $product->variants()->whereNotIn('id', $activeVariantIds)->get();
                foreach ($removed as $variant) {
                    if ($variant->image_path) {
                        $this->cloudinaryDelete($variant->image_path);
                    }
                    $variant->delete();
                }
            }
        });

        return response()->json($this->pricing()->decorate($product->load(['category', 'variants'])));
    }

    /**
     * Supprimer un produit via ID ou Slug (Admin)
     */
    public function destroy($idOrSlug): JsonResponse
    {
        $product = Product::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        foreach (($product->image_path ?? []) as $imageUrl) {
            $this->cloudinaryDelete($imageUrl);
        }

        foreach ($product->variants as $variant) {
            if ($variant->image_path) {
                $this->cloudinaryDelete($variant->image_path);
            }
        }
        $product->variants()->delete();
        $product->delete();

        return response()->json(['message' => 'Produit et ses variantes supprimés avec succès.']);
    }

    /**
     * Suppression groupée de produits (Admin)
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:products,id',
        ]);

        $products = Product::whereIn('id', $validated['ids'])->get();

        foreach ($products as $product) {
            foreach (($product->image_path ?? []) as $imageUrl) {
                $this->cloudinaryDelete($imageUrl);
            }
            foreach ($product->variants as $variant) {
                if ($variant->image_path) {
                    $this->cloudinaryDelete($variant->image_path);
                }
            }
            $product->variants()->delete();
            $product->delete();
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']) . ' produit(s) supprimé(s).',
        ]);
    }

    private function rules(?Product $product = null): array
    {
        $required = $product ? 'sometimes' : 'required';

        return [
            'name'                  => "{$required}|string|max:255",
            'slug'                  => ($product ? 'sometimes' : 'nullable') . '|string|max:255|unique:products,slug' . ($product ? ',' . $product->id : ''),
            'sku'                   => 'nullable|string|max:64|unique:products,sku' . ($product ? ',' . $product->id : ''),
            'description'           => "{$required}|string",
            'specs'                 => 'nullable|array|max:20',
            'specs.*.label'         => 'required|string|max:60',
            'specs.*.value'         => 'required|string|max:255',
            'price'                 => "{$required}|integer|min:0",
            'stock'                 => 'sometimes|integer|min:0',
            'rating'                => 'nullable|numeric|min:0|max:5',
            'category_id'           => "{$required}|exists:categories,id",
            'is_active'             => 'sometimes|boolean',
            'featured'              => 'sometimes|boolean',
            'is_new'                => 'sometimes|boolean',
            'image_path.*'          => 'image|mimes:jpeg,jpg,png,webp|max:4096',
            'existing_images'       => 'sometimes|array',
            'existing_images.*'     => 'sometimes|string',
            'sync_images'           => 'sometimes|boolean',
            'clear_variants'        => 'sometimes|boolean',
            'variants'              => 'sometimes|array|max:200',
            'variants.*.id'         => 'nullable|integer|exists:product_variants,id',
            'variants.*.sku'        => 'nullable|string|max:64|distinct',
            'variants.*.attributes' => 'required_with:variants|array',
            'variants.*.attributes.*' => 'required|string|max:100',
            'variants.*.price'      => 'nullable|integer|min:0',
            'variants.*.stock'      => 'required_with:variants|integer|min:0',
            'variants.*.is_active'  => 'sometimes|boolean',
            'variants.*.image'      => 'nullable|image|mimes:jpeg,jpg,png,webp|max:4096',
        ];
    }

    /**
     * Vérifie les variantes reçues :
     *  - référence (SKU) non utilisée par une variante d'un autre produit ;
     *  - si la catégorie a un type de produit, attributs et valeurs autorisés par ce type.
     * Sans type de produit, les attributs restent libres (données existantes).
     */
    private function assertValidVariants(array $variants, int $categoryId, ?Product $product = null): void
    {
        $errors = [];

        $skus = collect($variants)->pluck('sku')->filter()->values();
        if ($skus->isNotEmpty()) {
            $taken = ProductVariant::whereIn('sku', $skus)
                ->when($product, fn ($q) => $q->where('product_id', '!=', $product->id))
                ->pluck('sku');
            foreach ($variants as $index => $variant) {
                if (!empty($variant['sku']) && $taken->contains($variant['sku'])) {
                    $errors["variants.{$index}.sku"][] = "La référence « {$variant['sku']} » est déjà utilisée.";
                }
            }
        }

        $type = Category::with(['productType.variationAttributes.values', 'parent.productType.variationAttributes.values'])
            ->find($categoryId)
            ?->effectiveProductType();

        if ($type) {
            $allowed = $type->variationAttributes->mapWithKeys(fn ($attribute) => [
                $attribute->slug => $attribute->values->pluck('value')->all(),
            ]);

            foreach ($variants as $index => $variant) {
                foreach (($variant['attributes'] ?? []) as $slug => $value) {
                    if (!$allowed->has($slug)) {
                        $errors["variants.{$index}.attributes"][] = "L'attribut « {$slug} » ne fait pas partie du type « {$type->name} ».";
                    } elseif (!in_array($value, $allowed[$slug], true)) {
                        $errors["variants.{$index}.attributes"][] = "La valeur « {$value} » n'existe pas pour l'attribut « {$slug} ».";
                    }
                }
            }
        }

        if ($errors) {
            throw \Illuminate\Validation\ValidationException::withMessages($errors);
        }
    }

    private function cloudinary(): CloudinarySDK
    {
        return new CloudinarySDK(config('services.cloudinary.url'));
    }

    private function cloudinaryUpload($file, string $folder): string
    {
        $result = $this->cloudinary()->uploadApi()->upload($file->getRealPath(), [
            'folder' => $folder,
            'resource_type' => 'image',
        ]);
        return $result['secure_url'];
    }

    private function cloudinaryDelete(string $url): void
    {
        // Extrait le public ID depuis l'URL Cloudinary
        // Ex: https://res.cloudinary.com/cloud/image/upload/v123/products/file.jpg → products/file
        if (preg_match('/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/', $url, $matches)) {
            $this->cloudinary()->uploadApi()->destroy($matches[1]);
        }
    }
}
