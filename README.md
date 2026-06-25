# ShopSec — branche `secure` ✅

> **Version corrigée et sécurisée** du mini e-commerce (Node.js/Express + Vue 3 + SQLite).
> Chaque vulnérabilité de la branche `vulnerable` est corrigée **à la racine**, et une
> **pipeline DevSecOps** (GitHub Actions) automatise les contrôles de sécurité.
>
> Audit complet et correspondance faille → correction → validation :
> [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).

## 🧱 Stack

- **Backend** : Node.js 24, Express, `node:sqlite`, JWT (`jsonwebtoken@9`), **bcryptjs**,
  **Helmet**, **express-rate-limit**.
- **Frontend** : Vue 3, Vite, Vue Router.
- **Tests** : Vitest + Supertest (fonctionnels **+ non-régression sécurité**).

## 🚀 Installation & lancement

Prérequis : **Node.js ≥ 20**, npm.

### 1) Backend (port 4000)
```bash
cd backend
cp .env.example .env       # puis renseigner un JWT_SECRET fort :
                           # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm install
npm run seed               # crée la base SQLite (mots de passe hachés bcrypt)
npm start                  # API : http://localhost:4000
```
> Sans `.env`, le serveur démarre quand même en générant un secret éphémère (dev only).

### 2) Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev                # SPA : http://localhost:5173
```

## 👤 Comptes de test

| Rôle  | Email                 | Mot de passe |
|-------|-----------------------|--------------|
| admin | `admin@shopsec.local` | `Admin123!`  |
| user  | `alice@shopsec.local` | `Alice123!`  |
| user  | `bob@shopsec.local`   | `Bob123!`    |

## 🧪 Tests
```bash
cd backend && npm test     # 16 tests (5 fonctionnels + 11 non-régression sécurité)
```

## 🛡️ Corrections appliquées (résumé)

| Faille (vulnerable) | Correction (secure) |
|---------------------|----------------------|
| IDOR / BOLA | contrôle d'ownership en base (`WHERE id=? AND user_id=?`) |
| Injection SQL | requêtes **paramétrées** (prepared statements) |
| Stored XSS | rendu **texte** (plus de `v-html`) + **CSP** (Helmet) |
| Auth faible | **bcrypt**, **rate limiting**, message générique, **expiration** du token |
| Mass Assignment | **whitelist** des champs ; `role` jamais accepté du client |
| Misconfig / Info Disclosure | suppression `/api/debug`, **Helmet** (CSP/HSTS/X-Frame…), erreurs génériques, aucun hash exposé |
| Broken Access Control (admin) | middleware **`requireAdmin`** |
| CORS permissif | **allowlist** d'origines explicite |
| JWT non sécurisé | secret fort via env, **expiration**, secret non committé |

## ⚙️ Pipeline DevSecOps — `.github/workflows/security.yml`

Déclenchée sur `push` / `pull_request`. Jobs :

| Job | Outil | Bloquant |
|-----|-------|----------|
| Application tests | Vitest + build Vue | ✅ |
| SAST | **Semgrep** (`p/owasp-top-ten`, `p/javascript`) | ✅ (sévérité ERROR) |
| SCA | **npm audit** (`--omit=dev --audit-level=high`) | ✅ |
| Secret scanning | **Gitleaks** (config `.gitleaks.toml`) | ✅ |
| DAST | **OWASP ZAP baseline** | ⚠️ (rapport) |

> Résultats détaillés des scans : [`SECURITY_AUDIT.md` §8](./SECURITY_AUDIT.md).

---

## 📂 Structure

```
backend/    API REST sécurisée (Express, SQLite, JWT, bcrypt, Helmet, rate-limit)
frontend/   SPA Vue 3 (rendu texte des avis, plus de v-html)
.github/workflows/security.yml   pipeline DevSecOps
.gitleaks.toml                   config secret scanning
SECURITY_AUDIT.md                rapport d'audit complet
screenshots/ , exploits/         preuves de la version vulnérable (référence)
```
