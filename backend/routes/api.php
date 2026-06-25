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

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Routes Publiques (Catalogue, SEO & Commandes) ---
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']); 

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']); 
Route::get('/products/{product}', [ProductController::class, 'show']);    

// Gestion des variantes (Lecture publique pour l'application React)
Route::get('/variants', [ProductVariantController::class, 'index']);
Route::get('/variants/{productVariant}', [ProductVariantController::class, 'show']);

// Tunnel d'achat public
Route::post('/orders', [OrderController::class, 'store']);


// Configuration de l'application (Hero, Carrousel, etc.)
Route::get('/settings/{key}', [AppSettingController::class, 'getByKey']);

// Authentification
Route::post('/auth/register', [UserAuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/login',    [UserAuthController::class, 'login'])->middleware('throttle:5,1');

// --- Routes Authentifiées (utilisateur connecté) ---
Route::middleware('auth:api')->group(function () {
    Route::get('/auth/me',          [UserAuthController::class, 'me']);
    Route::post('/auth/logout',     [UserAuthController::class, 'logout']);
    Route::get('/orders/my',        [OrderController::class, 'myOrders']);
    Route::put('/profile',          [UserAuthController::class, 'updateProfile']);
    Route::post('/profile/avatar',  [UserAuthController::class, 'updateAvatar']);
});

// --- Routes Admin (authentifié + is_admin) ---
Route::middleware(['auth:api', 'admin'])->group(function () {

    // Gestion des Catégories
    Route::post('/categories', [CategoryController::class, 'store']);
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