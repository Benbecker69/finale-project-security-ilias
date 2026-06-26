# ShopSec — branche `secure` ✅

> **Version corrigée et sécurisée** du mini e-commerce (Node.js/Express + Vue 3 + SQLite).
> **Chaque** vulnérabilité de la branche `vulnerable` est corrigée **à la cause profonde**, et une
> **pipeline DevSecOps** (GitHub Actions) automatise les contrôles de sécurité à chaque `push`.
>
> Correspondance détaillée *faille → correction → validation* : **[`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)**.

Cette branche est la **partie « défensive »** du projet. Elle se lit en regard de la branche
`vulnerable` (partie offensive) : pour chaque faille, on y trouve le **correctif** et la **preuve**
qu'il fonctionne (tests de non-régression + pipeline). Dans le code, les correctifs sont signalés par
des commentaires `// SECURED:` (en face des `// VULNERABLE:` de l'autre branche).

---

## 🧱 Stack technique

- **Backend** : Node.js, Express, **`node:sqlite`**, JWT (`jsonwebtoken@9`), **bcryptjs** (hachage),
  **Helmet** (en-têtes de sécurité / CSP), **express-rate-limit** (anti brute force).
- **Frontend** : Vue 3, Vite, Vue Router.
- **Tests** : Vitest + Supertest — **fonctionnels + non-régression sécurité**.

## 🚀 Installation & lancement

Prérequis : **Node.js ≥ 22.5** (l'application utilise le module intégré `node:sqlite`) et npm.

### 1) Backend — API sur http://localhost:4000
```bash
cd backend
cp .env.example .env       # puis renseigner un JWT_SECRET fort :
                           # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm install
npm run seed               # crée la base SQLite (mots de passe hachés avec bcrypt)
npm start
```
> **Note** : contrairement à la branche `vulnerable`, le fichier `.env` n'est **pas committé**
> (les secrets ne doivent pas l'être). Sans `.env`, le serveur démarre quand même en générant un
> **secret éphémère** (utile en développement uniquement).

### 2) Frontend — interface sur http://localhost:5173
```bash
cd frontend
npm install
npm run dev
```

## 👤 Comptes de test

| Rôle  | Email                 | Mot de passe |
|-------|-----------------------|--------------|
| admin | `admin@shopsec.local` | `Admin123!`  |
| user  | `alice@shopsec.local` | `Alice123!`  |
| user  | `bob@shopsec.local`   | `Bob123!`    |

## 🧪 Tests
```bash
cd backend && npm test     # 16 tests : 5 fonctionnels + 11 de non-régression sécurité
```
Les **tests de non-régression** vérifient que les corrections tiennent : IDOR → `404`, route admin
pour un *user* → `403`, payload SQLi → 0 ligne, `role:"admin"` ignoré, `/api/debug` → `404`, absence
du champ `password` dans les réponses, en-têtes de sécurité présents, token forgé avec l'ancien secret
→ `401`, etc.

---

## 🛡️ Corrections appliquées (cause profonde, pas un simple filtrage de payload)

| Faille (`vulnerable`) | Correction (`secure`) |
|-----------------------|------------------------|
| IDOR / BOLA | contrôle d'**ownership** en base : `WHERE id = ? AND user_id = ?` → `404` |
| Injection SQL | **requêtes paramétrées** (prepared statements) — l'entrée ne peut plus altérer le SQL |
| Stored XSS | rendu **texte** (suppression de `v-html`, interpolation `{{ }}`) + **CSP** via Helmet |
| Authentification faible | **bcrypt** (salé), **rate limiting**, message d'erreur **générique**, **expiration** du token |
| Mass Assignment | **whitelist** des champs autorisés ; `role` **jamais** accepté depuis le client |
| Misconfig / Information Disclosure | **suppression** de `/api/debug`, **Helmet** (CSP/HSTS/X-Frame-Options…), erreurs **génériques**, aucun hash de mot de passe exposé |
| Broken Access Control (admin) | middleware **`requireAdmin`** sur toutes les routes sensibles |
| CORS permissif | **allowlist** d'origines explicite (plus de reflet de n'importe quelle origine) |
| JWT non sécurisé | **secret fort** via variable d'environnement (non committé) + **expiration** du token |

> Chaque correction est tracée dans le code par un commentaire `// SECURED:` et détaillée
> (avec extrait avant/après + validation) dans **`SECURITY_AUDIT.md` §6**.

---

## ⚙️ Pipeline DevSecOps — `.github/workflows/security.yml`

Déclenchée automatiquement sur `push` / `pull_request`. Elle **installe les dépendances, lance les
tests** puis exécute les contrôles de sécurité, et **échoue en cas de faille critique ou de secret
détecté** :

| Job | Outil | Rôle | Bloquant |
|-----|-------|------|----------|
| Application tests | Vitest + build Vue | vérifier que l'app fonctionne | ✅ |
| SAST | **Semgrep** (`p/owasp-top-ten`, `p/javascript`) | analyser le code source | ✅ (sévérité ERROR) |
| SCA | **npm audit** (`--omit=dev --audit-level=high`) | analyser les dépendances | ✅ |
| Secret scanning | **Gitleaks** (config `.gitleaks.toml`) | détecter les secrets exposés | ✅ |
| DAST | **OWASP ZAP baseline** | tester l'app en fonctionnement | ⚠️ (rapport) |

➡️ État et logs des exécutions : onglet **[Actions](https://github.com/Benbecker69/finale-project-security-ilias/actions)**
du dépôt. Résultats détaillés (avec chiffres réels) : **[`SECURITY_AUDIT.md` §8](./SECURITY_AUDIT.md)**.

---

## 📂 Structure

```
backend/    API REST sécurisée (Express, SQLite, JWT, bcrypt, Helmet, rate-limit)
frontend/   SPA Vue 3 (avis rendus en texte, plus de v-html)
.github/workflows/security.yml   pipeline DevSecOps
.gitleaks.toml                   configuration du secret scanning
SECURITY_AUDIT.md                rapport d'audit complet (10 sections + 9 fiches)
screenshots/ , exploits/         preuves de la version vulnérable (référence)
```

> **À propos des preuves (pas de Burp Suite)** : le projet ayant été réalisé sur un **poste RDP
> d'entreprise** sans droits administrateur pour installer **Burp Suite** ni **Java**, les preuves
> d'exploitation sont fournies via captures navigateur et requêtes/réponses HTTP reproductibles.
> Détails en **§9 du `SECURITY_AUDIT.md`**.
