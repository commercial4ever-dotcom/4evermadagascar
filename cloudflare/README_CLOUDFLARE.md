# Guide Phase 3 — Connexion Cloudflare D1 (sans R2) — 4EVER Madagascar

Ce guide décrit les étapes exactes pour connecter l'application **4EVER Madagascar** (Node.js / Express) à **votre base Cloudflare D1 existante** via le **D1 Bridge Worker**, **sans activer Cloudflare R2 pour le moment**.

> **Règle absolue** : **ne créez pas de nouvelle base D1**. Réutilisez uniquement la base D1 déjà créée dans votre compte Cloudflare.

---

## Comportement selon l'environnement (`NODE_ENV`)

| Mode (`NODE_ENV`) | Base de données | Stockage fichiers (R2 reporté) | Repli sur SQLite / disque local |
| :--- | :--- | :--- | :--- |
| **`development`** (local) | SQLite local (`data/4ever.sqlite`) | Disque local (`data/uploads/`, `data/attachments/`) | Autorisé uniquement en local |
| **`production`** (sans R2) | **Cloudflare D1 obligatoire** (`d1-worker` ou `d1-api`) | **Désactivé proprement (`HTTP 503`)** ; les illustrations vectorielles N&B restent actives | **STRICTEMENT INTERDIT** : si D1 ou `SESSION_SECRET` manquent, le serveur renvoie `HTTP 503` sans jamais créer de fichier SQLite |

---

## 1. Paramètres à récupérer dans votre compte Cloudflare (sans créer de doublon)

Depuis le **Dashboard Cloudflare** (**Workers & Pages → D1 SQL Database**) ou via Wrangler CLI :

```bash
npx wrangler login
npx wrangler d1 list
```

Relevez uniquement ces deux valeurs de votre base existante :
1. **`database_name`** : le nom exact de votre base D1 existante.
2. **`database_id`** : l'UUID de votre base D1 existante.

