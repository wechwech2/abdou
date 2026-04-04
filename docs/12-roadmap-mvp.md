# 12-roadmap-mvp.md



## 1. Objet du document



Ce document présente la roadmap MVP du projet **Abdou**.



Son objectif est de définir une trajectoire de réalisation réaliste, alignée sur les contraintes du projet :



- industrialiser la fabrication de minisites ;

- garder l’offre comme objet métier structurant ;

- séparer l’édition interne de la diffusion publique ;

- réussir une mise en service complète sur **OVH Hosting Pro**, sans dépendance à un runtime Node en production.



La roadmap MVP ne vise pas l’exhaustivité fonctionnelle.  

Elle vise la mise en place d’une chaîne fiable, exploitable et extensible.



---
## 2. Définition du MVP



Le MVP du projet Abdou doit permettre à ARA de produire au moins un minisite complet à partir d’un programme réel, puis de le publier de manière reproductible.



Autrement dit, le MVP est atteint lorsque le système permet réellement de :



- créer un programme ;

- le structurer dans le backoffice ;

- gérer les contenus et médias essentiels ;

- générer une publication versionnée ;

- produire un livrable statique ;

- publier ce livrable sur l’hébergement OVH du client ;

- faire fonctionner le backoffice, la logique métier PHP, la génération et la base dans la même offre Hosting Pro.



Le MVP n’est donc pas seulement une interface.  

C’est une chaîne fonctionnelle complète, même si elle reste sobre.



---
## 3. Principe de construction



La construction du MVP doit suivre l’ordre de dépendance réel du produit.



Il faut d’abord stabiliser :



- le cadrage ;

- le modèle métier ;

- le modèle de données.



Ensuite, il faut construire :



- la couche métier PHP ;

- le backoffice minimal ;

- le moteur de génération ;

- le template par défaut ;

- le pipeline de publication sur Hosting Pro.



Le front administratif ne doit pas précéder la stabilisation du noyau métier et de la logique de publication.



---
## 4. Phase 0 – Cadrage et structuration



Cette phase vise à établir le socle du projet.



Elle comprend :



- la vision produit ;

- l’architecture cible ;

- l’arborescence projet ;

- le modèle métier ;

- le modèle de données MySQL compatible OVH ;

- les règles de publication ;

- la stratégie d’environnements ;

- les conventions de code.



La phase 0 est achevée lorsque le projet dispose d’un cadre suffisamment clair pour éviter une dérive de conception.



---
## 5. Phase 1 – Socle technique et SQL



Cette phase vise à rendre le projet techniquement amorçable.



Elle comprend :



- la création physique de l’arborescence ;

- l’initialisation du workspace ;

- la mise en place du schéma SQL ;

- l’écriture des seeds de base ;

- la création des types partagés ;

- la préparation de la configuration d’environnement ;

- la pose des bases de la couche métier PHP.



État d’avancement (02 avril 2026) :

- arborescence, schéma SQL et seeds initiaux en place ;

- types partagés initiaux générés et alignés sur les statuts métier MVP ;

- socle `admin-php` fonctionnel pour les routes métier principales ;

- lecture référentiel `admin-php` (offres, templates, rôles, users) couverte par smoke dédié ;

- `admin-api` Node conservé en app d’appui technique avec endpoints `/health`, `/api/modules`, `/api/contracts` ;

