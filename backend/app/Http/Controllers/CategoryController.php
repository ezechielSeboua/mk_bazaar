<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Cloudinary\Cloudinary as CloudinarySDK;

class CategoryController extends Controller
{
    /**
     * Liste plate des catégories, ordonnée pour l'affichage en arbre.
     *
     * Chaque catégorie expose `parent_id`, son `product_type` et :
     *  - products_count       : produits rattachés directement ;
     *  - total_products_count : produits de la catégorie et de ses sous-catégories.
     *
     * `?all=1` inclut les catégories inactives (admin uniquement).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('productType:id,name,slug')
            ->withCount('products')
            ->orderByRaw('parent_id IS NOT NULL')
            ->orderBy('menu_order')
            ->orderBy('id');

        if (!($request->boolean('all') && $this->requestIsAdmin())) {
            $query->where('is_active', true);
        }

        $categories = $query->get();

        $childTotals = $categories->whereNotNull('parent_id')->groupBy('parent_id')
            ->map(fn ($children) => $children->sum('products_count'));

        $categories->each(fn (Category $c) => $c->setAttribute(
            'total_products_count',
            $c->products_count + ($c->parent_id === null ? (int) ($childTotals[$c->id] ?? 0) : 0)
        ));

        return response()->json($categories->values());
    }

    /**
     * Menu de l'en-tête : catégories principales cochées « Dans le menu », dans
     * l'ordre, avec leurs sous-catégories actives. Au-delà de MENU_LIMIT, les
     * suivantes passent dans `more` (onglet « Plus »).
     */
    public function menu(): JsonResponse
    {
        $categories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->where('show_in_menu', true)
            ->with(['children' => fn ($q) => $q->where('is_active', true)->select('id', 'parent_id', 'name', 'slug', 'image_path', 'menu_order')])
            ->orderBy('menu_order')
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'image_path', 'menu_order']);

        return response()->json([
            'items' => $categories->take(Category::MENU_LIMIT)->values(),
            'more'  => $categories->slice(Category::MENU_LIMIT)->values(),
        ]);
    }

    /**
     * Créer une nouvelle catégorie (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $this->assertValidParent($validated['parent_id'] ?? null);

        $validated['slug'] = Str::slug($validated['name']);

        if ($request->hasFile('image_path')) {
            $file = $request->file('image_path');
            if ($file->isValid()) {
                $validated['image_path'] = $this->cloudinaryUpload($file, 'categories');
            }
        }

        if (!isset($validated['menu_order'])) {
            $validated['menu_order'] = (int) Category::where('parent_id', $validated['parent_id'] ?? null)->max('menu_order') + 1;
        }

        $category = Category::create($validated);

        return response()->json($category->load('productType:id,name,slug'), 201);
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
        $category->load([
            'parent:id,name,slug',
            'children' => fn ($q) => $q->where('is_active', true)->withCount('products'),
            'productType.variationAttributes.values',
            'parent.productType.variationAttributes.values',
        ]);

        // Type effectif (celui du parent si la catégorie n'en a pas)
        $category->setAttribute('effective_product_type', $category->effectiveProductType());

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
        $validated = $request->validate($this->rules($category));

        if (array_key_exists('parent_id', $validated)) {
            $this->assertValidParent($validated['parent_id'], $category);
        }

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

        return response()->json($category->load('productType:id,name,slug'));
    }

    /**
     * Réordonner des catégories sœurs (glisser-déposer du back-office).
     * Reçoit les identifiants dans le nouvel ordre ; ils doivent partager le même parent.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|distinct|exists:categories,id',
        ]);

        $parents = Category::whereIn('id', $validated['ids'])->pluck('parent_id')->unique();
        if ($parents->count() > 1) {
            return response()->json([
                'message' => 'Les catégories à réordonner doivent avoir le même parent.',
            ], 422);
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $position => $id) {
                Category::where('id', $id)->update(['menu_order' => $position]);
            }
        });

        return response()->json(['message' => 'Ordre enregistré.']);
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

        if ($category->children()->exists()) {
            return response()->json([
                'error'   => 'Conflict',
                'message' => 'Impossible de supprimer cette catégorie car elle contient des sous-catégories.',
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

    private function rules(?Category $category = null): array
    {
        $required = $category ? 'sometimes' : 'required';
        $unique   = 'unique:categories,name' . ($category ? ',' . $category->id : '');

        return [
            'name'            => "{$required}|string|max:255|{$unique}",
            'description'     => 'nullable|string',
            'image_path'      => 'nullable|image|mimes:jpeg,jpg,png,webp|max:4096',
            'is_active'       => 'sometimes|boolean',
            'parent_id'       => 'nullable|integer|exists:categories,id',
            'product_type_id' => 'nullable|integer|exists:product_types,id',
            'show_in_menu'    => 'sometimes|boolean',
            'menu_order'      => 'sometimes|integer|min:0|max:65535',
        ];
    }

    /**
     * Un seul niveau d'imbrication : le parent doit être une catégorie principale,
     * différente de la catégorie, et une catégorie qui a des enfants ne peut pas
     * devenir sous-catégorie.
     */
    private function assertValidParent(?int $parentId, ?Category $category = null): void
    {
        if ($parentId === null) {
            return;
        }

        $parent = Category::findOrFail($parentId);

        $error = match (true) {
            $category && $parent->id === $category->id     => 'Une catégorie ne peut pas être son propre parent.',
            $parent->parent_id !== null                     => 'Le parent doit être une catégorie principale.',
            $category && $category->children()->exists()    => 'Cette catégorie a des sous-catégories : elle ne peut pas devenir sous-catégorie.',
            default                                         => null,
        };

        if ($error) {
            abort(response()->json(['message' => $error, 'errors' => ['parent_id' => [$error]]], 422));
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
        if (preg_match('/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/', $url, $matches)) {
            $this->cloudinary()->uploadApi()->destroy($matches[1]);
        }
    }
}
