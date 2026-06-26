# ShopSec — Application vulnérable, sécurisation & pipeline DevSecOps

[![DevSecOps Security Pipeline](https://github.com/Benbecker69/finale-project-security-ilias/actions/workflows/security.yml/badge.svg?branch=secure)](https://github.com/Benbecker69/finale-project-security-ilias/actions/workflows/security.yml)

> **Projet d'évaluation « Sécurité web avancée ».** Cycle complet de sécurité applicative :
> développement vulnérable → audit → exploitation → documentation → correction →
> sécurisation → pipeline DevSecOps.

**ShopSec** est un mini e-commerce (produits, commandes, avis) en **Node.js / Express** (API REST)
+ **Vue 3** (interface), volontairement décliné en deux versions pour démontrer une compréhension
**offensive et défensive** de la sécurité web.

---

## 🧭 POUR LE CORRECTEUR — comment lire ce dépôt en 1 minute

Ce dépôt est organisé en **3 branches**. La branche `main` (celle-ci) est volontairement une simple
**page d'accueil** : tout le code et les preuves sont sur `vulnerable` et `secure`.

| Branche | Ce qu'elle contient | Aller voir en priorité |
|---------|---------------------|------------------------|
| **`main`** | Présentation + ce guide d'évaluation | ce README |
| **`vulnerable`** | App **volontairement vulnérable** (9 failles) + audit + preuves | le rapport + `screenshots/` |
| **`secure`** | App **corrigée** (cause profonde) + **pipeline CI/CD** | le rapport + `.github/workflows/` + l'onglet **Actions** |

### 🔗 Liens directs (cliquables, sans rien installer)

- 📄 **Rapport d'audit complet** (le document central, 10 sections + 9 fiches de failles) :
  [`SECURITY_AUDIT.md` (branche secure)](https://github.com/Benbecker69/finale-project-security-ilias/blob/secure/SECURITY_AUDIT.md)
- 🖼️ **Captures / preuves** :
  [`screenshots/` (branche vulnerable)](https://github.com/Benbecker69/finale-project-security-ilias/tree/vulnerable/screenshots)
- 💥 **Scripts d'exploitation + preuves HTTP** :
  [`exploits/` (branche vulnerable)](https://github.com/Benbecker69/finale-project-security-ilias/tree/vulnerable/exploits)
- ⚙️ **Pipeline DevSecOps** :
  [`.github/workflows/security.yml`](https://github.com/Benbecker69/finale-project-security-ilias/blob/secure/.github/workflows/security.yml)
  · [**Exécutions (Actions)**](https://github.com/Benbecker69/finale-project-security-ilias/actions)
- 🟥 **Code vulnérable** vs 🟩 **code corrigé** : comparer la même route sur les deux branches, ex.
  [`orders.routes.js` vulnerable](https://github.com/Benbecker69/finale-project-security-ilias/blob/vulnerable/backend/src/routes/orders.routes.js)
  vs [`orders.routes.js` secure](https://github.com/Benbecker69/finale-project-security-ilias/blob/secure/backend/src/routes/orders.routes.js).
  > Astuce : dans le code, les failles sont commentées `// VULNERABLE:` et les correctifs `// SECURED:`.

### ✅ Grille d'évaluation → où trouver chaque point

| Critère du barème | Où le voir |
|-------------------|------------|
| Application fonctionnelle | branches `vulnerable`/`secure` : `backend/` + `frontend/` ; comptes de test ci-dessous |
| Version vulnérable (≥ 6 failles cohérentes) | branche `vulnerable` ; tableau des 9 failles ci-dessous |
| Audit personnel & explications | `SECURITY_AUDIT.md` §6 (fiches VULN-01 → VULN-09) |
| Captures & preuves d'exploitation | `screenshots/` + `exploits/output/` |
| Version sécurisée & corrections efficaces | branche `secure` (marqueurs `// SECURED:`) + tests de non-régression |
| Pipeline sécurité DevSecOps | `.github/workflows/security.yml` + onglet **Actions** (run **vert**) |
| Qualité dépôt Git / README / organisation | historique de commits taggés, ce README, README par branche |
| Qualité globale du rapport | `SECURITY_AUDIT.md` (Markdown structuré) |

---

## 🛡️ Les 9 vulnérabilités (≥ 6 obligatoires + 3 bonus)

| ID | Faille | OWASP | Corrigée sur `secure` par |
|----|--------|-------|---------------------------|
| VULN-01 | IDOR / BOLA | A01 / API1 | contrôle d'ownership (`WHERE id=? AND user_id=?`) |
| VULN-02 | Injection SQL | A03 | requêtes paramétrées |
| VULN-03 | Stored XSS | A03 | rendu texte (plus de `v-html`) + CSP |
| VULN-04 | Authentification faible | A07 | bcrypt, rate limiting, message générique, expiration token |
| VULN-05 | Mass Assignment (élévation `role`) | A04 / API6 | whitelist des champs |
| VULN-06 | Misconfiguration / Information Disclosure | A05 / A09 | Helmet, erreurs génériques, suppression `/api/debug` |
| VULN-07 | Broken Access Control (admin) | A01 / API5 | middleware `requireAdmin` |
| VULN-08 | CORS permissif | A05 | allowlist d'origines |
| VULN-09 | JWT non sécurisé (secret faible, pas d'exp., localStorage) | A02 / A07 | secret via env, expiration |

➡️ Détail complet (cause, exploitation, impact, criticité, validation) dans **`SECURITY_AUDIT.md`**.

---

## ⚙️ Pipeline DevSecOps (branche `secure`) — exécutée et **verte** ✅

`.github/workflows/security.yml`, déclenchée sur `push` / `pull_request` :

| Job | Outil | Bloquant |
|-----|-------|----------|
| Tests applicatifs | Vitest + build Vue | ✅ |
| SAST | Semgrep (`p/owasp-top-ten`, `p/javascript`) | ✅ (sévérité ERROR) |
| SCA | npm audit (`--omit=dev --audit-level=high`) | ✅ |
| Secret scanning | Gitleaks | ✅ |
| DAST | OWASP ZAP baseline | ⚠️ (rapport) |

---

## 🚀 Lancer le projet (sur `vulnerable` ou `secure`)

Prérequis : **Node.js ≥ 22.5** (l'app utilise le module intégré `node:sqlite`).

```bash
git clone https://github.com/Benbecker69/finale-project-security-ilias.git
cd finale-project-security-ilias

git checkout vulnerable        # ou : git checkout secure

# Terminal 1 — API (http://localhost:4000)
cd backend && npm install && npm run seed && npm start

# Terminal 2 — interface (http://localhost:5173)
cd frontend && npm install && npm run dev
```

> Chaque branche possède son propre **README** détaillé (installation, exploitation, corrections).

### 👤 Comptes de test

| Rôle  | Email                 | Mot de passe |
|-------|-----------------------|--------------|
| admin | `admin@shopsec.local` | `Admin123!`  |
| user  | `alice@shopsec.local` | `Alice123!`  |
| user  | `bob@shopsec.local`   | `Bob123!`    |

> La **commande #2 appartient à bob** : cible de la démonstration IDOR (alice y accède sur `vulnerable`,
> reçoit `404` sur `secure`).

---

## 🧱 Stack & arborescence (branches `vulnerable` / `secure`)

- **Backend** : Node.js, Express, `node:sqlite`, JWT. *(secure : + bcryptjs, Helmet, express-rate-limit)*
- **Frontend** : Vue 3, Vite, Vue Router.
- **Tests** : Vitest + Supertest. **Pipeline** : GitHub Actions (Semgrep, npm audit, Gitleaks, OWASP ZAP).

```
backend/      API REST (auth, products, orders, reviews, admin)
frontend/     SPA Vue 3
exploits/     scripts d'exploitation + preuves HTTP (output/)
screenshots/  captures navigateur + capture de la pipeline
.github/workflows/security.yml   pipeline DevSecOps   (branche secure)
SECURITY_AUDIT.md                rapport d'audit complet
```

## ⚠️ Note sur les captures (transparence)

Le sujet suggère des captures *Burp Suite*. L'environnement de réalisation étant **headless** (sans
interface graphique), les preuves sont fournies via des **captures navigateur automatisées (Playwright)**
et des **requêtes/réponses HTTP reproductibles (curl)** — équivalentes et rejouables avec les mêmes
payloads. Voir `SECURITY_AUDIT.md` §9 (Limites).

> 🚫 **Avertissement** : la branche `vulnerable` contient des failles **intentionnelles**.
> Ne jamais la déployer ni l'exposer publiquement — usage strictement pédagogique, en local.
