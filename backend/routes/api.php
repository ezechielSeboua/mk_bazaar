<?php

use App\Http\Controllers\AppSettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
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
Route::get('/categories/{slugOrId}', [CategoryController::class, 'show']); // Nouvelle route publique pour le détail d'une catégorie

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);

// Configuration de l'application (Hero, Carrousel, etc.)
Route::get('/settings/{key}', [AppSettingController::class, 'getByKey']);

// Authentification
Route::post('/auth/login', [UserAuthController::class, 'login']);
Route::post('/auth/logout', [UserAuthController::class, 'logout']);


// --- Routes Sécurisées (Espace Admin) ---
Route::middleware('auth:api')->group(function () {

    Route::get('/auth/me', [UserAuthController::class, 'me']);

    // Gestion des Catégories (Liaison automatique par slug)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Gestion des Produits
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::post('/products/bulk-delete', [ProductController::class, 'bulkDelete']);

    // Gestion des Utilisateurs
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // Gestion des Commandes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);

    // Statistiques & Rapports Dashboard
    Route::get('/stats/advanced', [OrderReportController::class, 'getAdvancedStats']);

    // Configuration Admin
    Route::post('/settings/{key}', [AppSettingController::class, 'updateByKey']);
});
