# 07-pipeline-deploiement-ftp.md



## 1. Objet du document



Ce document décrit le pipeline de publication du projet **Abdou** sur **OVH Hosting Pro**.



Il formalise la manière dont un build de minisite généré sur l’hébergement du client est publié dans la zone publique cible.



L’objectif est d’obtenir un processus :



- simple ;

- reproductible ;

- contrôlable ;

- compatible avec OVH Hosting Pro ;

- suffisamment robuste pour un MVP exploitable.



---
## 2. Hypothèse de travail



Le go live public s’effectue dans une offre OVH Hosting Pro du client exposant au minimum :



- un accès SSH ;

- un accès FTP ;

- un espace de stockage public ;

- un ou plusieurs domaines, sous-domaines ou multisites ;

- des bases MySQL/MariaDB ;

- des certificats SSL Let’s Encrypt.



Le minisite public étant statique, la publication doit être pensée d’abord comme une **opération locale sur le même hébergement**.

Le FTP reste un outil d’exploitation ou de secours.  
Le mode normal doit être exécutable depuis le backoffice, la couche PHP ou des scripts lancés sur l’hébergement lui-même.



---
## 3. Principe général du pipeline



Le pipeline repose sur la chaîne suivante :



1. préparation des données ;

2. génération du build statique ;

3. validation du build ;

4. packaging éventuel ;

5. publication dans le répertoire ou multisite cible ;

6. vérification post-publication ;

7. historisation du résultat ;

8. usage éventuel du FTP pour exploitation ou secours.



Le FTP n’est donc plus le cœur du pipeline.  
Le cœur du pipeline est la **publication locale maîtrisée sur le même hébergement**.



---
## 4. Entrées du pipeline



Le pipeline de déploiement attend au minimum les entrées suivantes :



- un identifiant de publication ;

- un répertoire de build généré ;

- une cible de déploiement ;

- des credentials ou accès d’exploitation valides ;

- un chemin de destination public ;

- des paramètres de contrôle post-déploiement.



---
## 5. Préconditions



Avant toute publication, les préconditions suivantes doivent être vérifiées.



### 5.1. Publication générée



Aucun déploiement ne doit être tenté si la publication n’est pas au statut `generated` ou équivalent.



### 5.2. Répertoire de build existant



Le répertoire source doit exister et contenir les fichiers attendus.



### 5.3. Cible connue



Le chemin de destination doit être explicitement défini.  

Aucun déploiement ne doit partir vers une destination implicite ou ambiguë.



### 5.4. Credentials disponibles



Les accès d’exploitation nécessaires, qu’ils soient locaux, SSH ou FTP de secours, doivent être lus depuis la configuration sécurisée et jamais codés en dur.



---
## 6. Structure cible côté OVH



Le pipeline doit supposer une structure claire côté hébergement public.



Selon les cas, le minisite peut être déployé :



- à la racine d’un sous-domaine ;

- dans un répertoire spécifique ;

- dans un emplacement réservé à un programme.



La cible doit rester prévisible et stable, par exemple :



- `/www/programmes/les-jardins/`

- `/www/`

- `/www/minisites/programme-x/`



Cette décision doit être documentée par environnement.



---
## 7. Étapes détaillées du pipeline



## 7.1. Résolution de la cible

Le système détermine :

- le chemin de destination ;

- l’URL publique attendue ;

- le mode de publication retenu ;

- les accès techniques nécessaires.

## 7.2. Vérification locale du build



Avant publication, le système contrôle au minimum :



- la présence de `index.html` ou de l’entrée attendue ;

- la présence du dossier assets si nécessaire ;

- l’absence de chemins brisés évidents ;

- l’absence de fichiers sensibles.



## 7.3. Préparation de l’accès technique



Le pipeline prépare soit une écriture locale directe sur le même hébergement, soit une connexion SSH ou FTP de secours selon le mode retenu.



## 7.4. Préparation de la cible



Le système vérifie que le dossier cible existe ou peut être créé sans exposer de fichiers intermédiaires non validés.



## 7.5. Publication / synchronisation

Le système publie les fichiers du build vers la cible en respectant la stratégie retenue :

- copie locale complète ;

- ou synchronisation différentielle ;

- ou transfert FTP de secours.

Pour le MVP, une copie locale complète ou un transfert contrôlé restent acceptables si le volume reste raisonnable.



## 7.6. Vérification de transfert



Le pipeline vérifie que les fichiers critiques ont bien été copiés ou transférés.



## 7.7. Vérification HTTP



Après la publication, le système peut effectuer un contrôle simple sur l’URL publique :



- disponibilité ;

- code HTTP attendu ;

- présence de contenu caractéristique.



## 7.8. Mise à jour de l’historique



Le système enregistre le résultat dans la table de déploiement ou le journal d’exploitation.



---
## 8. Stratégies de déploiement



