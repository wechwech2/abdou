# 06-regles-publication.md



## 1. Objet du document



Ce document définit les règles de publication du projet **Abdou**.



Son objectif est de formaliser le passage entre :



- les données préparées dans le backoffice ;

- la génération d’un livrable statique ;

- la publication de ce livrable depuis l’hébergement OVH du client vers la zone publique cible.



La publication ne doit pas être comprise comme une simple mise à jour technique.  

Elle constitue un acte métier et technique structuré, traçable et reproductible.



---
## 2. Principe général



Le principe fondamental est le suivant :



**on ne publie pas un brouillon vivant ; on publie une version figée.**



Cela implique que toute publication doit correspondre à :



- un programme identifié ;

- une offre déterminée ;

- un template résolu ;

- un état validé du contenu ;

- un build identifiable ;

- une cible de diffusion explicite.



Le site public ne doit jamais dépendre directement de l’état courant de la base en temps réel.



---
## 3. Définition métier de la publication



Dans le projet Abdou, une publication est un objet métier autonome qui représente :



- une version donnée d’un programme ;

- préparée à partir d’un contenu validé ;

- transformée selon un template ;

- générée en artefact statique ;

- potentiellement déployée vers une cible publique.



La publication doit donc être distinguée :



- du programme, qui continue à évoluer ;

- du brouillon, qui reste modifiable ;

- du minisite public, qui est le résultat diffusé.



---
## 4. Conditions minimales pour être publiable



Un programme ne peut être déclaré publiable que si les conditions minimales suivantes sont réunies.



### 4.1. Identification du programme



Le programme doit disposer au minimum de :



- un nom ;

- un slug ;

- un client ;

- une offre ;

- un statut compatible avec la publication.



### 4.2. Résolution du template



Le programme doit pouvoir être rattaché à un template effectif, soit :



- directement ;

- via l’offre.



En l’absence de template résolu, aucune publication ne doit être lancée.



### 4.3. Contenu minimum



Le programme doit disposer au minimum de :



- un titre exploitable ;

- un contenu de présentation minimal ;

- une structure de rubriques cohérente avec l’offre ;

- un chemin ou une cible de publication déterminable.



### 4.4. Médias critiques



Les médias essentiels doivent être présents si le template ou l’offre les exige.



Par exemple :



- image hero ;

- logo ;

- visuels galerie minimum ;

- documents téléchargeables si rubrique active.



### 4.5. Cohérence métier



Le programme ne doit pas contenir d’incohérence bloquante, notamment :



- offre inactive ;

- template inactif ;

- rubrique obligatoire absente ;

- cible de diffusion invalide ;

- données de lots activées mais structure lots absente.



---
## 5. États de publication



Le cycle minimal de publication doit suivre des états explicites.



### 5.1. `draft`



La publication existe mais n’a pas encore été réellement traitée.



### 5.2. `building`



Le moteur de génération est en train de construire le livrable.



### 5.3. `generated`



Le build statique a été produit avec succès.



### 5.4. `deploying`



Le build est en cours de transfert ou d’activation sur la cible.



### 5.5. `deployed`



Le livrable est officiellement déployé et disponible.



### 5.6. `failed`



La génération ou le déploiement a échoué.



### 5.7. `archived`



La publication n’est plus la version active mais reste historisée.



Ces états doivent être traçables et lisibles dans le backoffice et dans les journaux techniques.



### 5.8. États de déploiement (publication_deployments)



Pour chaque tentative de déploiement, la table `publication_deployments` suit:



- `pending` : tentative créée, pas encore exécutée ;

- `running` : script de déploiement en cours ;

- `success` : déploiement terminé et vérifications passées ;

- `failed` : échec du déploiement ou de la vérification ;

- `rolled_back` : rollback manuel/exploitation effectué.



Le statut de la publication (`publications.status`) n'est mis à `deployed` qu'après un déploiement `success`.



### 5.9. Convention de chemins publics



Pour un programme `:slug`, les champs attendus sont:



- `public_path = "/minisites/:slug"`

- `target_path = "www/minisites/:slug"`

- `published_url = "https://<target_domain>/minisites/:slug"`



Le build génère un artefact statique versionné, puis le déploiement copie cet artefact vers la cible locale/exploitation configurée.



---
## 6. Versionnement



Chaque publication doit être versionnée.



### 6.1. Version par programme



Le numéro de version est propre à un programme.  

Il doit être incrémental et ne pas être réutilisé.



### 6.2. Build code



Chaque publication doit disposer d’un identifiant technique unique de build, par exemple :



- `prog-lesjardins-v001`

- `prog-lesjardins-v002`



### 6.3. Non-réécriture de l’historique



Une publication passée ne doit pas être “écrasée” silencieusement par une nouvelle génération.  

Une nouvelle sortie doit créer une nouvelle publication.



---
## 7. Déclenchement de la publication



La publication doit être déclenchée explicitement.



Elle peut être initiée depuis :



- le backoffice ;

- une commande CLI ;

- un script d’exploitation ;

- un pipeline interne.



En revanche, elle ne doit pas être déclenchée implicitement à chaque modification de contenu.

