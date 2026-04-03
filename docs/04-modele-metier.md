# 04-modele-metier.md



## 1. Objet du document



Ce document définit le modèle métier de référence du projet **Abdou**.



L’objectif est de structurer le système autour d’objets métier stables, compréhensibles et réutilisables, afin d’éviter qu’il ne dérive vers un simple assemblage de pages ou de fichiers.



Le produit doit être conçu comme une plateforme de fabrication de minisites.  

Le modèle métier doit donc exprimer la chaîne logique allant de la relation commerciale jusqu’au livrable publié.



---
## 2. Principe de structuration métier



Le système doit être organisé autour de la hiérarchie suivante :



**Client > Offre > Programme > Publication > Minisite**



Cette hiérarchie constitue la colonne vertébrale du projet.



Elle signifie que :



- un client contractualise une prestation ;

- cette prestation prend la forme d’une offre ;

- l’offre encadre un ou plusieurs programmes ;

- chaque programme peut donner lieu à plusieurs publications ;

- chaque publication produit un minisite ou une version de minisite.



Le minisite ne doit donc pas être traité comme une entité éditoriale libre, mais comme la **projection publique générée** d’un ensemble de données métier.



---
## 3. Entités métier principales



## 3.1. Client



Le client est l’entité commerciale donneuse d’ordre.



Il représente le promoteur, le partenaire ou l’acteur pour lequel ARA prépare le livrable.



Le client possède notamment :



- une identité ;

- des coordonnées ;

- un statut ;

- une relation commerciale ;

- éventuellement une charte ou des préférences de marque.



Le client n’est pas un simple libellé.  

Il peut porter plusieurs programmes dans le temps et, potentiellement, plusieurs offres.



## 3.2. Offre



L’offre est un objet métier central et structurant.



Elle représente le niveau de prestation vendu ou convenu avec le client.  

Elle ne doit pas être réduite à une simple information descriptive.  

Elle pilote effectivement le comportement du système.



L’offre détermine notamment :



- le template autorisé ;

- la structure du minisite ;

- les rubriques disponibles ;

- le volume de contenu attendu ;

- les options activables ;

- les éventuelles limitations fonctionnelles ;

- le niveau de personnalisation ;

- le mode de publication.



L’offre conditionne donc la forme finale du livrable.  

Deux programmes identiques sur le fond peuvent aboutir à des minisites différents si les offres sont différentes.



## 3.3. Programme



Le programme représente l’opération immobilière à publier.



Il s’agit de l’objet central de production de contenu.  

Le programme regroupe :



- les informations générales ;

- la localisation ;

- la promesse commerciale ;

- les visuels ;

- les plans ;

- les documents ;

- les rubriques de présentation ;

- les éventuelles informations sur bâtiments, étages et lots.



Le programme appartient à un client et s’inscrit dans le cadre d’une offre donnée.



## 3.4. Rubrique



La rubrique représente une section fonctionnelle ou éditoriale du minisite.



Exemples possibles :



- accueil ;

- présentation ;

- galerie ;

- localisation ;

- plans ;

- prestations ;

- lots disponibles ;

- contact ;

- mentions ou documents.



La rubrique est un objet métier car elle peut être :



- activée ou non ;

- ordonnée ;

- configurée ;

- enrichie de médias ;

- soumise à des règles liées à l’offre.



## 3.5. Média



Le média représente tout contenu binaire ou visuel exploitable dans le minisite.



Cela comprend notamment :



- images ;

- rendus 3D ;

- plans ;

- logos ;

- vidéos ;

- brochures PDF ;

- documents téléchargeables.



Le média possède un cycle de vie distinct :



- import ;

- qualification ;

- optimisation ;

- affectation à une rubrique ou un programme ;

- publication.



Un média ne doit pas être confondu avec un simple fichier physiquement stocké.  

Il s’agit d’un objet géré, possédant un rôle métier.



## 3.6. Lot



