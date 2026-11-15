<?php

namespace App\Http\Controllers;

use App\Models\ProductType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Types de produit (écran « Attributs et types »).
 */
class ProductTypeController extends Controller
{
    /** Nombre maximal d'attributs de variation par type. */
    private const MAX_ATTRIBUTES = 3;

    public function index(): JsonResponse
    {
        return response()->json(
            ProductType::with('variationAttributes.values')
                ->withCount('categories')
                ->orderBy('name')
                ->get()
        );
    }

    public function show(ProductType $productType): JsonResponse
    {
        return response()->json(
            $productType->load('variationAttributes.values')->loadCount('categories')
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $type = DB::transaction(function () use ($validated) {
            $type = ProductType::create([
                'name'           => $validated['name'],
                'slug'           => Str::slug($validated['name']),
                'guide_label'    => $validated['guide_label'] ?? null,
                'show_as_filter' => $validated['show_as_filter'] ?? true,
            ]);
            $this->syncAttributes($type, $validated['attribute_ids'] ?? []);

            return $type;
        });

        return response()->json($type->load('variationAttributes.values'), 201);
    }

    public function update(Request $request, ProductType $productType): JsonResponse
    {
        $validated = $request->validate($this->rules($productType));

        DB::transaction(function () use ($productType, $validated) {
            $data = collect($validated)->only(['name', 'guide_label', 'show_as_filter'])->all();
            if (isset($data['name'])) {
                $data['slug'] = Str::slug($data['name']);
            }
            $productType->update($data);

            if (array_key_exists('attribute_ids', $validated)) {
                $this->syncAttributes($productType, $validated['attribute_ids'] ?? []);
            }
        });

        return response()->json($productType->load('variationAttributes.values'));
    }

    public function destroy(ProductType $productType): JsonResponse
    {
        if ($productType->categories()->exists()) {
            return response()->json([
                'error'   => 'Conflict',
                'message' => 'Ce type est utilisé par des catégories : retirez-le d\'abord de ces catégories.',
            ], 409);
        }

        $productType->delete();

        return response()->json(['message' => 'Type de produit supprimé.']);
    }

    private function rules(?ProductType $type = null): array
    {
        return [
            'name'            => [$type ? 'sometimes' : 'required', 'string', 'max:100', Rule::unique('product_types', 'name')->ignore($type?->id)],
            'guide_label'     => 'nullable|string|max:100',
            'show_as_filter'  => 'sometimes|boolean',
            'attribute_ids'   => 'sometimes|nullable|array|max:' . self::MAX_ATTRIBUTES,
            'attribute_ids.*' => 'integer|distinct|exists:product_attributes,id',
        ];
    }

    /** Les attributs sont enregistrés dans l'ordre reçu (attribut 1, attribut 2…). */
    private function syncAttributes(ProductType $type, array $attributeIds): void
    {
        $sync = [];
        foreach (array_values($attributeIds) as $position => $id) {
            $sync[$id] = ['position' => $position];
        }
        $type->variationAttributes()->sync($sync);
    }
}
