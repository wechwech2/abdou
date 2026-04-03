# Abdou

Abdou est une plateforme de fabrication de minisites immobiliers.

Le modele metier central est :
`Client > Offre > Programme > Publication > Minisite`

Le cadrage technique impose une separation claire :
- administration et logique metier sur l'hebergement `OVH Hosting Pro` du client via le moteur PHP ;
- generation statique des minisites depuis ce meme hebergement ;
- diffusion publique des minisites sur les espaces publics / multisites OVH du client.

Le site public final ne depend pas d'un serveur Node.js actif en production.
En cible finale, toute la chaine doit etre exploitable dans une seule offre `OVH Hosting Pro`.

## Structure du monorepo

- `docs/` : cadrage produit et technique
- `apps/admin-php` : socle PHP de l'administration cible OVH Hosting Pro
- `apps/backoffice-web` : interface d'administration (legacy front) a faire converger vers la cible PHP
- `apps/admin-api` : prototype technique Node historique (legacy)
- `apps/publisher-cli` : generation statique + packaging
- `apps/preview-server` : previsualisation locale/staging
- `apps/site-template-default` : template de minisite
- `packages/` : types/config/utils/UI partages
- `db/mysql` : schema SQL + seeds
- `deploy/` : scripts de build/package/deploiement
- `dist/` : artefacts generes
- `storage/` : stockage de travail (imports/media/publications)

## Statut

Ce depot contient le socle initial (arborescence, documentation, SQL, squelettes).
La logique metier complete sera implementee par increment.

## Demarrage local rapide (admin PHP)

1. Initialiser la base locale :
`pnpm run db:init:reset`

2. Lancer l'admin (commande quotidienne recommandee) :
`pnpm run dev:start`

3. Equivalent explicite (XAMPP) :
`pnpm run dev:admin:xampp`

4. Ouvrir :
`http://127.0.0.1:8080/admin`

5. Optionnel (compat legacy uniquement) :
`pnpm run start:admin-api:compat`

Note :
- `ADMIN_API_COMPAT_ENABLED=false` est le mode par defaut recommande en dev/staging.
- activer `ADMIN_API_COMPAT_ENABLED=true` uniquement pour un besoin explicite de compatibilite proxy.
- `pnpm run start:admin-api:compat` force automatiquement `ADMIN_API_COMPAT_ENABLED=true`.

## Playbook dev/staging (court)

Mode `dev` quotidien :
- initialiser la base : `pnpm run db:init:reset`
- lancer l'admin cible : `pnpm run dev:start`
- URL admin : `http://127.0.0.1:8080/admin`

Mode `staging` local (preview publication) :
- construire preview : `pnpm run preview:build`
- publier localement (workflow publication réel) : `pnpm run preview:publish`
- verifier workflow complet : `pnpm run test:smoke:admin-php:http`
- route publique programme attendue (build publication) : `/minisites/:programme-slug`

Mode `compat` ponctuel (legacy) :
- lancer proxy compat : `pnpm run start:admin-api:compat`
- endpoint sante proxy : `http://127.0.0.1:3001/health`
- verifier mode compat coupe : `pnpm run test:smoke:admin-api:compat-off`

## Smoke test workflow publication

Commande :
`pnpm run test:smoke:shared-types`

Ce test verrouille l'import runtime de `@abdou/shared-types` (packaging ESM + exports) depuis le contexte `admin-api`.

Commande :
`pnpm run test:smoke:publication`

Ce test verifie le socle build + deploy (logs et artefacts) sans necessiter tout le stack applicatif.

Commande :
`pnpm run test:smoke:public-programme-route`

Ce test verrouille que le build genere une route publique programme (`/minisites/:programme-slug`) et n'expose pas la home generique Abdou sur cette URL.

Commande :
`pnpm run test:smoke:public-v1-flow`

Ce test couvre le parcours V1 le plus rentable :
- programme public accessible (`/minisites/:slug`) ;
- contenu programme non generique ;
- sections publiques essentielles affichees selon donnees ;
- build/deploy locaux OK ;
- non-regression URL publique (`published_url`).

Commande :
`pnpm run test:smoke:deploy-rollback`

Ce test verifie le cycle minimal de rollback (`deploy-site` puis `rollback-site`) et la restauration effective de la cible.

Commande :
`pnpm run test:smoke:contracts`

Ce test verifie la coherence des catalogues de contrats entre `shared-types`, `admin-php (/contracts)` et `admin-api (/api/contracts)`.

Commande :
`pnpm run test:smoke:admin-php:http`

Ce test verifie directement les endpoints workflow publication de `admin-php` (cible principale) avec session.

Commande :
`pnpm run test:smoke:admin-php:health-db`