*(Aucune clé R2 n'est demandée à cette étape.)*

---

## 2. Configurer et déployer le Worker D1 Bridge

Le worker `cloudflare/d1-bridge-worker/worker.ts` est déjà prêt et sécurisé (requêtes `POST` uniquement, authentification `Bearer BRIDGE_AUTH_TOKEN` en temps constant, requêtes paramétrées `env.DB.prepare(sql).bind(...)`).

1. Copiez le modèle de configuration :
   ```bash
   cp cloudflare/d1-bridge-worker/wrangler.toml.example cloudflare/d1-bridge-worker/wrangler.toml
   ```
2. Éditez `cloudflare/d1-bridge-worker/wrangler.toml` avec le `database_name` et le `database_id` de votre base existante :
   ```toml
   name = "forever-d1-bridge"
   main = "worker.ts"
   compatibility_date = "2025-05-01"

   [[d1_databases]]
   binding = "DB"
   database_name = "<VOTRE_DATABASE_NAME_EXISTANT>"
   database_id = "<VOTRE_DATABASE_ID_EXISTANT>"
   ```
3. Générez un jeton secret aléatoire pour le Bridge :
   ```bash
   openssl rand -hex 32
   ```
4. Enregistrez ce secret dans Cloudflare Workers (ne jamais le mettre dans le code ni dans `wrangler.toml`) :
   ```bash
   cd cloudflare/d1-bridge-worker
   npx wrangler secret put BRIDGE_AUTH_TOKEN
   ```
5. Déployez le Worker Bridge :
   ```bash
   npx wrangler deploy
   ```
   Notez l'URL déployée, par exemple : `https://forever-d1-bridge.<sous-domaine>.workers.dev`.

---

## 3. Exécuter les migrations SQL versionnées sur votre base D1 existante

Les deux fichiers de migration sont non destructifs (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `INSERT OR IGNORE`). Exécutez-les depuis la racine du projet :

```bash
npx wrangler d1 execute <VOTRE_DATABASE_NAME_EXISTANT> --remote --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute <VOTRE_DATABASE_NAME_EXISTANT> --remote --file=migrations/0002_admin_security_and_indexes.sql
```

Vérifiez ensuite les tables créées dans D1 :

```bash
npx wrangler d1 execute <VOTRE_DATABASE_NAME_EXISTANT> --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Tables attendues : `admin_sessions`, `admin_users`, `audit_logs`, `categories`, `contact_messages`, `login_attempts`, `media_assets`, `poles`, `products`, `quotes`, `realisations`, `site_settings`.

---

## 4. Configurer les variables d'environnement du serveur Node.js / Express

Dans votre hébergeur backend (Render, Railway, Fly.io, Cloud Run, VPS...) — **jamais côté frontend** :

```env
NODE_ENV=production
APP_URL="https://votre-domaine.mg"

# Sécurité sessions & initialisation Super Admin
SESSION_SECRET="<chaine-aleatoire-64-caracteres>"
ADMIN_SETUP_TOKEN="<jeton-unique-initialisation-admin>"

# Connexion Cloudflare D1 via Worker Bridge (recommandé)
CLOUDFLARE_D1_BRIDGE_URL="https://forever-d1-bridge.<sous-domaine>.workers.dev"
CLOUDFLARE_D1_BRIDGE_TOKEN="<le-secret-BRIDGE_AUTH_TOKEN>"

# Laisser les variables CLOUDFLARE_R2_* vides tant que R2 est reporté
```

*(Alternative Option B si vous n'utilisez pas le Worker Bridge : définissez `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID` et `CLOUDFLARE_API_TOKEN` avec la permission `D1:Edit`.)*

Construisez et démarrez le serveur :

```bash
npm run build
NODE_ENV=production npm start
```

---

## 5. Initialiser le compte Super Admin propriétaire

1. Ouvrez `https://votre-domaine.mg/admin`.
2. Saisissez le jeton unique `ADMIN_SETUP_TOKEN`, votre nom, votre e-mail et un mot de passe robuste (10+ caractères avec lettres et chiffres).
3. Après validation, l'initialisation est définitivement verrouillée en base D1 (`_admin_setup_locked`). Vous pouvez retirer `ADMIN_SETUP_TOKEN` de l'environnement serveur.

---

## 6. Tests réels à exécuter

1. **Santé serveur & connexion D1** :
   - `GET /api/health` doit retourner **`HTTP 200`** avec :
     - `"persistenceReady": true`
     - `"dbDriver": "d1-worker"` (ou `"d1-api"`)
     - `"fileStorageAvailable": false`
     - `"storageDriver": "unconfigured"`
2. **Test lecture/écriture D1 depuis l'Admin** :
   - Ouvrez `/admin` → **Paramètres & Sécurité** → cliquez sur **« Tester lecture/écriture D1 & R2 »**.
   - `db` doit passer en **OK** (test réel d'écriture, lecture et suppression dans Cloudflare D1).
   - `r2` affiche l'état informatif « temporairement reporté ».
3. **Test de persistance après redémarrage** :
   - Créez un produit test dans `/admin` → **Produits & Prix** et envoyez un devis test **sans pièce jointe** sur `/devis`.
   - Redémarrez complètement le processus Node.js (`npm start`).
   - Vérifiez que le produit apparaît toujours sur `/catalogue` et le devis dans `/admin` → **Devis**, et que vous restez connecté si votre session n'a pas expiré.
4. **Vérification de blocage des uploads sans R2** :
   - Tant que R2 est absent en production, toute tentative d'envoi de fichier vers `/api/admin/upload` ou `/api/quotes` avec pièce jointe renvoie `HTTP 503` sans rien écrire sur le disque local.

---

## 7. Sauvegarde & Restauration D1

- **Export SQL complet depuis Cloudflare D1** :
  ```bash
  npx wrangler d1 export <VOTRE_DATABASE_NAME_EXISTANT> --remote --output=backup-4ever-$(date +%F).sql
  ```
- **Restauration SQL** :
  ```bash
  npx wrangler d1 execute <VOTRE_DATABASE_NAME_EXISTANT> --remote --file=backup-4ever-YYYY-MM-DD.sql
  ```
- **Export JSON complet depuis `/admin`** : onglet **Paramètres & Sécurité** → **Exporter sauvegarde JSON**.

---

## 8. Activation ultérieure de Cloudflare R2

Lorsque vous activerez R2 plus tard dans Cloudflare :
1. Créez les deux buckets séparés `4ever-public-media` (public) et `4ever-private-files` (strictement privé, sans `r2.dev` ni domaine public).
2. Ajoutez `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_PUBLIC_BUCKET="4ever-public-media"` et `CLOUDFLARE_R2_PRIVATE_BUCKET="4ever-private-files"` dans l'environnement serveur.
3. Redémarrez Express : la médiathèque R2, l'import du PDF 2027 et les pièces jointes privées de devis s'activeront automatiquement.
