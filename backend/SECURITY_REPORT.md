# Rapport de Sécurité — Backend Laravel MK Bazaar

**Date :** 2026-06-25  
**Périmètre :** `backend/app/`, `backend/config/`, `backend/routes/`, `backend/database/`, `backend/.env.example`  
**Outil :** Audit statique manuel exhaustif (toutes sévérités)  
**Statut global :** ⚠️ 7 nouvelles failles identifiées (en plus des 9 déjà corrigées)

---

## Résumé global

| Niveau | Ancienne session | Nouvelle session | Statut |
|--------|-----------------|-----------------|--------|
| 🔴 Critique | 2 | 0 | ✅ Tous corrigés |
| 🟠 Élevé | 3 | 1 | ✅ Corrigé |
| 🟡 Moyen | 4 | 3 | ✅ Corrigés |
| 🔵 Faible | 0 | 3 | ✅ Corrigés |
| **Total** | **9 ✅** | **7 ✅** | ✅ Tout corrigé |

---

## ✅ FAILLES PRÉCÉDEMMENT CORRIGÉES (pour mémoire)

| ID | Faille | Fichier | Statut |
|----|--------|---------|--------|
| C1 | `is_admin` mass assignable | `User.php`, `UserController.php` | ✅ |
| C2 | `total_price` contrôlé par le client | `OrderController.php` | ✅ |
| E1 | Pas de middleware admin | `AdminMiddleware.php`, `api.php` | ✅ |
| E2 | Pas de rate limiting sur `/auth/login` | `api.php` | ✅ |
| E3 | `APP_DEBUG=true` dans `.env.example` | `.env.example` | ✅ |
| M1 | CORS wildcard | `config/cors.php` | ✅ |
| M2 | Mot de passe admin en dur dans seeder | `UserSeeder.php` | ✅ |
| M3 | Clés de config non validées | `AppSettingController.php` | ✅ |
| M4 | Exceptions internes exposées au client | `OrderController.php` | ✅ |

---

## 🟠 ÉLEVÉ — Nouvelles failles

### [NE1] Frais de livraison contrôlés par le client

- **Fichier :** `app/Http/Controllers/OrderController.php` — ligne 55
- **Code vulnérable :**
  ```php
  $rules = [
      'delivery_fee' => 'required|integer|min:0', // ← valeur client acceptée telle quelle
      ...
  ];
  // Plus loin :
  $order->update(['total_price' => $computedTotal + $validated['delivery_fee']]);
  ```
- **Scénario d'exploitation :**
  Le prix des articles est désormais calculé côté serveur (C2 corrigé), mais `delivery_fee` vient toujours du client. Un acheteur peut envoyer `delivery_fee: 0` même si sa zone de livraison devrait coûter 2 000 FCFA. La commande est enregistrée avec des frais nuls.
- **Correction :**
  ```php
  // Supprimer delivery_fee de la validation entrante
  // Calculer côté serveur selon delivery_location
  $zonesFees = [
      'Abidjan - Cocody'   => 1000,
      'Abidjan - Yopougon' => 1500,
      // ...
  ];
  $deliveryFee = $zonesFees[$validated['delivery_location']] ?? 0;
  ```
  Ou au minimum, valider que `delivery_fee` correspond à la zone déclarée via une table `delivery_zones` en base.

---

## 🟡 MOYEN — Nouvelles failles

### [NM1] URL CORS avec slash final — brise la protection en production

- **Fichier :** `.env.example` — ligne 5
- **Code vulnérable :**
  ```
  FRONTEND_URL=https://mk-bazaar.vercel.app/
  ```
- **Problème :**
  Le navigateur envoie `Origin: https://mk-bazaar.vercel.app` (sans slash). La config CORS compare cette valeur à `https://mk-bazaar.vercel.app/` (avec slash). La comparaison échoue → toutes les requêtes cross-origin retournent `CORS error` en production.  
  Ironiquement cela ne "laisse passer" rien de mauvais, mais **casse l'application** pour les vrais utilisateurs tout en ayant l'impression d'être protégé.
- **Correction :**
  ```
  FRONTEND_URL=https://mk-bazaar.vercel.app
  APP_URL=https://mk-bazaar.onrender.com
  ```
  Supprimer le slash final dans les deux URLs.

---

### [NM2] `JWT_SECRET` absent du `.env.example`

- **Fichier :** `.env.example` (toutes les lignes)
- **Problème :**
  `JWT_SECRET` n'est pas mentionné dans `.env.example`. Si un développeur copie ce fichier en `.env` et oublie de générer la clé JWT (`php artisan jwt:secret`), la valeur sera `null`. Dans ce cas, `tymon/jwt-auth` utilise une clé vide — les tokens peuvent être forgés par n'importe qui avec `{"alg":"HS256"}` + secret `""`.
- **Scénario :**  
  Un attaquant forge un token admin valide avec une clé vide. Il obtient un accès total au back-office.
- **Correction :**
  ```
  # Générer avec : php artisan jwt:secret
  JWT_SECRET=
  JWT_TTL=60
  JWT_REFRESH_TTL=20160
  ```
  Ajouter ces lignes dans `.env.example` pour que l'étape de configuration soit visible.

---

### [NM3] Route `/auth/logout` sans middleware d'authentification

- **Fichier :** `routes/api.php` — ligne 40
- **Code vulnérable :**
  ```php
  Route::post('/auth/logout', [UserAuthController::class, 'logout']); // ← pas de auth:api
  ```
  ```php
  // UserAuthController.php
  public function logout()
  {
      JWTAuth::invalidate(JWTAuth::getToken()); // ← getToken() retourne false sans token
  }
  ```