Ce test verrouille le contrat des endpoints de sante `admin-php` (`/health`, `/health/db`) avec parite root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:health-db-down`

Ce test verrouille le contrat de degradation `health/db` quand MySQL est indisponible (`500`, `db=down`) avec parite root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:admin-page`

Ce test verrouille la disponibilite et la parite de la page admin HTML sur `/admin` et `/api/admin`.

Commande :
`pnpm run test:smoke:admin-php:dashboard-summary`

Ce test verrouille le contrat de synthese dashboard `admin-php` sur `/dashboard/summary` et `/api/dashboard/summary`.

Commande :
`pnpm run test:smoke:admin-php:dashboard-summary-db-down`

Ce test verrouille la degradation de `dashboard/summary` quand MySQL est indisponible (`500`, `dashboard_summary_failed`) sur root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:not-found`

Ce test verrouille le contrat d'erreur `404 not_found` sur `admin-php` (routes inconnues et methodes non supportees), avec parite root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:contracts`

Ce test verifie que `/contracts` cote `admin-php` exige une session et expose un catalogue non vide.

Commande :
`pnpm run test:smoke:admin-php:reference-read`

Ce test verifie les endpoints de lecture de referentiel cote `admin-php` (`offres`, `templates`, `roles`, `users`) avec controle auth + shape de payload.

Commande :
`pnpm run test:smoke:admin-php:rbac`

Ce test verifie les regles d'acces `admin-php` (non authentifie -> `401`, profil `operator` en ecriture -> `403`).

Commande :
`pnpm run test:smoke:admin-php:auth-session`

Ce test verrouille le cycle de session auth `admin-php` (`login/me/logout`) avec parite root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:auth-errors`

Ce test verrouille les erreurs d'auth `admin-php` sur `login` (`missing_credentials`, `invalid_credentials`) avec parite root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:auth-logout`

Ce test verrouille le contrat de `logout` (idempotence avec/sans session) avec parite root et `/api`.

Commande :
`pnpm run test:smoke:admin-php:auth-matrix`

Ce test verrouille la matrice d'acces `admin-php` (routes publiques, session et admin) sur les routes root et sous prefixe `/api`.

Commande :
`pnpm run test:smoke:admin-php:validation`

Ce test verifie les erreurs de validation `400` sur les routes metier `admin-php` (status/query ids/payloads invalides).

Commande :
`pnpm run test:smoke:admin-api:http`

Ce test verifie les endpoints HTTP `admin-api` du workflow publication (proxy vers `admin-php` avec session).

Commande :
`pnpm run test:smoke:admin-api:dashboard-summary`

Ce test verrouille le proxy `admin-api` de `/api/dashboard/summary` (auth requise + shape de reponse).

Commande :
`pnpm run test:smoke:admin-api:dashboard-summary-db-down`

Ce test verrouille la degradation du proxy `admin-api` pour `/api/dashboard/summary` quand MySQL est indisponible (`500`, `dashboard_summary_failed`).

Commande :
`pnpm run test:smoke:admin-api:workflow-detail-db-down`

Ce test verrouille la degradation du proxy `admin-api` pour `/api/publications/:id/workflow-detail` quand MySQL est indisponible (`500`, `publication_workflow_detail_failed`).

Commande :
`pnpm run test:smoke:admin-api:publication-build-db-down`

Ce test verrouille la degradation du proxy `admin-api` pour `POST /api/publications/:id/build` quand MySQL est indisponible (`500`, `publication_build_failed`).

Commande :
`pnpm run test:smoke:admin-api:publication-deploy-db-down`

Ce test verrouille la degradation du proxy `admin-api` pour `POST /api/publications/:id/deploy` quand MySQL est indisponible (`500`, `publication_deploy_failed`).

Commande :
`pnpm run test:smoke:admin-api:db-down-matrix`

Ce test agregue la verification de degradation DB-down sur `dashboard-summary`, `workflow-detail`, `build` et `deploy` dans un seul scenario proxy `admin-api`.
Ce test est le gate principal execute par `pnpm run test:smoke`.
Les variantes unitaires DB-down restent disponibles pour du diagnostic cible.

Commande :
`pnpm run test:smoke:admin-api:db-down-diagnostics`

Cette commande lance successivement les 4 smokes DB-down unitaires `admin-api` (`dashboard-summary`, `workflow-detail`, `build`, `deploy`) pour un diagnostic detaille.
Difference d usage :
- gate principal : `pnpm run test:smoke:admin-api:db-down-matrix`
- diagnostic detaille : `pnpm run test:smoke:admin-api:db-down-diagnostics`

Commande :
`pnpm run test:smoke:admin-api:envelope`

Ce test verifie la normalisation des enveloppes `admin-api` (`ok=true/false`) sur les routes techniques et les erreurs controlees.

Commande :
`pnpm run test:smoke:admin-api:timeout`

