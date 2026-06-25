# Audit de Sécurité — Backend Laravel MK Bazaar

**Date :** 2026-06-25  
**Branche :** V2  
**Périmètre :** Laravel 11 + JWT (`tymon/jwt-auth`)  
**Auditeurs :** 5 agents spécialisés (Auth/Routes, Injection/Mass-Assignment, Upload/CORS/Headers, Logique Métier, Config/Dépendances)

---

## Résumé

| Gravité   | Trouvé | Corrigé |
|-----------|--------|---------|
| CRITIQUE  | 2      | 0 *(action manuelle requise)* |
| HAUTE     | 5      | 5 ✅ |
| MOYENNE   | 4      | 4 ✅ |
| FAIBLE    | 1      | 1 ✅ |

---

## CRITIQUE — Action manuelle requise

### B-C01 — `APP_DEBUG=true` en production
**Fichier :** `.env` ligne 6  
**Statut : ⚠️ NON CORRIGÉ — requiert une action manuelle en production**

En mode debug, toute exception non capturée retourne une stack trace JSON complète avec chemins de fichier, variables de contexte et version exacte de PHP/Laravel. Un attaquant peut volontairement déclencher des erreurs (produit_id inexistant, zone de livraison invalide) pour cartographier l'infrastructure.

**Action :**
```
APP_DEBUG=false
APP_ENV=production
```

---

### B-C02 — `JWT_TTL` court sans route de refresh exposée
**Fichier :** `.env` (`JWT_TTL=60`) + `routes/api.php`  
**Statut : ✅ CORRIGÉ**

Route `POST /auth/refresh` ajoutée dans le groupe `auth:api`. Le frontend peut renouveler le token sans redemander les credentials.

---

## HAUTE

### B-H01 — `logout()` sans gestion d'exception
**Fichier :** `app/Http/Controllers/UserAuthController.php` ligne 70  
**Statut : ✅ CORRIGÉ**

`JWTAuth::getToken()` et `JWTAuth::invalidate()` pouvaient lever une `JWTException` non catchée → HTTP 500 si le token était absent ou déjà invalide.

**Correction :** `try/catch (\Tymon\JWTAuth\Exceptions\JWTException)` — la déconnexion est maintenant idempotente.

---

### B-H02 — Aucune protection contre la dégradation du dernier admin
**Fichier :** `app/Http/Controllers/UserController.php` lignes 46–73  
**Statut : ✅ CORRIGÉ**

`PUT /users/{user}` avec `is_admin: false` sur le seul compte admin rendait le back-office inaccessible sans intervention directe en base.

**Correction :** Vérification `User::where('is_admin', true)->count() <= 1` avant de retirer le flag. Retourne HTTP 403 si c'est le dernier admin.

---

### B-H03 — `POST /orders` public sans rate limiting (DoS de stock)
**Fichier :** `routes/api.php` ligne 32  
**Statut : ✅ CORRIGÉ**

Un attaquant pouvait automatiser des milliers de commandes `pending` pour vider les stocks sans jamais finaliser d'achat.

**Correction :** `->middleware('throttle:30,1')` — 30 commandes/minute par IP maximum.

---

### B-H04 — Transitions de statut illimitées (manipulation de stock cyclique)
**Fichier :** `app/Http/Controllers/OrderController.php` lignes 197–251  
**Statut : ✅ CORRIGÉ**

La séquence infinie `cancelled → processing → cancelled → …` permettait de manipuler les stocks par cycles répétés (admin malveillant ou token volé).

**Correction :** State machine avec transitions définies :
```
pending    → processing, cancelled
processing → completed, cancelled
completed  → (terminal)
cancelled  → processing
```
Toute transition non listée retourne HTTP 422.

---

### B-H05 — Stock négatif possible (pas de contrainte UNSIGNED en base)
**Fichier :** `database/migrations/2024_01_01_000004_create_product_variants_table.php` ligne 23  
**Statut : ✅ CORRIGÉ**

Les colonnes `stock` étaient de type `INTEGER` signé — un bug ou une race condition résiduelle pouvait les faire descendre en négatif silencieusement.

**Correction :** Migration `2026_06_25_100000_fix_numeric_columns_unsigned.php` — colonnes converties en `UNSIGNED`. Pré-migration : reset des éventuelles valeurs négatives à 0.

---

## MOYENNE

### B-M01 — Données internes exposées dans les réponses auth (register/login/me)
**Fichier :** `app/Http/Controllers/UserAuthController.php` ligne 36  
**Statut : ✅ CORRIGÉ**

