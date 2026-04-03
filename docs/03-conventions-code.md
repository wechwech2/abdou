# 03-conventions-code.md



## 1. Objet du document



Ce document définit les conventions de code du projet **Abdou**.



Son objectif est de garantir un code :



- lisible ;

- cohérent ;

- maintenable ;

- compatible avec une industrialisation progressive ;

- adapté à une architecture séparant administration, génération et publication.



Ces conventions s’appliquent au backoffice, à la couche métier PHP, au moteur de génération, aux packages partagés et aux scripts de déploiement.



---
## 2. Principes directeurs



Le code du projet doit respecter les principes suivants :



### 2.1. Clarté avant sophistication



Le projet est un produit métier industrialisable, pas un terrain d’expérimentation gratuit.  

Un code simple, explicite et stable doit toujours être préféré à une abstraction prématurée.



### 2.2. Cohérence avant préférence individuelle



Les choix de nommage, de structure et de découpage doivent rester homogènes d’un module à l’autre.  

L’objectif n’est pas que chaque développeur exprime son style personnel, mais que le dépôt reste intelligible dans son ensemble.



### 2.3. Séparation stricte des responsabilités



Le projet distingue clairement :



- le backoffice ;

- la couche métier PHP ;

- le moteur de génération ;

- le template public ;

- les scripts de déploiement.



Le code ne doit pas brouiller ces frontières.



### 2.4. MVP industrialisable



Les développements doivent viser une progression rationnelle vers un MVP exploitable.  

Il faut éviter les raffinements qui ralentissent le socle sans bénéfice immédiat.



---
## 3. Langue de travail



La langue de travail du code doit être cohérente.



### 3.1. Code source



Les identifiants techniques doivent être écrits en **anglais simple et stable**.



Cela concerne notamment :



- noms de variables ;

- noms de fonctions ;

- noms de classes ;

- noms de fichiers techniques ;

- points d’entrée HTTP ;

- types TypeScript ;

- noms de tables et colonnes SQL déjà définis.



### 3.2. Documentation métier



La documentation fonctionnelle et d’architecture peut rester en **français**.



### 3.3. Valeurs métier affichées



Les libellés visibles par les utilisateurs peuvent être en **français** tant que le besoin produit reste francophone.



---
## 4. Organisation générale du code



## 4.1. Découpage par domaine



Le code applicatif doit être structuré par domaine métier plutôt que par type technique seul.



Par exemple, dans la couche métier PHP et le backoffice, on privilégiera des modules tels que :



- clients

- offres

- programmes

- rubriques

- medias

- lots

- publications



Cela permet de faire correspondre le code au modèle métier.



## 4.2. Éviter les dossiers fourre-tout



Les dossiers génériques comme `misc`, `helpers2`, `temp`, `final`, `new`, `old`, `stuff` ou équivalents sont interdits.



Un fichier ou dossier doit avoir un nom indiquant clairement sa responsabilité.



## 4.3. Unité de responsabilité



Un fichier doit avoir une responsabilité dominante identifiable.  

S’il commence à porter plusieurs sujets distincts, il doit être découpé.



---
## 5. Conventions de nommage



## 5.1. Fichiers et dossiers



Les fichiers et dossiers doivent être nommés en **kebab-case** lorsqu’ils relèvent du système de fichiers.



Exemples :



- `programmes.service.ts`

- `publication-builder.ts`

- `deploy-site.mjs`

- `shared-types`

- `site-template-default`



## 5.2. Variables et fonctions



Les variables et fonctions doivent être nommées en **camelCase**.



Exemples :



- `buildPublication`

- `generateProgramSlug`

- `findPublishedProgrammes`



## 5.3. Classes et types



Les classes, interfaces, enums et types doivent être nommés en **PascalCase**.



Exemples :



- `ProgrammeService`

- `PublicationStatus`

- `CreateProgrammeDto`

- `ProgrammeSummary`



## 5.4. Constantes globales



Les constantes métier ou techniques partagées doivent être nommées en **UPPER\_SNAKE\_CASE** lorsqu’elles sont réellement constantes.



Exemples :



- `DEFAULT\_TEMPLATE\_CODE`

- `MAX\_UPLOAD\_FILE\_SIZE`

- `PUBLICATION\_STATUS\_DEPLOYED`



## 5.5. Noms booléens



Les booléens doivent porter des noms lisibles et affirmatifs.



Exemples corrects :



- `isActive`

- `isPublished`

- `hasGallery`