Ce test verifie le comportement timeout du proxy `admin-api` vers `admin-php` (reponse `502 upstream_unavailable` avec `details.reason=timeout`).

Commande :
`pnpm run test:smoke:admin-api:compat-catalog`

Ce test verifie la coherence du catalogue de routes de compatibilite `admin-api` avec `app.module` (couverture, doublons, politiques d acces/reponse).
Il s appuie sur les endpoints techniques `/api/modules` et `/api/compat/routes` en conditions reelles.

Commande :
`pnpm run test:smoke:admin-api:compat-off`

Ce test verifie que `admin-api` peut etre demarree en mode compatibilite desactivee (`ADMIN_API_COMPAT_ENABLED=false`) et retourne `410 compat_disabled` sur les routes metier proxifiees.

Commande :
`pnpm run test:smoke:backoffice:contract-parsing`

Ce test verifie les gardes de parsing/structure des payloads critiques dans le backoffice.

Commande :
`pnpm run test:smoke:backoffice:dashboard-wiring`

Ce test verifie le cablage du dashboard dans le backoffice (onglet HTML + panel + loader API + inclusion workspace).

Commande :
`pnpm run test:smoke:backoffice:api-base`

Ce test verrouille que le backoffice utilise `/api` comme base par defaut (sans fallback implicite vers la racine).
Il verrouille aussi que `ABDOU_API_BASE` invalide est ignoree avec fallback vers `/api`.

Commande :
`pnpm run test:smoke:backoffice:api-paths`

Ce test verrouille que les appels `api(...)` du backoffice restent coherents avec la base `/api` (pas de chemin `'/api/...'` en dur, pas d URL absolue).

Commande :
`pnpm run test:smoke:backoffice:workspace-partial`

Ce test verifie la resilience du chargement workspace en cas d echecs partiels de panneaux.

Commande :
`pnpm run test:smoke:release-readiness`

Ce gate enchaine un sous-ensemble critique (admin-php, compat-off, db-down-matrix, backoffice guards) pour valider la readiness avant release.

Commande :
`pnpm run test:smoke:go-live-rehearsal`

Ce gate execute la repetition generale (release-readiness + verify deploy + rollback) avant mise en ligne.

Commande :
`pnpm run test:smoke:client-phase-local`

Ce gate execute la phase locale complete orientee test client:
- repetition generale,
- publication preview locale,
- verification du contenu `dist/preview` (index racine + page programme `/minisites/:slug`),
- verification HTTP de l'URL programme publiee (`CLIENT_PREVIEW_URL`, par defaut `https://abdou.wechwech.tn/minisites/residence-horizon`).

Commande globale :
`pnpm run test:smoke`

Cette commande enchaine les smoke tests disponibles et affiche un resume `passed/failed`.
Pour le perimetre DB-down `admin-api`, la commande globale execute le test agrege `admin-api:db-down-matrix`.
Le runner smoke applique aussi des timeouts par tache pour eviter les blocages indefinis en local/CI.
Le runner genere aussi un rapport JSON `dist/logs/smoke-summary.json`.
Le runner genere aussi un rapport Markdown `dist/logs/smoke-summary.md`.
Ce rapport inclut la commande de chaque tache et des extraits `stdout/stderr` pour accelerer le diagnostic.
Il inclut aussi des metadonnees d execution (`node`, `platform`, `arch`, `cwd`, `total_elapsed_ms`).

Commande standard :
`pnpm run lint`

Cette commande execute les typechecks principaux et la verification syntaxique du front backoffice.

Commande standard :
`pnpm run test`

Cette commande execute la suite smoke globale.

Commande complete :
`pnpm run check`

Cette commande enchaine `lint` puis `test` pour une verification locale complete.

## CI

Le workflow GitHub Actions `CI` (`.github/workflows/ci.yml`) execute automatiquement `pnpm run check` sur chaque `push` et `pull_request`.
Il peut aussi etre lance manuellement (`workflow_dispatch`) et annule les runs precedents sur la meme ref (`concurrency`).
En CI, les logs de smoke (`dist/logs`) sont publies comme artefact pour faciliter le diagnostic.
Le workflow CI publie aussi le contenu de `dist/logs/smoke-summary.json` dans le Step Summary GitHub Actions.
Le workflow publie aussi `dist/logs/smoke-summary.md` dans le Step Summary quand il est disponible.
Le Step Summary inclut un tableau synthese par tache (commande, statut, duree, timeout) et un bloc JSON repliable.
En cas d'echec, le Step Summary CI affiche aussi un extrait stderr/stdout pour chaque tache smoke en erreur.
Un workflow manuel de gate release est disponible: `.github/workflows/release-readiness.yml`.
Un workflow manuel de repetition generale est disponible: `.github/workflows/go-live-rehearsal.yml`.
