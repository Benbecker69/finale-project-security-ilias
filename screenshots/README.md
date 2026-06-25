# Screenshots — preuves d'exploitation & pipeline

Captures navigateur (générées avec Playwright, cf. `tools/screenshots.mjs`) et preuve de la
pipeline. Les preuves HTTP (requêtes/réponses/payloads) correspondantes sont dans
`exploits/output/`.

| Fichier | Faille / contenu |
|---------|------------------|
| `00-products.png` | Page catalogue (application fonctionnelle) |
| `01-login.png` | Page de connexion |
| `vuln-01-idor.png` | **IDOR** — alice (user) consulte la commande #2 de bob |
| `vuln-02-sqli.png` | **Injection SQL** — `UNION SELECT` exfiltrant les comptes + hashes |
| `vuln-03-xss.png` | **Stored XSS** — HTML injecté rendu via `v-html` (alerte JS captée : vol du token) |
| `vuln-07-broken-access-control.png` | **Broken Access Control + Info Disclosure** — un user voit tous les comptes/hashes + config fuitée |
| `pipeline-success.png` | **Pipeline DevSecOps** GitHub Actions — tous les jobs verts (branche `secure`) |

> Note : l'environnement de génération étant headless, les captures sont produites automatiquement
> (Playwright) ; elles peuvent être complétées par des captures Burp Suite manuelles avec les mêmes
> payloads (documentés dans `SECURITY_AUDIT.md` et `exploits/run_all.sh`).
