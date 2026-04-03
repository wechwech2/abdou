# 00-vision-produit.md

## 1. Objet du document

Ce document définit la vision produit du projet **Abdou**, plateforme de préparation et de publication de minisites immobiliers, en tenant compte d’une contrainte forte d’hébergement : le **go live final doit être entièrement opérable dans une offre OVH Hosting Pro du client**, avec un **site public généré statiquement**.

Il remplace la vision initiale orientée application web classique et recentre le produit sur une logique de **fabrique de minisites avec publication statique**.

---

## 2. Contexte métier

Le propriétaire de la plateforme souhaite déléguer à la société **ARA** la préparation complète du livrable digital associé à chaque nouveau programme immobilier.

Jusqu’ici, ARA intervenait principalement sur les rendus 3D, les plans, les visuels et les médias. Le besoin évolue désormais vers un livrable plus complet : pour chaque nouveau client contracté, ARA doit pouvoir préparer un **minisite immobilier prêt à être publié**.

Le projet ne doit donc pas être pensé comme un simple site vitrine, mais comme une **usine de production de minisites**.

Chaque minisite doit être alimenté à partir de contenus préparés par ARA, puis publié sous une forme légère, stable, transportable et compatible avec l’environnement d’hébergement retenu.

---

## 3. Contrainte structurante de production

La cible finale doit être hébergée dans une **offre OVH Hosting Pro** du client.

Cette contrainte implique plusieurs décisions fondamentales :

1. le front public ne doit pas dépendre d’un serveur Node permanent en production ;
2. le livrable public doit pouvoir être produit sous forme de **fichiers statiques** ;
3. le backoffice et la logique métier devront utiliser le **moteur PHP** de l’offre OVH ;
4. la base de données de production devra rester dans les **bases MySQL OVH** fournies par l’offre ;
5. la génération, l’administration, l’authentification et l’exploitation doivent être conçues pour fonctionner depuis le même hébergement mutualisé ;
6. les capacités réelles de l’offre doivent guider les choix techniques : **4 BDD MySQL de 1 Go**, **250 Go d’espace disque**, **10 multisites**, **SSH**, **FTP**, **SSL Let’s Encrypt**, logs et protections standard.

En conséquence, le produit cible n’est pas une architecture Node séparée, mais une **fabrique de minisites opérée depuis un seul hébergement OVH Hosting Pro** :

- un **backoffice protégé** ;
- une **logique métier PHP** ;
- une **base MySQL OVH** ;
- des **minisites statiques générés** publiés dans les espaces publics du même hébergement.

---

## 4. Vision produit

Le projet Abdou a pour finalité de permettre à ARA de transformer des contenus bruts de commercialisation immobilière en minisites publiables rapidement, proprement et de manière répétable.

Le système doit permettre de :

- créer un client ;
- rattacher à ce client une ou plusieurs offres ;
- rattacher à une offre un ou plusieurs programmes ;
- structurer le contenu du programme ;
- préparer les rubriques du minisite ;
- charger les médias, plans, visuels, vidéos et liens externes ;
- prévisualiser le rendu ;
- générer un package publiable ;
- publier ce package dans l’espace public du même hébergement OVH.

Le produit doit donc industrialiser un processus qui, sans cela, resterait artisanal, lent et difficile à maintenir.

---

## 5. Modèle métier structurant

Le modèle métier cible s’organise autour des objets suivants :

### Client

Le client représente l’entité commerciale porteuse de la commande. Il peut s’agir d’un promoteur, d’un partenaire ou d’un donneur d’ordre.

### Offre

L’offre choisie par le client est un **objet métier structurant** du système.

Elle ne doit pas être un simple attribut décoratif. Elle détermine :

- le niveau de prestation ;
- le nombre de rubriques autorisées ;
- les fonctionnalités disponibles ;
- le template visuel applicable ;
- les règles de publication ;
- les éventuelles limites de médias, de pages ou de variantes.

Le système doit donc être pensé selon la hiérarchie suivante :

**Client > Offre > Programme > Publication > Minisite**

### Programme

Le programme représente l’opération immobilière à commercialiser. Il contient les informations de fond, les médias, les lots, les bâtiments, les étages et la matière éditoriale du minisite.

### Publication

La publication représente un instant figé du programme, validé pour diffusion. Une publication doit pouvoir être versionnée, reconstruite et redéployée.

### Minisite

Le minisite n’est pas un objet édité manuellement page par page. Il est le **résultat généré** d’une publication.

---

## 6. Positionnement fonctionnel

Le projet Abdou n’est pas seulement un site institutionnel ARA.

C’est une plateforme interne de préparation de contenu avec un mécanisme de sortie publiable.

Le système doit donc couvrir deux périmètres bien distincts :

### 6.1. Le périmètre interne de fabrication

Cet espace est utilisé par ARA pour :

