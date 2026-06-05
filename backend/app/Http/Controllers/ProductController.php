<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category']);

        if ($request->filled('category_slug')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category_slug));
        } elseif ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('in_stock')) {
            $query->where('in_stock', $request->boolean('in_stock'));
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

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

    public function show($slug)
    {
        $product = Product::with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($product);
    }

    public function featured()
    {
        return response()->json(
            Product::where('featured', true)->with('category')->limit(8)->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'slug'          => 'nullable|string|max:255',
            'description'   => 'required|string',
            'price'         => 'required|numeric|min:0',
            'category_id'   => 'required|exists:categories,id',
            'featured'      => 'boolean',
            'in_stock'      => 'boolean',
            'image_path.*'  => 'image|mimes:jpeg,jpg,png,webp|max:4096',
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $paths = [];

        if ($request->hasFile('image_path')) {
            $files = $request->file('image_path');

            if (!is_array($files)) {
                $files = [$files];
            }

            foreach ($files as $file) {
                if (!$file->isValid()) continue;

                $path = $file->store('products', 'public');
                $paths[] = Storage::url($path);
            }
        }

        $validated['image_path'] = $paths;

        $product = Product::create($validated);

        return response()->json($product->load('category'), 201);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'featured' => 'sometimes|boolean',
            'in_stock' => 'sometimes|boolean',
            'image_path.*' => 'image|mimes:jpeg,jpg,png,webp|max:4096',
        ]);

        if (isset($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if ($request->hasFile('image_path')) {
            foreach (($product->image_path ?? []) as $imageUrl) {
                $relativePath = str_replace('/storage/', '', $imageUrl);

                if (Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
            }

            $files = $request->file('image_path');

            if (!is_array($files)) {
                $files = [$files];
            }

            $newImages = [];

            foreach ($files as $file) {
                if (!$file->isValid()) {
                    continue;
                }

                $path = $file->store('products', 'public');
                $newImages[] = Storage::url($path);
            }

            $validated['image_path'] = $newImages;
        }

        $product->update($validated);

        return response()->json($product->load('category'));
    }

    public function destroy(Product $product)
    {
        foreach (($product->image_path ?? []) as $imageUrl) {
            $relativePath = str_replace('/storage/', '', $imageUrl);

            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }

    /**
     * Suppression groupée de produits.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:products,id',
        ]);

        $products = Product::whereIn('id', $validated['ids'])->get();

        foreach ($products as $product) {
            // Supprime les images associées
            foreach (($product->image_path ?? []) as $imageUrl) {
                $relativePath = str_replace('/storage/', '', $imageUrl);
                if (Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
            }
            $product->delete();
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']) . ' produit(s) supprimé(s).',
        ]);
    }
}