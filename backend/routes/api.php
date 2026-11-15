<?php

use App\Http\Controllers\AppSettingController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductVariantController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\UserAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrderReportController;
use App\Http\Controllers\ProductTypeController;
use App\Http\Controllers\ProductAttributeController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\AnnouncementBarController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Routes Publiques (Catalogue, SEO & Commandes) ---
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/menu', [CategoryController::class, 'menu']);
Route::get('/categories/{category}', [CategoryController::class, 'show']); 

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']); 
Route::get('/products/{product}', [ProductController::class, 'show']);    

// Types de produit et attributs (options des fiches, filtres du catalogue)
Route::get('/product-types', [ProductTypeController::class, 'index']);
Route::get('/product-types/{productType}', [ProductTypeController::class, 'show']);
Route::get('/attributes', [ProductAttributeController::class, 'index']);

// Offres en cours et bandeaux d'annonce
Route::get('/offers', [PromotionController::class, 'offers']);
Route::get('/announcement-bars', [AnnouncementBarController::class, 'index']);

// Gestion des variantes (Lecture publique pour l'application React)
Route::get('/variants', [ProductVariantController::class, 'index']);
Route::get('/variants/{productVariant}', [ProductVariantController::class, 'show']);

// Tunnel d'achat public — rate limited to prevent stock DoS
Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:30,1');


// Configuration de l'application (Hero, Carrousel, etc.)
Route::get('/settings/{key}', [AppSettingController::class, 'getByKey']);

// Authentification — composite rate limit: 5/min par IP + 3/min par email
Route::post('/auth/register', [UserAuthController::class, 'register'])->middleware('throttle:register');
Route::post('/auth/login',    [UserAuthController::class, 'login'])->middleware('throttle:login');

// --- Routes Authentifiées (utilisateur connecté) ---
Route::middleware('auth:api')->group(function () {
    Route::get('/auth/me',          [UserAuthController::class, 'me']);
    Route::post('/auth/logout',     [UserAuthController::class, 'logout']);
    Route::post('/auth/refresh',    [UserAuthController::class, 'refresh']);
    Route::get('/orders/my',        [OrderController::class, 'myOrders']);
    Route::put('/profile',          [UserAuthController::class, 'updateProfile']);
    Route::put('/profile/password', [UserAuthController::class, 'updatePassword']);
    Route::post('/profile/avatar',  [UserAuthController::class, 'updateAvatar']);
});

// --- Routes Admin (authentifié + is_admin) ---
Route::middleware(['auth:api', 'admin'])->group(function () {

    // Gestion des Catégories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/reorder', [CategoryController::class, 'reorder']); // avant /categories/{category}
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Gestion des Produits
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::post('/products/bulk-delete', [ProductController::class, 'bulkDelete']);

    // Gestion des Variantes de Produits
    Route::post('/variants', [ProductVariantController::class, 'store']);
    Route::put('/variants/{productVariant}', [ProductVariantController::class, 'update']);
    Route::delete('/variants/{productVariant}', [ProductVariantController::class, 'destroy']);

    // Types de produit et attributs
    Route::post('/product-types', [ProductTypeController::class, 'store']);
    Route::put('/product-types/{productType}', [ProductTypeController::class, 'update']);
    Route::delete('/product-types/{productType}', [ProductTypeController::class, 'destroy']);
    Route::post('/attributes', [ProductAttributeController::class, 'store']);
    Route::put('/attributes/{productAttribute}', [ProductAttributeController::class, 'update']);
    Route::delete('/attributes/{productAttribute}', [ProductAttributeController::class, 'destroy']);

    // Promotions
    Route::get('/promotions', [PromotionController::class, 'index']);
    Route::post('/promotions', [PromotionController::class, 'store']);
    Route::get('/promotions/{promotion}', [PromotionController::class, 'show']);
    Route::put('/promotions/{promotion}', [PromotionController::class, 'update']);
    Route::delete('/promotions/{promotion}', [PromotionController::class, 'destroy']);

    // Bandeaux d'annonce
    Route::get('/announcement-bars/all', [AnnouncementBarController::class, 'all']);
    Route::post('/announcement-bars', [AnnouncementBarController::class, 'store']);
    Route::put('/announcement-bars/reorder', [AnnouncementBarController::class, 'reorder']); // avant /{announcementBar}
    Route::put('/announcement-bars/{announcementBar}', [AnnouncementBarController::class, 'update']);
    Route::delete('/announcement-bars/{announcementBar}', [AnnouncementBarController::class, 'destroy']);

    // Gestion des Utilisateurs
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // Gestion des Commandes (Back-office)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);

    // Statistiques & Rapports Dashboard
    Route::get('/stats/advanced', [OrderReportController::class, 'getAdvancedStats']);

    // Configuration Admin
    Route::post('/settings/upload-image', [AppSettingController::class, 'uploadImage']);
    Route::post('/settings/{key}', [AppSettingController::class, 'updateByKey']);
});