## 8.1. Déploiement direct



Le build est envoyé directement dans le répertoire public final.



Avantage :

- simplicité.



Inconvénient :

- risque plus élevé de transition visible si le transfert est long.



## 8.2. Déploiement par dossier temporaire puis bascule



Le build est d’abord envoyé dans un dossier temporaire, puis basculé si l’environnement le permet.



Avantage :

- meilleure maîtrise des transitions.



Inconvénient :

- plus complexe à gérer sur Hosting Pro.



Pour le MVP, le déploiement direct reste acceptable si le volume des fichiers reste raisonnable et si les contrôles sont bien faits.



---
## 9. Nettoyage et suppression



Le pipeline doit définir comment gérer les fichiers devenus obsolètes.



### 9.1. Risque des résidus



Un upload sans nettoyage peut laisser des fichiers anciens encore accessibles.



### 9.2. Règle recommandée



Le pipeline doit pouvoir :



- comparer la cible et le build ;

- supprimer les fichiers devenus inutiles ;

- ou reconstruire proprement la cible.



Pour le MVP, il faut au minimum prévoir une vérification des résidus les plus probables.



---
## 10. Rollback



Le pipeline doit être pensé pour permettre un retour arrière.



Deux stratégies sont possibles.



### 10.1. Redéploiement d’une publication antérieure



On redéploie un build déjà conservé.



### 10.2. Réactivation d’un package archivé



On reprend un package archivé précédemment validé.



La stratégie retenue doit éviter de “refabriquer à la main” une ancienne version.



---
## 11. Logs de déploiement



Chaque déploiement doit produire un journal minimal comprenant :



- identifiant de publication ;

- cible visée ;

- heure de début ;

- heure de fin ;

- nombre de fichiers transférés si possible ;

- résultat ;

- message d’erreur en cas d’échec.



Ces logs doivent suffire à comprendre rapidement ce qui s’est passé.



---
## 12. Sécurité du pipeline



Le pipeline doit respecter les règles de sécurité suivantes.



### 12.1. Pas de secrets dans le dépôt



Les secrets d’exploitation ne doivent jamais être committés.



### 12.2. Configuration centralisée



Les secrets doivent être lus via variables d’environnement ou coffre de secrets.



### 12.3. Journalisation prudente



Les logs ne doivent pas exposer le mot de passe, ni des secrets complets.



### 12.4. Portée limitée



Le compte technique utilisé doit idéalement avoir une portée limitée à la cible utile.



---
## 13. Scripts attendus



Le dossier `deploy/ovh/ftp/` doit contenir au minimum des scripts dédiés à la publication ou au secours opérationnel :



- déployer un site ;

- vérifier un site ;

- effectuer un rollback si possible.



Exemples :



- `deploy-site.mjs`

- `verify-site.mjs`

- `rollback-site.mjs`



Ces scripts doivent être appelables depuis le pipeline global.



---
## 14. Contrôles post-déploiement



Après publication, les contrôles suivants doivent être prévus.



### 14.1. Contrôle technique



Le site doit répondre sur l’URL cible.

Le contrôle HTTP doit être borné par un timeout explicite pour éviter les blocages de pipeline en cas de réseau dégradé.



### 14.2. Contrôle structurel



Les pages critiques doivent être présentes.



### 14.3. Contrôle de cohérence



Le contenu attendu doit correspondre à la publication déployée.



### 14.4. Contrôle manuel minimal



Pour les mises en ligne importantes, un contrôle humain rapide reste recommandé sur le MVP.



---
## 15. Cas d’échec



En cas d’échec, le pipeline doit distinguer au moins :



- échec d’accès au répertoire cible ou d’ouverture de session technique ;

- échec de création du répertoire cible ;

- échec de transfert ;

- échec de validation post-déploiement ;

- incohérence entre le build et la cible.



Chaque cas doit produire un état clair et un message exploitable.



---
## 16. Compatibilité avec l’architecture OVH cible



Le pipeline de déploiement doit rester réaliste au regard de la cible OVH finale :



- exécution PHP et logique métier sur OVH Hosting Pro ;

- pas de dépendance à un runtime Node en production ;

- pas de dépendance à un orchestrateur complexe ;

- pas de logique serveur lourde.



Hosting Pro reste un mutualisé enrichi, pas un environnement DevOps avancé. Le calcul, la validation et l’orchestration doivent donc rester sobres et compatibles PHP, SSH, FTP et MySQL OVH.



---
## 17. Conclusion



Le pipeline de publication du projet Abdou doit rester volontairement sobre :



- on génère hors zone publique ;

- on valide le build ;

- on publie les fichiers dans la cible locale ;

- on contrôle la mise en ligne ;

- on historise le résultat.



Cette simplicité est précisément ce qui rend le go live fiable sur **OVH Hosting Pro**.




