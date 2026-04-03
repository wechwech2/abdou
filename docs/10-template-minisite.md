# 10-template-minisite.md



## 1. Objet du document



Ce document définit les principes de conception du **template de minisite** du projet Abdou.



Le template est le gabarit de rendu utilisé par le moteur de publication pour transformer les données métier d’un programme en un site public statique.



Il ne doit pas être conçu comme un thème décoratif isolé, mais comme un composant structurant du pipeline de génération.



---
## 2. Rôle du template dans l’architecture



Dans l’architecture cible, le template se situe entre :



- les données métier préparées dans le backoffice ;

- le moteur de génération ;

- le livrable public final.



Le template ne contient pas les données du programme.  

Il contient la logique de présentation, la structure des pages, la composition des blocs et les conventions de rendu.



Il doit donc rester indépendant du contenu concret d’un programme donné.



---
## 3. Nature du template



Le template doit être pensé comme un **contrat de rendu**.



Cela signifie qu’il attend une structure de données propre, déterminée et stable.  

À partir de cette structure, il génère :



- les pages ;

- les sections ;

- la navigation ;

- les assets front ;

- les métadonnées publiques utiles.



Le template ne doit pas aller chercher lui-même les données dans la base en production.  

Il reçoit un payload préparé par le moteur de génération.



---
## 4. Objectif du template par défaut



Le template par défaut doit permettre de produire un minisite :



- lisible ;

- rapide ;

- responsive ;

- compatible mobile ;

- SEO-friendly dans une logique raisonnable ;

- simple à générer ;

- robuste sur hébergement OVH Hosting Pro.



Le premier template ne doit pas chercher à maximiser l’effet visuel au détriment de la stabilité de production.



---
## 5. Principes de conception du template



Le template doit suivre les principes suivants.



### 5.1. Simplicité structurelle



La structure de page doit être claire et stable.



### 5.2. Performance raisonnable



Le rendu doit rester léger et compatible avec un hébergement de diffusion statique.



### 5.3. Variabilité contrôlée



Le template doit permettre certaines variations selon l’offre ou le contenu, sans devenir un moteur de règles illimité.



### 5.4. Découpage modulaire



Les parties du rendu doivent être organisées en composants ou blocs clairement identifiables.



### 5.5. Tolérance maîtrisée au contenu incomplet



Le template doit pouvoir masquer certains blocs non pertinents, mais il ne doit pas corriger magiquement un programme mal préparé.



---
## 6. Structure globale attendue du minisite



Le minisite généré par le template par défaut doit suivre une structure sobre, adaptée à un programme immobilier.



À titre de base, on peut attendre :



- une page d’accueil servant de page principale du programme ;

- une navigation claire entre les rubriques actives ;

- un header identifiable ;

- un hero principal ;

- des sections éditoriales ;

- une galerie si l’offre l’autorise ;

- une section localisation si activée ;

- une section lots si activée ;

- une section documents si activée ;

- un footer simple.



Le MVP peut fonctionner avec une structure mono-page enrichie ou une petite structure multi-pages, à condition que le choix soit cohérent avec le moteur de génération.



---
## 7. Composants fonctionnels du template



## 7.1. Header



Le header doit afficher l’identité minimale du programme ou du client, ainsi que la navigation utile.



Il doit rester léger et ne pas embarquer de complexité inutile.



## 7.2. Hero



Le hero constitue le bloc principal d’entrée.  

Il doit pouvoir afficher :



- le nom du programme ;

- un slogan ou headline ;

- un visuel principal ;

- éventuellement un appel à action simple.



Le hero dépend très fortement de la présence d’un média principal correct.



## 7.3. Sections de contenu



Les sections de contenu doivent correspondre aux rubriques activées du programme.



Le template doit pouvoir rendre ces rubriques dans un ordre déterminé par la préparation métier.



## 7.4. Galerie



La galerie doit être activable selon l’offre et le contenu disponible.



Elle doit rester techniquement simple dans le MVP.



## 7.5. Bloc localisation



Ce bloc peut afficher l’adresse, la ville, une carte intégrée ou une représentation plus simple selon les capacités retenues.



## 7.6. Bloc lots



Si l’offre active les lots, le template doit proposer un rendu clair et sobre permettant de visualiser les unités publiables.



## 7.7. Bloc documents



Ce bloc doit permettre d’exposer des fichiers publics validés, par exemple brochures ou plans téléchargeables.



## 7.8. Footer



Le footer doit rester simple, contenir les informations minimales utiles et clôturer proprement le minisite.



---
## 8. Contrat de données attendu



Le template doit recevoir un payload public préparé par le moteur de génération.



Ce payload doit être indépendant du schéma SQL brut.  

Il doit représenter une donnée déjà nettoyée, résolue et prête à afficher.



On doit y retrouver au minimum :



- les informations du client utiles à l’affichage ;

- les informations du programme ;

- l’offre résolue ;

- les rubriques actives ;

- les médias publics ;

- les lots publiables si activés ;

- les informations SEO ;