En cible finale, le déclenchement normal doit provenir d’un composant hébergé dans OVH Hosting Pro : backoffice, logique PHP, moteur de génération ou script d’exploitation.



---
## 8. Étapes de publication



Le pipeline métier minimal de publication suit les étapes suivantes.



### 8.1. Vérification préalable



Le système vérifie que le programme est publiable selon les règles définies.



### 8.2. Création de l’objet publication



Une nouvelle ligne de publication est créée avec sa version et son build code.



### 8.3. Chargement des données



Le moteur de génération charge les données du programme, de l’offre, du template, des rubriques, des médias et des éventuels lots.



### 8.4. Constitution du snapshot



Le système capture le contexte utile à la publication.  

Le snapshot doit servir à la traçabilité et à la reconstruction logique du build.



### 8.5. Génération du livrable



Le site statique est généré dans un dossier de build dédié.



### 8.6. Contrôles post-build



Le système vérifie que les artefacts essentiels existent :



- page d’accueil ;

- assets critiques ;

- navigation minimale ;

- médias attendus.



### 8.7. Déploiement



Si demandé, le build est transféré sur la cible de diffusion.



### 8.8. Clôture



La publication est marquée en succès ou en échec selon le résultat réel.



---
## 9. Règles de contenu publiable



Les contenus publiés doivent respecter certaines règles.



### 9.1. Contenu validé



Un contenu non validé ou manifestement incomplet ne doit pas être publié.



### 9.2. Contenu public uniquement



Aucune information interne ne doit être injectée dans le livrable public :



- notes internes ;

- commentaires de travail ;

- chemins locaux ;

- identifiants techniques inutiles ;

- données d’exploitation.



### 9.3. Cohérence éditoriale



Les rubriques activées doivent correspondre à un contenu réellement présent.  

Une rubrique vide ne doit pas être rendue publiquement sauf choix explicite du template.



---
## 10. Règles sur les médias



### 10.1. Utilisation de médias validés



Seuls les médias validés et affectés à la publication doivent être exportés.



### 10.2. Optimisation



Les médias destinés au web doivent être optimisés avant diffusion.



### 10.3. Nettoyage



Les fichiers inutiles ne doivent pas être copiés dans le package final.



### 10.4. Référencement explicite



Chaque média publié doit pouvoir être relié à la publication qui l’a embarqué.



---
## 11. Règles sur les lots



Lorsque l’offre active les lots, la publication doit vérifier :



- la cohérence du paramétrage ;

- la présence des champs minimaux ;

- la possibilité réelle de rendu dans le template.



Si l’offre n’autorise pas les lots, leur présence en base ne doit pas suffire à les rendre publiquement.



---
## 12. Publication active et historique



Le système doit distinguer :



- la publication active ;

- les anciennes publications historisées ;

- les publications en échec.



Une seule publication doit être considérée comme active pour une cible donnée, sauf besoin métier particulier ultérieur.



---
## 13. Gestion des échecs



Une publication en échec ne doit jamais être considérée comme partiellement réussie sans contrôle.



En cas d’échec, le système doit conserver :



- le statut d’échec ;

- l’étape de rupture ;

- un extrait de journal utile ;

- la possibilité de relancer proprement.



---
## 14. Règles de rollback



Le système doit permettre de revenir à une publication précédemment déployée si nécessaire.



Le rollback doit être pensé comme :



- la réactivation d’un artefact déjà validé ;

- ou le redéploiement d’une version antérieure connue.



Il ne doit pas dépendre d’une reconstruction improvisée depuis un brouillon modifié.



---
## 15. Traçabilité minimale



Pour chaque publication, il faut pouvoir connaître au minimum :



- le programme concerné ;

- la version ;

- le build code ;

- le template ;

- la date de génération ;

- la date de déploiement ;

- l’utilisateur ou le système ayant lancé l’action ;

- la cible de diffusion ;

- le résultat.



---
## 16. Règles spécifiques à OVH Hosting Pro



Dans le contexte de diffusion sur OVH Hosting Pro, la publication doit respecter les principes suivants :



- le rendu public doit être statique ;

- aucun runtime Node n’est requis en production ;

- le build est effectué depuis le même hébergement, mais hors des zones publiques exposées ;

- la publication s’effectue par écriture locale, déplacement contrôlé ou copie de fichiers ;

- le site public ne dépend pas d’une reconstruction à la volée.



---
## 17. Contrôles avant mise en ligne



Avant de marquer une publication comme déployée, les contrôles suivants doivent être prévus :



- présence du fichier d’entrée public attendu ;

- cohérence du répertoire cible ;

- vérification d’un nombre minimal d’assets ;

- absence de fichiers manifestement sensibles ;

- vérification de l’URL finale si possible.



---
## 18. Conclusion



La publication dans Abdou ne doit jamais être un simple bouton technique opaque.



Elle constitue :



- un acte métier ;

- une version identifiable ;

- une génération statique ;

- une diffusion contrôlée ;

- un élément historisé.



Le respect de ces règles est essentiel pour garantir un go live fiable sur **OVH Hosting Pro**, avec une diffusion publique sobre et maîtrisée.


