# Rapport d'audit sécurité — ShopSec

> Projet « Application vulnérable, sécurisation et pipeline DevSecOps ».
> Application : **ShopSec**, un mini e-commerce (Node.js/Express + Vue 3 + SQLite).
> Deux branches : **`vulnerable`** (failles intentionnelles) et **`secure`** (corrigée + pipeline CI/CD).

---

## 1. Présentation du projet

ShopSec est une petite application e-commerce permettant de :

- s'inscrire / se connecter (authentification JWT) ;
- consulter un catalogue de **produits** et leurs **avis** (reviews) ;
- passer et consulter ses **commandes** ;
- accéder à un **espace administrateur** (gestion des utilisateurs et produits).

L'application existe en deux versions dans le même dépôt Git :

| Branche | Rôle |
|---------|------|
| `vulnerable` | Version volontairement vulnérable, contenant **9 failles** exploitables et documentées. |
| `secure` | Version corrigée (cause profonde de chaque faille) + **pipeline DevSecOps** (SAST, SCA, secret scanning, DAST, tests). |

Deux rôles applicatifs : **`user`** et **`admin`**.

L'objectif n'est pas la richesse fonctionnelle mais la **qualité de la logique de sécurité** :
montrer le cycle complet *faille → exploitation → impact → correction → validation → pipeline*.

---

## 2. Architecture de l'application

```
finale-project-security-ilias/
├── backend/                  # API REST Node.js / Express
│   ├── src/
│   │   ├── server.js         # point d'entrée (auto-seed si DB vide)
│   │   ├── app.js            # app Express, CORS, montage des routes
│   │   ├── config.js         # configuration (.env)
│   │   ├── db.js             # node:sqlite (SQLite), schéma
│   │   ├── seed.js           # données de démo + comptes de test
│   │   ├── middleware/       # auth (JWT), gestion d'erreurs
│   │   ├── routes/           # auth, products, orders, users, admin
│   │   └── utils/crypto.js   # hachage des mots de passe
│   └── tests/                # tests applicatifs (Vitest + Supertest)
├── frontend/                 # SPA Vue 3 (Vite, Vue Router)
│   └── src/{views,store,api,router}
├── exploits/                 # scripts d'exploitation reproductibles + preuves
├── screenshots/              # captures navigateur
└── .github/workflows/        # pipeline sécurité (branche secure)
```

**Stack technique**

- **Backend** : Node.js 24, Express 4, `node:sqlite` (SQLite intégré), `jsonwebtoken`.
- **Frontend** : Vue 3, Vite, Vue Router.
- **Tests** : Vitest + Supertest.
- **Pipeline (secure)** : GitHub Actions — Semgrep (SAST), `npm audit` (SCA),
  Gitleaks (secret scanning), OWASP ZAP baseline (DAST), tests applicatifs.

**Modèle de données** : `users`, `products`, `orders`, `order_items`, `reviews`.

**Schéma d'architecture**

```
[ Vue 3 SPA ] --(fetch JSON, Bearer JWT)--> [ Express REST API ] --> [ SQLite ]
   :5173                                          :4000
```

---

## 3. Installation et lancement

### Prérequis
- Node.js ≥ 20 (testé sur Node 24), npm.

### Backend
```bash
cd backend
npm install
npm run seed      # crée et peuple la base SQLite (idempotent)
npm start         # API sur http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # SPA sur http://localhost:5173
```

### Comptes de test (seed)

| Rôle  | Email                  | Mot de passe |
|-------|------------------------|--------------|
| admin | `admin@shopsec.local`  | `Admin123!`  |
| user  | `alice@shopsec.local`  | `Alice123!`  |
| user  | `bob@shopsec.local`    | `Bob123!`    |

> La **commande #2 appartient à bob** : c'est la cible de la démonstration IDOR (alice y accède).

### Rejouer les exploitations
```bash
# backend lancé sur :4000
bash exploits/run_all.sh        # génère les preuves dans exploits/output/
```

