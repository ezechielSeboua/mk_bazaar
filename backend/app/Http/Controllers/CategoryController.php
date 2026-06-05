<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Récupérer toutes les catégories avec le nombre de produits (Optimisé)
     */
    public function index(): JsonResponse
    {
        // Utilisation de withCount au lieu de with('products') pour ne charger 
        // que le nombre de produits, ce qui booste drastiquement les performances.
        $categories = Category::withCount('products')->get();

        return response()->json($categories);
    }

    /**
     * Créer une nouvelle catégorie (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
        ]);

        // Génération propre et automatique du slug unique
        $validated['slug'] = Str::slug($validated['name']);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    /**
     * Afficher une seule catégorie via son ID ou son Slug (Public/Admin)
     */
    public function show(string $slugOrId): JsonResponse
    {
        $category = Category::where('id', $slugOrId)
            ->orWhere('slug', $slugOrId)
            ->firstOrFail();

        return response()->json($category);
    }

    /**
     * Mettre à jour une catégorie (Admin)
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * Supprimer une catégorie (Admin)
     */
    public function destroy(Category $category): JsonResponse
    {
        // Sécurité : Empêche la suppression si la catégorie contient des produits
        if ($category->products()->count() > 0) {
            return response()->json([
                'error' => 'Conflict',
                'message' => 'Impossible de supprimer cette catégorie car elle contient des produits actifs.'
            ], 409); // Code 409 : Conflit de ressources
        }

        $category->delete();

        return response()->json([
            'message' => 'La catégorie a été supprimée avec succès.'
        ]);
    }
}