<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB; // AJOUTÉ : Pour la sécurité des transactions

class ProductController extends Controller
{
    /**
     * Récupérer les produits (Filtres, tri et pagination)
     */
    public function index(Request $request): JsonResponse
    {
        // On charge la catégorie ET les variantes associées
        $query = Product::where('is_active', true)->with(['category', 'variants']);

        // Filtrage par catégorie (Slug ou ID)
        if ($request->filled('category_slug')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category_slug));
        } elseif ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Nouveau filtre de stock basé sur la table des variantes
        if ($request->has('in_stock')) {
            if ($request->boolean('in_stock')) {
                // En stock : le produit possède au moins une variante dont le stock > 0
                $query->whereHas('variants', fn($q) => $q->where('stock', '>', 0));
            } else {
                // Rupture : toutes les variantes ont un stock à 0
                $query->whereDoesntHave('variants', fn($q) => $q->where('stock', '>', 0));
            }
        }

        // Recherche textuelle
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
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

        return response()->json($query->paginate($perPage));
    }

    /**
     * Afficher un seul produit complet (via ID ou Slug)
     */
    // public function show($idOrSlug): JsonResponse
    // {
    //     $product = Product::where('id', $idOrSlug)
    //         ->orWhere('slug', $idOrSlug)
    //         ->firstOrFail();

    //     return response()->json($product->load(['category', 'variants']));
    // }


    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['category', 'variants']));
    }

    /**
     * Récupérer les produits mis en avant pour la Home
     */
    public function featured(): JsonResponse
    {
        return response()->json(
            Product::where('featured', true)
                ->where('is_active', true)
                ->with(['category', 'variants'])
                ->limit(8)
                ->get()
        );
    }

    /**
     * Créer un nouveau produit et ses variantes optionnelles (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'slug'                  => 'nullable|string|max:255|unique:products,slug',
            'description'           => 'required|string',
            'price'                 => 'required|integer|min:0',
            'old_price'             => 'nullable|integer|min:0',
            'category_id'           => 'required|exists:categories,id',
            'is_active'             => 'sometimes|boolean',
            'featured'              => 'sometimes|boolean',
            'image_path.*'          => 'image|mimes:jpeg,jpg,png,webp|max:4096',

            // Validation des variantes envoyées en même temps que le produit
            'variants'              => 'sometimes|array',
            'variants.*.attributes' => 'required|array',
            'variants.*.price'      => 'nullable|integer|min:0',
            'variants.*.old_price'  => 'nullable|integer|min:0',
            'variants.*.stock'      => 'required|integer|min:0',
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        // Gestion des images
        $paths = [];
        if ($request->hasFile('image_path')) {
            $files = $request->file('image_path');
            $files = is_array($files) ? $files : [$files];

            foreach ($files as $file) {
                if ($file->isValid()) {
                    $path = $file->store('products', 'public');
                    $paths[] = Storage::url($path);
                }
            }
        }
        $validated['image_path'] = $paths;

        // 1. Création du produit principal
        $product = Product::create($validated);

        // 2. Création des variantes associées si présentes
        if (!empty($validated['variants'])) {
            $product->variants()->createMany($validated['variants']);
        }

        return response()->json($product->load(['category', 'variants']), 201);
    }

    /**
     * Mettre à jour un produit et ses variantes via ID ou Slug (Admin)
     */
    public function update(Request $request, $idOrSlug): JsonResponse
    {
        $product = Product::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        $validated = $request->validate([
            'name'                  => 'sometimes|string|max:255',
            'slug'                  => 'sometimes|string|max:255|unique:products,slug,' . $product->id,
            'description'           => 'sometimes|string',
            'price'                 => 'sometimes|integer|min:0',
            'old_price'             => 'nullable|integer|min:0',
            'category_id'           => 'sometimes|exists:categories,id',
            'is_active'             => 'sometimes|boolean',
            'featured'              => 'sometimes|boolean',
            'image_path.*'          => 'image|mimes:jpeg,jpg,png,webp|max:4096',

            // MODIFICATION : Validation poussée pour la mise à jour des variantes
            'variants'              => 'sometimes|array',
            'variants.*.id'         => 'nullable|integer|exists:product_variants,id', // 'nullable' car les nouvelles variantes n'ont pas d'ID
            'variants.*.attributes' => 'required_with:variants|array',
            'variants.*.price'      => 'nullable|integer|min:0',
            'variants.*.old_price'  => 'nullable|integer|min:0',
            'variants.*.stock'      => 'required_with:variants|integer|min:0',
        ]);

        if (isset($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Gestion du remplacement de la galerie d'images
        if ($request->hasFile('image_path')) {
            foreach (($product->image_path ?? []) as $imageUrl) {
                $relativePath = str_replace('/storage/', '', $imageUrl);
                if (Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
            }

            $files = $request->file('image_path');
            $files = is_array($files) ? $files : [$files];

            $newImages = [];
            foreach ($files as $file) {
                if ($file->isValid()) {
                    $path = $file->store('products', 'public');
                    $newImages[] = Storage::url($path);
                }
            }
            $validated['image_path'] = $newImages;
        }

        // MODIFICATION : On encapsule les modifications en base de données dans une Transaction
        DB::transaction(function () use ($product, $validated, $request) {

            // 1. Mise à jour du produit principal
            $product->update($validated);

            // 2. Gestion et synchronisation des variantes
            if ($request->has('variants')) {
                $activeVariantIds = [];

                foreach ($validated['variants'] as $variantData) {
                    if (!empty($variantData['id'])) {
                        // Variante existante : On la met à jour via la relation pour isoler la recherche au produit
                        $variant = $product->variants()->findOrFail($variantData['id']);
                        $variant->update($variantData);
                        $activeVariantIds[] = $variant->id;
                    } else {
                        // Nouvelle variante : On la crée
                        $newVariant = $product->variants()->create($variantData);
                        $activeVariantIds[] = $newVariant->id;
                    }
                }

                // Suppression des variantes qui ne sont plus présentes dans le tableau envoyé par React
                $product->variants()->whereNotIn('id', $activeVariantIds)->delete();
            }
        });

        return response()->json($product->load(['category', 'variants']));
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
            $relativePath = str_replace('/storage/', '', $imageUrl);
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
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
                $relativePath = str_replace('/storage/', '', $imageUrl);
                if (Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
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
}
