# DealerLink

SaaS de gestion et de mise en réseau pour marchands automobiles.

Trois blocs :

1. **Gestion interne** — stock + dépôt-vente
2. **Réseau** — partage de véhicules entre marchands
3. **Recherche** — moteur de recherche multi-filtres

Stack : Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres + Storage).

---

## 🚀 Mise en route

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer un projet Supabase

1. Aller sur [app.supabase.com](https://app.supabase.com) et créer un nouveau projet (gratuit).
2. Dans **Project Settings → API**, copier l'URL et la clé `anon`.
3. Copier `.env.example` en `.env.local` et remplir :

```bash
cp .env.example .env.local
```

### 3. Initialiser la base

Dans Supabase → **SQL Editor**, exécuter le contenu de [`supabase/schema.sql`](./supabase/schema.sql).
Cela crée :

- les tables `profiles`, `vehicles`, `vehicle_images`
- les politiques de sécurité (Row Level Security)
- le bucket de stockage public `vehicle-images`
- un trigger qui crée automatiquement un profil à l'inscription

### 4. Lancer le serveur de dev

```bash
npm run dev
```

L'app tourne sur [http://localhost:3000](http://localhost:3000).

---

## 🧩 Modèle de données

### `vehicles`

Chaque véhicule a 3 dimensions :

- **type** : `stock` (au marchand) | `depot` (en dépôt-vente)
- **visibility** : `private` (visible par le marchand seul) | `network` (visible par le réseau)
- **status** : `available` | `reserved` | `sold`

Seuls les véhicules `visibility = 'network'` ET `status = 'available'` apparaissent
dans le moteur de recherche pour les autres marchands.

---

## 📁 Structure

```
app/
  (auth)/           pages publiques (login, register)
  (app)/            pages protégées (dashboard, véhicules, recherche…)
  layout.tsx        layout racine
components/
  ui/               primitives (Button, Input, Card…)
  vehicle-form.tsx  formulaire ajout/édition
  ...
lib/
  supabase/         clients (browser, server, middleware)
  validators.ts     schémas Zod
  types.ts          types DB
supabase/
  schema.sql        DDL Postgres + RLS + storage
middleware.ts       garde de session sur les routes protégées
```

---

## 🚢 Déploiement

### Vercel

1. Pousser le repo sur GitHub.
2. Importer dans Vercel.
3. Renseigner les 2 variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

---

## 🗺️ Roadmap MVP+

Hors-scope volontairement (cf. cahier des charges §20) :

- messagerie interne
- abonnement / paiement
- app mobile native
- multi-utilisateurs par entreprise
- publication automatique sur Leboncoin / La Centrale
