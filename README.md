# ShopSec — branche `vulnerable` ⚠️

> **Version volontairement vulnérable** d'un mini e-commerce (Node.js/Express + Vue 3 + SQLite).
> Contient **9 vulnérabilités intentionnelles** exploitables, documentées dans
> [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).
>
> 🚫 **Ne jamais déployer ni exposer publiquement.** Usage pédagogique, en local uniquement.

La version corrigée + la pipeline DevSecOps sont sur la branche **`secure`**.

---

## 🧱 Stack

- **Backend** : Node.js 24, Express, `node:sqlite` (SQLite intégré), JWT.
- **Frontend** : Vue 3, Vite, Vue Router.
- **Tests** : Vitest + Supertest.

## 📂 Structure

```
backend/    API REST Express + SQLite (auth, products, orders, reviews, admin)
frontend/   SPA Vue 3 (login, catalogue, avis, commandes, espace admin)
exploits/   scripts d'exploitation reproductibles + preuves HTTP (output/)
screenshots/ captures navigateur des failles
```

## 🚀 Installation & lancement

Prérequis : **Node.js ≥ 20** (testé sur Node 24) et npm.

### 1) Backend (port 4000)
```bash
cd backend
npm install
npm run seed     # crée et peuple la base SQLite (idempotent)
npm start        # API : http://localhost:4000
```

### 2) Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev      # SPA : http://localhost:5173
```

Ouvrir http://localhost:5173.

## 👤 Comptes de test

| Rôle  | Email                 | Mot de passe |
|-------|-----------------------|--------------|
| admin | `admin@shopsec.local` | `Admin123!`  |
| user  | `alice@shopsec.local` | `Alice123!`  |
| user  | `bob@shopsec.local`   | `Bob123!`    |

> La **commande #2 appartient à bob** (cible de la démonstration IDOR par alice).

## 🧪 Tests
```bash
cd backend && npm test     # 8 tests fonctionnels
```

## 💥 Rejouer les exploitations

Avec le backend lancé sur `:4000` :
```bash
bash exploits/run_all.sh   # preuves générées dans exploits/output/
```

Captures navigateur (optionnel, nécessite Playwright) :
```bash
cd tools && npm install && npx playwright install chromium
# backend :4000 + frontend :5173 lancés, puis :
node screenshots.mjs       # captures dans screenshots/
```

## 🎯 Vulnérabilités (voir `SECURITY_AUDIT.md` pour le détail)

| ID | Faille | Endpoint / zone |
|----|--------|-----------------|
| VULN-01 | IDOR / BOLA | `GET /api/orders/:id` |
| VULN-02 | Injection SQL | `GET /api/products?search=` |
| VULN-03 | Stored XSS | avis produit (`v-html`) |
| VULN-04 | Authentification faible | `POST /api/auth/login` |
| VULN-05 | Mass Assignment (élévation de privilège) | `register`, `PUT /api/users/me` |
| VULN-06 | Misconfiguration / Information Disclosure | `/api/debug`, erreurs, headers |
| VULN-07 | Broken Access Control (admin) | `/api/admin/*` |
| VULN-08 | CORS permissif | global |
| VULN-09 | JWT non sécurisé (secret faible, pas d'expiration, localStorage) | auth |

---

## 📑 Documents

- [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) — rapport d'audit complet (cause, exploitation,
  preuve, impact, criticité, correction, validation).
- `screenshots/` — preuves visuelles. `exploits/output/` — preuves HTTP.
