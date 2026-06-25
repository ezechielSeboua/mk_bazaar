# MK Bazaar — V2 Frontend

> Branch : `V2`
> Stack : React 18 · Vite · Tailwind CSS · Framer Motion · Lucide

---

## Statut global

| # | Feature | Statut | Dépendance backend |
|---|---------|--------|--------------------|
| 1 | PWA + icônes | 🟡 Partiel | Aucune |
| 2 | Agrandissement logo | ✅ Fait | Aucune |
| 3 | Lightbox galerie produit | ✅ Fait | Aucune |
| 4 | Partage produit | ✅ Fait | Aucune |
| 5 | WishlistContext + cœurs | ✅ Fait | Aucune |
| 6 | Alertes stock bas (dashboard) | ✅ Fait | Aucune |
| 7 | Inscription utilisateur | ✅ Fait | `POST /api/auth/register` ✅ |
| 8 | Espace client (`/compte`) | ✅ Fait | `GET /api/orders/my` ✅ |
| 9 | Photo de profil | ✅ Fait | `POST /api/profile/avatar` ✅ |
| 10 | Mise à jour profil | ✅ Fait | `PUT /api/profile` ✅ |
| 11 | Sidebar client (dashboard-style) | ✅ Fait | Aucune |
| 12 | Topbar interne + panier + favoris | ✅ Fait | Aucune |
| 13 | Carte favori améliorée | ✅ Fait | Aucune |
| 14 | Produits similaires | ⬜ À faire | `GET /api/products/{slug}/similar` |
| 15 | Suivi de commande (invité) | ⬜ À faire | `GET /api/orders/track/{number}` |
| 16 | Icônes PWA | ⬜ Fichiers à fournir | Aucune |

---

## 1. PWA

**Statut : partiel** — plugin configuré, icônes manquantes.
**Fichiers :** `frontend/vite.config.js`, `frontend/index.html`

- [x] `vite-plugin-pwa` installé et configuré
- [x] `manifest` : `name`, `short_name`, `theme_color`, `background_color`, `display: standalone`
- [x] Service worker Workbox : `NetworkFirst` pour les requêtes API, `CacheFirst` pour Cloudinary
- [x] `index.html` : `<meta name="theme-color">` + `<link rel="apple-touch-icon">`
- [ ] `public/icons/icon-192.png` — **à créer manuellement** (192×192px, fond blanc, logo centré)
- [ ] `public/icons/icon-512.png` — **à créer manuellement** (512×512px)

