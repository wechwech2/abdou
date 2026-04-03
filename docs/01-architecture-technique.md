# 01-architecture-technique.md

## 1. Objet du document

Ce document décrit l’architecture technique cible du projet **Abdou**.

La contrainte structurante est désormais claire :

- toute la chaîne doit fonctionner dans une seule offre **OVH Hosting Pro** du client ;
- le backoffice doit s’appuyer sur le **moteur PHP** de l’hébergement ;
- les minisites publics doivent rester **générés statiquement** ;
- la solution doit tenir dans les capacités réelles de l’offre : **4 bases MySQL de 1 Go**, **250 Go disque**, **10 multisites**, **SSH**, **FTP**, **SSL Let’s Encrypt** et protections standard.

L’objectif n’est donc plus de prévoir une séparation entre une plateforme d’administration distincte et un hébergement public séparé.  
L’objectif est de concevoir une architecture **sobre, exploitable sur mutualisé enrichi**, et compatible avec la logique :

**on administre dynamiquement en PHP, mais on publie statiquement.**

---
## 2. Principe d’architecture

Le principe directeur du projet est le suivant :

**tout est opéré depuis OVH Hosting Pro, mais le public reste livré sous forme statique.**

Cela signifie que :

- le backoffice et la logique métier vivent sur le même hébergement OVH ;
- les données métier sont stockées dans les bases MySQL OVH de l’offre ;
- un moteur de publication, déclenché depuis le backoffice ou via scripts PHP / SSH, reconstruit les minisites ;
- les minisites sont écrits dans des répertoires publics ou multisites dédiés ;
- le site public final ne dépend pas d’un runtime Node actif en production.

---
## 3. Vue d’ensemble des blocs techniques

L’architecture cible se compose de cinq blocs.

### 3.1. Backoffice web

Le backoffice est l’interface interne utilisée par ARA pour gérer :

- les clients ;
- les offres ;
- les programmes ;
- les rubriques ;
- les médias ;
- les publications ;
- les paramètres de diffusion.

Le backoffice doit être déployé sur l’hébergement OVH Hosting Pro et protégé par authentification.  
Il peut utiliser du JavaScript côté navigateur, mais sa logique serveur doit rester compatible avec le moteur PHP OVH.

### 3.2. Couche métier PHP

La logique métier côté serveur doit être portée par une couche PHP compatible avec l’hébergement mutualisé.

Cette couche doit couvrir :

- authentification ;
- CRUD métier ;
- validation des données ;
- gestion des médias ;
- préparation des publications ;
- déclenchement de la génération ;
- orchestration de la mise en ligne.

Le projet ne doit donc plus supposer une API Node.js persistante en production.

### 3.3. Base de données MySQL OVH

La base de données stocke les objets métier structurants :

- clients ;
- offres ;
- programmes ;
- rubriques ;
- médias ;
- lots ;
- publications ;
- historiques minimaux.

Le modèle doit rester compatible avec MySQL/MariaDB fourni par OVH Hosting Pro.

### 3.4. Moteur de génération

Le moteur de génération est le cœur de la chaîne de publication.

Il lit les données validées, applique le template de sortie, prépare les assets, génère les pages HTML/CSS/JS statiques et produit un livrable publiable.

En cible finale, ce moteur doit être exécutable depuis le même hébergement OVH :

- par action backoffice ;
- par script PHP ;
- ou par script lancé via SSH, si cela reste compatible avec l’offre.

### 3.5. Hébergement public

L’hébergement public repose sur les espaces publics du même OVH Hosting Pro :

- racine web ;
- sous-répertoires dédiés ;
- ou multisites.

Il ne doit servir que :

- les fichiers HTML générés ;
- les assets statiques ;
- les documents publics ;
- les médias optimisés.

Le public ne doit pas dépendre d’un calcul à la volée à chaque visite.

---
## 4. Environnements logiques

Le projet doit distinguer trois environnements logiques.

### 4.1. Développement

Cet environnement sert à :

- développer le backoffice ;
- développer la logique PHP ;
- tester les templates ;
- tester la génération ;
- simuler les publications.

Il peut vivre localement.

### 4.2. Staging

Cet environnement sert à :

- valider le rendu généré ;
- tester les données réelles ;
- vérifier les chemins de génération ;
- reproduire le parcours complet avant mise en ligne.

Si possible, il doit déjà se rapprocher des contraintes d’OVH Hosting Pro.

### 4.3. Production

La production correspond à **une seule offre OVH Hosting Pro**.

À l’intérieur de cette offre, on distingue logiquement :

- le backoffice protégé ;
- la couche métier PHP ;
- les bases MySQL ;
- les zones de stockage ;
- les zones publiques de diffusion des minisites.

La séparation est logique et structurelle, mais pas fondée sur deux infrastructures distinctes.

---
## 5. Schéma fonctionnel de circulation

Le flux cible est le suivant :

