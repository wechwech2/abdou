# 05-modele-donnees-mysql-ovh.md



## 1. Objet du document



Ce document définit les principes de modélisation de la base de données du projet **Abdou**, dans une cible compatible avec **MySQL/MariaDB sur OVH**.



L’objectif n’est pas uniquement de stocker des données, mais de permettre :



- une gestion métier propre ;

- une génération fiable des publications ;

- une compatibilité technique avec le go live retenu ;

- une évolution future sans refonte majeure.



---
## 2. Principe général de modélisation



Le modèle de données doit refléter le modèle métier, sans sur-ingénierie.



Il doit distinguer clairement :



- les entités de paramétrage ;

- les entités de production ;

- les entités de publication ;

- les entités techniques d’exploitation.



La base n’a pas vocation à servir directement le site public à chaque requête visiteur.  

Elle sert d’abord de **source de vérité pour la fabrication**.



---
## 3. Contraintes de conception liées à OVH



La base cible doit rester compatible avec un environnement MySQL/MariaDB OVH sobre et portable.



Cela implique les orientations suivantes :



- privilégier un schéma simple et lisible ;

- éviter les dépendances à des procédures complexes ;

- éviter les fonctionnalités spécifiques à d’autres moteurs ;

- limiter la logique métier dans la base ;

- privilégier les contraintes gérées par l’application lorsque cela simplifie l’exploitation ;

- utiliser UTF-8 proprement ;

- anticiper des exports, imports et sauvegardes simples.



Le modèle ne doit pas supposer des capacités d’administration avancées indisponibles sur une offre OVH simple.

En cible finale, la base d’administration doit tenir dans les bases MySQL fournies par OVH Hosting Pro, et le schéma doit conserver une forte portabilité.



---
## 4. Schéma conceptuel cible



Le schéma conceptuel minimal s’organise autour des tables suivantes :



- `users`

- `roles`

- `clients`

- `offres`

- `templates`

- `programmes`

- `programme\_rubriques`

- `medias`

- `programme\_medias`

- `batiments`

- `etages`

- `lots`

- `publications`

- `publication\_assets`

- `publication\_deployments`



Selon les besoins, des tables annexes pourront compléter ce noyau.



---
## 5. Tables de référence et d’administration



## 5.1. Table `roles`



Cette table stocke les rôles fonctionnels internes :



- administrateur ;

- opérateur ;

- valideur ;

- exploitant.



Champs recommandés :



- `id`

- `code`

- `label`

- `is\_active`

- `created\_at`

- `updated\_at`



## 5.2. Table `users`



Cette table stocke les utilisateurs du backoffice.



Champs recommandés :



- `id`

- `role\_id`

- `first\_name`

- `last\_name`

- `email`

- `password\_hash`

- `is\_active`

- `last\_login\_at`

- `created\_at`

- `updated\_at`



Relations :



- un utilisateur appartient à un rôle.



---
## 6. Tables métier principales



## 6.1. Table `clients`



La table `clients` représente les donneurs d’ordre.



Champs recommandés :



- `id`

- `code`

- `name`

- `slug`

- `legal\_name`

- `contact\_name`

- `contact\_email`

- `contact\_phone`

- `brand\_primary\_color`

- `brand\_secondary\_color`

- `logo\_media\_id`

- `status`

- `notes`

- `created\_at`

- `updated\_at`



Remarques :



- `slug` doit être unique ;

- `status` doit rester simple pour le MVP ;

- `logo\_media\_id` peut référencer un média existant.



## 6.2. Table `offres`



La table `offres` stocke les niveaux de prestation.



Champs recommandés :



- `id`

- `code`

- `name`

- `slug`

- `description`

- `template\_id`

- `max\_rubriques`

- `enable\_lots`

- `enable\_documents`

- `enable\_gallery`

- `enable\_map`

- `enable\_contact\_block`

- `is\_active`

- `created\_at`

- `updated\_at`



Remarque importante :



l’offre pilote réellement le comportement métier et ne doit pas être vidée de sa substance.



## 6.3. Table `templates`



La table `templates` recense les gabarits de rendu.



Champs recommandés :



- `id`

- `code`

- `name`

- `version`

- `is\_default`

- `is\_active`

- `created\_at`

- `updated\_at`



Une offre référence un template principal.



## 6.4. Table `programmes`



La table `programmes` représente les opérations immobilières.



Champs recommandés :



- `id`

- `client\_id`

- `offre\_id`

- `template\_id`

- `code`

- `name`

- `slug`

- `headline`

- `short\_description`

- `full\_description`

- `city`

- `address\_line`

- `postal\_code`

- `latitude`

- `longitude`

- `hero\_media\_id`

- `status`

- `publication\_status`

- `target\_path`

- `target\_domain`

- `seo\_title`

- `seo\_description`

- `created\_by`

- `updated\_by`

- `created\_at`

- `updated\_at`



Relations :



- un programme appartient à un client ;

- un programme s’inscrit dans une offre ;

- un programme peut référencer explicitement un template si une surcharge est autorisée.



---
## 7. Tables de structuration éditoriale



## 7.1. Table `programme\_rubriques`