- créer et administrer les fiches clients ;
- affecter une offre ;
- créer les programmes ;
- saisir ou importer les contenus ;
- charger les médias ;
- organiser les rubriques ;
- préparer les informations sur les bâtiments, étages et lots ;
- générer un aperçu ;
- lancer une publication.

### 6.2. Le périmètre public de diffusion

Cet espace correspond aux minisites diffusés aux prospects finaux.

Cet espace doit rester :

- rapide ;
- léger ;
- stable ;
- SEO-friendly ;
- compatible OVH Hosting Pro ;
- indépendant d’un backend Node permanent.

---

## 7. Principe directeur d’architecture

Le projet doit être conçu selon le principe suivant :

**on édite dynamiquement, mais on publie statiquement.**

Cela signifie que :

- le contenu est préparé dans un environnement d’administration ;
- un moteur de génération transforme les données métier en pages HTML/CSS/JS statiques ;
- les médias nécessaires sont copiés dans un package de publication ;
- le package est ensuite publié depuis le backoffice vers les répertoires publics ou multisites du même hébergement OVH.

Ce choix réduit fortement le risque technique au go live, simplifie l’exploitation, améliore la compatibilité OVH et rend la plateforme plus robuste commercialement.

---

## 8. Parcours cible

Le parcours cible du produit est le suivant :

1. ARA crée un client.
2. ARA sélectionne ou affecte une offre.
3. ARA crée un programme immobilier.
4. ARA renseigne les contenus et charge les médias.
5. ARA prépare la structure de navigation du minisite.
6. ARA visualise un aperçu local ou sur l’hébergement OVH de travail.
7. ARA génère une publication.
8. Le système produit un export statique compatible OVH Hosting Pro.
9. Le système déploie les fichiers sur le domaine ou sous-domaine prévu.
10. Le minisite public devient accessible.

---

## 9. Périmètre du MVP

Le MVP doit permettre de faire réellement un go live dans **une seule offre OVH Hosting Pro**, avec une chaîne complète opérable côté administration et une diffusion publique statique.

Le périmètre minimal doit donc couvrir :

- gestion des clients ;
- gestion des offres ;
- gestion des programmes ;
- gestion des rubriques du minisite ;
- gestion des médias principaux ;
- gestion des liens externes ;
- structuration bâtiment / étage / lot si nécessaire au programme ;
- aperçu avant publication ;
- génération statique ;
- publication locale ou par scripts depuis l’hébergement OVH ;
- environnement d’administration exploitable sur OVH Hosting Pro ;
- publication sur domaine ou sous-domaine ;
- mise à jour d’un minisite déjà publié par régénération puis redéploiement.

---

## 10. Hors périmètre du MVP

Les éléments suivants ne doivent pas bloquer la première mise en production :

- moteur de recherche complexe ;
- édition collaborative en temps réel ;
- workflow de validation multi-acteurs avancé ;
- analytics avancées ;
- espace client complet ;
- publication multi-template très poussée ;
- import automatisé depuis systèmes tiers complexes ;
- génération multilingue avancée ;
- rendu temps réel dépendant d’une API publique en production.

Ces éléments pourront être ajoutés ensuite, mais ne doivent pas compliquer le premier go live.

---

## 11. Conséquences techniques de la cible OVH

Le choix d’un hébergement final entièrement opéré dans une offre OVH Hosting Pro impose une architecture pragmatique.

Le front public doit être livré sous forme statique.

Le backoffice, la logique métier PHP et les traitements de génération doivent vivre dans le même hébergement OVH Hosting Pro.

La base de production d’administration doit utiliser les bases MySQL OVH fournies par l’offre, mais le minisite lui-même doit rester consultable même sans logique serveur complexe.

Le système doit donc privilégier :

- les pages pré-générées ;
- les données embarquées ou exposées sous forme de fichiers statiques ;
- les médias servis directement par l’hébergement ;
- les déploiements reproductibles via scripts PHP, SSH ou opérations locales maîtrisées.

---

## 12. Critères de succès

Le projet sera considéré comme réussi si :

- ARA peut préparer un nouveau programme sans développement spécifique ;
- l’offre choisie pilote réellement la structure du livrable ;
- un minisite peut être généré et publié rapidement ;
- le backoffice, la logique métier PHP et la génération peuvent fonctionner sur OVH Hosting Pro ;
- le rendu public fonctionne correctement sur le même hébergement OVH ;
- la maintenance d’un minisite publié reste simple ;
- le produit supporte la répétition du processus pour plusieurs clients et plusieurs programmes.

---

## 13. Vision d’évolution

À moyen terme, le projet pourra évoluer vers :

- plusieurs templates de publication ;
- une bibliothèque de composants de rubrique ;
- des versions premium selon l’offre ;
- des exports plus riches ;
- une séparation plus poussée entre usine interne et réseau public ;
- une montée en gamme des services OVH du client si le volume ou les besoins l’exigent.

Mais la première cible reste claire :

**réussir une chaîne de production fiable, opérable sur OVH Hosting Pro, menant à un minisite publiable sans dépendance à Node en production.**
