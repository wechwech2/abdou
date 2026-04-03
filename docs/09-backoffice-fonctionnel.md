# 09-backoffice-fonctionnel.md



## 1. Objet du document



Ce document décrit le périmètre fonctionnel du **backoffice** du projet Abdou.



Le backoffice est l’espace interne utilisé par ARA pour préparer, structurer, contrôler et publier les minisites. Il ne doit pas être pensé comme un simple panneau d’administration technique, mais comme l’outil opérationnel central de la chaîne de fabrication.



Son rôle est de permettre à un opérateur interne de transformer une commande client et des contenus bruts en une publication exploitable.



---
## 2. Positionnement du backoffice dans le produit



Le produit Abdou repose sur une séparation claire entre :



- l’espace interne de préparation ;

- le moteur de génération ;

- le minisite public diffusé.



Le backoffice appartient entièrement au périmètre interne.  

Il sert à manipuler les objets métier du système, à préparer les contenus, à piloter la qualité minimale du programme et à déclencher les publications.



Il ne doit pas être confondu avec le site public final, ni avec l’outil de déploiement, même s’il peut offrir un point d’entrée vers ces actions.



---
## 3. Finalités du backoffice



Le backoffice doit permettre de répondre à quatre besoins fondamentaux.



Premièrement, il doit permettre de **structurer la donnée métier** autour des objets du système : client, offre, programme, rubrique, média, lot, publication.



Deuxièmement, il doit permettre de **préparer le contenu public** sans exposer directement le brouillon aux visiteurs finaux.



Troisièmement, il doit permettre de **contrôler la qualité minimale d’un programme** avant génération.



Quatrièmement, il doit permettre de **déclencher, suivre et historiser les publications**.



---
## 4. Utilisateurs cibles



Le backoffice doit être conçu pour des utilisateurs internes, non techniques ou semi-techniques selon les profils.



On distingue au minimum les profils suivants :



### 4.1. Administrateur



L’administrateur gère les paramètres structurants du système : utilisateurs, rôles, offres, templates et réglages globaux.



### 4.2. Opérateur de contenu



L’opérateur de contenu prépare les programmes, saisit les rubriques, charge les médias, organise les informations et prépare la publication.



### 4.3. Valideur



Le valideur contrôle la cohérence du programme, vérifie qu’il est prêt et autorise ou déclenche la publication.



### 4.4. Exploitant technique



L’exploitant technique suit les builds, surveille les déploiements et intervient en cas d’erreur ou de besoin de rollback.



---
## 5. Principes ergonomiques



Le backoffice doit rester simple et orienté travail réel.



Il doit privilégier :



- la lisibilité ;

- la navigation métier ;

- la cohérence des écrans ;

- la réduction des frictions sur les tâches fréquentes ;

- la mise en évidence des éléments manquants ou bloquants.



L’objectif n’est pas de produire une interface surchargée, mais un outil clair qui accompagne la progression d’un programme vers l’état publiable.



---
## 6. Parcours métier principal



Le parcours principal du backoffice doit suivre une logique naturelle.



Un utilisateur crée ou ouvre un client.  

Il affecte une offre.  

Il crée un programme.  

Il renseigne les contenus principaux.  

Il organise les rubriques.  

Il importe les médias.  

Il rattache éventuellement les lots.  

Il vérifie l’état de préparation.  

Il lance un aperçu.  

Il crée une publication.  

Il suit le résultat de génération et, si besoin, le déploiement.



Ce parcours doit pouvoir être compris sans lecture technique du système.



---
## 7. Modules fonctionnels attendus



## 7.1. Tableau de bord



Le tableau de bord doit offrir une vue d’ensemble de l’activité.



Il doit au minimum permettre de voir :



- les programmes récents ;

- les programmes en brouillon ;

- les programmes prêts à publier ;

- les dernières publications ;

- les publications échouées ou en attente d’attention.



Le tableau de bord ne doit pas devenir un centre de reporting complexe dans le MVP.  

Il doit surtout aider l’utilisateur à reprendre rapidement le travail utile.



## 7.2. Gestion des clients



Le module clients doit permettre de :



- créer un client ;

- modifier ses informations ;

- consulter ses programmes ;