Cette table représente les rubriques activées sur un programme.



Champs recommandés :



- `id`

- `programme\_id`

- `code`

- `title`

- `slug`

- `content\_html`

- `content\_text`

- `display\_order`

- `is\_enabled`

- `is\_menu\_visible`

- `settings\_json`

- `created\_at`

- `updated\_at`



Remarques :



- `code` identifie la nature fonctionnelle de la rubrique ;

- `settings\_json` permet de stocker des paramètres simples de rendu sans multiplier les colonnes trop tôt ;

- il faut éviter d’y stocker tout le métier principal.



## 7.2. Table `programme\_contacts` (optionnelle mais pertinente)



Cette table peut stocker les coordonnées publiques affichées dans le minisite.



Champs recommandés :



- `id`

- `programme\_id`

- `label`

- `contact\_name`

- `phone`

- `email`

- `address`

- `is\_primary`

- `created\_at`

- `updated\_at`



---
## 8. Tables médias



## 8.1. Table `medias`



La table `medias` représente les fichiers gérés.



Champs recommandés :



- `id`

- `uuid`

- `type`

- `mime\_type`

- `original\_filename`

- `storage\_filename`

- `storage\_path`

- `public\_url`

- `title`

- `alt\_text`

- `caption`

- `width`

- `height`

- `file\_size`

- `checksum`

- `status`

- `uploaded\_by`

- `created\_at`

- `updated\_at`



Remarques :



- le média est un objet métier ;

- `storage\_path` ne doit pas dépendre du futur domaine public ;

- `checksum` aide à éviter les doublons ou à vérifier l’intégrité.



## 8.2. Table `programme\_medias`



Cette table gère l’affectation des médias.



Champs recommandés :



- `id`

- `programme\_id`

- `media\_id`

- `rubrique\_id`

- `lot\_id`

- `usage\_code`

- `display\_order`

- `is\_featured`

- `is\_published`

- `created\_at`

- `updated\_at`



Cette table permet de rattacher un média :



- au programme ;

- à une rubrique ;

- à un lot.



---
## 9. Tables de structuration immobilière



## 9.1. Table `batiments`



Champs recommandés :



- `id`

- `programme\_id`

- `code`

- `name`

- `display\_order`

- `is\_active`

- `created\_at`

- `updated\_at`



## 9.2. Table `etages`



Champs recommandés :



- `id`

- `batiment\_id`

- `code`

- `name`

- `level\_number`

- `display\_order`

- `created\_at`

- `updated\_at`



## 9.3. Table `lots`



Champs recommandés :



- `id`

- `programme\_id`

- `batiment\_id`

- `etage\_id`

- `reference`

- `title`

- `typology`

- `surface\_m2`

- `price\_label`

- `commercial\_status`

- `short\_description`

- `display\_order`

- `is\_published`

- `created\_at`

- `updated\_at`



Remarques :



- ne pas imposer trop tôt une structure commerciale trop complexe ;

- pour le MVP, des champs simples et robustes valent mieux qu’un modèle trop fin.



---
## 10. Tables de publication



## 10.1. Table `publications`



La table `publications` est centrale.



Champs recommandés :



- `id`

- `programme\_id`

- `version\_number`

- `build\_code`

- `template\_id`

- `status`

- `source\_snapshot\_json`

- `build\_path`

- `public\_path`

- `published\_url`

- `started\_at`

- `generated\_at`

- `deployed\_at`

- `created\_by`

- `created\_at`

- `updated\_at`



Remarques importantes :



- `version\_number` doit être incrémental par programme ;

- `build\_code` doit être unique ;

- `source\_snapshot\_json` peut conserver un instantané léger du contexte de publication ;

- `status` doit couvrir au minimum brouillon, générée, déployée, échouée, archivée.



## 10.2. Table `publication\_assets`



Cette table permet de tracer les assets réellement inclus dans une publication.



Champs recommandés :



- `id`

- `publication\_id`

- `media\_id`

- `relative\_output\_path`

- `asset\_type`

- `created\_at`



Elle facilite :



- la traçabilité ;

- l’audit ;

- le nettoyage ;

- le rollback.



## 10.3. Table `publication\_deployments`



Cette table historise les déploiements.



Champs recommandés :



- `id`

- `publication\_id`

- `target\_type`

- `target\_label`

- `target\_host`

- `target\_path`

- `deployment\_status`

- `deployed\_by`

- `started\_at`

- `finished\_at`

- `log\_excerpt`

- `created\_at`



Cette table est utile même dans un MVP si l’on veut garder un minimum d’exploitation propre.



---
## 11. Types de données recommandés



Dans une cible MySQL/MariaDB compatible OVH, les recommandations suivantes sont adaptées.



### 11.1. Identifiants



Utiliser de préférence :



- `BIGINT UNSIGNED` auto-incrémenté pour les identifiants internes ;

- éventuellement `CHAR(36)` ou `VARCHAR(36)` pour les UUID fonctionnels si nécessaire.



Pour le MVP, les identifiants numériques suffisent très bien.



### 11.2. Textes courts



