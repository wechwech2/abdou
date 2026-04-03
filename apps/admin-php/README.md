# admin-php

Socle PHP de l'administration cible pour OVH Hosting Pro.

Perimetre actuel :
- point d'entree HTTP minimal ;
- route de sante ;
- route de sante base de donnees ;
- module de lecture des offres ;
- base de routing sobre pour evoluer vers le metier.

Ce module remplace la cible de production historique basee sur Node.
Le routeur accepte aussi les memes endpoints sous prefixe `/api/*` pour faciliter la migration progressive du front admin.

Endpoints exposes :
- `GET /health`
- `GET /health/db`
- `GET /dashboard/summary`
- `GET /contracts`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /offres`
- `GET /offres/{id}`
- `GET /templates`
- `GET /templates/{id}`
- `GET /clients`
- `GET /clients/{id}`
- `POST /clients` (admin)
- `PUT /clients/{id}` (admin)
- `GET /programmes`
- `GET /programmes/{id}`
- `POST /programmes` (admin)
- `PUT /programmes/{id}` (admin)
- `GET /lots`
- `GET /lots/{id}`
- `POST /lots` (admin)
- `PUT /lots/{id}` (admin)
- `GET /rubriques`
- `GET /rubriques/{id}`
- `POST /rubriques` (admin)
- `PUT /rubriques/{id}` (admin)
- `GET /medias`
- `GET /medias/{id}`
- `POST /medias` (admin)
- `GET /publications`
- `GET /publications/{id}`
- `POST /publications` (admin)
- `PUT /publications/{id}/status` (admin)
- `POST /publications/{id}/build` (admin)
- `GET /publications/{id}/build-log`
- `GET /publications/{id}/deployments`
- `POST /publications/{id}/deploy` (admin)
- `GET /publications/{id}/deploy-log`
- `GET /publications/{id}/deploy-manifest`
- `GET /publications/{id}/deploy-verify-log`
- `GET /publications/{id}/deploy-artifacts`
- `GET /publications/{id}/deploy-summary`
- `GET /publications/{id}/workflow-detail`
- `POST /publications/{id}/preview` (admin)
- `GET /roles`
- `GET /users`
- `GET /users/{id}`

Regles d'acces :
- lecture metier: session requise ;
- ecriture metier: role `admin` requis.
- controle RBAC couvert par smoke: `pnpm run test:smoke:admin-php:rbac`.
- cycle de session auth (`login/me/logout`) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:auth-session`.
- matrice d'acces (public/session/admin) root + `/api` couverte par smoke: `pnpm run test:smoke:admin-php:auth-matrix`.
- contrat des endpoints de sante (`/health`, `/health/db`) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:health-db`.
- contrat de synthese dashboard (`/dashboard/summary`) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:dashboard-summary`.
- contrat de degradation dashboard (`/dashboard/summary`) avec MySQL indisponible couvert par smoke: `pnpm run test:smoke:admin-php:dashboard-summary-db-down`.
- contrat de degradation `health/db` (MySQL indisponible -> `500`, `db=down`) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:health-db-down`.
- disponibilite et parite de la page admin HTML (`/admin`, `/api/admin`) couvertes par smoke: `pnpm run test:smoke:admin-php:admin-page`.
- contrat d'erreur `404 not_found` (routes inconnues et methodes non supportees) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:not-found`.
- contrat d'erreurs d'auth `login` (`missing_credentials`, `invalid_credentials`) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:auth-errors`.
- contrat de `logout` (idempotence avec/sans session) root + `/api` couvert par smoke: `pnpm run test:smoke:admin-php:auth-logout`.
- validation des payloads couverte par smoke: `pnpm run test:smoke:admin-php:validation`.
- lecture referentiel couverte par smoke: `pnpm run test:smoke:admin-php:reference-read`.
- contrat JSON `workflow-detail` couvert par smoke: `pnpm run test:smoke:admin-php:workflow-detail-contract`.
- surface de routage (health/public/protege/not_found) couverte par smoke: `pnpm run test:smoke:admin-php:route-surface`.
- compatibilite du prefixe `/api/*` (parite root vs `/api`, incluant auth `me/logout`) couverte par smoke: `pnpm run test:smoke:admin-php:api-prefix`.

Filtres/pagination :
- `offres`: `?q=&page=&limit=`
- `templates`: `?q=&page=&limit=`
- `clients`: `?q=&status=active|inactive|archived|all&page=&limit=`
- `programmes`: `?q=&status=&client_id=&offre_id=&page=&limit=`
- `lots`: `?q=&programme_id=&published=published|unpublished|all&page=&limit=`
- `rubriques`: `?q=&enabled=enabled|disabled|all&programme_id=&page=&limit=`
- `medias`: `?q=&status=uploaded|optimized|published|archived|all&type=image|video|document|all&page=&limit=`
- `publications`: `?status=&programme_id=&page=&limit=`

Validation input (renforcee) :
- statuses listes (`clients`, `programmes`, `publications`) rejettent les valeurs hors liste ;
- query ids (`client_id`, `offre_id`, `programme_id`) doivent etre des entiers positifs ;
- creations/mises a jour rejettent les champs structurants invalides (`name`, `slug`, `status`).

Demarrage local (Windows/XAMPP) :
- `pnpm run serve:admin-php:xampp`
- commande principale recommandee : `pnpm run dev:start`

Variable utile :
- `NODE_BIN` pour definir le binaire Node utilise par les routes build/deploy (defaut: `node`).

Pre-requis base locale :
- base `abdou` creee en MySQL/MariaDB ;
- schemas `db/mysql/schema/*.sql` appliques ;
- seeds `db/mysql/seeds/*.sql` appliques.

Compte de test seed local :
- email : `admin@abdou.local`
- mot de passe : `0000`

Compte non-admin seed local :
- email : `operator@abdou.local`
- mot de passe : `0000`
