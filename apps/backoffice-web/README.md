# backoffice-web

Application d'administration interne.

Responsabilites MVP :
- gestion clients/offres/programmes ;
- gestion rubriques, medias, lots ;
- preparation et declenchement de publication.

Ce module ne sert pas le minisite public.

Note de cadrage :
- la cible finale doit fonctionner sur OVH Hosting Pro ;
- le backoffice devra converger vers une implementation compatible avec le moteur PHP OVH.

Etat actuel :
- socle web statique minimal dans `public/` ;
- connexion par defaut sur endpoints `admin-php` sous `/api/...` ;
- affichage des listes `clients`, `offres`, `programmes`, `publications` via `admin-php` ;
- affichage des listes `roles`, `users`, `templates` via `admin-php` ;
- vue detail `users/:id` et `templates/:id` depuis l UI ;
- affichage des listes `rubriques` et `medias` via `admin-php` ;
- affichage des listes `lots` via `admin-php` ;
- onglet dashboard avec synthese de production (`clients/programmes/publications/deployments`) via `GET /api/dashboard/summary` ;
- filtres/recherche/pagination pour clients/offres/programmes/publications ; 
- filtres/recherche/pagination pour rubriques/medias/lots ;
- actions MVP exposees dans l UI : creation/mise a jour client, creation/mise a jour programme, creation publication, changement de statut, preview, deploy.
- action build manuel disponible dans l onglet publications (en plus du workflow guide).
- action `Refresh detail` disponible dans le workflow publication pour recharger etat + logs sans relancer d action metier.
- detail publication enrichi avec metadonnees des logs (chemin fichier + dernier timestamp detecte).
- detail publication: actions `Voir manifest` et `Voir verify log` pour lire les fichiers auxiliaires de deploy depuis l UI.
- les actions `Voir manifest` et `Voir verify log` reutilisent les artefacts deja charges par `workflow-detail` (pas d appel API supplementaire).
- le detail publication affiche un indicateur d etat des artefacts de deploy (`loaded`, `partial`, `missing`).
- le detail publication propose aussi la copie du path et du contenu des artefacts (manifest et verify log).
- le detail publication permet aussi de telecharger les artefacts `manifest` et `verify log` en JSON.
- les champs `Publication ID` (build/status/preview/deploy/detail) se synchronisent automatiquement sur l ID courant du workflow.
- les retours build affichent aussi l etat de `status_sync` (sync du statut `generated` cote backend metier).
- le chargement du detail publication utilise prioritairement l endpoint agrege `/api/publications/:id/workflow-detail` (avec fallback).
- chargement detail publication protege contre les courses (requete la plus recente prioritaire).
- actions publications verrouillees pendant execution pour eviter les doubles clics et appels concurrents.
- ce verrouillage couvre aussi les actions rapides de la table publications.
- pendant ce verrouillage, l UI affiche `Operation en cours...` et les boutons sont visuellement desactives.
- la table publications permet de choisir rapidement un `Publication ID` via l action `Utiliser` (prefill des formulaires).
- apres `Utiliser` et les actions `Detail`/`Refresh detail`, le detail se charge automatiquement et la ligne selectionnee reste surlignee.
- actions rapides par ligne dans la table publications : `Detail`, `Build`, `Preview`, `Deploy`.
- `Deploy` (workflow + action rapide ligne) reutilise les parametres courants du formulaire de deploy (label/host/path).
- statuts publication/deploiement affiches via des badges visuels (`draft`, `generated`, `deployed`, `failed`, etc.).
- le panneau detail affiche un etat de chargement explicite pendant les appels API.
- actions MVP `rubriques/medias` : creation rubrique, mise a jour rubrique, creation media ;
- actions MVP `lots` : creation lot, mise a jour lot ;
- detail publication avec historique des deploiements via `GET /api/publications/:id` et `GET /api/publications/:id/deployments`.
- detail publication avec logs build/deploy via `GET /api/publications/:id/build-log` et `GET /api/publications/:id/deploy-log`.
- apres actions build/preview/deploy, le detail publication est recharge automatiquement pour afficher etat et logs.
- detail programme (programme + rubriques + medias + publications) via une vue centralisee.
- workflow guide publication dans l onglet publications (create -> generated -> preview -> deploy).
- la base API peut etre forcee avec `window.ABDOU_API_BASE` ou `<meta name="abdou-api-base" content="...">` (valeur attendue: chemin commencant par `/api`).
- si `ABDOU_API_BASE` est fournie mais invalide (ex: URL absolue, chemin non prefixe `/`), elle est ignoree et le backoffice retombe sur `/api` avec un warning console.
- `admin-api` reste utilisable uniquement comme couche de compatibilite pendant la migration.
- le backoffice charge les contrats via `/contracts` pour alimenter dynamiquement statuts/roles (plus de valeurs hardcode legacy `editor/viewer`).
- parsing des payloads durci sur les flux critiques (`users`, `clients`, `programmes`, `publications`) avec validation de structure cote UI.
- validation des cles minimales ajoutee sur les listes critiques (`clients`, `programmes`, `publications`) et sur `workflow-detail` publication.
- validation des cles minimales etendue a `rubriques`, `medias`, `lots` pour homogeniser la detection des regressions de contrat.
- fallback detail publication durci (`/publications/:id`, `/publications/:id/deployments`) avec verification de structure minimale avant rendu.
- resilience workspace maintenue en cas d echec partiel de panneaux (`Promise.allSettled` + liste `failedPanels` + statut `partiel`).
- chargement workspace rendu resilient: en cas d echec partiel d un panneau, la session reste active avec signalement des panneaux en erreur.


- le detail publication affiche un resume deploy (source, target, mode, verify, resultat).
- dans ce resume, `verify` et `resultat` sont rendus avec des badges de statut.
- un bouton `Recharger artefacts` recharge uniquement `deploy-artifacts` sans recharger tout le detail workflow.
- un bouton `Recharger resume deploy` recharge uniquement le resume de deploy sans recharger tout le detail workflow.
- ce refresh cible utilise l endpoint `GET /api/publications/:id/deploy-summary`.
- le detail publication affiche aussi `Derniere MAJ resume` et `Derniere MAJ artefacts`.
- ces horodatages incluent un indicateur de fraicheur (`fresh`/`stale`) avec seuil de 5 minutes.
- un bouton `Recharger resume + artefacts` declenche les deux refresh cibles en une seule action.
- le bouton \Recharger resume + artefacts\ signale desormais les cas de succes partiel (resume seul ou artefacts seuls).
- les boutons de refresh cibles (esume, rtefacts, esume + artefacts) respectent le verrou d'actions pour eviter les doubles appels concurrents.
- pendant une operation verrouillee, les actions detail (oir, copier, 	elecharger) sont aussi desactivees temporairement.

Smoke de convergence API base :
- `pnpm run test:smoke:backoffice:api-base` verrouille que la base par defaut du backoffice est `/api` (sans fallback implicite vers la racine).
- `pnpm run test:smoke:backoffice:api-paths` verrouille la coherence des appels `api(...)` (pas de `'/api/...'` en dur, pas d URL absolue).