Le lot représente, lorsque le périmètre l’exige, une unité commercialisable ou présentable à l’intérieur du programme.



Le lot peut être rattaché à :



- un bâtiment ;

- un étage ;

- une typologie ;

- un statut commercial ;

- une surface ;

- un prix ou une mention tarifaire ;

- des plans ou médias associés.



Le lot ne doit être activé que si l’offre ou le programme l’exige réellement.



## 3.7. Publication



La publication est un objet métier fondamental.



Elle représente un état figé, validé et publiable d’un programme à un instant donné.



La publication permet de :



- versionner le livrable ;

- conserver une trace des sorties successives ;

- savoir ce qui a été mis en ligne ;

- régénérer un package ;

- revenir à une version antérieure si nécessaire.



La publication n’est donc pas un simple flag “publié / non publié”.  

C’est un objet de fabrication, d’exploitation et de traçabilité.



## 3.8. Minisite



Le minisite est le livrable public résultant d’une publication.



Il ne constitue pas le cœur de la saisie métier.  

Il constitue la sortie finale d’un processus.



Autrement dit :



- le programme est saisi ;

- la publication est générée ;

- le minisite est produit.



---
## 4. Entités de structuration complémentaires



## 4.1. Utilisateur



L’utilisateur représente une personne autorisée à accéder au backoffice.



Il peut s’agir par exemple :



- d’un administrateur ;

- d’un opérateur de contenu ;

- d’un valideur ;

- d’un profil technique.



L’utilisateur ne doit pas être mélangé avec le visiteur public.



## 4.2. Template



Le template représente le gabarit de rendu utilisé pour générer le minisite.



Il est déterminé ou contraint par l’offre.  

Il définit :



- la structure visuelle ;

- les composants disponibles ;

- certaines variantes de navigation ;

- le contrat de données attendu.



## 4.3. Domaine / cible de diffusion



La cible de diffusion représente le point d’exposition public.



Elle peut être :



- un sous-domaine ;

- un répertoire public ;

- une cible FTP ;

- un espace de publication donné.



Cette entité est importante pour industrialiser plusieurs publications.



---
## 5. Relations métier structurantes



Le modèle métier repose sur les relations suivantes.



### 5.1. Client et offre



Un client peut avoir une ou plusieurs offres dans le temps.  

Pour le MVP, on pourra simplifier en liant un programme à une offre active.



### 5.2. Offre et programme



Une offre encadre les règles applicables au programme.  

Un programme donné doit être publié selon une offre déterminée.



### 5.3. Programme et rubriques



Un programme contient plusieurs rubriques.  

La liste des rubriques possibles dépend partiellement ou totalement de l’offre.



### 5.4. Programme et médias



Un programme agrège plusieurs médias.  

Certains médias peuvent être globaux au programme, d’autres spécifiques à des rubriques ou à des lots.



### 5.5. Programme et lots



Un programme peut comporter zéro, un ou plusieurs lots selon le niveau de détail attendu.



### 5.6. Programme et publications



Un programme peut donner lieu à plusieurs publications successives.  

Chaque publication représente une version diffusée ou diffusable.



### 5.7. Publication et minisite



Une publication produit un minisite public, matérialisé par un package statique et par une cible de diffusion.



---
## 6. États métier principaux



## 6.1. État d’un programme



Le programme doit au minimum passer par les états suivants :



- brouillon ;

- en préparation ;

- prêt à publier ;

- publié ;

- archivé.



Ces états doivent refléter la réalité du travail.



## 6.2. État d’un média



Le média peut passer par :



- importé ;

- à qualifier ;

- validé ;

- optimisé ;

- publié ;

- retiré.



## 6.3. État d’une publication



La publication peut passer par :



- brouillon ;

- en génération ;

- générée ;

- déployée ;

- échouée ;

- retirée ;

- archivée.



Le système doit pouvoir tracer proprement ces états.



---
## 7. Rôle métier de l’offre



L’offre étant un objet structurant, elle doit piloter au moins les dimensions suivantes.



