# Neuroshost Billing V0.1.4 Complete FIX

Corrections incluses :
- `HtmlEditor` accepte `minHeight` sur Tickets, Announcements et ModuleForms.
- `lib/schema.ts` utilise `string[]` et ignore toute entrée vide avant `conn.execute`.
- Modules admin regroupés : Orders, Products, Invoices, Tickets, Users, Announcements, Affiliates, Services, Categories, Config Options, Coupons, Currencies, Custom Properties, Roles, Tax Rates, Gateways, Servers et Extensions.
- Migrations MariaDB additives pour conserver les bases existantes.

# Neuroshost Billing V1.2

V1.2 ajoute une vraie fiche produit pilotée depuis MariaDB, avec description HTML éditable depuis l’administration, édition des produits, tickets Web, réponses aux tickets, clients, commandes, services, modèles email, historique email, SMTP configurable et navigation admin étendue.

## Installation

```bash
npm install
npm run build
npm start
```

Puis ouvrir `/install`. La connexion MariaDB est enregistrée automatiquement dans `.runtime/config.json`. Les données métier et la configuration sont stockées en MariaDB.

## Fiches produits HTML

Dans **Administration → Produits & offres**, chaque produit possède une **Description HTML**. Elle est enregistrée en MariaDB et rendue sur `/shop/<slug>`. Exemple :

```html
<h2>⚙️ Caractéristiques techniques</h2>
<div class="feature-grid">
  <div class="feature-card"><strong>💾 RAM</strong><br>4 Go</div>
  <div class="feature-card"><strong>🧠 CPU</strong><br>1 vCPU dédié</div>
  <div class="feature-card"><strong>💿 Stockage</strong><br>10 Go NVMe</div>
</div>
```

Le HTML est considéré comme du contenu de confiance puisqu'il est saisi par un administrateur.

## Modules Web V1.2

- Dashboard
- Clients
- Commandes
- Services
- Produits + édition + HTML
- Site & vitrine
- Tickets + détail + réponses
- Emails + modèles + historique
- Discord
- MariaDB

Les paiements réels, la création automatique Pterodactyl et l'envoi SMTP effectif seront finalisés dans les prochaines versions.


## Espace client & tickets
- `/client` : tableau de bord client.
- `/client/register` : création de compte client.
- `/client/tickets` : liste des tickets du client connecté.
- `/client/tickets/new` : création d'un ticket.
- `/client/tickets/[id]` : conversation et réponses.
- Les API `/api/client/*` vérifient la session et la propriété du ticket avant toute modification.

## V1.7 — Orders / Products / Support / Content extensions

This build adds the administration flows for Tickets, Users, Announcements and Affiliates.

- Tickets: create/edit support tickets with status, priority, department, user, staff assignment and service; initial messages and replies accept raw HTML.
- Users: create and edit users with role and optional password reset.
- Announcements: create/edit/publish announcements; Description is optional and both Description and Content accept raw HTML.
- Affiliates: create/edit referral programs with enabled state, referral code and reward percentage.
- Public announcements are available at `/announcements` and `/announcements/[slug]`.
- Existing product descriptions continue to accept raw HTML.
- Existing installations are upgraded automatically with additive MariaDB migrations.
- Fixed the TypeScript `string | undefined` issue in `lib/schema.ts`.

> HTML entered by administrators is trusted content and is rendered as HTML by the application. Only allow trusted staff to edit these fields.

## V0.1.2 — Administration modules

Cette version ajoute les modules d'administration inspirés de l'interface montrée :
- Custom Properties : Name, Key, Model, Type, Description HTML, Validation, Non editable, Required, Show on invoice.
- Roles : gestion des permissions avec recherche et sélection globale.
- Tax Rates : Name, Rate, Country.
- Gateways : Mollie, PayPal, PayPal_IPN, PayU, Stripe avec paramètres dynamiques.
- Servers : CPanel, Convoy, DirectAdmin, DownloadableProducts, Enhance, Plesk, Pterodactyl, Virtfusion, Virtualizor avec paramètres dynamiques.

Les paramètres sensibles des Gateways et Servers sont chiffrés en AES-256-GCM avant stockage en MariaDB.

### Correction build

`HtmlEditor` accepte maintenant correctement `minHeight`, et le schéma TypeScript de l'installation est explicitement typé en `string[]` pour éviter l'erreur `string | undefined` sur `conn.execute()`.

## Documentation V1.0.0

La documentation intégrée est disponible sur `/documentation`. Le lien **Documentation** du pied de page de l'administration ouvre directement cette page.
