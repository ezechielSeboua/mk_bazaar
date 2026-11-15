<?php

namespace App\Http\Controllers;

use App\Models\ProductAttribute;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Attributs de variation et leurs valeurs (écran « Attributs et types »).
 *
 * Les variantes stockent les valeurs en clair dans leur JSON `attributes`
 * (clé = slug de l'attribut). Ce contrôleur garde ces données cohérentes :
 * renommer une valeur met à jour les variantes, et une valeur ou un attribut
 * encore utilisé ne peut pas être supprimé.
 */
class ProductAttributeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            ProductAttribute::with('values')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:100',
            'slug'           => ['nullable', 'string', 'regex:' . ProductAttribute::SLUG_PATTERN, 'unique:product_attributes,slug'],
            'family'         => ['required', Rule::in(ProductAttribute::FAMILIES)],
            ...$this->valueRules(),
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name'], '_');
        if (!preg_match(ProductAttribute::SLUG_PATTERN, $slug) || ProductAttribute::where('slug', $slug)->exists()) {
            return response()->json([
                'message' => 'Impossible de générer un identifiant pour cet attribut : précisez un « slug ».',
                'errors'  => ['slug' => ['Identifiant invalide ou déjà utilisé.']],
            ], 422);
        }

        $attribute = DB::transaction(function () use ($validated, $slug) {
            $attribute = ProductAttribute::create([
                'name'   => $validated['name'],
                'slug'   => $slug,
                'family' => $validated['family'],
            ]);
            foreach (array_values($validated['values'] ?? []) as $position => $value) {
                $attribute->values()->create([
                    'value'      => $value['value'],
                    'hex'        => $value['hex'] ?? null,
                    'sort_order' => $position,
                ]);
            }

            return $attribute;
        });

        return response()->json($attribute->load('values'), 201);
    }

    /**
     * Le slug ne change pas après création : c'est la clé stockée dans les variantes.
     * `values` remplace la liste complète (ordre compris) ; une valeur existante
     * est identifiée par son `id`.
     */
    public function update(Request $request, ProductAttribute $productAttribute): JsonResponse
    {
        $validated = $request->validate([
            'name'   => 'sometimes|string|max:100',
            'family' => ['sometimes', Rule::in(ProductAttribute::FAMILIES)],
            ...$this->valueRules(),
            'values.*.id' => 'nullable|integer',
        ]);

        $slug     = $productAttribute->slug;
        $existing = $productAttribute->values()->get()->keyBy('id');

        if (array_key_exists('values', $validated)) {
            $keptIds = collect($validated['values'] ?? [])->pluck('id')->filter()->map(fn ($id) => (int) $id);

            $unknown = $keptIds->reject(fn ($id) => $existing->has($id));
            if ($unknown->isNotEmpty()) {
                return response()->json(['message' => 'Valeur inconnue pour cet attribut.'], 422);
            }

            $removed = $existing->keys()->diff($keptIds);
            foreach ($removed as $id) {
                if ($this->valueInUse($slug, $existing[$id]->value)) {
                    return response()->json([
                        'error'   => 'Conflict',
                        'message' => "La valeur « {$existing[$id]->value} » est utilisée par des variantes : elle ne peut pas être supprimée.",
                    ], 409);
                }
            }
        }

        DB::transaction(function () use ($productAttribute, $validated, $existing, $slug) {
            $productAttribute->update(collect($validated)->only(['name', 'family'])->all());

            if (!array_key_exists('values', $validated)) {
                return;
            }

            $keptIds = [];
            foreach (array_values($validated['values'] ?? []) as $position => $data) {
                $id = isset($data['id']) ? (int) $data['id'] : null;

                if ($id && $existing->has($id)) {
                    $value = $existing[$id];
                    if ($value->value !== $data['value']) {
                        // Renommage : les variantes suivent.
                        ProductVariant::where("attributes->{$slug}", $value->value)
                            ->update(["attributes->{$slug}" => $data['value']]);
                    }
                    $value->update([
                        'value'      => $data['value'],
                        'hex'        => $data['hex'] ?? null,
                        'sort_order' => $position,
                    ]);
                    $keptIds[] = $id;
                } else {
                    $keptIds[] = $productAttribute->values()->create([
                        'value'      => $data['value'],
                        'hex'        => $data['hex'] ?? null,
                        'sort_order' => $position,
                    ])->id;
                }
            }

            $productAttribute->values()->whereNotIn('id', $keptIds)->delete();
        });

        return response()->json($productAttribute->load('values'));
    }

    public function destroy(ProductAttribute $productAttribute): JsonResponse
    {
        if ($productAttribute->productTypes()->exists()) {
            return response()->json([
                'error'   => 'Conflict',
                'message' => 'Cet attribut est utilisé par un type de produit : retirez-le d\'abord du type.',
            ], 409);
        }

        if (ProductVariant::whereNotNull("attributes->{$productAttribute->slug}")->exists()) {
            return response()->json([
                'error'   => 'Conflict',
                'message' => 'Cet attribut est utilisé par des variantes : il ne peut pas être supprimé.',
            ], 409);
        }

        $productAttribute->delete();

        return response()->json(['message' => 'Attribut supprimé.']);
    }

    private function valueRules(): array
    {
        return [
            'values'         => 'sometimes|nullable|array|max:100',
            'values.*.value' => 'required|string|max:100|distinct',
            'values.*.hex'   => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }

    private function valueInUse(string $slug, string $value): bool
    {
        return ProductVariant::where("attributes->{$slug}", $value)->exists();
    }
}
