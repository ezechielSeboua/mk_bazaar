<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Cloudinary\Cloudinary as CloudinarySDK;

class CategoryController extends Controller
{
    /**
     * Récupérer toutes les catégories actives avec le nombre de produits
     */
    public function index(): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->withCount('products')
            ->get();

        return response()->json($categories);
    }

    /**
     * Créer une nouvelle catégorie (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'image_path'  => 'nullable|image|mimes:jpeg,jpg,png,webp|max:4096',
            'is_active'   => 'sometimes|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if ($request->hasFile('image_path')) {
            $file = $request->file('image_path');
            if ($file->isValid()) {
                $validated['image_path'] = $this->cloudinaryUpload($file, 'categories');
            }
        }

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    /**
     * Afficher une seule catégorie via son ID ou son Slug
     */
    public function show(string $idOrSlug): JsonResponse
    {
        // Recherche flexible par ID ou par Slug
        $category = Category::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        $category->loadCount('products');

        return response()->json($category);
    }

    /**
     * Mettre à jour une catégorie (Admin)
     */
    public function update(Request $request, string $idOrSlug): JsonResponse
    {
        // 1. On récupère d'abord la catégorie pour avoir son ID sous la main
        $category = Category::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // 2. On valide les données (en injectant l'ID pour la règle unique)
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'image_path'  => 'nullable|image|mimes:jpeg,jpg,png,webp|max:4096',
            'is_active'   => 'sometimes|boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // 3. Gestion du remplacement de l'image
        if ($request->hasFile('image_path')) {
            if ($category->image_path) {
                $this->cloudinaryDelete($category->image_path);
            }

            $file = $request->file('image_path');
            if ($file->isValid()) {
                $validated['image_path'] = $this->cloudinaryUpload($file, 'categories');
            }
        }

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * Supprimer une catégorie (Admin)
     */
    public function destroy(string $idOrSlug): JsonResponse
    {
        // On récupère la catégorie par son ID ou son Slug
        $category = Category::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // Sécurité produits
        if ($category->products()->count() > 0) {
            return response()->json([
                'error' => 'Conflict',
                'message' => 'Impossible de supprimer cette catégorie car elle contient des produits actifs.'
            ], 409);
        }

        // Nettoyage de l'image
        if ($category->image_path) {
            $this->cloudinaryDelete($category->image_path);
        }

        $category->delete();

        return response()->json([
            'message' => 'La catégorie a été supprimée avec succès.'
        ]);
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
        if (preg_match('/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/', $url, $matches)) {
            $this->cloudinary()->uploadApi()->destroy($matches[1]);
        }
    }
}