### 7.1. Structure du livrable



L’offre définit le socle fonctionnel minimal du minisite.



### 7.2. Profondeur éditoriale



Elle peut encadrer le nombre ou le type de rubriques disponibles.



### 7.3. Composants autorisés



Elle peut autoriser ou interdire certains blocs :



- galerie avancée ;

- lots ;

- carte interactive ;

- documents téléchargeables ;

- contact enrichi ;

- variantes premium.



### 7.4. Template ou variation graphique



Elle peut imposer un rendu donné ou une famille de templates.



### 7.5. Règles de publication



Elle peut également fixer des contraintes de publication :



- un seul minisite actif ;

- plusieurs itérations autorisées ;

- options SEO ;

- paramètres de domaine ;

- règles de nommage.



L’offre ne doit donc jamais être modélisée comme une colonne décorative sans impact.



---
## 8. Principes métier de publication



La publication doit obéir aux règles suivantes.



### 8.1. Une publication est intentionnelle



On ne publie pas automatiquement toute modification de saisie.  

La publication est une action volontaire.



### 8.2. Une publication est versionnée



Chaque publication doit être identifiable.



### 8.3. Une publication est reproductible



À partir des mêmes données et du même template, il doit être possible de régénérer le même livrable.



### 8.4. Une publication est traçable



Le système doit conserver la date, la version, le statut et la cible.



### 8.5. Une publication est indépendante du brouillon courant



Les modifications ultérieures du programme ne doivent pas altérer rétroactivement la publication déjà sortie.



---
## 9. Modèle métier simplifié du contenu



Le contenu doit être structuré en couches.



### 9.1. Couche identitaire



Elle contient :



- nom du programme ;

- slogan ;

- description courte ;

- identité du client ;

- logos ;

- visuel principal.



### 9.2. Couche éditoriale



Elle contient :



- textes par rubrique ;

- arguments commerciaux ;

- prestations ;

- informations de localisation ;

- contenus enrichis.



### 9.3. Couche média



Elle contient :



- images ;

- plans ;

- vidéos ;

- documents.



### 9.4. Couche commerciale ou technique éventuelle



Elle contient, selon les cas :



- lots ;

- surfaces ;

- statuts ;

- références ;

- prix indicatifs ;

- typologies.



### 9.5. Couche de publication



Elle contient :



- slug ;

- cible de diffusion ;

- version ;

- historique ;

- template ;

- date de génération ;

- date de déploiement.



---
## 10. Rôles utilisateurs métier



Même dans un MVP, le système doit distinguer au moins les rôles suivants.



### 10.1. Administrateur



Il gère la configuration générale, les utilisateurs, les offres, les templates et les paramètres techniques.



### 10.2. Opérateur contenu



Il prépare les programmes, charge les médias, renseigne les rubriques et prépare les publications.



### 10.3. Valideur / responsable



Il vérifie qu’un programme est prêt pour publication et autorise la sortie.



### 10.4. Exploitant technique



Il supervise les déploiements, contrôle la cohérence des packages et gère les incidents.



---
## 11. Principes de modélisation à respecter



Le modèle métier doit respecter les règles suivantes :



- ne pas mélanger métier interne et rendu public ;

- ne pas confondre programme et publication ;

- ne pas réduire l’offre à un simple libellé ;

- ne pas stocker toute la logique dans des blobs non structurés ;

- garder une structure extensible vers plusieurs templates ;

- permettre l’historisation des publications ;

- rendre la diffusion multi-programmes industrialisable.



---
## 12. Conclusion



Le modèle métier du projet Abdou doit exprimer une réalité simple :



ARA ne construit pas manuellement des pages web isolées ;  

ARA fabrique des minisites à partir d’objets métier structurés.



Le cœur du système est donc la chaîne :



**client → offre → programme → publication → minisite**



Cette chaîne doit guider la base de données, la couche métier PHP, le backoffice, le moteur de génération et le déploiement.


