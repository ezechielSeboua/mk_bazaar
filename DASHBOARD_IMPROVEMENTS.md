# Dashboard Admin — Feuille de route des améliorations

> Fichier de suivi des améliorations prévues pour `DashboardHome.jsx` et les pages admin.

---

## Priorité haute

- [x] **1. StatCard "Chiffre d'affaires"**
  - Afficher `metrics.total_revenue_fcfa` (déjà renvoyé par `GET /api/orders`)
  - Couleur : golden — icône : TrendingUp
  - Fichier : `DashboardHome.jsx`

- [x] **2. Commandes récentes**
  - Remplacer le tableau "Derniers ajouts produits" par un double widget :
    - Gauche : 5 dernières commandes (nom client, téléphone, montant, statut, date)
    - Droite : 3 derniers produits ajoutés (existant, déplacé)
  - Données disponibles via `useDashboardData` sans nouvel endpoint
  - Fichier : `DashboardHome.jsx`

- [x] **3. StatCards cliquables**
  - Chaque StatCard devient un lien vers sa page admin :
    - Produits → `/dashboard/products`
    - Catégories → `/dashboard/categories`
    - Commandes → `/dashboard/commands`
    - Utilisateurs → `/dashboard/users`
  - Fichier : `DashboardHome.jsx` — composant `StatCard`

---

## Priorité moyenne

- [x] **4. Répartition des statuts commandes**
  - 4 compteurs visuels sous les StatCards : En attente / En traitement / Livrées / Annulées
  - Calculable depuis `orders` déjà en mémoire (pas de nouvel endpoint)
  - Fichier : `DashboardHome.jsx`

- [x] **5. Panier moyen**
  - `Math.round(total_revenue / completedOrders.length)` FCFA
  - Affiché en subValue sur la StatCard "Chiffre d'affaires"
  - Fichier : `DashboardHome.jsx`

- [x] **6. Revenu perdu (commandes annulées)**
  - `metrics.lost_revenue_cancelled_fcfa` déjà renvoyé par le backend
  - Affiché en rouge sur la StatCard Commandes (`lostValue`)
  - Fichier : `DashboardHome.jsx`

---

## Priorité basse

- [x] **7. Graphique des commandes sur 7 jours**
  - SVG pur (sans dépendance) — courbe avec aire dégradée
  - Toggle Commandes / Revenus, total semaine affiché, labels jours en bas
  - Fichier : `DashboardHome.jsx`

- [x] **8. Raccourcis d'actions rapides**
  - "Ajouter un produit" (pill noir) + "Commandes en attente" (badge count amber)
  - Positionnés dans l'en-tête du dashboard, côté droit
  - Fichier : `DashboardHome.jsx`

---

## Suivi

| # | Tâche | Statut | Date |
|---|-------|--------|------|
| 1 | StatCard CA | ✅ Fait | 2026-06-25 |
| 2 | Commandes récentes | ✅ Fait | 2026-06-25 |
| 3 | StatCards cliquables | ✅ Fait | 2026-06-25 |
| 4 | Répartition statuts | ✅ Fait | 2026-06-25 |
| 5 | Panier moyen | ✅ Fait | 2026-06-25 |
| 6 | Revenu perdu | ✅ Fait | 2026-06-25 |
| 7 | Graphique 7 jours | ✅ Fait | 2026-06-25 |
| 8 | Raccourcis actions | ✅ Fait | 2026-06-25 |