> Générer les icônes depuis `mk_bazaar_logo.png` via [realfavicongenerator.net](https://realfavicongenerator.net).

---

## 2. Agrandissement logo

**Statut : fait.**
**Fichiers :** `Header.jsx`, `Footer.jsx`, `LoginPage.jsx`, `DashboardLayout.jsx`, `AboutPage.jsx`

- [x] `Header.jsx` — taille scrollée et normale augmentées (classe `logoHeight` dynamique)
- [x] `Footer.jsx` — conteneur logo `w-16` → `w-24`
- [x] `LoginPage.jsx` — logo header `h-12` → `h-16`, logo carte `w-24` → `w-32`
- [x] `DashboardLayout.jsx` — taille explicite `w-14 h-14` ajoutée
- [x] `AboutPage.jsx` — `h-12 md:h-16` → `h-16 md:h-24`

---

## 3. Lightbox galerie produit

**Statut : fait.**
**Fichier :** `src/components/ProductGallery.jsx`

- [x] Clic sur loupe → lightbox plein écran
- [x] Mobile : image `w-full h-full object-contain` (plein écran)
- [x] Desktop : `max-w-[90vw] max-h-[90vh]`
- [x] Navigation clavier `←` `→` `Échap`
- [x] Swipe tactile
- [x] Miniatures cliquables en bas
- [x] Compteur `1 / N`
- [x] Scroll body bloqué à l'ouverture

---

## 4. Partage produit

**Statut : fait.**
**Fichier :** `src/pages/ProductDetails.jsx`

- [x] Bouton "Partager" après la description produit
- [x] `navigator.share` disponible (mobile) → feuille de partage native
- [x] Fallback → copie URL dans le presse-papier + toast de confirmation
- [x] Contenu partagé : `{ title, text: prix, url: window.location.href }`

---

## 5. WishlistContext + cœurs

**Statut : fait.**
**Fichiers :** `src/contexts/WishlistContext.jsx` *(nouveau)*, `ProductCard.jsx`, `ProductDetails.jsx`, `App.jsx`, `Header.jsx`

- [x] `WishlistContext` avec `toggleWishlist`, `isInWishlist`
- [x] Persistance `localStorage` clé `mk_wishlist`
- [x] Données stockées : `{ id, name, slug, price, image, category }`
- [x] Icône cœur sur `ProductCard` (overlay haut-droite)
- [x] Icône cœur sur `ProductDetails` (bouton après description)
- [x] Badge animé sur l'icône cœur du `Header`
- [x] `WishlistProvider` wrappant l'app dans `App.jsx`

> Pas de synchronisation backend en V2 — `localStorage` uniquement.

---

## 6. Alertes stock bas (dashboard)

**Statut : fait.**
**Fichiers :** `src/pages/Dashboard/DashboardHome.jsx`

- [x] Section "Réapprovisionnement nécessaire" en bas de `DashboardHome`
- [x] Filtre côté frontend : variantes avec `stock > 0 && stock <= 3`
- [x] Produits sans variantes : `product.stock <= 3`
- [x] Style amber avec nom du produit, attributs de variante, stock restant

---

## 7. Inscription utilisateur

**Statut : fait.**
**Fichier :** `src/pages/Auth/RegisterPage.jsx` *(nouveau)*

- [x] Formulaire : nom, email, téléphone (optionnel), mot de passe, confirmation
- [x] Appel `POST /api/auth/register`
- [x] Mapping des erreurs Laravel champ par champ
- [x] Redirection vers `/compte` après inscription réussie
- [x] Lien "Créer un compte" ajouté dans `LoginPage.jsx`
- [x] Route `/register` ajoutée dans `App.jsx`
- [x] `LoginPage.jsx` : redirection post-login → `/compte` (utilisateur) ou `/dashboard` (admin)

---

## 8. Espace client (`/compte`)

**Statut : fait.**
**Fichier :** `src/pages/Account/AccountPage.jsx` *(nouveau)*

### Structure
```
/compte
├── Mon profil    → avatar, nom, téléphone, mot de passe
├── Mes commandes → historique avec statut, articles, livraison
└── Mes favoris   → produits sauvegardés (localStorage)
```

### Onglet Profil
- [x] Section avatar cliquable → `<input type="file">` → preview + upload
- [x] Champs : nom (modifiable), email (readonly), téléphone
- [x] Validation téléphone côté frontend
- [x] Indicateur de force du mot de passe (`PasswordStrength`)
- [x] Section mot de passe avec animation toggle (Framer Motion)
- [x] `isDirty` : bouton "Enregistrer" désactivé si aucun changement
- [x] Messages de succès/erreur auto-effacés après 4 s

### Onglet Commandes
- [x] Appel `GET /api/orders/my`
- [x] Skeleton loader pendant le chargement
- [x] Cards : numéro, date, statut (badge coloré), articles (image + nom + attributs + prix × qté)
- [x] Footer de carte : zone de livraison + frais

### Onglet Favoris
- [x] Grille responsive : `2 cols → sm:3 → md:2 → lg:3 → xl:4`
- [x] `FavoriteCard` : image avec overlay cœur (retirer) + badge catégorie, prix, bouton "Voir le produit"
- [x] Animation `AnimatePresence mode="popLayout"` à la suppression
- [x] État vide : icône + message + CTA "Parcourir le catalogue"

### Services ajoutés
- [x] `src/services/auth.js` — `updateProfile(data)`, `uploadAvatar(file)`
- [x] `src/services/order.js` — `getMyOrders()`

---

## 9. Photo de profil

**Statut : fait.**
**Fichiers :** `AccountPage.jsx`, `Header.jsx`, `src/services/auth.js`

- [x] Zone avatar cliquable (initiales ou photo) dans l'onglet Profil
- [x] Preview immédiate via `URL.createObjectURL`
- [x] Upload `FormData` → `POST /api/profile/avatar`
- [x] `fetchAPI` gère automatiquement le `multipart/form-data` (pas de `Content-Type` JSON)
- [x] URLs relatives backend (`/storage/avatars/...`) passées par `resolveMediaUrl()` → URL absolue backend
- [x] `Header.jsx` : affiche `<img>` si `user.avatar`, sinon initiales

---

## 10. Mise à jour profil

**Statut : fait.**
**Fichiers :** `AccountPage.jsx`, `src/services/auth.js`

- [x] `PUT /api/profile` → nom + téléphone
- [x] `localStorage` mis à jour côté service (`auth.js`)
- [x] Context `AuthContext` resynchronisé via `refreshProfile()` après sauvegarde

---

## 11. Sidebar client (style dashboard)

**Statut : fait.**
**Fichier :** `AccountPage.jsx` — composant `SidebarNav`

- [x] Sidebar sombre `bg-stone-950` sur desktop
- [x] Collapsible : `w-56/64` → `w-16` (icônes seules), chevron dans l'en-tête
- [x] Drawer mobile : slide depuis la gauche + backdrop, fermé par clic extérieur
- [x] En-tête sidebar : avatar + nom + email (masqués quand collapsed)
- [x] Items de navigation : icône + label + badge rose (favoris)
- [x] Bas de sidebar : lien "Boutique" + bouton "Déconnexion"
- [x] Header global (`Header.jsx`) retiré de la page compte

---

## 12. Topbar interne

**Statut : fait.**
**Fichier :** `AccountPage.jsx`

Remplace le `Header` global sur la page compte.

- [x] Logo MK Bazaar cliquable (lien `/accueil`) — desktop
- [x] Hamburger mobile → ouvre le drawer sidebar
- [x] Icône + nom de l'onglet actif
- [x] **Icône panier** avec badge animé (lien `/panier`) — marron `#c07b5a`
- [x] **Icône favoris** avec badge animé (navigue vers onglet Favoris) — rose
- [x] Prénom utilisateur — desktop large
- [x] Compte du panier synchronisé en temps réel (`storage` + `cart-updated` events)

---

## 13. Carte favori améliorée

**Statut : fait.**
**Fichier :** `AccountPage.jsx` — composant `FavoriteCard`

- [x] Image `aspect-[3/4]` avec zoom au survol
- [x] Badge catégorie en haut à gauche (fond noir/blur)
- [x] Bouton cœur rempli (rose) haut à droite → retire avec animation scale
- [x] Overlay subtil au survol
- [x] Catégorie en sous-titre, nom du produit sur 2 lignes max
- [x] Prix : chiffres gras + "FCFA" discret
- [x] Bouton "Voir le produit →" en bas de carte

---

## 14. Produits similaires ⬜

**Fichiers :** `ProductDetails.jsx`, `src/services/product.js`
**Backend requis :** `GET /api/products/{slug}/similar`

- [ ] `getSimilarProducts(slug)` dans `product.js`
- [ ] Section "Vous aimerez aussi" en bas de `ProductDetails`
- [ ] Chargement asynchrone (ne bloque pas l'affichage principal)
- [ ] Grille `2 cols mobile / 4 cols desktop` avec `ProductCard`

---

## 15. Suivi de commande (invité) ⬜

**Fichier :** `src/pages/TrackOrderPage.jsx` *(à créer)*
**Backend requis :** `GET /api/orders/track/{order_number}`

- [ ] Page publique `/suivi` — champ de saisie du numéro de commande
- [ ] Stepper visuel : `En attente` → `En traitement` → `Expédié` → `Livré`
- [ ] Lien vers `/suivi` depuis `BasketPage` après commande réussie
- [ ] Utilisateur connecté → redirection vers `/compte?tab=orders`
- [ ] Route `/suivi` ajoutée dans `App.jsx`

---

## 16. Icônes PWA ⬜

**Fichiers à créer manuellement :**
- `public/icons/icon-192.png` — 192×192px
- `public/icons/icon-512.png` — 512×512px

> Générer depuis `mk_bazaar_logo.png` via [realfavicongenerator.net](https://realfavicongenerator.net).

---

## Ordre d'implémentation réel

```
1.  ✅ PWA setup (partiel)
2.  ✅ Agrandissement logo
3.  ✅ Lightbox galerie produit
4.  ✅ Partage produit
5.  ✅ WishlistContext + cœurs (ProductCard + ProductDetails)
6.  ✅ Alertes stock bas (dashboard)
7.  ✅ Inscription utilisateur (RegisterPage)
8.  ✅ Espace client — profil, commandes, favoris
9.  ✅ Photo de profil
10. ✅ Sidebar client style dashboard
11. ✅ Topbar interne (panier + favoris + logo)
12. ✅ Carte favori améliorée (FavoriteCard)
13. ⬜ Produits similaires   (attend endpoint backend)
14. ⬜ Suivi de commande     (attend endpoint backend)
15. ⬜ Icônes PWA            (fichiers PNG à fournir)
```
