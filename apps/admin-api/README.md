# admin-api

Ce dossier correspond a un prototype technique historique base sur Node.js.

Il n'est plus la cible de production finale.
Il n'est pas requis pour le demarrage quotidien de l'administration.
Lancement optionnel : `pnpm run start:admin-api:compat`.
Par defaut, `ADMIN_API_COMPAT_ENABLED=false` (mode compatibilite coupe).
La commande `start:admin-api:compat` force `ADMIN_API_COMPAT_ENABLED=true` au lancement.

Cible finale :
- backoffice et logique metier compatibles avec le moteur PHP d'OVH Hosting Pro ;
- absence de runtime Node obligatoire en production.

Usage actuel :
- reference de contrats techniques partages pendant le developpement ;
- endpoint de sante et endpoint de catalogue des modules ;
- endpoint des contrats metier centralises depuis `@abdou/shared-types`.
- proxy HTTP de compatibilite pour le front pendant la migration vers `admin-php`.
- enveloppes des endpoints techniques homogenisees avec `ok=true/false`.

Endpoints :
- `GET /health`
- `GET /api/modules`
- `GET /api/modules/:code`
- `GET /api/contracts`
- `GET /api/compat/routes`
- `GET /api/compat/guards`
- `GET /api/compat/write-guards`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard/summary`
- `GET /api/roles`
- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `GET /api/templates`
- `GET /api/templates/:id`
- `GET /api/offres`
- `GET /api/offres/:id`
- `GET /api/programmes`
- `GET /api/programmes/:id`
- `POST /api/programmes`
- `PUT /api/programmes/:id`
- `GET /api/rubriques`
- `GET /api/rubriques/:id`
- `POST /api/rubriques`
- `PUT /api/rubriques/:id`
- `GET /api/medias`
- `GET /api/medias/:id`
- `POST /api/medias`
- `GET /api/lots`
- `GET /api/lots/:id`
- `POST /api/lots`
- `PUT /api/lots/:id`
- `GET /api/publications`
- `GET /api/publications/:id`
- `GET /api/publications/:id/deployments`
- `GET /api/publications/:id/workflow-detail`
- `POST /api/publications/:id/build`
- `GET /api/publications/:id/build-log`
- `GET /api/publications/:id/deploy-log`
- `GET /api/publications/:id/deploy-artifacts`
- `GET /api/publications/:id/deploy-summary`
- `GET /api/publications/:id/deploy-manifest`
- `GET /api/publications/:id/deploy-verify-log`
- `POST /api/publications`
- `PUT /api/publications/:id/status`
- `POST /api/publications/:id/deploy`
- `POST /api/publications/:id/preview`

Notes d execution :
- ces endpoints metier deleguent a `admin-php` via `ADMIN_PHP_BASE_URL` ;
- ils reutilisent le cookie de session entrant pour conserver les controles d acces.
- le proxy relaie aussi les en-tetes `set-cookie` du backend PHP (incluant scenarios multi-cookies).
- la resolution des routes de compatibilite est centralisee dans `src/modules/compat-routes.ts` pour limiter la divergence route->proxy.
- `app.module.routes` est alimente depuis ce meme catalogue `compat-routes` pour eviter la duplication des declarations.
- les routes publication (`build`, logs, artefacts, `workflow-detail`, `deploy`) sont des proxys vers `admin-php`, qui porte desormais l'orchestration locale.
- aucune orchestration build/deploy n'est conservee dans `admin-api` elle-meme.
- quand `ADMIN_API_COMPAT_ENABLED=false`, seules les routes techniques (`/health`, `/api/modules*`, `/api/contracts`, `/api/compat/routes`, `/api/compat/guards`, `/api/compat/write-guards`) restent actives et les routes metier proxifiees retournent `410 compat_disabled`.
- pour reactiver temporairement la compatibilite proxy, definir `ADMIN_API_COMPAT_ENABLED=true`.
- les smoke tests HTTP `admin-api` demarrent aussi `admin-php` et ouvrent une session pour verifier ces routes dans des conditions realistes.
- un smoke dedie `pnpm run test:smoke:admin-api:dashboard-summary` verrouille le proxy de `GET /api/dashboard/summary`.
- un smoke dedie `pnpm run test:smoke:admin-api:dashboard-summary-db-down` verrouille aussi la degradation de `GET /api/dashboard/summary` quand MySQL est indisponible.
- un smoke dedie `pnpm run test:smoke:admin-api:workflow-detail-db-down` verrouille aussi la degradation de `GET /api/publications/:id/workflow-detail` quand MySQL est indisponible.
- un smoke dedie `pnpm run test:smoke:admin-api:publication-build-db-down` verrouille aussi la degradation de `POST /api/publications/:id/build` quand MySQL est indisponible.
- un smoke dedie `pnpm run test:smoke:admin-api:publication-deploy-db-down` verrouille aussi la degradation de `POST /api/publications/:id/deploy` quand MySQL est indisponible.
- un smoke dedie `pnpm run test:smoke:admin-api:db-down-matrix` agrege ces verifications DB-down (dashboard, workflow-detail, build, deploy) en un scenario unique.
- dans le runner global `pnpm run test:smoke`, seul le test agrege `admin-api:db-down-matrix` est execute pour ce perimetre ; les tests unitaires DB-down restent disponibles en ciblage.
- une commande dediee `pnpm run test:smoke:admin-api:db-down-diagnostics` enchaine ces 4 tests unitaires DB-down pour un diagnostic detaille.
- difference d usage : `admin-api:db-down-matrix` = gate principal ; `admin-api:db-down-diagnostics` = troubleshooting detaille.
- un smoke dedie `pnpm run test:smoke:admin-api:envelope` verrouille aussi la convention d enveloppe `ok=true/false` sur les routes techniques.
- un smoke dedie `pnpm run test:smoke:admin-api:technical-contract` verrouille le contrat minimal des endpoints techniques (`/health`, `/api/modules*`, `/api/contracts`, `/api/compat/routes`, `/api/compat/guards`).
- ce contrat technique inclut aussi `/api/compat/write-guards` pour exposer les gardes d ecriture proxy.
- un smoke dedie `pnpm run test:smoke:admin-api:compat-catalog` verrouille la coherence entre le catalogue de routes compat (`compat-routes`) et `app.module`.
- un smoke dedie `pnpm run test:smoke:admin-api:guard-coverage` verrouille la couverture des routes compat `read` par `/api/compat/guards` et de toutes les routes `write` par `/api/compat/write-guards`.
- un smoke dedie `pnpm run test:smoke:admin-api:compat-snapshot` verrouille l inventaire des routes compat via snapshot versionne (`tests/smoke/snapshots/admin-api-compat-routes.snapshot.json`).
- un smoke dedie `pnpm run test:smoke:admin-api:compat-auth-matrix` verrouille la matrice des politiques d acces (`public/session/admin`) sur toutes les routes compat.
- un smoke dedie `pnpm run test:smoke:admin-api:compat-response-policy` verrouille la matrice des politiques de reponse (`proxy_passthrough`) sur toutes les routes compat.
- un smoke dedie `pnpm run test:smoke:admin-api:compat-off` verrouille aussi que les routes techniques restent actives (`/api/modules*`, `/api/contracts`, `/api/compat/routes`, `/api/compat/guards`, `/api/compat/write-guards`) pendant que les routes proxy retournent `410 compat_disabled`.
- pour mettre a jour volontairement ce snapshot apres changement de routage: `UPDATE_COMPAT_SNAPSHOT=1 pnpm run test:smoke:admin-api:compat-snapshot`.
- des gardes de contrat sont actifs en lecture sur `auth/me`, `dashboard/summary`, `roles/users/templates/clients/offres/programmes/rubriques/medias/lots/publications` (listes et routes `/:id` quand disponibles), `publications/:id/workflow-detail`, `publications/:id/build-log`, `publications/:id/deploy-log`, `publications/:id/deploy-manifest`, `publications/:id/deploy-verify-log`, `publications/:id/deploy-artifacts`, `publications/:id/deployments` et `publications/:id/deploy-summary` ;
- des gardes de contrat sont aussi actifs en ecriture sur `auth/login`, `auth/logout`, `clients`, `programmes`, `rubriques`, `medias`, `lots`, `publications` et actions de workflow publication (`status`, `build`, `deploy`, `preview`) ;
- en cas d ecart de contrat upstream, le proxy retourne `502 upstream_contract_mismatch` avec une raison explicite.
- avant la validation metier d un garde, le proxy impose `content-type` JSON (`expected_json_content_type`) puis parsing JSON valide (`invalid_json_payload`).
- un smoke dedie `pnpm run test:smoke:admin-api:contract-guard` verrouille le comportement des gardes de contrat.
- le script `pnpm --filter @abdou/admin-api run build` nettoie `dist/` avant compilation pour eviter les artefacts stale.
- `ADMIN_PHP_TIMEOUT_MS` permet d encadrer le timeout des appels proxy vers `admin-php` (defaut `15000` ms).
- en timeout upstream, le proxy retourne `502 upstream_unavailable` avec details (`reason=timeout`, `timeout_ms`, `upstream`).