---

## 4. Organisation Git

- **`main`** : présentation et README d'overview.
- **`vulnerable`** : application vulnérable + audit + preuves.
- **`secure`** : application corrigée + pipeline DevSecOps.

Convention de commits : messages en anglais avec un **tag entre crochets**
(`[feat]`, `[vuln]`, `[fix]`, `[ci]`, `[docs]`, `[chore]`, `[test]`). Exemples :

```
[feat] add ShopSec backend: Express REST API, SQLite, JWT auth, CRUD
[vuln] intentional IDOR on GET /api/orders/:id
[fix]  enforce ownership on order endpoint
[fix]  sanitize review rendering and add CSP
[ci]   add DevSecOps security pipeline
```

Traçabilité dans le code : chaque faille est marquée `// VULNERABLE:` (branche `vulnerable`)
et sa correction `// SECURED:` (branche `secure`).

---

## 5. Liste des vulnérabilités intégrées

La branche `vulnerable` contient **9 vulnérabilités** (≥ 6 obligatoires + 3 bonus).

| ID | Vulnérabilité | Catégorie OWASP | Criticité |
|----|---------------|-----------------|-----------|
| VULN-01 | IDOR / BOLA sur consultation de commande | A01:2021 / API1:2023 | Élevée |
| VULN-02 | Injection SQL sur la recherche produits | A03:2021 | **Critique** |
| VULN-03 | Stored XSS sur les avis produit | A03:2021 (XSS) | Élevée |
| VULN-04 | Authentification faible (énumération, brute force, hash faible) | A07:2021 | Élevée |
| VULN-05 | Mass Assignment → élévation de privilège | A04:2021 / API6 | **Critique** |
| VULN-06 | Security Misconfiguration / Information Disclosure | A05:2021 / A09 | Élevée |
| VULN-07 | Broken Access Control sur routes admin | A01:2021 / API5:2023 | Élevée |
| VULN-08 | Mauvaise configuration CORS | A05:2021 | Moyenne |
| VULN-09 | Token JWT non sécurisé (secret faible, pas d'expiration, localStorage) | A02/A07:2021 | **Critique** |

Failles obligatoires couvertes : Broken Access Control/IDOR (01, 07), Injection (02),
XSS (03), Authentification faible (04), Mass Assignment (05), Misconfiguration/Info
Disclosure (06). Bonus : CORS (08), JWT/stockage token (09).

---

## 6. Audit détaillé des vulnérabilités

> Pour chaque faille : preuve HTTP dans `exploits/output/` et capture dans `screenshots/`.

---

### VULN-01 — IDOR / BOLA sur la consultation de commande

- **Type** : Broken Access Control / IDOR / BOLA — A01:2021, API1:2023.
- **Endpoint concerné** : `GET /api/orders/:id`
- **Description** : un utilisateur authentifié peut consulter **n'importe quelle**
  commande à partir de son identifiant, y compris celles d'autres utilisateurs.
- **Cause technique** : la commande est récupérée uniquement par son `id`, sans contrôle
  de propriété (ownership).
  ```js
  // backend/src/routes/orders.routes.js (VULNERABLE)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  // aucune vérification order.user_id === req.user.id
  ```
- **Exploitation** : alice (user_id=2) lit la commande #2 qui appartient à bob (user_id=3).
  ```http
  GET /api/orders/2 HTTP/1.1
  Authorization: Bearer <token_alice>
  ```
- **Preuve** : `screenshots/vuln-01-idor.png`, `exploits/output/vuln-01-idor.txt`
  ```json
  { "id": 2, "user_id": 3, "status": "paid", "total": 259, "items": [ ... ] }
  ```
  (réponse contenant la commande de bob alors que le token est celui d'alice).
- **Impact** : fuite de données personnelles (historique d'achat, montants), risque RGPD,
  perte de confiance. Énumération possible de toutes les commandes.
- **Criticité** : **Élevée**.
- **Correction appliquée (secure)** : contrôle d'ownership dans la requête.
  ```js
  // SECURED
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
                  .get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  ```
- **Validation après correction** : `GET /api/orders/2` avec le token d'alice renvoie
  désormais **404 Not Found**. alice ne voit que ses propres commandes.

---

### VULN-02 — Injection SQL sur la recherche de produits

- **Type** : Injection — A03:2021.
- **Endpoint concerné** : `GET /api/products?search=`
- **Description** : le terme de recherche est concaténé directement dans la requête SQL.
- **Cause technique** :
  ```js
  // backend/src/routes/products.routes.js (VULNERABLE)
  sql += ` WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`;
  db.prepare(sql).all();
  ```
- **Exploitation** : une injection `UNION SELECT` exfiltre la table `users`
  (la table `products` a 7 colonnes) :
  ```
  ?search=zzz' UNION SELECT id, username, email, password, role, 'x', created_at FROM users --
  ```
- **Preuve** : `screenshots/vuln-02-sqli.png`, `exploits/output/vuln-02-sqli.txt` — la réponse
  liste les comptes avec leurs **hash de mots de passe** (mappés sur `price`) et leur `role`.
- **Impact** : exfiltration complète de la base (identifiants, hashes, rôles), pouvant mener
  à une compromission totale. **Impact métier majeur** (fuite de données clients).
- **Criticité** : **Critique**.
- **Correction appliquée (secure)** : requête **paramétrée** (prepared statement) + validation.
  ```js
  // SECURED
  const like = `%${String(search ?? '')}%`;
  db.prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ?').all(like, like);
  ```
- **Validation après correction** : le payload `UNION SELECT` est traité comme une chaîne
  littérale ; la requête ne renvoie aucun produit et **aucune donnée `users` n'est exposée**.

---

### VULN-03 — Stored XSS sur les avis produit

- **Type** : Cross-Site Scripting (stocké) — A03:2021.
- **Endpoint / zone** : `POST /api/products/:id/reviews` (stockage) + page de détail produit
  (rendu `v-html`).
- **Description** : le contenu d'un avis est stocké brut et rendu en HTML via `v-html` dans
  la SPA, ce qui exécute tout script injecté pour chaque visiteur du produit.
- **Cause technique** :
  ```vue
  <!-- frontend/src/views/ProductDetailView.vue (VULNERABLE) -->
  <div v-html="r.content"></div>
  ```
  (côté backend, aucune sanitization n'est appliquée au stockage.)
- **Exploitation** : poster un avis contenant
  ```html
  <img src=x onerror="alert('XSS! token='+localStorage.getItem('token'))">
  ```
- **Preuve** : `screenshots/vuln-03-xss.png` (HTML injecté rendu) ; le script de capture a
  intercepté la boîte de dialogue JavaScript :
  ```
  XSS! token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
  → le payload **lit le JWT dans `localStorage`** (cf. VULN-09).
- **Impact** : vol de session/token, actions au nom de la victime, défiguration, propagation
  (stored = persistant pour tous les visiteurs).
- **Criticité** : **Élevée**.
- **Correction appliquée (secure)** :
  1. rendu **texte** (suppression de `v-html`, interpolation `{{ }}` qui échappe) ;
  2. sanitization/validation côté backend ;
  3. en-tête **Content-Security-Policy** (Helmet) en défense en profondeur.
  ```vue
  <!-- SECURED -->
  <div>{{ r.content }}</div>
  ```
- **Validation après correction** : le payload s'affiche en **texte brut** (`&lt;img ...&gt;`),
  aucun script ne s'exécute, la CSP bloque l'exécution inline.

---

### VULN-04 — Authentification faible

- **Type** : Identification and Authentication Failures — A07:2021.
- **Endpoint concerné** : `POST /api/auth/login` (+ hachage des mots de passe).
- **Description** : plusieurs faiblesses cumulées :
  - **énumération d'utilisateurs** (messages d'erreur distincts) ;
  - **aucun rate limiting** (brute force possible) ;
  - **hachage faible** (SHA-256 sans sel, rapide) ;
  - tokens faibles (cf. VULN-09).
- **Cause technique** :
  ```js
  // auth.routes.js (VULNERABLE)
  if (!user)  return res.status(401).json({ error: 'No account found for this email' });
  if (!verifyPassword(...)) return res.status(401).json({ error: 'Incorrect password' });
  // utils/crypto.js : sha256(plain) sans sel
  ```
- **Exploitation** :
  ```
  email inconnu  -> "No account found for this email"   (le compte n'existe pas)
  email connu    -> "Incorrect password"                (le compte existe)
  20 tentatives rapides -> 20 réponses 401 (aucun blocage)
  ```
- **Preuve** : `exploits/output/vuln-04-weak-auth.txt`.
- **Impact** : cartographie des comptes valides, brute force des mots de passe, cracking
  hors-ligne des hashes non salés en cas de fuite (cf. VULN-02).
- **Criticité** : **Élevée**.
- **Correction appliquée (secure)** :
  - **message générique unique** (« Invalid credentials ») ;
  - **rate limiting** sur `/api/auth/login` (`express-rate-limit`) ;
  - **bcrypt** (salé, lent) pour le hachage ;
  - **expiration** des tokens (cf. VULN-09).
- **Validation après correction** : réponses identiques quel que soit le cas ; au-delà de N
  tentatives → **429 Too Many Requests** ; hashes en `bcrypt`.

---

### VULN-05 — Mass Assignment → élévation de privilège

- **Type** : Mass Assignment / Broken Object Property Level Authorization — A04:2021, API6.
- **Endpoints concernés** : `POST /api/auth/register`, `PUT /api/users/me`.
- **Description** : le champ `role` est accepté depuis le corps de la requête, permettant à
  un utilisateur de devenir **admin**.
- **Cause technique** :
  ```js
  // auth.routes.js (VULNERABLE) — role pris du body
  const role = req.body.role || 'user';
  // users.routes.js (VULNERABLE) — merge non filtré
  const merged = { ...existing, ...req.body };
  ```
- **Exploitation** :
  ```http
  POST /api/auth/register   { "username":"mallory", "email":"m@x", "password":"x", "role":"admin" }
  PUT  /api/users/me        { "role":"admin" }      (token user existant)
  ```
- **Preuve** : `exploits/output/vuln-05-mass-assignment.txt` (compte créé avec `role:"admin"`,
  et bob promu `admin`).
- **Impact** : élévation de privilège complète → accès aux fonctions d'administration.
- **Criticité** : **Critique**.
- **Correction appliquée (secure)** : **whitelist** explicite des champs autorisés ; `role`
  jamais accepté depuis l'entrée utilisateur (forcé à `user` à l'inscription).
  ```js
  // SECURED
  const role = 'user'; // jamais depuis le body
  // update: on ne lit que { username, email } du body, role ignoré
  ```
- **Validation après correction** : l'envoi de `role:"admin"` est **ignoré** ; le compte
  reste `user` (vérifié en base et via `/api/users/me`).

---

### VULN-06 — Security Misconfiguration / Information Disclosure

- **Type** : Security Misconfiguration + Information Disclosure — A05:2021 / A09:2021.
- **Zones concernées** : `GET /api/debug`, gestion globale des erreurs, `GET /api/users/me`,
  en-têtes HTTP, logs.
- **Description** : multiples fuites :
  - endpoint `/api/debug` **non authentifié** exposant secrets et environnement ;
  - **stack traces** renvoyées au client ;
  - **hash de mot de passe** renvoyé par l'API ;
  - **aucun en-tête de sécurité** (pas de Helmet/CSP/HSTS/X-Frame-Options) ;
  - logs incluant le header `Authorization` (tokens) ;
  - fichier **`.env`** committé avec des secrets.
- **Cause technique** :
  ```js
  // app.js (VULNERABLE) : /api/debug renvoie config + process.env
  // errorHandler.js (VULNERABLE) : res.json({ error, stack: err.stack })
  // users.routes.js (VULNERABLE) : res.json(user) // inclut password
  // app.js : pas de helmet ; log de req.headers.authorization
  ```
- **Exploitation** : `GET /api/debug` → `jwtSecret: "secret123"`, `stripeSecretKey`, etc.
- **Preuve** : `screenshots/vuln-07-broken-access-control.png` (config fuitée),
  `exploits/output/vuln-06-info-disclosure.txt` (assaini).
- **Impact** : compromission des secrets (→ forge de tokens, cf. VULN-09), reconnaissance
  facilitée, exposition de données sensibles.
- **Criticité** : **Élevée**.
- **Correction appliquée (secure)** :
  - **suppression** de `/api/debug` ;
  - **Helmet** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.) ;
  - gestionnaire d'erreurs **générique** (pas de stack en production) ;
  - API ne renvoyant **jamais** le champ `password` (projection des colonnes) ;
  - logs sans header `Authorization` ;
  - `.env` **git-ignoré**, secrets via le secret store CI/CD.
- **Validation après correction** : `/api/debug` → 404 ; en-têtes de sécurité présents
  (vérifiables via `curl -I`) ; erreurs génériques ; `password` absent des réponses.

---

### VULN-07 — Broken Access Control sur les routes admin

- **Type** : Broken Access Control / Broken Function Level Authorization — A01:2021, API5:2023.
- **Endpoints concernés** : `GET /api/admin/users`, `DELETE /api/admin/users/:id`,
  `POST/PUT/DELETE /api/products`.
- **Description** : les routes « admin » ne sont protégées que par `requireAuth` ; **aucun
  contrôle de rôle** n'est effectué. Tout utilisateur authentifié y accède.
- **Cause technique** :
  ```js
  // admin.routes.js (VULNERABLE) : requireAuth seulement, pas de requireAdmin
  adminRouter.get('/users', requireAuth, (req, res) => { ...dump all users... });
  ```
- **Exploitation** : alice (`role:user`) appelle `GET /api/admin/users` et obtient la liste
  complète des comptes (avec hashes).
- **Preuve** : `screenshots/vuln-07-broken-access-control.png`,
  `exploits/output/vuln-07-broken-access-control.txt`.
- **Impact** : accès non autorisé aux fonctions d'administration (lecture/suppression de
  comptes, gestion du catalogue).
- **Criticité** : **Élevée**.
- **Correction appliquée (secure)** : middleware **`requireAdmin`** appliqué sur toutes les
  routes sensibles.
  ```js
  // SECURED
  export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  }
  adminRouter.get('/users', requireAuth, requireAdmin, handler);
  ```
- **Validation après correction** : alice → **403 Forbidden** ; seul un token `admin` accède.

---

### VULN-08 — Mauvaise configuration CORS

- **Type** : Security Misconfiguration (CORS) — A05:2021.
- **Zone concernée** : middleware CORS global.
- **Description** : l'API **reflète n'importe quelle origine** tout en autorisant les
  credentials, ce qui ouvre la porte à des requêtes cross-origin authentifiées depuis un site
  malveillant.
- **Cause technique** :
  ```js
  // app.js (VULNERABLE)
  app.use(cors({ origin: true, credentials: true })); // reflète Origin + credentials
  ```
- **Exploitation** :
  ```
  Origin: https://evil.example
  -> Access-Control-Allow-Origin: https://evil.example
  -> Access-Control-Allow-Credentials: true
  ```
- **Preuve** : `exploits/output/vuln-08-cors.txt`.
- **Impact** : un site tiers malveillant peut appeler l'API avec les cookies/credentials de
  la victime (exfiltration de données cross-origin).
- **Criticité** : **Moyenne**.
- **Correction appliquée (secure)** : **allowlist** d'origines explicite.
  ```js
  // SECURED
  const allowed = ['http://localhost:5173'];
  app.use(cors({ origin: (o, cb) => cb(null, !o || allowed.includes(o)), credentials: true }));
  ```
- **Validation après correction** : une origine non autorisée n'obtient pas d'en-tête
  `Access-Control-Allow-Origin` correspondant.

---

### VULN-09 — Token JWT non sécurisé

- **Type** : Cryptographic / Authentication Failures — A02:2021 / A07:2021.
- **Zone concernée** : émission/validation JWT, stockage côté client.
- **Description** : trois faiblesses cumulées :
  - **secret faible et committé** (`secret123`, exposé via `/api/debug` et `.env`) ;
  - **aucune expiration** (`JWT_EXPIRES_IN` vide) ;
  - **token stocké dans `localStorage`** (accessible via XSS, cf. VULN-03).
- **Cause technique** :
  ```js
  // config.js / auth.routes.js (VULNERABLE)
  jwtSecret: 'secret123'; const options = expiresIn ? {...} : {}; // pas d'exp
  // frontend/store/auth.js : localStorage.setItem('token', ...)
  ```
- **Exploitation** : avec le secret connu, on **forge hors-ligne** un token `role:admin` sans
  authentification, puis on accède aux routes admin :
  ```
  forged = jwt.sign({ id:999, role:'admin' }, 'secret123')
  GET /api/admin/users  Authorization: Bearer <forged>  -> dump complet
  ```
- **Preuve** : `exploits/output/vuln-09-insecure-token.txt` (payload sans `exp`, token forgé,
  dump obtenu).
- **Impact** : usurpation totale d'identité/rôle, tokens valides indéfiniment, vol via XSS.
- **Criticité** : **Critique**.
- **Correction appliquée (secure)** :
  - **secret fort** depuis une variable d'environnement (non committée) ;
  - **expiration** des tokens (`expiresIn: '1h'`) ;
  - réduction de la surface XSS (VULN-03) ; documentation du compromis localStorage vs cookie
    `HttpOnly` (cf. §9 Limites).
- **Validation après correction** : un token forgé avec `secret123` est **rejeté** (401) ;
  les tokens expirent ; le secret n'est plus exposé.

---

## 7. Pipeline sécurité (branche `secure`)

Fichier : `.github/workflows/security.yml` (GitHub Actions). Déclenché sur `push` et
`pull_request`. Étapes :

| Étape | Outil | Objectif | Bloquant |
|-------|-------|----------|----------|
| Tests applicatifs | Vitest + Supertest (`npm test`) | vérifier que l'app fonctionne | Oui |
| SAST | **Semgrep** (`p/owasp-top-ten`, `p/javascript`) | analyser le code source | Oui (high/critical) |
| SCA | **npm audit** (`--audit-level=high`) | analyser les dépendances | Oui |
| Secret scanning | **Gitleaks** | détecter les secrets exposés | Oui |
| DAST | **OWASP ZAP baseline** | tester l'app en fonctionnement | Avertissement |

Règles : installation des dépendances → tests → SAST → audit deps → secret scanning →
DAST → **échec du job en cas de faille critique ou de secret détecté**.

---

## 8. Résultats des scans

Les contrôles SAST (Semgrep), secret scanning (Gitleaks) et DAST (OWASP ZAP) s'exécutent dans
la **CI GitHub Actions** (`.github/workflows/security.yml`, branche `secure`) où ces outils sont
nativement supportés. Le SCA (`npm audit`) et les tests ont été exécutés localement ; résultats
réels ci-dessous.

### SCA — `npm audit` (résultats réels)

**Branche `vulnerable`** (`npm audit --omit=dev` sur `backend/`) :

```
jsonwebtoken  <=8.5.1   Severity: high
  - GHSA-8cf7-32gw-wr33 : unrestricted key type → legacy keys usage
  - GHSA-hjrf-2m68-5959 : forgeable public/private tokens (RSA→HMAC)
  - GHSA-qwph-4952-7xr6 : signature validation bypass (insecure default algorithm)
=> 1 high severity vulnerability (dépendance de production réellement utilisée)
```

Total (dev inclus) : `{ moderate: 3, high: 2, critical: 1 }`.

**Branche `secure`** : `jsonwebtoken` est mis à jour en `^9.0.2`
→ **0 vulnérabilité de production** ; la pipeline passe `npm audit --omit=dev --audit-level=high`.

### Secret scanning — Gitleaks (attendu en CI)

- **`vulnerable`** : détecte le fichier `backend/.env` committé contenant `JWT_SECRET=secret123`
  et `STRIPE_SECRET_KEY=...` → **secret(s) détecté(s)**, job **bloquant**.
- **`secure`** : `.env` est git-ignoré, aucun secret en clair dans l'historique de la branche
  → **0 secret**.

### SAST — Semgrep (attendu en CI, règles `p/owasp-top-ten`, `p/javascript`)

- **`vulnerable`** : remonte la concaténation SQL (VULN-02), l'usage de `v-html` (VULN-03),
  le renvoi de `err.stack` (VULN-06), la CORS permissive (VULN-08), etc.
- **`secure`** : findings résolus (requêtes paramétrées, plus de `v-html`, erreurs génériques,
  CORS allowlist).

### DAST — OWASP ZAP baseline (attendu en CI, app lancée)

- **`vulnerable`** : alertes en-têtes manquants (CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options), CORS permissive.
- **`secure`** : alertes fortement réduites grâce à Helmet (en-têtes de sécurité présents).

### Tests applicatifs

- `npm test` : **8/8 tests passants** sur les deux branches (la branche `secure` ajoute des
  tests de non-régression sécurité : IDOR→404, admin→403, mass assignment ignoré, etc.).

> Les sorties brutes des jobs CI sont disponibles dans l'onglet **Actions** du dépôt après push
> de la branche `secure`.

---

## 9. Limites du projet

- **Captures** : l'environnement de développement étant headless (sans Burp Suite GUI), les
  preuves sont fournies via (a) des **captures navigateur automatisées** (Playwright,
  `screenshots/`) et (b) des **requêtes/réponses HTTP reproductibles** (`exploits/`). La
  reproduction manuelle avec Burp est possible avec les mêmes payloads.
- **Stockage du token** : la version sécurisée conserve le JWT côté client. Un durcissement
  supplémentaire consisterait à utiliser un cookie `HttpOnly`/`SameSite` + protection CSRF ;
  ce choix est documenté mais non imposé ici (compromis pédagogique).
- **Base de données** : SQLite (intégré) pour faciliter l'installation ; un déploiement réel
  utiliserait PostgreSQL/MySQL.
- **Périmètre fonctionnel volontairement minimal** : l'accent est mis sur la logique de
  sécurité, conformément aux consignes.

---

## 10. Conclusion

ShopSec illustre un **cycle complet de sécurité applicative** : développement vulnérable,
audit personnel, exploitation contrôlée, documentation, correction de la **cause profonde**,
sécurisation et **pipeline DevSecOps**.

Les 9 vulnérabilités couvrent l'ensemble des catégories obligatoires (Broken Access
Control/IDOR, Injection, XSS, Authentification faible, Mass Assignment, Misconfiguration/
Information Disclosure) ainsi que des failles bonus (CORS, JWT/stockage de token). Chacune est
exploitable, prouvée, puis corrigée à la racine sur la branche `secure`, et les corrections
sont automatiquement contrôlées par la pipeline.

L'objectif n'était pas une application parfaite, mais la démonstration d'une **compréhension
offensive et défensive** de la sécurité web moderne.
