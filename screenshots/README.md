# Captures — preuves d'exploitation & pipeline

Ce dossier rassemble les **preuves visuelles** du projet : le résultat de chaque attaque tel qu'il
apparaît côté application, plus la preuve que la **pipeline DevSecOps** s'exécute avec succès.

Chaque capture est **complémentaire des preuves HTTP** correspondantes (requête exacte, payload,
réponse serveur) situées dans `exploits/output/` et rejouables via `exploits/run_all.sh`. Pour une
faille donnée, on dispose ainsi à la fois du **résultat visible** (ici) et de la **trace réseau**
(dans `exploits/`).

## Index des captures

| Fichier | Faille / contenu | Ce qu'il faut observer |
|---------|------------------|------------------------|
| `00-products.png` | Application fonctionnelle | le catalogue de produits s'affiche (l'app tourne) |
| `01-login.png` | Authentification | page de connexion avec les comptes de test |
| `vuln-01-idor.png` | **IDOR / BOLA** | alice (rôle *user*) consulte la **commande #2 de bob** (`user_id: 3`) |
| `vuln-02-sqli.png` | **Injection SQL** | un `UNION SELECT` fait remonter **tous les comptes + hashes** à la place des produits |
| `vuln-03-xss.png` | **Stored XSS** | l'avis injecté est rendu en **HTML** (`v-html`) ; l'alerte JS captée prouve le **vol du token** |
| `vuln-07-broken-access-control.png` | **Broken Access Control + Information Disclosure** | un *user* atteint la page admin : **liste des comptes + hashes** et configuration fuités |
| `pipeline-success.png` | **Pipeline DevSecOps** | run GitHub Actions (branche `secure`) — **tous les jobs verts** (tests, SAST, SCA, secret scanning, DAST) |

> Les autres failles (auth faible, mass assignment, CORS, info disclosure `/api/debug`, JWT forgé)
> sont surtout des manipulations **API** : leur preuve la plus lisible est la **requête/réponse HTTP**
> dans `exploits/output/` (`vuln-04` … `vuln-09`).

## Pourquoi des captures navigateur plutôt que Burp Suite ?

Le projet a été réalisé sur un **poste RDP d'entreprise** (mon **unique** poste de travail), sur
lequel je **n'ai pas les droits administrateur** pour installer **Burp Suite** ni le **runtime Java**
qui lui est indispensable. Les preuves sont donc fournies via des **captures navigateur** (résultat
des attaques) et des **requêtes/réponses HTTP reproductibles** (`exploits/`) contenant les mêmes
requêtes et payloads qu'une démonstration Burp. Détails en **§9 du `SECURITY_AUDIT.md`**.
