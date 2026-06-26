<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Frontend React app will be served through Inertia.js
|
| Pages JSX disponibles :
|   resources/js/pages/Welcome.jsx
|   resources/js/pages/Home.jsx
|   resources/js/pages/ProductList.jsx
|   resources/js/pages/ProductDetail.jsx
|   resources/js/pages/Contact.jsx
|   resources/js/pages/About.jsx
|   resources/js/pages/Dashboard.jsx
|   resources/js/pages/Admin/Login.jsx
|   resources/js/pages/Admin/Dashboard.jsx
|   resources/js/pages/Admin/ProductList.jsx
|   resources/js/pages/Admin/CategoryList.jsx
|   resources/js/pages/Auth/Login.jsx
|   resources/js/pages/Auth/Register.jsx
|   resources/js/pages/Auth/ForgotPassword.jsx
|   resources/js/pages/Auth/ResetPassword.jsx
|   resources/js/pages/Auth/ConfirmPassword.jsx
|   resources/js/pages/Auth/VerifyEmail.jsx
|   resources/js/pages/Profile/Edit.jsx
*/

// ─── Health check ───────────────────────────────────────────────────
Route::get('/', function () {
    return response()->json(['status' => 'ok']);
})->name('home');

Route::get('/welcome', function () {
    return inertia('Welcome');
})->name('welcome');

Route::get('/products', function () {
    return inertia('ProductList');
})->name('products');

Route::get('/products/{slug}', function ($slug) {
    return inertia('ProductDetail', ['slug' => $slug]);
})->name('product.detail');

Route::get('/contact', function () {
    return inertia('Contact');
})->name('contact');

Route::get('/about', function () {
    return inertia('About');
})->name('about');

// ─── Auth (Breeze) ──────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return inertia('Auth/Login');
    })->name('login');

    Route::get('/register', function () {
        return inertia('Auth/Register');
    })->name('register');

    Route::get('/forgot-password', function () {
        return inertia('Auth/ForgotPassword');
    })->name('password.request');

    Route::get('/reset-password/{token}', function ($token) {
        return inertia('Auth/ResetPassword', ['token' => $token]);
    })->name('password.reset');
});

Route::middleware('auth')->group(function () {
    Route::get('/confirm-password', function () {
        return inertia('Auth/ConfirmPassword');
    })->name('password.confirm');

    Route::get('/verify-email', function () {
        return inertia('Auth/VerifyEmail');
    })->name('verification.notice');

    // ─── Dashboard utilisateur ──────────────────────────────────────
    Route::get('/dashboard', function () {
        return inertia('Dashboard');
    })->name('dashboard');

    // ─── Profil ─────────────────────────────────────────────────────
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ─── Admin ──────────────────────────────────────────────────────────
Route::get('/admin/login', function () {
    return inertia('Admin/Login');
})->name('admin.login');

Route::middleware('auth')->group(function () {
    Route::get('/admin', function () {
        return inertia('Admin/Dashboard');
    })->name('admin.dashboard');

    Route::get('/admin/products', function () {
        return inertia('Admin/ProductList');
    })->name('admin.products');

    Route::get('/admin/categories', function () {
        return inertia('Admin/CategoryList');
    })->name('admin.categories');
});
