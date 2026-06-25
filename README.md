# ShopSec — Application vulnérable, sécurisation & pipeline DevSecOps

> Projet d'évaluation **Sécurité web avancée**. Cycle complet de sécurité applicative :
> développement vulnérable → audit → exploitation → documentation → correction →
> sécurisation → pipeline DevSecOps.

**ShopSec** est un mini e-commerce (gestion de produits, commandes, avis) développé en
**Node.js / Express** (API REST) + **Vue 3** (interface), volontairement décliné en deux
versions afin de démontrer une compréhension **offensive et défensive** de la sécurité web.

## 📦 Organisation du dépôt (branches)

| Branche | Contenu |
|---------|---------|
| `main` | Présentation, plan de travail (`CLAUDE.md`), ce README. |
| `vulnerable` | Application **volontairement vulnérable** (≥ 6 failles) + audit + preuves. |
| `secure` | Application **corrigée et sécurisée** + **pipeline CI/CD DevSecOps**. |

```bash
git clone https://github.com/Benbecker69/finale-project-security-ilias.git
cd finale-project-security-ilias

git checkout vulnerable   # voir la version vulnérable
git checkout secure       # voir la version sécurisée + pipeline
```

## 📚 Documents clés

- **`SECURITY_AUDIT.md`** (branches `vulnerable` / `secure`) — rapport d'audit complet :
  liste des vulnérabilités, fiches détaillées (cause, exploitation, preuve, impact,
  criticité, correction, validation), pipeline et résultats de scans.
- **`README.md`** de chaque branche — installation, lancement, comptes de test.
- **`screenshots/`** — preuves d'exploitation.

## 🧱 Stack technique

- **Backend** : Node.js, Express, better-sqlite3 (SQLite), JWT.
- **Frontend** : Vue 3, Vite, Vue Router, Pinia.
- **Tests** : Vitest + Supertest.
- **Pipeline (secure)** : GitHub Actions — Semgrep (SAST), npm audit (SCA),
  Gitleaks (secret scanning), OWASP ZAP baseline (DAST), tests applicatifs.

## 🎯 Vulnérabilités couvertes (branche `vulnerable`)

1. Broken Access Control / **IDOR / BOLA**
2. **Injection SQL**
3. **Stored XSS**
4. **Authentification faible** (secret JWT faible, pas d'expiration, brute force, messages révélateurs)
5. **Mass Assignment** (élévation de privilège via `role`)
6. **Security Misconfiguration / Information Disclosure**
7. *(bonus)* Broken Access Control sur routes admin
8. *(bonus)* Mauvaise configuration **CORS**
9. *(bonus)* Stockage de token non sécurisé (`localStorage`) / JWT faible

➡️ Détails, exploitation et corrections : voir **`SECURITY_AUDIT.md`**.

---

> ⚠️ **Avertissement** : la branche `vulnerable` contient des failles **intentionnelles**.
> Ne jamais déployer cette version en production ni l'exposer publiquement. Usage strictement
> pédagogique, en local.