- les paramètres de navigation ;

- les chemins relatifs des assets générés.



Le template ne doit pas connaître toute la complexité interne du backoffice.



---
## 9. Séparation entre données et présentation



Le template ne doit pas mélanger :



- récupération de données métier ;

- validation métier ;

- logique de rendu.



La récupération et la validation relèvent du moteur de génération et de la couche métier PHP.  

Le template doit se concentrer sur la mise en forme.



Cette séparation est indispensable si l’on veut faire évoluer plus tard les templates sans casser le cœur métier.



---
## 10. Assets du template



Le template doit embarquer ses propres assets de présentation :



- fichiers CSS ;

- fichiers JavaScript front strictement nécessaires ;

- images décoratives si besoin ;

- polices si la stratégie de diffusion le permet.



Ces assets doivent être organisés proprement et intégrables dans le package de publication.



Le MVP doit éviter les dépendances front superflues qui alourdissent inutilement le build.



---
## 11. Responsive design



Le template doit être pensé mobile-first ou, à défaut, réellement responsive dès le départ.



Le minisite final doit rester utilisable sur :



- mobile ;

- tablette ;

- desktop.



Le responsive ne doit pas être traité comme une correction tardive.



---
## 12. SEO raisonnable pour le MVP



Le template doit permettre une base SEO propre, sans chercher une sophistication excessive.



Il faut prévoir au minimum :



- une balise title ;

- une meta description ;

- une hiérarchie de titres cohérente ;

- des URLs propres ;

- des attributs alt pour les images quand disponibles ;

- une structure HTML lisible.



Le MVP n’a pas besoin d’un moteur SEO avancé, mais il ne doit pas dégrader inutilement l’indexabilité.



---
## 13. Performance



Le template doit être conçu avec une logique de sobriété.



Il faut viser :



- un nombre raisonnable d’assets ;

- des médias optimisés ;

- un JavaScript limité ;

- un chargement simple ;

- une bonne compatibilité avec un hébergement statique standard.



Chaque complexité ajoutée doit être justifiée par un besoin métier réel.



---
## 14. Accessibilité minimale



Le template doit viser une accessibilité raisonnable dès le MVP.



Il faut au minimum veiller à :



- une structure HTML sémantique ;

- des titres clairs ;

- des contrastes acceptables ;

- des attributs alt quand pertinents ;

- une navigation compréhensible.



L’objectif est d’éviter un template purement visuel mais techniquement faible.



---
## 15. Variantes pilotées par l’offre



L’offre étant structurante, le template doit pouvoir adapter le rendu selon certaines capacités activées.



Par exemple, l’offre peut piloter :



- l’activation ou non des lots ;

- le nombre ou le type de sections ;

- certaines variantes de hero ;

- certains blocs premium ;

- le niveau de profondeur du contenu.



Ces variantes doivent rester encadrées.  

Le template ne doit pas devenir un système de conditions incontrôlées.



---
## 16. Relation entre template et moteur de génération



Le moteur de génération prépare le payload, choisit le template effectif, copie les assets nécessaires et demande la génération.



Le template, lui, rend le minisite à partir des données reçues.



Cette relation doit être nette.  

Le template n’a pas vocation à devenir un moteur de build complet.



---
## 17. Versionnement du template



Le template doit être versionné.



Cette version doit permettre de savoir :



- quel gabarit a été utilisé ;

- quelle version du rendu a servi à une publication ;

- si une publication ancienne dépend d’un comportement de template particulier.



Le versionnement est important pour la traçabilité et pour l’évolution future du produit.



---
## 18. Ce que le template ne doit pas faire



Le template ne doit pas :



- lire directement la base ;

- exécuter une logique applicative lourde côté production ;

- dépendre d’un serveur Node actif en ligne ;

- contenir des secrets ;

- embarquer des données internes de backoffice ;

- devenir un mini CMS autonome.



Il doit rester un composant de présentation générée.



---
## 19. Critères de réussite du template par défaut



Le template par défaut sera considéré comme réussi s’il permet, avec un payload propre, de générer un minisite :



- cohérent visuellement ;

- rapide à afficher ;

- simple à maintenir ;

- compatible avec la chaîne de publication ;

- adapté à l’hébergement OVH Hosting Pro ;

- suffisamment générique pour plusieurs programmes.



---
## 20. Conclusion



Le template de minisite n’est pas un simple habillage graphique.  

Il est l’interface entre la donnée métier préparée et le livrable public diffusé.



Sa qualité dépendra de sa sobriété, de sa stabilité et de sa capacité à transformer un payload propre en minisite fiable, sans complexité inutile.

---
## 21. État V1 implémenté (socle public)

Le socle public V1 actuel génère une page programme dédiée sur la route statique :

- `/minisites/:programme-slug`

Le template public V1 rend les blocs suivants quand les données existent :

- hero ;
- navigation des rubriques actives ;
- environnement ;
- maquette & lots ;
- images ;
- vidéo ;
- documentation ;
- footer.

Les sections sans données ne sont pas affichées.