- consulter l’offre ou les offres associées ;

- stocker les éléments de base d’identité de marque si nécessaire.



Le client constitue un point d’entrée de navigation, mais ne doit pas porter tout le contenu opérationnel du minisite.



## 7.3. Gestion des offres



Le module offres permet d’administrer les niveaux de prestation disponibles.



Il doit permettre de :



- créer ou modifier une offre ;

- visualiser les fonctionnalités activées ;

- associer un template de référence ;

- définir les options structurantes du minisite ;

- activer ou désactiver une offre.



Dans le MVP, ce module peut rester principalement administratif.



## 7.4. Gestion des programmes



Le module programmes est le cœur du backoffice.



Il doit permettre de :



- créer un programme ;

- l’associer à un client ;

- lui affecter une offre ;

- lui affecter ou résoudre un template ;

- saisir les données de base ;

- gérer son statut ;

- définir la cible de publication ;

- renseigner les métadonnées SEO minimales.



L’écran programme doit être pensé comme une fiche centrale, à partir de laquelle on accède aux rubriques, médias, lots et publications.



## 7.5. Gestion des rubriques



Le module rubriques doit permettre de construire la structure éditoriale du minisite.



Il doit permettre de :



- activer ou désactiver une rubrique ;

- ordonner les rubriques ;

- définir leur titre ;

- saisir leur contenu ;

- paramétrer leur visibilité dans le menu ;

- stocker certains réglages simples liés au rendu.



Le backoffice doit aider à éviter les rubriques vides, inutiles ou incohérentes avec l’offre.



## 7.6. Gestion des médias



Le module médias doit permettre de gérer l’ensemble des contenus visuels et documentaires.



Il doit permettre de :



- importer un fichier ;

- le qualifier ;

- le rattacher à un programme ;

- le rattacher à une rubrique ou à un lot si nécessaire ;

- définir un titre, un texte alternatif ou une légende ;

- identifier les usages critiques comme le hero ou la galerie.



Le backoffice doit aussi rendre visible le statut du média : importé, validé, publié, retiré.



## 7.7. Gestion des lots



Lorsque l’offre le permet, le module lots doit permettre de gérer la structure bâtiment / étage / lot.



Il doit permettre de :



- créer des bâtiments ;

- créer des étages ;

- créer ou importer des lots ;

- ordonner les lots ;

- renseigner les champs utiles à l’affichage public ;

- activer ou non leur publication.



Ce module ne doit pas être imposé à tous les programmes.  

Il doit apparaître comme une capacité activable, non comme une contrainte universelle.



## 7.8. Gestion des publications



Le module publications doit permettre de piloter le passage du brouillon au livrable.



Il doit permettre de :



- créer une nouvelle publication ;

- voir la version ;

- voir le build code ;

- suivre le statut ;

- consulter les dates importantes ;

- déclencher un build ;

- déclencher un déploiement si autorisé ;

- consulter l’historique des publications ;

- identifier la publication active.



C’est un module central pour la traçabilité du produit.



## 7.9. Gestion des utilisateurs



Le module utilisateurs doit permettre à l’administrateur de :



- créer un utilisateur ;

- lui attribuer un rôle ;

- activer ou désactiver un accès ;

- contrôler la portée de ses actions.



Dans le MVP, ce module peut rester volontairement sobre.



---
## 8. Écrans clés du backoffice



Le MVP devrait au minimum couvrir les écrans suivants.



### 8.1. Liste des programmes



Cet écran doit être l’un des principaux points d’entrée.  

Il doit permettre de filtrer les programmes par client, statut, offre ou état de publication.



### 8.2. Fiche programme



La fiche programme doit synthétiser l’identité du programme, son client, son offre, son template effectif, son état de préparation et ses accès vers les sous-modules.



### 8.3. Éditeur de rubriques



L’utilisateur doit pouvoir gérer les rubriques depuis une vue claire, ordonnée et facile à manipuler.



### 8.4. Gestionnaire de médias



L’utilisateur doit pouvoir voir les médias importés, leurs usages et leurs problèmes éventuels.



### 8.5. Écran de préparation à la publication



Cet écran doit présenter les éléments essentiels du programme avant build et signaler les blocages.



### 8.6. Historique des publications



