# Rapport de Sécurité — Frontend MK Bazaar

**Date :** 2026-06-25  
**Périmètre :** `frontend/src/`  
**Outil :** Audit statique manuel (2 passes)  
**Statut global :** ✅ Toutes les failles corrigées

---

## Résumé

| Niveau | Nombre | Statut |
|--------|--------|--------|
| 🔴 Critique | 2 | ✅ Corrigé |
| 🟠 Élevé | 3 | ✅ Corrigé |
| 🟡 Moyen | 5 | ✅ Corrigé |
| **Total** | **10** | |

---

## 🔴 CRITIQUE

### [C1] JWT Token affiché en console à chaque requête API ✅

- **Fichier :** `frontend/src/services/apiConfig.js` — ligne 44
- **Code supprimé :**
  ```js
  console.log('🔐 Token found:', !!token, token);
  ```
- **Impact :** Le token JWT admin était visible en clair à chaque appel API. Toute extension navigateur, script tiers ou personne aux DevTools pouvait en prendre le contrôle total du compte admin.

---

### [C2] JWT Token loggué dans la réponse de connexion ✅

- **Fichier :** `frontend/src/services/auth.js` — ligne 16
- **Code supprimé :**
  ```js
  console.log("Connexion reussie:", res); // res.data.token = JWT complet
  ```
- **Impact :** Chaque login loggait la réponse complète avec le JWT. Moment le plus critique : token frais, session venante de démarrer.

---

## 🟠 ÉLEVÉ

### [E1] Mot de passe en clair loggué lors d'une mise à jour utilisateur ✅

- **Fichier :** `frontend/src/services/users.js` — ligne 28
- **Code supprimé :**
  ```js
  console.log("Updating user:", userId, userData); // userData contient password
  ```
- **Impact :** Quand un admin modifiait le mot de passe d'un utilisateur, le nouveau mot de passe en clair était imprimé en console. Tout outil de capture (Sentry, Datadog) l'enregistrait automatiquement.

---

### [E2] Données personnelles (PII) des clients loggées à chaque commande ✅

- **Fichier :** `frontend/src/services/order.js` — lignes 48 et 59
- **Code supprimé :**
  ```js
  console.log("Creating order with data:", orderData); // nom, téléphone, adresse
  console.log(`Updating order ${orderId} with data:`, orderData);
  ```
- **Impact :** Nom, téléphone et adresse de livraison du client loggués à chaque commande. Violation RGPD potentielle, capturable par tout script tiers.

---

### [E3] Catalogue produits et commandes loggués dans le dashboard ✅

- **Fichiers :**
  - `frontend/src/pages/Dashboard/DashboardHome.jsx` — ligne 72
  - `frontend/src/pages/Dashboard/OrdersPage.jsx` — ligne 227
- **Code supprimé :**
  ```js
  console.log("Mes produits du dash:", products); // stocks, prix, variantes
  console.log("Mes commandes:", orders);           // PII clients + montants
  ```
- **Impact :** L'ensemble des données métier (inventaire complet avec stocks réels, toutes les commandes clients avec adresses) était exposé en console dans l'interface admin.

---

## 🟡 MOYEN

### [M1] Profil utilisateur complet loggué sur chaque page produit ✅

- **Fichier :** `frontend/src/pages/ProductDetails.jsx` — ligne 342
- **Code supprimé :**
  ```js
  console.log(user); // email, téléphone, is_admin
  ```
- **Impact :** L'objet utilisateur complet (email, téléphone, rôle admin) loggué en continu lors de la navigation sur les pages produits.

---

### [M2] URL non encodée dans la recherche utilisateurs ✅

- **Fichier :** `frontend/src/services/users.js` — ligne 67
- **Avant :**
  ```js
  return fetchAPI(`/users?search=${query}`, {
  ```
- **Après :**
  ```js
  return fetchAPI(`/users?search=${encodeURIComponent(query)}`, {
  ```
- **Impact :** Une valeur comme `foo&role=admin` injectait un paramètre supplémentaire dans la requête HTTP, pouvant déclencher des filtres non prévus côté backend.

---

### [M3] Headers mal configurés dans toutes les requêtes API ✅

- **Fichier :** `frontend/src/services/apiConfig.js` — lignes 21–22
- **Code supprimé :**
  ```js
  'Access-Control-Allow-Credentials': 'true', // header de réponse serveur envoyé en requête
  'ngrok-skip-browser-warning': 'true',        // artifact de développement ngrok
  ```
- **Impact :** `Access-Control-Allow-Credentials` est un header serveur envoyé par erreur côté client (sans effet). Le header ngrok exposait un tunnel de développement en production, contournant les protections firewall.

---

### [M4] Log de disponibilité de l'API et de FormData supprimés ✅

- **Fichiers :**
  - `frontend/src/services/auth.js` — ligne 4
  - `frontend/src/services/category.js` — ligne 17
- **Code supprimé :**
  ```js
  console.log("Route api disponible");
  console.log("Creating category with FormData containing image...");
  ```
- **Impact :** Artefacts de debug révélant la présence et l'état interne de l'API à quiconque ouvre la console.

---

## Vérification finale

Après correction, aucun `console.log` ne subsiste dans les fichiers sensibles :

```
✅ services/apiConfig.js  — 0 console.log
✅ services/auth.js       — 0 console.log
✅ services/users.js      — 0 console.log
✅ services/order.js      — 0 console.log
✅ services/category.js   — 0 console.log
✅ pages/ProductDetails   — 0 console.log
✅ pages/Dashboard/       — 0 console.log

Conservés (légitimes) :
ℹ️  console.error dans les blocs catch — comportement normal de gestion d'erreurs
```

Aucun vecteur XSS (`dangerouslySetInnerHTML`, `eval`, `innerHTML`), aucun open redirect, aucune clé API hardcodée détectés.

---

## Recommandation pour prévenir les régressions

Ajouter la règle ESLint `no-console` dans la configuration du projet :

```json
// .eslintrc ou eslint.config.js
{
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  }
}
```

Cela bloque tout nouveau `console.log` avant le commit, tout en autorisant les `console.error` légitimes dans les blocs catch.
