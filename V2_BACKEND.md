# MK Bazaar — V2 Backend

> Branch : `V2`
> Stack : Laravel 11 · JWT (`tymon/jwt-auth`) · MySQL

---

## Statut global

| # | Tâche | Statut | Fichier(s) |
|---|-------|--------|-----------|
| 1 | Fix CORS (trailing slash) | ✅ Fait | `.env` |
| 2 | Inscription utilisateur | ✅ Fait | `UserAuthController`, `api.php` |
| 3 | Espace client — commandes | ✅ Fait | `OrderController`, `api.php` |
| 4 | Espace client — profil | ✅ Fait | `UserAuthController`, `api.php` |
| 5 | Photo de profil (avatar) | ✅ Fait | `UserAuthController`, `User`, migration |
| 6 | Produits similaires | ⬜ À faire | `ProductController`, `api.php` |
| 7 | Suivi de commande (public) | ⬜ À faire | `OrderController`, `api.php` |

---

## 1. Fix CORS

**Fichier :** `backend/.env`

```env
# Avant (bug)
FRONTEND_URL=http://localhost:5173/

# Après (corrigé)
FRONTEND_URL=http://localhost:5173
```

**Cause :** `config/cors.php` fait une correspondance exacte sur `allowed_origins`.
Le navigateur envoie `Origin: http://localhost:5173` (sans slash) — le trailing slash
cassait la comparaison et déclenchait l'erreur CORS.

---

## 2. Inscription utilisateur

**Route :** `POST /api/auth/register`
**Middleware :** `throttle:5,1` (5 tentatives/minute)
**Fichier :** `app/Http/Controllers/UserAuthController.php`

### Validation
```php
'name'     => 'required|string|max:255',
'email'    => 'required|email|unique:users,email',
'password' => 'required|string|min:8|confirmed',
'phone'    => 'nullable|string|max:20',
```

### Réponse (201)
```json
{
    "token": "eyJ...",
    "token_type": "bearer",
    "user": { "id": 1, "name": "...", "email": "...", "phone": "..." }
}
```

---

## 3. Commandes de l'utilisateur connecté

**Route :** `GET /api/orders/my`
**Middleware :** `auth:api`
**Fichier :** `app/Http/Controllers/OrderController.php`

### Comportement
- Retourne uniquement les commandes de l'utilisateur authentifié (`user_id`)
- Triées par date décroissante (`latest()`)
- Eager loading : `items.variant.product`, `items.product`

### Réponse
```json
[
    {
        "id": 12,
        "order_number": "MK-0012-2026",
        "status": "pending",
        "total_price": 25000,
        "delivery_location": "Cocody",
        "delivery_fee": 1500,
        "created_at": "2026-06-10T...",
        "items": [
            {
                "id": 5,
                "quantity": 2,
                "price": 12500,
                "variant": { "attributes": { "taille": "M" }, "product": { "name": "..." } }
            }
        ]
    }
]
```

---

## 4. Mise à jour du profil

**Route :** `PUT /api/profile`
**Middleware :** `auth:api`
**Fichier :** `app/Http/Controllers/UserAuthController.php`

### Champs modifiables
```php
'name'  => 'sometimes|string|max:255',
'phone' => 'nullable|string|max:20',
```

> L'email et le mot de passe ne sont **pas** modifiables via cette route.
> Le mot de passe est géré par une route dédiée (existante).

### Réponse
Retourne l'objet `User` complet rafraîchi (`$user->fresh()`).

---

## 5. Photo de profil (avatar)

### 5a. Migration

**Fichier :** `database/migrations/2026_06_25_000001_add_avatar_to_users_table.php`

```php
$table->string('avatar')->nullable()->after('phone');
```

Migrée : `php artisan migrate` ✅

### 5b. Modèle User

**Fichier :** `app/Models/User.php`

Ajout de `'avatar'` dans `$fillable` :
```php
protected $fillable = ['name', 'email', 'phone', 'password', 'avatar'];
```

### 5c. Route et contrôleur

**Route :** `POST /api/profile/avatar`
**Middleware :** `auth:api`
**Fichier :** `app/Http/Controllers/UserAuthController.php`

**Validation :**
```php
'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
```

**Logique :**
1. Supprime l'ancien avatar si présent (`Storage::disk('public')->delete()`)
2. Stocke le nouveau dans `storage/app/public/avatars/`
3. Génère l'URL via `Storage::url($path)` → `/storage/avatars/filename.jpg`
4. Met à jour `users.avatar` et retourne `$user->fresh()`

**Lien symbolique :** `php artisan storage:link` exécuté ✅

---

## 6. Produits similaires ⬜

**Route à créer :** `GET /api/products/{slug}/similar`
**Fichier :** `app/Http/Controllers/ProductController.php`

### Spécification
- Route publique (pas d'auth)
- Paramètre : `slug` du produit courant
- Retourne : 4 produits actifs (`is_active = 1`) de la même catégorie
- Exclut : le produit courant
- Tri suggéré : `inRandomOrder()` ou `latest()`

```php
public function similar(Product $product): JsonResponse
{
    $similar = Product::where('category_id', $product->category_id)
        ->where('id', '!=', $product->id)
        ->where('is_active', 1)
        ->with(['category', 'variants'])
        ->inRandomOrder()
        ->limit(4)
        ->get();

    return response()->json($similar);
}
```

```php
// api.php
Route::get('/products/{product:slug}/similar', [ProductController::class, 'similar']);
```

---

## 7. Suivi de commande public ⬜

**Route à créer :** `GET /api/orders/track/{order_number}`
**Fichier :** `app/Http/Controllers/OrderController.php`

### Spécification
- Route **publique** (sans `auth:api`)
- Paramètre : numéro de commande (ex. `MK-0012-2026`)
- Retourne les infos non-sensibles : statut, date, articles (nom + qté), montant, zone
- Ne retourne **pas** : email complet, adresse, téléphone

```php
public function track(string $orderNumber): JsonResponse
{
    $order = Order::with(['items.variant.product', 'items.product'])
        ->where('order_number', $orderNumber)
        ->firstOrFail();

    return response()->json([
        'order_number'     => $order->order_number,
        'status'           => $order->status,
        'created_at'       => $order->created_at,
        'total_price'      => $order->total_price,
        'delivery_location'=> $order->delivery_location,
        'delivery_fee'     => $order->delivery_fee,
        'items'            => $order->items->map(fn($i) => [
            'name'     => $i->variant?->product?->name ?? $i->product?->name,
            'quantity' => $i->quantity,
            'price'    => $i->price,
        ]),
    ]);
}
```

```php
// api.php (route publique)
Route::get('/orders/track/{orderNumber}', [OrderController::class, 'track']);
```

---

## Récapitulatif des routes V2

```
POST   /api/auth/register              throttle:5,1     ✅ Fait
GET    /api/orders/my                  auth:api         ✅ Fait
PUT    /api/profile                    auth:api         ✅ Fait
POST   /api/profile/avatar             auth:api         ✅ Fait
GET    /api/products/{slug}/similar    public           ⬜ À faire
GET    /api/orders/track/{number}      public           ⬜ À faire
```
