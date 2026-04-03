# 08-environnements-dev-staging-prod.md

## 1. Objet du document

Ce document définit les environnements du projet **Abdou** et le rôle de chacun.

L’objectif est d’éviter toute confusion entre :

- l’environnement de développement ;
- l’environnement de prévalidation ;
- l’environnement de production.

Cette distinction reste importante, même si la cible finale est une seule offre **OVH Hosting Pro** :

- l’édition reste dynamique ;
- la génération reste distincte de la diffusion ;
- le public reste servi sous forme statique.

---
## 2. Principe général

Le projet doit distinguer au minimum trois environnements :

- **dev** ;
- **staging** ;
- **prod**.

Leur rôle n’est pas interchangeable.

Le principe à respecter est le suivant :

- on développe en `dev` ;
- on valide en `staging` ;
- on exploite en `prod`.

---
## 3. Environnement `dev`

L’environnement `dev` est l’environnement de travail des développeurs.

Il sert à :

- développer le backoffice ;
- développer la logique PHP ;
- tester la base ;
- tester la génération ;
- expérimenter les templates ;
- simuler les publications.

Il peut vivre sur poste local.

Mode operatoire recommande en local :

- demarrer l'administration via `admin-php` ;
- le backoffice cible en priorite les endpoints `admin-php` sous `/api/*` ;
- la base API par defaut du backoffice est `/api` (sans fallback implicite vers la racine) ;
- utiliser `admin-api` uniquement si un besoin de compatibilite l'exige temporairement.
- commande quotidienne recommandee : `pnpm run dev:start`.
- si `admin-api` est lancee pour compatibilite, utiliser `pnpm run start:admin-api:compat` (flag proxy force explicitement).

En `dev`, on accepte :

- des données de test ;
- des scripts en cours de stabilisation ;
- des redémarrages fréquents ;
- des configurations temporaires.

---
## 4. Environnement `staging`

L’environnement `staging` sert à la validation avant mise en ligne.

Il doit être le plus proche possible des contraintes d’OVH Hosting Pro.

Il permet de :

- tester une publication réelle ;
- valider le rendu des templates ;
- vérifier les chemins de stockage ;
- tester les scripts de génération ;
- tester les scripts de mise en ligne ;
- vérifier les performances minimales sur un contexte proche de Hosting Pro.

Le `staging` doit répondre à la question :

**ce que nous allons publier tiendra-t-il réellement sur Hosting Pro ?**

---
## 5. Environnement `prod`

La production correspond à **une seule offre OVH Hosting Pro**.

Dans cet environnement unique, il faut néanmoins distinguer structurellement :

- le backoffice protégé ;
- la couche métier PHP ;
- les bases MySQL ;
- les zones de stockage ;
- les zones publiques où vivent les minisites générés.

La production doit utiliser les capacités de l’offre :

- jusqu’à 10 multisites ;
- 4 bases MySQL de 1 Go ;
- 250 Go disque ;
- accès SSH ;
- FTP ;
- SSL Let’s Encrypt ;
- logs et statistiques.

Le public ne doit pas accéder aux zones d’administration ni aux fichiers de travail.

---
## 6. Séparation fonctionnelle dans `prod`

Même si la production est unique, il faut distinguer clairement :

### 6.1. Zone d’administration

Cette zone héberge :

- le backoffice ;
- la logique métier PHP ;
- les actions de publication ;
- les écrans d’exploitation ;
- les traitements internes.

Elle doit être protégée et non indexée publiquement.

### 6.2. Zone publique

Cette zone héberge :

- les minisites générés ;
- les assets statiques ;
- les documents publics ;
- les médias optimisés exposés.

Elle doit rester simple, stable et légère.

---
## 7. Configuration par environnement

Chaque environnement doit disposer de sa propre configuration.

Les paramètres concernés incluent notamment :

- accès MySQL ;
- chemins de stockage ;
- paramètres de publication ;
- répertoires publics ;
- multisites cibles ;
- options de journalisation ;
- secrets d’authentification.

Ces paramètres ne doivent pas être codés en dur dans le dépôt.

---
## 8. Variables d’environnement

Une stratégie simple de variables d’environnement doit être retenue.

Exemples de catégories :

- base de données ;
- authentification ;
- stockage ;
- publication ;
- chemins publics ;
- logs.

Le projet doit disposer d’un `.env.example` propre et documenté.

---
## 9. Données par environnement

### 9.1. Données de `dev`

Les données de `dev` peuvent être partielles, simulées ou reconstruites facilement.

### 9.2. Données de `staging`

Les données de `staging` doivent être plus réalistes, sans nécessairement être une copie exacte de la production.

### 9.3. Données de `prod`

Les données de production comprennent :

- les données métier actives dans MySQL ;
- l’historique des publications ;
- les médias de travail ;
- les artefacts publics effectivement diffusés.

Il faut éviter tout mélange incontrôlé entre stockage de travail et exposition publique.

