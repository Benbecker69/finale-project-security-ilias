# ShopSec — branche `vulnerable` ⚠️

> **Version volontairement vulnérable** d'un mini e-commerce (Node.js/Express + Vue 3 + SQLite).
> Elle contient **9 vulnérabilités intentionnelles**, toutes exploitables et documentées, dont
> l'audit complet se trouve dans **[`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)**.
>
> 🚫 **Ne jamais déployer ni exposer publiquement.** Usage strictement pédagogique, en local.

Cette branche est la **partie « offensive »** du projet : on y intègre les failles, on les exploite
et on le prouve. La **partie « défensive »** (corrections + pipeline DevSecOps) est sur la branche
**`secure`**. Le même dépôt contient donc le **cycle complet** *développement vulnérable → audit →
exploitation → correction → sécurisation → pipeline*.

---

## 🧱 Stack technique

- **Backend** : Node.js, Express, **`node:sqlite`** (module SQLite intégré à Node ≥ 22.5), JWT.
- **Frontend** : Vue 3, Vite, Vue Router.
- **Tests** : Vitest + Supertest.

## 📂 Structure du projet

```
backend/      API REST Express + SQLite
  src/
    routes/   auth, products, orders, users, admin   <- les failles sont ici (commentées // VULNERABLE:)
    middleware/  auth (JWT), gestion d'erreurs
    db.js, seed.js, config.js
frontend/     SPA Vue 3 (login, catalogue, avis, commandes, espace admin)
exploits/     run_all.sh + output/  (preuves HTTP : requête, payload, réponse)
screenshots/  captures navigateur des failles + capture de la pipeline
SECURITY_AUDIT.md   rapport d'audit complet (10 sections + 9 fiches de failles)
```

> 💡 **Repère de lecture du code** : dans le backend, chaque faille est signalée par un commentaire
> `// VULNERABLE:` qui explique le problème. Sur la branche `secure`, le correctif correspondant est
> signalé par `// SECURED:`. Comparer un même fichier entre les deux branches montre la correction.

---

## 🚀 Installation & lancement

Prérequis : **Node.js ≥ 22.5** (l'application utilise le module intégré `node:sqlite`) et npm.

### 1) Backend — API sur http://localhost:4000
```bash
cd backend
npm install
npm run seed     # crée et peuple la base SQLite (idempotent : rejouable à volonté)
npm start        # démarre l'API
```

### 2) Frontend — interface sur http://localhost:5173
```bash
cd frontend
npm install
npm run dev
```

Ouvrir ensuite **http://localhost:5173**.

## 👤 Comptes de test

| Rôle  | Email                 | Mot de passe |
|-------|-----------------------|--------------|
| admin | `admin@shopsec.local` | `Admin123!`  |
| user  | `alice@shopsec.local` | `Alice123!`  |
| user  | `bob@shopsec.local`   | `Bob123!`    |

> La **commande #2 appartient à bob** : c'est la cible de la démonstration **IDOR** (alice, connectée
> avec son propre compte, parvient à lire la commande de bob).

## 🧪 Tests
```bash
cd backend && npm test     # 8 tests fonctionnels (santé, login, CRUD, auth requise…)
```

---

## 💥 Reproduire les exploitations (preuves)

Toutes les failles sont **rejouables en une commande**. Avec le backend lancé sur `:4000` :

```bash
bash exploits/run_all.sh
```

Ce script enchaîne les 9 attaques et écrit, pour chacune, la **requête**, le **payload** et la
**réponse serveur** dans `exploits/output/` (un fichier `.txt` par faille). C'est la preuve réseau,
complémentaire des captures d'écran de `screenshots/`.

Pour régénérer les **captures navigateur** (optionnel, nécessite Playwright) :
```bash
cd tools && npm install && npx playwright install chromium
# backend (:4000) + frontend (:5173) lancés, puis :
node screenshots.mjs       # écrit les captures dans screenshots/
```

---

## 🎯 Les 9 vulnérabilités (détail complet dans `SECURITY_AUDIT.md`)

| ID | Faille | Endpoint / zone | Comment la voir rapidement |
|----|--------|-----------------|----------------------------|
| VULN-01 | IDOR / BOLA | `GET /api/orders/:id` | connecté en *alice*, ouvrir `/orders/2` (commande de bob) |
| VULN-02 | Injection SQL | `GET /api/products?search=` | coller le payload `UNION SELECT` dans la recherche produits |
| VULN-03 | Stored XSS | avis produit (`v-html`) | poster un avis `<img src=x onerror=alert(...)>` puis recharger |
| VULN-04 | Authentification faible | `POST /api/auth/login` | messages d'erreur différents (énumération), aucun rate limit |
| VULN-05 | Mass Assignment | `register`, `PUT /api/users/me` | envoyer `"role":"admin"` dans le corps de la requête |
| VULN-06 | Misconfiguration / Information Disclosure | `/api/debug`, erreurs, headers | ouvrir `/api/debug` (secrets), provoquer une erreur (stack trace) |
| VULN-07 | Broken Access Control (admin) | `/api/admin/*` | connecté en *alice*, ouvrir la page **Admin** |
| VULN-08 | CORS permissif | global | requête avec `Origin: https://evil.example`, header reflété |
| VULN-09 | JWT non sécurisé | auth | secret faible `secret123`, token sans expiration, stocké en `localStorage` |

---

## 📸 À propos des preuves (pas de Burp Suite)

Le sujet suggère des captures **Burp Suite**. Ce projet a été réalisé sur un **poste RDP
d'entreprise**, qui est mon **unique environnement de travail**, sur lequel je **n'ai pas les droits
administrateur** pour installer **Burp Suite** ni le **runtime Java** qui lui est indispensable. Burp
n'a donc pas pu être utilisé.

Les preuves sont fournies de façon **équivalente et reproductible** : **captures navigateur**
(`screenshots/`, résultat des attaques) + **requêtes/réponses HTTP** complètes avec payloads
(`exploits/output/`, rejouables via `exploits/run_all.sh`). On retrouve donc, pour chaque faille
importante, la **requête, le payload et la réponse** attendus — seul l'outil de capture diffère.
Voir **§9 du [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)**.

---

## 📑 Documents

- **[`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)** — rapport d'audit complet : pour chaque faille,
  cause, exploitation, preuve, impact, criticité, correction (branche `secure`) et validation.
- **`screenshots/`** — preuves visuelles (voir `screenshots/README.md`).
- **`exploits/output/`** — preuves HTTP (requête / payload / réponse).