L’utilisateur doit pouvoir voir les versions passées, leur état et leur cible de diffusion.



---
## 9. Données minimales visibles dans la fiche programme



La fiche programme doit afficher clairement :



- le nom du programme ;

- le client ;

- l’offre ;

- le template effectif ;

- le slug ;

- le statut ;

- le statut de publication ;

- le domaine ou chemin cible ;

- l’état de complétude minimum ;

- la dernière publication connue.



L’utilisateur doit comprendre rapidement si le programme est encore en préparation, prêt ou déjà publié.



---
## 10. Contrôle de complétude



Le backoffice doit intégrer une logique de contrôle de complétude.



Cette logique ne doit pas être comprise comme un moteur expert complexe, mais comme une aide opérationnelle indiquant si les éléments minimums sont réunis.



Le système peut par exemple signaler :



- absence de client ;

- absence d’offre ;

- absence de slug ;

- absence d’image hero ;

- rubriques vides ;

- cible de publication non définie ;

- lots activés mais non configurés.



Ce contrôle est essentiel pour éviter les publications hasardeuses.



---
## 11. Aide à la publication



Le backoffice doit préparer l’utilisateur à publier, pas simplement lui offrir un bouton de build.



Avant publication, l’interface doit rendre visibles :



- les prérequis satisfaits ;

- les blocages restants ;

- le template utilisé ;

- la cible de diffusion ;

- la prochaine version attendue ;

- l’historique récent.



Cette approche réduit les erreurs et renforce la lisibilité du processus.



---
## 12. Aperçu et preview



Le backoffice doit permettre de lancer ou d’ouvrir une preview du minisite avant mise en ligne.



Cette preview ne doit pas être confondue avec la production publique.  

Elle doit servir à valider le rendu, la structure de navigation, la présence des médias et la cohérence générale.



Dans le MVP, l’aperçu peut être simple, à condition qu’il soit fiable.



---
## 13. Gestion des erreurs et messages utilisateur



Le backoffice doit parler un langage compréhensible par les utilisateurs internes.



Les messages doivent être explicites.  

Par exemple, il faut préférer :



- “Le programme ne peut pas être publié car l’image principale est absente”

à

- “Build validation failed: missing hero asset”



Les messages techniques détaillés peuvent exister dans les journaux ou les vues avancées, mais l’interface standard doit rester lisible.



---
## 14. Règles de droits dans le backoffice



Le backoffice doit refléter les rôles définis dans le système.



Un opérateur de contenu ne doit pas nécessairement pouvoir modifier les offres ou les utilisateurs.  

Un valideur doit pouvoir déclencher certaines actions sans accéder aux réglages globaux.  

Un exploitant technique doit pouvoir consulter et relancer des processus sans devenir administrateur métier.



Cette séparation est importante dès le MVP, même si elle reste simple.



---
## 15. Ce que le backoffice n’a pas vocation à faire au MVP



Pour le MVP, le backoffice ne doit pas chercher à tout absorber.



Il n’a pas vocation à devenir :



- un ERP de gestion commerciale ;

- un DAM complet de niveau entreprise ;

- un outil d’analytics avancé ;

- un CMS généraliste sans contrainte ;

- un moteur de workflow multi-validation complexe.



Il doit rester centré sur la préparation et la publication de minisites.



---
## 16. Critères de réussite fonctionnelle du backoffice



Le backoffice sera considéré comme fonctionnellement réussi si un opérateur peut :



- créer un programme ;

- lui affecter une offre ;

- saisir les rubriques ;

- charger les médias ;

- voir ce qui manque ;

- préparer une publication ;

- générer une version ;

- suivre son état jusqu’à la mise en ligne.



Autrement dit, il doit rendre la production répétable, et non artisanale.



---
## 17. Conclusion



Le backoffice du projet Abdou est la pièce maîtresse de la fabrique de minisites.



Il ne s’agit ni d’un simple panneau d’administration technique, ni d’un site public caché.  

C’est l’outil de préparation opérationnelle qui permet à ARA de transformer une matière brute en un livrable publiable.



Sa qualité se mesurera à une chose simple : la capacité d’un utilisateur interne à faire avancer un programme jusqu’à une publication fiable, sans bricolage.