---
## 10. Builds et publications

Les sorties doivent être distinctes selon l’environnement.

### 10.1. Preview

Utilisé surtout en `dev`.

### 10.2. Validation

Utilisé en `staging`.

### 10.3. Publication

Utilisé en `prod`.

Une publication destinée à la production doit être :

- identifiable ;
- traçable ;
- localisable sur disque ;
- associée à une version métier.

---
## 11. Gestion des domaines, sous-domaines et multisites

Le projet doit distinguer clairement les cibles d’accès.

Par exemple :

- un sous-domaine d’administration ;
- un multisite de preview si nécessaire ;
- un ou plusieurs multisites publics pour les minisites.

La diffusion publique peut se faire :

- sur un sous-domaine ;
- sur un répertoire dédié ;
- via un multisite distinct.

Cette décision doit être documentée programme par programme ou offre par offre si besoin.

---
## 12. Journalisation par environnement

### 12.1. `dev`

Les logs peuvent être plus verbeux.

### 12.2. `staging`

Les logs doivent aider à diagnostiquer les écarts entre comportement attendu et comportement réel sur une cible proche d’OVH.

### 12.3. `prod`

Les logs doivent rester utiles, sobres et compatibles avec les outils fournis par OVH :

- logs applicatifs ;
- logs d’accès ;
- historique de publication ;
- journaux de génération.

---
## 13. Promotion entre environnements

Le passage de `dev` à `staging`, puis de `staging` à `prod`, doit obéir à une logique maîtrisée.

### 13.1. De `dev` vers `staging`

On promeut lorsque :

- le schéma est cohérent ;
- le backoffice fonctionne sur le cas visé ;
- la logique PHP est stable ;
- la génération produit un livrable exploitable.

### 13.2. De `staging` vers `prod`

On promeut lorsque :

- le rendu est validé ;
- les limites Hosting Pro ont été prises en compte ;
- la publication locale sur l’hébergement est maîtrisée ;
- la structure des multisites / répertoires cibles est claire ;
- les accès et secrets sont en place.

---
## 14. Sécurité par environnement

### 14.1. `dev`

Souple mais non négligée. Aucun secret réel ne doit circuler dans le dépôt.

### 14.2. `staging`

Plus stricte, car proche du comportement réel.

### 14.3. `prod`

Strictement contrôlée, avec :

- accès limités ;
- comptes d’administration protégés ;
- séparation des zones privées et publiques ;
- exposition minimale ;
- surveillance des uploads et des publications.

---
## 15. Risques à éviter

Le projet doit éviter les erreurs classiques suivantes :

- faire du `dev` une pseudo-production ;
- publier sans validation ;
- mélanger les zones privées et publiques ;
- exposer le backoffice ;
- stocker des secrets dans le dépôt ;
- dépendre d’un runtime non disponible sur Hosting Pro ;
- surestimer les capacités réelles de Hosting Pro.

---
## 16. Recommandation pratique pour Abdou

Dans votre contexte, l’organisation la plus réaliste est la suivante :

- **dev** : poste local ;
- **staging** : environnement de test le plus proche possible d’OVH Hosting Pro ;
- **prod** : une seule offre OVH Hosting Pro avec séparation stricte entre administration et diffusion.

Cette approche est cohérente avec le nouveau cadrage :

- pas de production Node distincte ;
- pas de double production séparant un interne et un public distincts ;
- pas d’hypothèse VPS obligatoire ;
- une seule cible d’exploitation.

---
## 16.1. Playbook opérationnel court

Pour éviter les ambiguïtés d’exploitation locale, utiliser la séquence suivante.

`dev` (quotidien) :

- initialiser la base locale : `pnpm run db:init:reset` ;
- démarrer l’administration cible : `pnpm run dev:start` ;
- accéder à l’admin : `http://127.0.0.1:8080/admin`.

`staging` local (validation publication) :

- construire la preview : `pnpm run preview:build` ;
- publier en local : `pnpm run preview:publish` ;
- exécuter la validation HTTP cible : `pnpm run test:smoke:admin-php:http`.
- pour valider la phase locale complete avant test client sur domaine: `pnpm run test:smoke:client-phase-local`.

`compat legacy` (ponctuel uniquement) :

- démarrer le proxy : `pnpm run start:admin-api:compat` ;
- vérifier la santé du proxy : `http://127.0.0.1:3001/health` ;
- vérifier le mode compat désactivé : `pnpm run test:smoke:admin-api:compat-off`.

---
## 17. Conclusion

Le projet Abdou doit traiter ses environnements comme trois rôles distincts :

- `dev` pour construire ;
- `staging` pour vérifier ;
- `prod` pour exploiter et publier.

La séparation critique n’est plus entre deux infrastructures de production.  
Elle est entre :

- l’administration ;
- la génération ;
- la diffusion publique ;

le tout dans le cadre unique d’**OVH Hosting Pro**.