Utiliser `VARCHAR` avec des tailles raisonnables :



- `VARCHAR(100)`

- `VARCHAR(150)`

- `VARCHAR(255)`



### 11.3. Textes longs



Utiliser `TEXT` ou `MEDIUMTEXT` selon le volume.



### 11.4. Dates



Utiliser :



- `DATETIME`

- ou `TIMESTAMP` selon les besoins de portabilité.



Pour éviter les comportements implicites indésirables, `DATETIME` est souvent plus prévisible.



### 11.5. Booléens



Utiliser `TINYINT(1)`.



### 11.6. Données semi-structurées



Le JSON peut être utilisé avec prudence pour :



- paramètres de rubrique ;

- snapshots de publication ;

- options de rendu.



Il ne doit pas remplacer le modèle relationnel principal.



---
## 12. Clés, index et unicité



Le schéma doit prévoir des index utiles, sans excès.



### 12.1. Unicité recommandée



Il faut prévoir des contraintes d’unicité sur :



- `clients.slug`

- `offres.code`

- `offres.slug`

- `templates.code`

- `programmes.slug`

- `publications.build\_code`



### 12.2. Index de navigation



Prévoir des index sur :



- `programmes.client\_id`

- `programmes.offre\_id`

- `programme\_rubriques.programme\_id`

- `programme\_medias.programme\_id`

- `lots.programme\_id`

- `publications.programme\_id`

- `publication\_deployments.publication\_id`



### 12.3. Ordonnancement



Les champs `display\_order` doivent être indexés lorsque les écrans les utilisent massivement.



---
## 13. Intégrité et suppression



Le modèle doit éviter les suppressions destructrices mal maîtrisées.



### 13.1. Suppression logique



Pour plusieurs entités, la désactivation ou l’archivage est préférable à la suppression physique.



### 13.2. Suppression physique encadrée



Les suppressions physiques doivent rester possibles pour :



- brouillons techniques ;

- imports échoués ;

- médias jamais publiés.



### 13.3. Publications



Une publication déployée ne doit pas être supprimée sans traçabilité.



---
## 14. Exemple de relations principales



Le graphe principal est le suivant :



- un `client` possède plusieurs `programmes`

- une `offre` encadre plusieurs `programmes`

- un `template` peut être utilisé par plusieurs `offres` et `publications`

- un `programme` possède plusieurs `programme\_rubriques`

- un `programme` possède plusieurs `programme\_medias`

- un `programme` possède plusieurs `lots`

- un `programme` possède plusieurs `publications`

- une `publication` possède plusieurs `publication\_assets`

- une `publication` possède plusieurs `publication\_deployments`



---
## 15. Exemple minimal de DDL logique



Le DDL réel sera détaillé dans les scripts SQL, mais voici l’intention structurelle.



### Table `clients`



- clé primaire `id`

- slug unique

- informations de marque et de contact



### Table `offres`



- clé primaire `id`

- code unique

- paramètres fonctionnels d’activation



### Table `programmes`



- clé primaire `id`

- FK vers `clients`

- FK vers `offres`

- FK éventuelle vers `templates`

- slug unique

- informations éditoriales, géographiques et SEO



### Table `programme\_rubriques`



- clé primaire `id`

- FK vers `programmes`

- code de rubrique

- ordre d’affichage

- statut activé / non activé



### Table `medias`



- clé primaire `id`

- métadonnées fichier

- statut

- traçabilité upload



### Table `programme\_medias`



- clé primaire `id`

- FK vers `programmes`

- FK vers `medias`

- rattachement facultatif à rubrique ou lot



### Table `publications`



- clé primaire `id`

- FK vers `programmes`

- version

- statut

- chemins de build et de déploiement



---
## 16. Règles de modélisation à respecter



Le schéma devra respecter les principes suivants :



- ne pas confondre données de saisie et données de publication ;

- ne pas modéliser le minisite public comme une simple page unique sans structure ;

- ne pas enfermer toute la logique dans des champs texte non structurés ;

- garder un noyau relationnel propre ;

- utiliser le JSON avec parcimonie ;

- faciliter la génération répétable ;

- anticiper la traçabilité des déploiements.



---
## 17. Décisions à figer pour le SQL



Les décisions suivantes doivent être retenues pour la phase SQL :



1. moteur cible : MySQL/MariaDB compatible OVH Hosting Pro ;

2. encodage : UTF-8 complet ;

3. identifiants : numériques simples pour le MVP ;

4. structure relationnelle claire pour client, offre, programme, publication ;

5. publication versionnée ;

6. médias gérés par table dédiée ;

7. lots activables mais non obligatoires ;

8. historique minimal de déploiement.



---
## 18. Conclusion



Le modèle de données du projet Abdou doit rester simple, solide et directement utile à la chaîne de fabrication du minisite.



La base n’est pas là pour alimenter en direct un site public lourd ;  

elle est là pour structurer, sécuriser et préparer la génération.



Le noyau critique du schéma est donc :



- `clients`

- `offres`

- `programmes`

- `programme\_rubriques`

- `medias`

- `lots`

- `publications`



C’est autour de ce noyau que le MVP doit être construit.