- `canDeploy`



Exemples à éviter :



- `activeFlag`

- `publishStateBool`

- `testOkMaybe`



---
## 6. Conventions TypeScript



## 6.1. Typage



Le projet doit privilégier un typage explicite et fiable.



Règles :



- éviter `any` sauf cas exceptionnel et justifié ;

- préférer `unknown` à `any` quand le type n’est pas encore résolu ;

- typer les retours de fonctions publiques ;

- centraliser les types métier partagés dans `packages/shared-types`.



## 6.2. DTO et contrats



Les objets d’entrée et de sortie doivent être formalisés par des types ou DTO dédiés.



Exemples :



- `CreateClientDto`

- `UpdateProgrammeDto`

- `PublicationBuildInput`

- `ProgrammePublicPayload`



## 6.3. Enums



Les enums doivent être réservés aux états ou catégories réellement structurants.  

S’il suffit d’une union littérale simple, on la privilégiera.



## 6.4. Fonctions pures



Lorsqu’une logique de transformation ne dépend pas d’un service externe, elle doit être écrite sous forme de fonction pure.



Cela est particulièrement important dans :



- les transformations de contenu ;

- la génération de slugs ;

- la préparation des payloads de publication ;

- les validations simples.



---
## 7. Conventions de la couche métier PHP



## 7.1. Ressources



Les points d’entrée HTTP doivent suivre une logique ressource claire.



Exemples :



- `/clients`

- `/offres`

- `/programmes`

- `/programmes/:id/rubriques`

- `/programmes/:id/publications`



## 7.2. Actions spécifiques



Les actions exceptionnelles doivent rester limitées et explicites.



Exemples acceptables :



- `POST /publications/:id/build`

- `POST /publications/:id/deploy`



Il faut éviter de transformer toute la couche métier exposée en collection de verbes sans structure.



## 7.3. Réponses



Les réponses de la couche métier doivent rester prévisibles.  

Un même type d’opération doit renvoyer des structures homogènes.



## 7.4. Validation



Toutes les entrées externes doivent être validées côté couche métier PHP :



- formats ;

- longueurs ;

- champs requis ;

- cohérence métier minimale.



Aucune confiance implicite ne doit être accordée au front.



---
## 8. Conventions SQL



## 8.1. Tables et colonnes



Les tables et colonnes SQL sont définies en **snake\_case**.



Exemples :



- `programme\_rubriques`

- `created\_at`

- `updated\_at`

- `publication\_status`



## 8.2. Clés primaires et étrangères



Les identifiants primaires suivent la forme :



- `id`



Les clés étrangères suivent la forme :



- `client\_id`

- `offre\_id`

- `programme\_id`



## 8.3. Horodatage



Les tables persistantes doivent prévoir autant que possible :



- `created\_at`

- `updated\_at`



Lorsque pertinent, elles peuvent aussi prévoir :



- `started\_at`

- `generated\_at`

- `deployed\_at`



## 8.4. États métier



Les états métier stockés en base doivent rester simples, explicites et documentés dans le code.



Exemples :



- `draft`

- `ready`

- `generated`

- `deployed`

- `archived`



---
## 9. Conventions de structure côté backoffice



## 9.1. Features



Chaque feature du backoffice doit correspondre à un domaine métier identifiable.



Exemples :



- `features/clients`

- `features/programmes`

- `features/publications`



## 9.2. Composants partagés



Les composants réutilisables ne doivent pas contenir de logique métier spécifique forte.  

Ils doivent rester génériques et réemployables.



## 9.3. Formulaires



Les formulaires doivent être découpés lorsque le domaine l’exige :



- formulaire principal ;

- sections dédiées ;

- validations lisibles ;

- mapping propre vers les DTO d’entrée et de sortie.



---
## 10. Conventions côté moteur de génération



## 10.1. Le moteur de génération n’est pas un second backoffice



Le code du moteur de génération doit rester focalisé sur :



- le chargement des données ;

- leur transformation ;

- la génération ;

- l’écriture du livrable ;

- le packaging ;

- le déploiement éventuel.



Il ne doit pas absorber la logique métier générale de gestion.



## 10.2. Pipeline explicite



Le pipeline doit être lisible dans le code.



Par exemple :



- charger une publication ;

- résoudre le template ;

- transformer les données ;

- générer les pages ;

- copier les assets ;

- produire le package final.



Cette chaîne doit apparaître clairement dans les modules et dans les noms.



## 10.3. Sorties reconstruisibles



