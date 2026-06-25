# Roadmap — Paramètres configurables MK Bazaar

## Déjà implémenté ✅
- Hero (image, titre, sous-titre, badge, CTA)
- Carrousel éditorial
- Témoignages
- Zones de livraison + tarifs

---

## À implémenter

### Priorité 1 — Identité & Branding
- [x] **Logo** — image uploadable, Header + Footer dynamiques (`SiteSettingsContext`)
- [ ] **Favicon** — icône de l'onglet navigateur
- [ ] **Nom du site** — balises `<title>`, emails, footer (`site_name` lu via `SiteSettingsContext`)
- [ ] **Couleur principale** — la terracotta `#c07b5a` actuellement hardcodée

### Priorité 2 — Contact & Réseaux sociaux
- [x] **Liens réseaux sociaux** — Instagram, Facebook, TikTok, Pinterest (Footer + ConfigurationsPage)
- [x] **Numéro WhatsApp Business** — bouton flottant + Footer dynamiques
- [x] **Email de contact** — footer configurable
- [x] **Adresse du showroom** — footer configurable

### Priorité 3 — Boutique
- [x] **Bannière promotionnelle** — barre sticky avec toggle on/off + aperçu temps réel
- [ ] **Montant minimum de commande** — validation serveur + message client
- [ ] **Message délai de livraison** — texte au checkout
- [ ] **Politique de retour** — texte libre affiché sur produit / footer

### Priorité 4 — SEO
- [ ] **Meta title & description** — défauts pour la homepage

### Priorité 5 — Opérationnel
- [ ] **Mode maintenance** — toggle + message personnalisé aux visiteurs
- [ ] **Seuil d'alerte stock faible** — actuellement hardcodé (≤ 5), rendre configurable

---

## Clés backend (AppSettingController::ALLOWED_KEYS)

| Clé | Statut | Description |
|-----|--------|-------------|
| `hero` | ✅ actif | Hero banner homepage |
| `hero_banner` | ✅ alias legacy | Compatibilité données existantes |
| `carousel` | ✅ actif | Galerie éditoriale |
| `testimonials` | ✅ actif | Témoignages clients |
| `shipping_zones` | ✅ actif | Zones + tarifs de livraison |
| `site_name` | ⏳ déclaré, non exposé | Nom du site |
| `social_links` | ⏳ déclaré, non exposé | Réseaux sociaux |
| `contact_info` | ⏳ déclaré, non exposé | Coordonnées contact |
| `logo` | ✅ actif | Logo uploadable |
| `promo_banner` | ✅ actif | Bannière promotionnelle |
| `maintenance` | ❌ à ajouter | Mode maintenance |
| `seo` | ❌ à ajouter | Meta title / description |
| `low_stock_threshold` | ❌ à ajouter | Seuil alerte stock |
