<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductVariantController extends Controller
{
    /**
     * Récupérer toutes les variantes (Optionnel : filtrées par produit)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductVariant::query();

        // Permet de récupérer facilement toutes les variantes d'un produit précis
        // Exemple : /api/variants?product_id=5
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        return response()->json($query->get());
    }

    /**
     * Créer une nouvelle variante pour un produit (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'attributes' => 'required|array', // Ex: {"couleur": "Noir", "taille": "XL"}
            'price'      => 'nullable|integer|min:0', // Si nul, prendra le prix du produit parent
            'old_price'  => 'nullable|integer|min:0',
            'stock'      => 'required|integer|min:0',
        ]);

        $variant = ProductVariant::create($validated);

        return response()->json($variant, 201);
    }

    /**
     * Afficher une variante spécifique via son ID
     */
    public function show(ProductVariant $productVariant): JsonResponse
    {
        // On charge la relation parent au cas où le front ait besoin des infos globales du produit
        return response()->json($productVariant->load('product'));
    }

    /**
     * Mettre à jour une variante existante (Admin)
     */
    public function update(Request $request, ProductVariant $productVariant): JsonResponse
    {
        $validated = $request->validate([
            'attributes' => 'sometimes|array',
            'price'      => 'nullable|integer|min:0',
            'old_price'  => 'nullable|integer|min:0',
            'stock'      => 'sometimes|integer|min:0',
        ]);

        $productVariant->update($validated);

        return response()->json($productVariant);
    }

    /**
     * Supprimer une variante (Admin)
     */
    public function destroy(ProductVariant $productVariant): JsonResponse
    {
        $productVariant->delete();

        return response()->json([
            'message' => 'La variante de produit a été supprimée avec succès.'
        ]);
    }
}