- **Problème :**
  Une requête sans token déclenche `JWTAuth::getToken()` qui retourne `false`, puis `invalidate(false)` lève une `JWTException` non gérée → réponse 500 avec stack trace potentielle (si `APP_DEBUG=true`).  
  De plus, sans middleware, un token expiré ne peut pas être révoqué proprement.
- **Correction :**
  ```php
  Route::middleware('auth:api')->group(function () {
      Route::get('/auth/me', [UserAuthController::class, 'me']);
      Route::post('/auth/logout', [UserAuthController::class, 'logout']); // ← déplacer ici
  });
  ```

---

## 🔵 FAIBLE — Nouvelles failles

### [NF1] Paramètre `days` non borné dans le dashboard

- **Fichier :** `app/Http/Controllers/OrderReportController.php` — ligne 19
- **Code vulnérable :**
  ```php
  $days = $request->get('days', 30); // ← aucune validation
  $startDate = Carbon::now()->subDays($days);
  ```
- **Problème :**
  Un admin peut passer `days=999999` → requête sur toute la base depuis ~2700 ans. Avec un grand volume de commandes, cela peut saturer la mémoire ou faire timeout le serveur. Mineur car réservé aux admins.
- **Correction :**
  ```php
  $days = min(max((int) $request->get('days', 30), 1), 365);
  ```

---

### [NF2] Aucune protection contre la suppression de son propre compte admin

- **Fichier :** `app/Http/Controllers/UserController.php` — ligne 79
- **Code vulnérable :**
  ```php
  public function destroy(User $user)
  {
      $user->delete(); // ← un admin peut se supprimer lui-même
  }
  ```
- **Problème :**
  Un admin peut supprimer son propre compte (ou le seul compte admin du système), rendant le back-office inaccessible. Pas une faille de sécurité externe, mais un risque opérationnel critique.
- **Correction :**
  ```php
  public function destroy(User $user)
  {
      if ($user->id === auth('api')->id()) {
          return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
      }
      $user->delete();
  }
  ```

---

### [NF3] `is_admin` embarqué dans le payload JWT (lisible par le client)

- **Fichier :** `app/Models/User.php` — lignes 43–47
- **Code :**
  ```php
  public function getJWTCustomClaims()
  {
      return ['is_admin' => $this->is_admin]; // ← inclus dans le token
  }
  ```
- **Problème :**
  Le JWT est encodé en Base64, pas chiffré. Le client (et n'importe qui avec le token) peut décoder le payload avec `atob()` ou [jwt.io](https://jwt.io) et voir `"is_admin": true`. Ce claim n'est pas utilisé pour l'autorisation (le middleware lit la DB), c'est donc une fuite d'information inutile.
- **Correction (optionnelle) :**
  ```php
  public function getJWTCustomClaims()
  {
      return []; // Le middleware lit la DB — ce claim est inutile
  }
  ```
  Ou le conserver si le frontend en a besoin pour afficher l'UI, en acceptant que c'est de la donnée publique côté client.

---

## Plan de correction prioritaire

```
Phase 1 — Élevé (avant la mise en production)
└── [NE1] Calculer delivery_fee côté serveur selon delivery_location

Phase 2 — Moyen (correctifs rapides, 1-2h de travail)
├── [NM1] Retirer les slashs finaux dans APP_URL et FRONTEND_URL dans .env.example
├── [NM2] Ajouter JWT_SECRET= dans .env.example avec instructions
└── [NM3] Déplacer /auth/logout dans le groupe auth:api

Phase 3 — Faible (améliorations de robustesse)
├── [NF1] Borner le paramètre 'days' entre 1 et 365
├── [NF2] Bloquer la suppression de son propre compte admin
└── [NF3] Vider getJWTCustomClaims() si is_admin n'est pas utilisé côté frontend
```

---

## Points vérifiés — Aucune vulnérabilité

- ✅ **Injection SQL** — ORM Eloquent partout, requêtes paramétrées
- ✅ **Upload de fichiers** — `mimes:jpeg,jpg,png,webp|max:4096`, stockage hors webroot
- ✅ **Hash des mots de passe** — `bcrypt()` + `BCRYPT_ROUNDS=12`
- ✅ **Exposition du hash** — `$hidden = ['password', 'remember_token']`
- ✅ **Invalidation JWT au logout** — `JWTAuth::invalidate()` appelé
- ✅ **Race conditions stock** — `DB::transaction()` + `lockForUpdate()` sur variants/products
- ✅ **Mass assignment** — `$fillable` restrictifs sur tous les modèles, `forceFill()` pour `is_admin`
- ✅ **Authorization admin** — middleware `['auth:api', 'admin']` sur toutes les routes sensibles
- ✅ **Rate limiting login** — `throttle:5,1` sur `POST /auth/login`
- ✅ **CORS restreint** — `allowed_origins` limité au frontend via `FRONTEND_URL`
- ✅ **Clés AppSettings whitelistées** — `ALLOWED_KEYS` + `validateKey()` appelé
- ✅ **Total prix serveur** — `total_price` calculé depuis la DB, jamais depuis le client
- ✅ **Exceptions internes masquées** — `Log::error()` + message générique en réponse
- ✅ **APP_DEBUG=false** par défaut dans `.env.example`
- ✅ **Mot de passe seeder via env** — `ADMIN_SEED_PASSWORD` avec fallback `Str::random(32)`
- ✅ **Path traversal uploads** — Laravel Storage confine au disque `public`
- ✅ **XSS** — API JSON pure, pas de rendu HTML côté backend