1. un opérateur crée un client ;
2. il lui affecte une offre ;
3. il crée un programme ;
4. il charge les contenus et médias ;
5. il structure les rubriques ;
6. il lance un aperçu ;
7. il déclenche une publication ;
8. le moteur récupère les données validées ;
9. le moteur génère le site statique ;
10. le système construit un livrable publiable ;
11. le système publie ce livrable dans le multisite ou répertoire public cible ;
12. le minisite devient accessible publiquement.

La publication doit être considérée comme un **artefact généré**, et non comme une lecture live de la base en production.

---
## 6. Choix techniques directeurs

### 6.1. Type d’application publique

Le site public doit être un **site statique généré**.

Il peut embarquer du JavaScript côté navigateur, mais il ne doit pas dépendre d’un backend Node permanent.

### 6.2. Type d’administration

Le backoffice doit être compatible avec le **moteur PHP OVH**.

Cela implique :

- pas de dépendance à un serveur Node persistant ;
- pas d’hypothèse de workers complexes ;
- pas d’architecture qui exige des services système non disponibles sur mutualisé.

### 6.3. Type de base de données

Le schéma doit viser **MySQL/MariaDB compatible OVH Hosting Pro**.

Il ne doit pas supposer :

- des fonctionnalités SQL Server ;
- des procédures lourdes ;
- des capacités d’administration indisponibles sur mutualisé.

### 6.4. Déploiement

Le déploiement doit être pensé autour de :

- génération de build ;
- validation ;
- écriture locale dans les espaces publics ;
- vérification post-publication ;
- rollback simple.

Le FTP reste un outil d’exploitation ou de secours, pas nécessairement le mode principal de publication si tout vit sur le même hébergement.

### 6.5. Médias

Les médias doivent être gérés avec discipline :

- conservation des originaux ;
- optimisation ;
- normalisation des noms ;
- organisation par programme et publication ;
- copie sélective dans le livrable final.

### 6.6. URLs et multisites

L’offre Hosting Pro autorise jusqu’à **10 multisites**.  
L’architecture doit donc permettre de publier :

- soit dans des sous-répertoires ;
- soit dans des multisites dédiés ;
- soit selon une combinaison des deux.

Les URLs publiques doivent rester :

- stables ;
- lisibles ;
- pilotées par des slugs ;
- indépendantes des identifiants internes techniques.

---
## 7. Stratégie de génération

La génération doit suivre les étapes suivantes :

1. sélection explicite de la publication ;
2. extraction des données métier ;
3. transformation vers un contrat de rendu ;
4. génération des pages ;
5. copie des assets ;
6. écriture du résultat dans un répertoire de publication ;
7. activation de la version publique ciblée.

Le moteur doit être rejouable sans altérer les données sources.

---
## 8. Compatibilité avec OVH Hosting Pro

L’architecture doit rester réaliste vis-à-vis des limites du mutualisé enrichi.

Cela implique :

- pas de runtime Node en production ;
- pas de dépendance à un orchestrateur externe complexe ;
- pas de génération lourde à chaque requête visiteur ;
- pas d’hypothèse de services système non garantis ;
- une exploitation compatible SSH, FTP, PHP et MySQL OVH.

La contrainte n’est pas seulement de publier un site statique.  
La contrainte est de faire tenir **l’administration, la génération et la diffusion** dans le même cadre technique.

---
## 9. Sécurité cible

La sécurité doit être pensée sur trois plans :

- le backoffice protégé ;
- la couche métier PHP ;
- le contenu public statique.

Le système doit prévoir au minimum :

- authentification ;
- gestion de rôles ;
- validation stricte des uploads ;
- stockage des secrets hors dépôt ;
- contrôle des publications ;
- vérification du contenu réellement exposé.

---
## 10. Observabilité et exploitation

Même pour un MVP, l’exploitation doit être anticipée.

Il faut prévoir :

- journal technique des publications ;
- horodatage des mises en ligne ;
- identification de la dernière publication active ;
- mécanisme de rollback ;
- vérifications smoke simples ;
- exploitation possible via logs OVH, accès SSH et structure de dossiers lisible.

---
## 11. Décisions structurantes

Les décisions suivantes sont considérées comme structurantes :

1. le backoffice et la logique métier de production doivent être compatibles PHP sur OVH Hosting Pro ;
2. le site public sera généré statiquement ;
3. la base de référence sera modélisée pour MySQL/MariaDB OVH ;
4. la génération et la publication doivent être opérables depuis le même hébergement ;
5. l’offre commerciale pilotera les capacités fonctionnelles du minisite ;
6. les multisites OVH font partie des options de diffusion cibles ;
7. aucun choix ne doit rendre obligatoire un runtime Node en production.

---
## 12. Conclusion

L’architecture cible du projet Abdou doit être pensée comme une chaîne de fabrication hébergée sur une seule offre OVH Hosting Pro :

- on saisit ;
- on structure ;
- on valide ;
- on génère ;
- on publie.

La meilleure réponse technique à cette contrainte est une architecture **PHP-compatible, sobre, génératrice de statique, et disciplinée dans son usage de MySQL, du stockage et des multisites OVH**.