- `admin-api` expose aussi un gateway vers `admin-php` : auth proxy (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`), lecture (`/api/clients`, `/api/offres`, `/api/programmes`) et ecriture minimale (`clients`, `programmes`, `publications`, `deploy`, `preview`).



À la fin de cette phase, le projet doit pouvoir démarrer avec une structure technique propre et une base relationnelle cohérente.



---
## 6. Phase 2 – Couche métier PHP minimale



Cette phase vise à rendre manipulables les objets métier principaux depuis un backend compatible OVH Hosting Pro.



Le périmètre minimal doit couvrir :



- authentification simple ;

- gestion des clients ;

- gestion des offres en lecture au minimum ;

- gestion des programmes ;

- gestion des rubriques ;

- gestion des médias ;

- gestion des publications.



À ce stade, la couche métier n’a pas besoin de couvrir toutes les subtilités futures.  

Elle doit avant tout permettre au backoffice et au moteur de génération de travailler sur un noyau stable.



---
## 7. Phase 3 – Backoffice minimal opérable



Cette phase vise à donner un vrai outil de préparation interne.



Le backoffice MVP doit permettre de :



- se connecter ;

- lister les programmes ;

- créer un programme ;

- modifier la fiche programme ;

- gérer les rubriques ;

- importer et rattacher des médias ;

- visualiser l’état de préparation ;

- créer une publication.



Le but n’est pas encore de produire un backoffice riche, mais un outil suffisamment utilisable pour fabriquer un premier livrable réel.



---
## 8. Phase 4 – Moteur de génération



Cette phase est l’une des plus importantes du MVP.



Le moteur de génération doit être capable de :



- charger une publication ;

- résoudre le template ;

- préparer le payload public ;

- générer le site statique ;

- écrire les fichiers dans un dossier de build ;

- tracer les assets générés ;

- retourner un statut clair.



Le MVP n’est pas atteint si cette phase est incomplète.  

Le moteur de génération est le cœur de la promesse technique du produit.



---
## 9. Phase 5 – Template public par défaut



Cette phase vise à produire un premier minisite cohérent.



Le template par défaut doit être capable de rendre :



- le hero ;

- les rubriques principales ;

- une galerie simple ;

- la localisation ;

- les documents publics si activés ;

- les lots si l’offre le permet ;

- le footer.



Il doit être suffisamment générique pour servir plusieurs programmes, sans créer une complexité excessive de variations.



---
## 10. Phase 6 – Preview et validation



Cette phase vise à permettre la vérification du rendu avant mise en ligne.



Elle comprend :



- le preview server local ou de staging ;

- la vérification de la structure du build ;

- les premiers tests smoke ;

- le contrôle de complétude avant publication ;

- la validation manuelle rapide du rendu.



Le but est d’éviter que la première apparition publique ait lieu directement en production.



---
## 11. Phase 7 – Mise en service OVH Hosting Pro



Cette phase vise le go live réel sur l’infrastructure cible.



Elle comprend :



- la mise en place de l’hébergement OVH Hosting Pro ;

- le déploiement du backoffice, de la logique PHP, du moteur de génération et de la base ;

- la configuration des domaines, répertoires et multisites cibles ;

- la préparation des scripts de publication ;

- la vérification post-déploiement ;

- la mise à jour de l’historique de déploiement ;

- le test d’un rollback minimal.



Le MVP n’est pleinement atteint qu’une fois cette phase réussie sur une vraie cible OVH Hosting Pro du client.



---
## 12. Livrables attendus du MVP



À l’issue du MVP, les livrables attendus sont les suivants.



Le dépôt doit contenir :



- la documentation de cadrage ;

- le schéma SQL ;

- les seeds de base ;

- la couche métier PHP minimale ;

- le backoffice minimal ;

- le moteur de génération ;

- le template public par défaut ;

- les scripts de publication et de déploiement ;

- la configuration de mise en service OVH Hosting Pro ;

- un premier parcours de publication fonctionnel.



Sur le plan opérationnel, le MVP doit aussi permettre de publier au moins un minisite réel.



---
## 13. Hors périmètre du MVP



Pour protéger la trajectoire de réalisation, les éléments suivants doivent être explicitement tenus hors MVP, sauf besoin exceptionnel.



Sont hors périmètre :



- gestion commerciale complexe multi-contrats ;

- workflow multi-validation avancé ;

- analytics détaillées ;

- moteur de recherche sophistiqué ;

- multi-template hautement paramétrable ;

- import massif multi-sources complexe ;

- édition collaborative temps réel ;

- internationalisation avancée ;

- espace client autonome ;

- bibliothèque média de niveau DAM complet.



Le MVP doit rester centré sur la chaîne de fabrication minimale exploitable.



---
## 14. Critères d’acceptation du MVP



Le MVP peut être considéré comme atteint si les conditions suivantes sont remplies.



Un utilisateur interne peut créer un programme réel dans le backoffice, lui affecter une offre, préparer ses rubriques et ses médias, puis créer une publication.



Le moteur de génération peut transformer cette publication en build statique cohérent.



Le build peut être prévisualisé et validé.



Le build peut être publié correctement sur OVH Hosting Pro via le pipeline prévu.

Le backoffice, la logique PHP et le moteur de génération peuvent fonctionner sur l’OVH du client avec une configuration d’exploitation cohérente.



Le minisite public est effectivement accessible et correspond à la publication générée.



Ces critères doivent primer sur le degré de sophistication visuelle ou sur la richesse fonctionnelle secondaire.



---
## 15. Ordre de travail recommandé pour Codex



L’ordre de réalisation recommandé est le suivant.



D’abord, finaliser les documents et le socle SQL.  

Ensuite, générer les types partagés.  

Puis construire la couche métier PHP minimale.  

Après cela, développer le backoffice minimal.  

Ensuite, implémenter le moteur de génération.  

Puis intégrer le template public.  

Enfin, finaliser la mise en service OVH Hosting Pro, le pipeline de publication et les tests smoke.



Cet ordre limite les régressions de conception et garde le projet aligné sur sa finalité réelle.



---
## 16. Vision post-MVP



Après le MVP, le projet pourra évoluer selon plusieurs axes :



- enrichissement du backoffice ;

- multiplication des offres ;

- variantes de templates ;

- amélioration des lots ;

- enrichissement du pipeline de déploiement ;

- observabilité renforcée ;

- meilleure industrialisation de la bibliothèque média ;

- montée en gamme éventuelle de l’infrastructure.



Mais ces évolutions ne doivent pas compromettre la réussite du premier objectif : opérer proprement toute la chaîne sur une offre OVH Hosting Pro.



---
## 16.1. Etat d’avancement daté

Mise à jour du 2 avril 2026.

Travaux réalisés :

- arborescence cible créée et maintenue ;
- documentation socle injectée et alignée OVH Hosting Pro + PHP + publication statique ;
- schéma SQL MySQL/MariaDB initial + seeds installables localement ;
- package `shared-types` rendu consommable en runtime Node ESM (`dist` + exports) ;
- catalogue de contrats metier ajoute dans `shared-types` (statuts + role codes) et reutilise par `admin-api` ;
- smoke test dédié ajouté pour verrouiller l’import runtime de `shared-types` ;
- endpoint PHP `GET /contracts` ajouté pour exposer les catalogues métier côté cible OVH/PHP ;
- compatibilité de routage `admin-php` étendue au préfixe `/api/*` pour migration progressive du front ;
- endpoints workflow publication exposés côté `admin-php` (`build`, logs, artefacts, summary, workflow-detail) ;
- `admin-api` legacy simplifiée en proxy des routes workflow publication vers `admin-php` ;
- modules workflow internes `admin-api` supprimés (build/deploy/logs désormais portés par `admin-php`) ;
- mode de demarrage quotidien bascule sur `admin-php` (scripts `dev:admin*`), `admin-api` conserve en compatibilite optionnelle ;
- smoke HTTP direct `admin-php` ajoute pour verrouiller la cible principale sans dependance `admin-api` ;
- commande de demarrage unifiee `dev:start` ajoutee pour standardiser l'usage quotidien sur `admin-php` ;
- flag `ADMIN_API_COMPAT_ENABLED` ajoute pour desactiver explicitement la couche de compatibilite `admin-api` ;
- mode par defaut bascule sur `ADMIN_API_COMPAT_ENABLED=false` (reactivation explicite seulement si necessaire) ;
- script dedie `start:admin-api:compat` ajoute pour activer explicitement le mode proxy uniquement a la demande ;
- routage proxy `admin-api` structure via un resolveur de routes compat dedie (reduction de duplication et risque de derive) ;
- enveloppes HTTP techniques `admin-api` homogenisees (`ok=true/false`) et front backoffice aligne sur `/contracts` pour les listes de statuts/roles ;
- parsing des payloads backoffice durci (mappers structures pour `users/clients/programmes/publications`) pour detection rapide des ecarts de contrat ;
- chargement backoffice durci en mode tolerant aux pannes partielles (session maintenue + signalement des panneaux en erreur) ;
- smoke de coherence des catalogues ajoute (`shared-types` <-> `admin-php /contracts` <-> `admin-api /api/contracts`) ;
- smoke de normalisation des enveloppes `admin-api` ajoute (`ok=true/false` sur succes/erreurs techniques) ;
- smoke `admin-api-technical-contract` ajoute pour verrouiller le contrat minimal des endpoints techniques (`/health`, `/api/modules*`, `/api/contracts`, `/api/compat/*`) ;
- gestion explicite des methodes HTTP non supportees ajoutee dans `admin-api` (`405 method_not_allowed` + header `Allow`) ;
- smoke dedie `admin-api-methods` ajoute pour verrouiller ce comportement ;
- gardes de contrat de lecture ajoutes dans `admin-api` sur `clients/offres/programmes/publications` pour detecter les payloads upstream invalides ;
- garde de contrat de lecture ajoute dans `admin-api` sur `publications/:id/workflow-detail` (valideur runtime shared-types) pour detecter les structures workflow invalides ;
- endpoint technique `GET /api/compat/guards` ajoute pour exposer les gardes actives ;
- smoke dedie `admin-api-contract-guard` ajoute pour verrouiller le comportement `502 upstream_contract_mismatch` ;
- smoke dedie `admin-php /contracts` ajoute (auth requise + contrat non vide) ;
- smoke dedie lecture referentiel `admin-php` ajoute (`offres`, `templates`, `roles`, `users`) ;
- smoke dedie `admin-php-workflow-detail-contract` ajoute pour verrouiller la structure JSON de `GET /publications/:id/workflow-detail` ;
- smoke dedie `admin-php-route-surface` ajoute pour verrouiller la surface des routes critiques (`health`, routes protegees, `not_found`) ;
- smoke dedie `admin-php-api-prefix` ajoute pour verrouiller la parite de comportement entre routes racine et routes prefixees `/api/*` ;
- smoke `admin-php-api-prefix` etendu pour verifier aussi la parite auth (`/auth/me` vs `/api/auth/me`) et le cycle logout (`/api/auth/logout` puis `401` attendu sur `/api/auth/me`) ;
- smoke rollback deploy ajoute pour verrouiller la restauration minimale (`deploy-site` -> `rollback-site`) ;
- smoke verify deploy ajoute pour verrouiller la verification post-deploiement (`verify-site`, succes/erreur) en modes `target` (filesystem) et `url` (HTTP) ;
- smoke `deploy-verify` corrige pour eviter un blocage event-loop sur serveur local (appels CLI HTTP passes en mode asynchrone) ;
- script `verify-site` durci avec timeout HTTP configurable (`--timeout-ms`) et journalisation explicite des echecs reseau ;
- typage des contrats techniques `admin-api` centralise dans `shared-types` (health/modules/contracts + catalogue compat) ;
- contrats de payload `admin-php` ajoutes dans `shared-types` (auth, referentiels, clients/programmes/publications, workflow build/deploy) ;
- validateurs runtime `shared-types` etendus pour les payloads `admin-php` listes + items (`clients`, `offres`, `programmes`, `publications`) et branches sur les gardes `admin-api` ;
- validateurs runtime `shared-types` etendus aussi aux payloads `roles/users/templates` (listes + items) et relies aux gardes de lecture `admin-api` ;
- validateurs runtime `shared-types` etendus aussi aux payloads `rubriques/medias/lots` (listes + items) et relies aux gardes de lecture `admin-api` ;
- validateurs runtime `shared-types` ajoutes pour `publications/:id/deployments` et `publications/:id/deploy-summary`, relies aux gardes `admin-api` ;
- validateurs runtime `shared-types` ajoutes pour les artefacts publication (`build-log`, `deploy-log`, `deploy-manifest`, `deploy-verify-log`, `deploy-artifacts`) et relies aux gardes `admin-api` ;
- validateur runtime `shared-types` ajoute pour `auth/me` et relie au garde de lecture `admin-api` ;
- backoffice durci avec verification des cles minimales sur `clients/programmes/publications` et `workflow-detail` publication (fallback detail inclus) ;
- verification des cles minimales backoffice etendue a `rubriques/medias/lots` ;
- smoke dedie `backoffice-contract-parsing` ajoute pour verrouiller la presence de ces gardes de parsing ;
- base API par defaut du backoffice verrouillee sur `/api` (sans fallback implicite vers la racine) ;
- smoke dedie `backoffice-api-base` ajoute pour verrouiller ce comportement de convergence vers `admin-php` ;
- smoke dedie `backoffice-workspace-partial` ajoute pour verrouiller le mode degrade workspace (session conservee + statut partiel) ;
- smoke de coherence catalogue compat `admin-api` ajoute (routes declarees, doublons, politiques d acces/reponse) ;
- smoke snapshot `admin-api-compat-snapshot` ajoute pour detecter toute derive d inventaire des routes compat ;
- smoke `admin-api-compat-auth-matrix` ajoute pour verrouiller la matrice des politiques d acces des routes compat ;
- smoke `admin-api-compat-response-policy` ajoute pour verrouiller la matrice des politiques de reponse des routes compat ;
- smoke `admin-api-compat-off` etendu pour verrouiller la surface technique en mode compat coupe (`/api/modules*`, `/api/contracts`, `/api/compat/routes`, `/api/compat/guards`) ;
- smoke HTTP `admin-api` durci pour creer une publication de test, executer `build/deploy` via API, puis verifier `workflow-detail` sans skip base sur ID hardcode ;
- runner smoke enrichi avec un rapport Markdown exploitable (`dist/logs/smoke-summary.md`) en plus du JSON ;
- workflow CI aligne pour publier aussi le rapport Markdown smoke dans le Step Summary ;
- playbook operationnel court ajoute (dev/staging/compat) pour normaliser l exploitation quotidienne ;
- smoke RBAC `admin-php` ajoute pour verrouiller les regles `401/403` sur lecture/ecriture ;
- validation d'entree `admin-php` durcie (status/query ids/champs structurants) avec smoke dedie `admin-php-validation` ;
- scripts de build, validation, packaging et déploiement local disponibles ;
- endpoints `admin-api` legacy de support publication en place ;
- smoke tests publication + modules admin-api + endpoints HTTP opérationnels ;
- pipeline CI (`pnpm run check`) en place avec rapport de synthèse smoke.

Travaux en cours :

- convergence progressive du legacy Node vers la cible d’exécution métier PHP sur OVH ;
- durcissement du workflow de publication (contrôles, diagnostics, rollback opérationnel) ;
- stabilisation UX backoffice sur les écrans de publication et d’exploitation.

Prochain jalon rationnel :

- extension des types partagés métier (couverture objets + contraintes MVP) ;
- puis démarrage structuré de la couche d’administration opérationnelle (priorité cible OVH/PHP, avec `admin-api` conservé en app d’appui transitoire).



---
## 17. Conclusion



La roadmap MVP du projet Abdou doit rester disciplinée.



Le vrai succès n’est pas d’accumuler rapidement des écrans ou des options.  

Le vrai succès est de mettre en service une chaîne cohérente :



préparation interne, structuration métier, génération statique, validation, mise en service sur OVH Hosting Pro, puis diffusion fiable depuis ce même hébergement.



C’est cette chaîne, et non une simple interface, qui constitue le MVP du produit.

---
## 18. Mise à jour session (04 avril 2026)

Livré sur le socle V1 publiable:

- minisite public data-driven route `/minisites/:programme-slug` ;
- payload public V1 (programme, offre, template, rubriques, médias, lots, bâtiments, sections conditionnelles) ;
- template public V1 (hero, rubriques actives, environnement, maquette & lots, images, vidéo, documentation, footer) ;
- flux publication effectif build -> deploy -> published_url ;
- alignement de publication `public_path=/minisites/:slug`, `target_path=www/minisites/:slug`, `published_url=https://<domain>/minisites/:slug` ;
- statuts déploiement corrigés (`pending -> running -> success|failed`) ;
- CRUD minimal backoffice PHP: programme, rubriques, médias, associations programme-médias, bâtiments, étages, lots ;
- smoke tests renforcés sur parcours V1.

Prochaine reprise recommandée (ordre court):

1. formulaire lots admin avec sélection guidée bâtiment/étage ;
2. upload médias local (au-delà URL) + copie assets publication ;
3. validation métier opérateur/validateur/admin avant publication.


