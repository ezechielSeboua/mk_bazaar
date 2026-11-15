<?php

namespace Tests\Feature;

use App\Models\AnnouncementBar;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\CatalogStructureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Backend de la maquette « Retail premium » : catégories et menu, types et
 * attributs, promotions et prix, commandes (statuts, remises), offres,
 * bandeaux et mot de passe.
 */
class RetailRedesignBackendTest extends TestCase
{
    use RefreshDatabase;

    private Category $bijoux;
    private Category $colliers;
    private Product $collier;
    private ProductVariant $collierDore45;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogStructureSeeder::class);

        $this->bijoux   = Category::create(['name' => 'Bijoux et montres', 'slug' => 'bijoux-et-montres', 'show_in_menu' => true]);
        $this->colliers = Category::create([
            'name'            => 'Colliers et chaînes',
            'slug'            => 'colliers-et-chaines',
            'parent_id'       => $this->bijoux->id,
            'product_type_id' => ProductType::where('slug', 'collier')->value('id'),
        ]);

        $this->collier = Product::create([
            'name' => 'Collier Perles Artisan', 'slug' => 'collier-perles-artisan', 'description' => 'Collier',
            'price' => 8500, 'category_id' => $this->colliers->id, 'is_active' => true,
        ]);
        $this->collierDore45 = $this->collier->variants()->create([
            'attributes' => ['finition' => 'Doré', 'longueur' => '45 cm'], 'stock' => 5,
        ]);

        Setting::create(['key' => 'shipping_zones', 'value' => [['name' => 'Abidjan, Cocody', 'price' => 2000]]]);
    }

    private function adminHeaders(): array
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@test.ci', 'password' => Hash::make('secret123')]);
        $admin->forceFill(['is_admin' => true])->save();

        return ['Authorization' => 'Bearer ' . JWTAuth::fromUser($admin)];
    }

    private function promotion(array $attributes): Promotion
    {
        return Promotion::create($attributes + [
            'name' => 'Promo', 'discount_type' => 'percentage', 'discount_value' => 20,
            'target_type' => 'category', 'is_active' => true,
        ]);
    }

    // ---------------------------------------------------------------- Catégories

    public function test_categories_count_subcategory_products_and_menu_overflows_into_more(): void
    {
        $response = $this->getJson('/api/categories')->assertOk();
        $parent = collect($response->json())->firstWhere('id', $this->bijoux->id);
        $this->assertSame(0, $parent['products_count']);
        $this->assertSame(1, $parent['total_products_count']);

        foreach (range(1, 6) as $i) {
            Category::create(['name' => "Cat {$i}", 'slug' => "cat-{$i}", 'show_in_menu' => true, 'menu_order' => $i]);
        }

        $menu = $this->getJson('/api/categories/menu')->assertOk()->json();
        // 7 catégories dans le menu (Bijoux + 6) : MENU_LIMIT affichées, le reste dans « Plus »
        $this->assertCount(Category::MENU_LIMIT, $menu['items']);
        $this->assertCount(7 - Category::MENU_LIMIT, $menu['more']);
        $this->assertSame('Colliers et chaînes', $menu['items'][0]['children'][0]['name']);
    }

    public function test_only_one_level_of_subcategories_is_allowed(): void
    {
        $this->postJson('/api/categories', ['name' => 'Perles', 'parent_id' => $this->colliers->id], $this->adminHeaders())
            ->assertStatus(422)
            ->assertJsonValidationErrors('parent_id');
    }

    // ---------------------------------------------------------- Types et attributs

    public function test_variants_must_match_the_category_product_type(): void
    {
        $this->putJson("/api/products/{$this->collier->id}", [
            'variants' => [['attributes' => ['finition' => 'Doré', 'taille' => 'M'], 'stock' => 1]],
        ], $this->adminHeaders())
            ->assertStatus(422)
            ->assertJsonValidationErrors('variants.0.attributes');
    }

    public function test_clear_variants_flag_removes_all_variants(): void
    {
        $this->putJson("/api/products/{$this->collier->id}", ['clear_variants' => true, 'stock' => 4], $this->adminHeaders())
            ->assertOk();

        $this->assertSame(0, $this->collier->variants()->count());
        $this->assertSame(4, $this->collier->fresh()->stock);
    }

    public function test_renaming_an_attribute_value_updates_variants(): void
    {
        $finition = ProductAttribute::where('slug', 'finition')->with('values')->first();
        $values = $finition->values->map(fn ($v) => [
            'id' => $v->id, 'hex' => $v->hex, 'value' => $v->value === 'Doré' ? 'Or jaune' : $v->value,
        ])->all();

        $this->putJson("/api/attributes/{$finition->id}", ['values' => $values], $this->adminHeaders())->assertOk();

        $this->assertSame('Or jaune', $this->collierDore45->fresh()->attributes['finition']);
    }

    public function test_an_attribute_value_used_by_variants_cannot_be_removed(): void
    {
        $finition = ProductAttribute::where('slug', 'finition')->with('values')->first();
        $withoutDore = $finition->values->reject(fn ($v) => $v->value === 'Doré')
            ->map(fn ($v) => ['id' => $v->id, 'value' => $v->value])->values()->all();

        $this->putJson("/api/attributes/{$finition->id}", ['values' => $withoutDore], $this->adminHeaders())
            ->assertStatus(409);
    }

    // ------------------------------------------------------------ Prix et promos

    public function test_category_promotion_applies_to_subcategory_products_and_best_one_wins(): void
    {
        $this->promotion(['name' => 'Bijoux −20 %', 'category_id' => $this->bijoux->id]);
        $this->promotion(['name' => 'Petit geste', 'discount_type' => 'fixed', 'discount_value' => 500, 'category_id' => $this->bijoux->id]);
        $this->promotion(['name' => 'Expirée', 'discount_value' => 50, 'category_id' => $this->bijoux->id, 'ends_at' => now()->subDay()]);

        $pricing = $this->getJson('/api/products/collier-perles-artisan')->assertOk()->json('variants.0.pricing');

        $this->assertSame(8500, $pricing['base_price']);
        $this->assertSame(6800, $pricing['final_price']);
        $this->assertSame(20, $pricing['discount_percent']);
        $this->assertSame('Bijoux −20 %', $pricing['promotion']['name']);
    }

    public function test_product_endpoint_exposes_the_effective_product_type(): void
    {
        $type = $this->getJson('/api/products/collier-perles-artisan')->json('product_type');

        $this->assertSame('Collier', $type['name']);
        $this->assertSame(['finition', 'longueur'], array_column($type['variation_attributes'], 'slug'));
    }

    public function test_offers_list_discounted_products_and_the_next_operation(): void
    {
        $this->promotion(['name' => 'Bijoux −20 %', 'category_id' => $this->bijoux->id]);
        $this->promotion(['name' => 'Soldes', 'category_id' => $this->bijoux->id, 'starts_at' => now()->addMonth()]);

        $offers = $this->getJson('/api/offers')->assertOk()->json();

        $this->assertSame(['Collier Perles Artisan'], array_column($offers['products'], 'name'));
        $this->assertSame('Soldes', $offers['upcoming']['name']);
    }

    public function test_percentage_promotions_are_capped_at_90(): void
    {
        $this->postJson('/api/promotions', [
            'name' => 'Trop', 'discount_type' => 'percentage', 'discount_value' => 95,
            'target_type' => 'category', 'category_id' => $this->bijoux->id,
        ], $this->adminHeaders())->assertStatus(422)->assertJsonValidationErrors('discount_value');
    }

    // ------------------------------------------------------------------ Commandes

    public function test_order_freezes_server_side_discount(): void
    {
        $promo = $this->promotion(['name' => 'Bijoux −20 %', 'category_id' => $this->bijoux->id]);

        $order = $this->postJson('/api/orders', [
            'customer_name' => 'Marie', 'customer_phone' => '0700000000',
            'delivery_location' => 'Abidjan, Cocody', 'detailed_address' => 'Angré',
            'items' => [['product_variant_id' => $this->collierDore45->id, 'quantity' => 2]],
        ])->assertCreated()->json('order');

        $this->assertSame('pending', $order['status']);
        $this->assertSame(1700 * 2, $order['discount_total']);
        $this->assertSame(6800 * 2 + 2000, $order['total_price']);
        $this->assertSame(6800, $order['items'][0]['price']);
        $this->assertSame(1700, $order['items'][0]['discount']);
        $this->assertSame($promo->id, $order['items'][0]['promotion_id']);
        $this->assertSame(3, $this->collierDore45->fresh()->stock);
    }

    public function test_inactive_variants_cannot_be_ordered(): void
    {
        $this->collierDore45->update(['is_active' => false]);

        $this->postJson('/api/orders', [
            'customer_name' => 'Marie', 'customer_phone' => '0700000000',
            'delivery_location' => 'Abidjan, Cocody', 'detailed_address' => 'Angré',
            'items' => [['product_variant_id' => $this->collierDore45->id, 'quantity' => 1]],
        ])->assertStatus(400);
    }

    public function test_order_statuses_follow_the_design_flow(): void
    {
        $headers = $this->adminHeaders();
        $order = Order::create([
            'customer_name' => 'Marie', 'customer_phone' => '07', 'order_number' => 'MK-TEST-1',
            'delivery_location' => 'Abidjan, Cocody', 'detailed_address' => 'Angré', 'status' => 'pending',
            'total_price' => 17000,
        ]);
        $order->items()->create(['product_id' => $this->collier->id, 'product_variant_id' => $this->collierDore45->id, 'quantity' => 2, 'price' => 8500]);

        $this->putJson("/api/orders/{$order->id}", ['status' => 'shipping'], $headers)->assertStatus(422);

        foreach (['confirmed', 'shipping', 'cancelled'] as $status) {
            $this->putJson("/api/orders/{$order->id}", ['status' => $status], $headers)->assertOk();
        }
        $this->assertSame(7, $this->collierDore45->fresh()->stock); // stock rendu à l'annulation

        $this->putJson("/api/orders/{$order->id}", ['status' => 'confirmed'], $headers)->assertOk();
        $this->putJson("/api/orders/{$order->id}", ['status' => 'shipping'], $headers)->assertOk();
        $this->putJson("/api/orders/{$order->id}", ['status' => 'delivered'], $headers)->assertOk();

        $metrics = $this->getJson('/api/orders', $headers)->json('metrics');
        $this->assertSame(1, $metrics['counts']['delivered']);
        $this->assertSame(17000, $metrics['total_revenue_fcfa']);
    }

    // ------------------------------------------------------- Bandeaux et compte

    public function test_announcement_bars_respect_dates_and_reject_unsafe_links(): void
    {
        AnnouncementBar::create(['message' => 'Visible', 'link' => '/offres']);
        AnnouncementBar::create(['message' => 'Programmé', 'starts_at' => now()->addWeek()]);

        $this->assertSame(['Visible'], array_column($this->getJson('/api/announcement-bars')->json(), 'message'));

        $this->postJson('/api/announcement-bars', ['message' => 'X', 'link' => 'javascript:alert(1)'], $this->adminHeaders())
            ->assertStatus(422)->assertJsonValidationErrors('link');
    }

    public function test_password_change_requires_current_password_and_is_dated(): void
    {
        $user = User::create(['name' => 'Marie', 'email' => 'marie@test.ci', 'password' => Hash::make('ancienmotdepasse')]);
        $headers = ['Authorization' => 'Bearer ' . JWTAuth::fromUser($user)];

        $this->putJson('/api/profile/password', [
            'current_password' => 'mauvais', 'password' => 'nouveaumotdepasse', 'password_confirmation' => 'nouveaumotdepasse',
        ], $headers)->assertStatus(422);

        $this->putJson('/api/profile/password', [
            'current_password' => 'ancienmotdepasse', 'password' => 'nouveaumotdepasse', 'password_confirmation' => 'nouveaumotdepasse',
        ], $headers)->assertOk()->assertJsonPath('password_changed_at', fn ($v) => $v !== null);

        $this->assertTrue(Hash::check('nouveaumotdepasse', $user->fresh()->password));
    }
}