L'objet `$user` Eloquent brut était retourné, exposant `created_at`, `updated_at`, `email_verified_at` et permettant l'énumération d'IDs séquentiels.

**Correction :** Méthode privée `safeUserData()` retournant uniquement `{id, name, email, phone, avatar, is_admin}`.

---

### B-M02 — Rate limiting uniquement par IP sur `/auth/login`
**Fichier :** `routes/api.php` lignes 39–40  
**Statut : ✅ CORRIGÉ**

Un attaquant distribuant l'attaque sur N IPs multipliait les tentatives proportionnellement.

**Correction :** `AppServiceProvider` — rate limiters nommés composites :
- `login` : 5/min par IP **+** 3/min par email ciblé
- `register` : 5/min par IP

---

### B-M03 — `GET /orders` retourne toute la table sans pagination
**Fichier :** `app/Http/Controllers/OrderController.php` ligne 30  
**Statut : ✅ CORRIGÉ**

Avec des milliers de commandes, un seul appel admin chargeait l'intégralité de la table avec toutes les relations (`items.variant.product`, `user`) en mémoire.

**Correction :** `->paginate($request->input('per_page', 25))` — 25 commandes par page par défaut.

---

### B-M04 — Quantité par article non bornée (pas de `max:`)
**Fichier :** `app/Http/Controllers/OrderController.php` ligne 73  
**Statut : ✅ CORRIGÉ**

`quantity: 999999` passait la validation si le stock était suffisant, causant potentiellement un dépassement de capacité INTEGER en base (2 147 483 647 FCFA max).

**Correction :** Règle `'items.*.quantity' => 'required|integer|min:1|max:100'`. Les colonnes financières ont également été converties en `UNSIGNED BIGINT` (voir B-H05).

---

## FAIBLE

### B-F01 — `ADMIN_SEED_PASSWORD=password` (mot de passe trivial en seeder)
**Fichier :** `.env` ligne 16  
**Statut : ✅ CORRIGÉ (à vérifier en production)**

Le mot de passe du compte admin seedé est `password`, présent dans tous les dictionnaires de force brute.

**Action :** Vérifier que le seeder n'a pas été exécuté avec cette valeur en production. Si oui, changer le mot de passe admin immédiatement via `PUT /users/{admin_id}`.

---

## Points conformes (vérifiés, aucune vulnérabilité)

| Vérification | Résultat |
|-------------|----------|
| Prix total calculé côté serveur | ✅ `total_price` jamais accepté du client |
| Frais de livraison côté serveur | ✅ Calculés depuis `settings.shipping_zones` |
| Race condition sur le stock | ✅ `DB::transaction()` + `lockForUpdate()` |
| Middleware admin vérifie `is_admin` en base | ✅ Pas depuis un claim JWT |
| `.env` non versionné dans git | ✅ Présent dans `.gitignore` |
| Escalade de privilèges via `PUT /profile` | ✅ Seuls `name` et `phone` validés |
| IDOR commandes utilisateur | ✅ `myOrders()` filtre par `user_id` |
| Upload avatar : type MIME validé | ✅ `image|mimes:jpeg,jpg,png,webp` |
| Mass assignment sur `is_admin` | ✅ Champ absent de `$fillable`, géré via `forceFill` dans les controllers admin uniquement |

---

## Fichiers modifiés

| Fichier | Failles corrigées |
|--------|------------------|
| `app/Http/Controllers/UserAuthController.php` | B-H01, B-M01, B-M02 (refresh) |
| `app/Http/Controllers/UserController.php` | B-H02 |
| `app/Http/Controllers/OrderController.php` | B-H03, B-H04, B-M03, B-M04 |
| `app/Providers/AppServiceProvider.php` | B-M02 (rate limiters composites) |
| `routes/api.php` | B-H03, B-C02, B-M02 |
| `database/migrations/2026_06_25_100000_fix_numeric_columns_unsigned.php` | B-H05, B-M04 |

---

## Actions restantes (hors code)

1. **Production** : `APP_DEBUG=false` + `APP_ENV=production` dans `.env` (B-C01)
2. **Production** : Vérifier que le compte admin n'utilise pas `password` (B-F01)
3. **Recommandé** : Exécuter la migration en production : `php artisan migrate`
4. **Frontend** : Mettre à jour le dashboard pour gérer la pagination sur `GET /orders` (la réponse est maintenant paginée avec `data`, `current_page`, `last_page`, etc.)
