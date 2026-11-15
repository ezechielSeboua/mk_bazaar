<?php

namespace Database\Seeders;

use App\Models\AnnouncementBar;
use App\Models\Category;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Contenu de démonstration pour tester la boutique : promotions (catégorie,
 * produits, variante, programmée), bandeaux d'annonce, bannière d'accueil et
 * carrousel avec les photos du catalogue.
 */
class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $category = fn (string $name) => Category::where('name', $name)->value('id');

        // Promotion sur une catégorie (et ses sous-catégories)
        Promotion::create([
            'name' => 'Bracelets −20 %',
            'discount_type' => Promotion::TYPE_PERCENTAGE,
            'discount_value' => 20,
            'target_type' => Promotion::TARGET_CATEGORY,
            'category_id' => $category('Bracelets'),
            'starts_at' => $now->copy()->subDays(3)->startOfDay(),
            'ends_at' => $now->copy()->addDays(14)->endOfDay(),
        ]);

        // Promotion sur une sélection de produits, montant fixe
        $alliances = Promotion::create([
            'name' => 'Alliances −3 000 FCFA',
            'discount_type' => Promotion::TYPE_FIXED,
            'discount_value' => 3000,
            'target_type' => Promotion::TARGET_PRODUCTS,
            'ends_at' => $now->copy()->addDays(30)->endOfDay(),
        ]);
        $alliances->products()->sync(Product::whereIn('slug', ['alliances-diamantees', 'alliances-rainure-centrale'])->pluck('id'));

        // Promotion sur une seule déclinaison : la chevalière dorée
        $variantPromo = Promotion::create([
            'name' => 'Chevalière dorée −15 %',
            'discount_type' => Promotion::TYPE_PERCENTAGE,
            'discount_value' => 15,
            'target_type' => Promotion::TARGET_VARIANTS,
        ]);
        $chevaliere = Product::where('slug', 'chevaliere-carree')->first();
        $variantPromo->variants()->sync(
            $chevaliere?->variants()->where('attributes->couleur', 'Doré')->pluck('id') ?? []
        );

        // Opération programmée (affichée comme « prochaine opération »)
        $saleStart = $now->copy()->month(12)->day(26)->startOfDay();
        if ($saleStart->lt($now)) {
            $saleStart->addYear();
        }
        Promotion::create([
            'name' => 'Soldes de fin d\'année',
            'discount_type' => Promotion::TYPE_PERCENTAGE,
            'discount_value' => 30,
            'target_type' => Promotion::TARGET_CATEGORY,
            'category_id' => $category('Bagues'),
            'starts_at' => $saleStart,
            'ends_at' => $saleStart->copy()->addDays(15)->endOfDay(),
        ]);

        AnnouncementBar::create([
            'message' => '−20 % sur les bracelets jusqu\'au ' . $now->copy()->addDays(14)->locale('fr')->isoFormat('D MMMM'),
            'link' => '/offres',
            'ends_at' => $now->copy()->addDays(14)->endOfDay(),
            'sort_order' => 0,
        ]);
        AnnouncementBar::create([
            'message' => 'Expédition sous 24 h, Abidjan et intérieur',
            'link' => '/about#livraison',
            'sort_order' => 1,
        ]);

        Setting::updateOrCreate(['key' => 'hero'], ['value' => [
            'badge' => 'Nouvelle collection',
            'title' => 'Bijoux et accessoires,',
            'title_bold' => 'choisis pour durer.',
            'subtitle' => 'Bagues, colliers, bracelets et parures en acier inoxydable, sélectionnés à Abidjan.',
            'cta_text' => 'Découvrir la boutique',
            'cta_link' => '/products',
            'image_url' => CatalogueData::image('colliers-femme/collier-couple-enlace-6'),
        ]]);

        Setting::updateOrCreate(['key' => 'carousel'], ['value' => [
            CatalogueData::image('colliers-homme/collier-onyx-rectangle-2'),
            CatalogueData::image('bracelets-cordon/bracelet-manille-porte'),
            CatalogueData::image('colliers-homme/collier-barre-verticale-2'),
            CatalogueData::image('bagues-homme/anneau-chaine-rotative-duo-1'),
        ]]);

        $this->command?->info('✅ 4 promotions, 2 bandeaux, bannière d\'accueil et carrousel.');
    }
}