Le moteur de génération ne doit produire que des artefacts reconstruisibles.  

Aucune donnée critique ne doit vivre uniquement dans `dist/`.



---
## 11. Gestion des erreurs



## 11.1. Erreurs explicites



Les erreurs doivent être formulées clairement, avec un message exploitable.



Exemples :



- publication introuvable ;

- template inactif ;

- programme sans offre ;

- média manquant pour le hero.



## 11.2. Pas de silence technique



Les erreurs ne doivent pas être absorbées silencieusement sans journalisation minimale.



## 11.3. Contextualisation



Une erreur doit contenir suffisamment de contexte pour permettre un diagnostic rapide.



Exemples utiles :



- identifiant de publication ;

- chemin de sortie ;

- code template ;

- cible FTP.



---
## 12. Logs et observabilité



## 12.1. Logs utiles



Les logs doivent aider à comprendre ce qui se passe réellement.  

Il faut éviter :



- les logs décoratifs ;

- les messages vagues ;

- les logs massifs non filtrables.



## 12.2. Étapes loguées



Le moteur de génération et les scripts de déploiement doivent journaliser les étapes importantes :



- début de build ;

- récupération des données ;

- génération terminée ;

- packaging terminé ;

- début de déploiement ;

- succès ou échec.



## 12.3. Pas d’informations sensibles dans les logs



Ne jamais exposer dans les logs :



- mots de passe ;

- secrets ;

- credentials FTP complets ;

- tokens ;

- données non nécessaires.



---
## 13. Configuration et variables d’environnement



## 13.1. Pas de secrets en dur



Aucun secret ne doit être hardcodé dans le dépôt.



Cela concerne notamment :



- accès base de données ;

- identifiants FTP ;

- clés d’API ;

- secrets de session.



## 13.2. Variables d’environnement centralisées



Les variables d’environnement doivent être lues via une couche centralisée de configuration.



## 13.3. Fichier exemple



Le dépôt doit contenir un `.env.example` documenté et propre.



---
## 14. Tests



## 14.1. Priorités de test



Pour le MVP, les tests les plus rentables doivent cibler :



- les transformations métier pures ;

- la génération de publication ;

- les validations critiques ;

- les scripts de packaging ;

- les points sensibles du déploiement.



## 14.2. Tests unitaires



Les fonctions pures et services isolables doivent recevoir des tests unitaires.



## 14.3. Tests d’intégration



Les cas de publication doivent avoir quelques tests d’intégration représentant le parcours réel minimal.



## 14.4. Tests smoke



Un test smoke doit vérifier qu’une publication générée contient bien les artefacts essentiels attendus.



---
## 15. Git et hygiène de dépôt



## 15.1. Fichiers générés



Les dossiers de sortie comme `dist/`, `storage/exports/` ou artefacts temporaires ne doivent pas polluer le dépôt, sauf décision explicite contraire.



## 15.2. Commits



Les commits doivent être ciblés et compréhensibles.  

Il faut éviter les commits massifs sans cohérence interne.



## 15.3. Branches



Les branches doivent refléter un objectif identifiable :



- documentation

- schema-sql

- metier-programmes

- generation-build

- deploy-ovh



---
## 16. Qualité minimale attendue



Un code est considéré acceptable lorsqu’il respecte les critères suivants :



- responsabilité claire ;

- nommage explicite ;

- absence de duplication grossière ;

- pas de dépendance circulaire évidente ;

- pas de secret embarqué ;

- pas d’abstraction prématurée inutile ;

- cohérence avec le modèle métier ;

- cohérence avec l’architecture “édition dynamique / publication statique”.



---
## 17. Anti-patterns à éviter



Les pratiques suivantes doivent être évitées :



- mélanger logique de publication et logique de backoffice ;

- lire directement la base depuis le template public en production ;

- coder des chemins en dur spécifiques à une machine ;

- multiplier les champs JSON pour éviter de modéliser proprement ;

- faire du template public un mini framework autonome ;

- créer des couches techniques inutiles pour un MVP ;

- accumuler des utilitaires sans ownership clair ;

- surcharger les services avec trop de responsabilités.



---
## 18. Conclusion



Les conventions de code du projet Abdou servent un objectif précis :



produire un système lisible, stable et extensible, compatible avec une chaîne de fabrication de minisites et avec une diffusion finale sur OVH Hosting Pro.



Le principe à retenir est simple :



**un code clair, découpé par responsabilité, aligné sur le métier et sur la logique de publication.**


