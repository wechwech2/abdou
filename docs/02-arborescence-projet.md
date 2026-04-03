# 02-arborescence-projet.md

## 1. Objet du document

Ce document décrit l’arborescence cible du projet **Abdou** dans une version compatible avec le cadrage retenu :

- administration et préparation sur l’hébergement **OVH Hosting Pro** du client ;
- génération des minisites depuis ce même hébergement ;
- diffusion finale sous forme de livrable statique dans les zones publiques OVH.

L’objectif de cette arborescence n’est pas uniquement d’organiser les fichiers.
Il doit traduire la séparation fondamentale entre :

- la documentation de cadrage ;
- les applications internes ;
- le moteur de génération ;
- le template de minisite ;
- la base de données ;
- les scripts de déploiement ;
- les artefacts publiés.

---

## 2. Principe de structuration

L’arborescence doit être pensée selon un principe simple :

**on sépare ce qui sert à administrer, ce qui sert à générer, et ce qui sert à publier.**

Il ne faut donc pas mélanger :

- le backoffice ;
- la couche métier PHP ;
- le moteur de publication ;
- le template public ;
- les scripts de déploiement ;
- les données SQL ;
- les fichiers générés.

Cette séparation est particulièrement importante dans le contexte OVH Hosting Pro, car le site public final ne doit pas dépendre de la structure technique interne du projet.

Important : l’arborescence contient un socle `apps/admin-php/` aligné avec la cible OVH Hosting Pro, tout en conservant `apps/admin-api/` comme **legacy** le temps de finaliser la migration.

---

## 3. Arborescence cible

```text
abdou/
├─ README.md
├─ .gitignore
├─ .editorconfig
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
│
├─ docs/
│  ├─ 00-vision-produit.md
│  ├─ 01-architecture-technique.md
│  ├─ 02-arborescence-projet.md
│  ├─ 03-conventions-code.md
│  ├─ 04-modele-metier.md
│  ├─ 05-modele-donnees-mysql-ovh.md
│  ├─ 06-regles-publication.md
│  ├─ 07-pipeline-deploiement-ftp.md
│  ├─ 08-environnements-dev-staging-prod.md
│  ├─ 09-backoffice-fonctionnel.md
│  ├─ 10-template-minisite.md
│  ├─ 11-securite-exploitation.md
│  └─ 12-roadmap-mvp.md
│
├─ apps/
│  ├─ admin-php/
│  │  ├─ README.md
│  │  ├─ public/
│  │  │  ├─ .htaccess
│  │  │  └─ index.php
│  │  ├─ src/
│  │  │  ├─ bootstrap.php
│  │  │  ├─ config.php
│  │  │  ├─ Controllers/
│  │  │  │  └─ HealthController.php
│  │  │  └─ Http/
│  │  │     └─ Router.php
│  │  └─ storage/
│  │     └─ logs/
│  │
│  ├─ backoffice-web/
│  │  ├─ README.md
│  │  ├─ public/
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ core/
│  │     │  ├─ shared/
│  │     │  ├─ layout/
│  │     │  └─ features/
│  │     │     ├─ auth/
│  │     │     ├─ dashboard/
│  │     │     ├─ clients/
│  │     │     ├─ offres/
│  │     │     ├─ programmes/
│  │     │     ├─ rubriques/
│  │     │     ├─ medias/
│  │     │     ├─ lots/
│  │     │     ├─ publications/
│  │     │     └─ users/
│  │     ├─ assets/
│  │     └─ environments/
│  │
│  ├─ admin-api/ (legacy)
│  │  ├─ README.md
│  │  ├─ src/
│  │  │  ├─ main.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ config/
│  │  │  ├─ common/
│  │  │  ├─ database/
│  │  │  └─ modules/
│  │  │     ├─ auth/
│  │  │     ├─ users/
│  │  │     ├─ roles/
│  │  │     ├─ clients/
│  │  │     ├─ offres/
│  │  │     ├─ templates/
│  │  │     ├─ programmes/
│  │  │     ├─ rubriques/
│  │  │     ├─ medias/
│  │  │     ├─ lots/
│  │  │     ├─ publications/
│  │  │     └─ deploy/
│  │  └─ test/
│  │
│  ├─ publisher-cli/
│  │  ├─ README.md
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ commands/
│  │  │  ├─ loaders/
│  │  │  ├─ transformers/
│  │  │  ├─ generators/
│  │  │  ├─ writers/
│  │  │  ├─ packaging/
│  │  │  └─ deploy/
│  │  └─ templates/
│  │
│  ├─ preview-server/
│  │  ├─ README.md
│  │  └─ src/
│  │     ├─ index.ts
│  │     └─ routes/
│  │
│  └─ site-template-default/
│     ├─ README.md
│     ├─ src/
│     │  ├─ layouts/
│     │  ├─ partials/
│     │  ├─ components/
│     │  ├─ pages/
│     │  ├─ assets/
│     │  │  ├─ css/
│     │  │  ├─ js/
│     │  │  └─ img/
│     │  └─ data-contract/
│     └─ dist/
│
├─ packages/
│  ├─ shared-types/
│  │  ├─ README.md
│  │  └─ src/
│  │     ├─ client.ts
│  │     ├─ offre.ts
│  │     ├─ programme.ts
│  │     ├─ rubrique.ts
│  │     ├─ media.ts
│  │     ├─ lot.ts
│  │     ├─ publication.ts
│  │     └─ index.ts
│  │
│  ├─ shared-config/
│  │  ├─ README.md
│  │  └─ src/
│  │     ├─ env.ts
│  │     ├─ constants.ts
│  │     └─ routes.ts
│  │
│  ├─ shared-utils/
│  │  ├─ README.md
│  │  └─ src/
│  │     ├─ slug.ts
│  │     ├─ dates.ts
│  │     ├─ files.ts
│  │     ├─ checksum.ts
│  │     └─ validation.ts
│  │
│  └─ shared-ui/
│     ├─ README.md
│     └─ src/
│        ├─ forms/
│        ├─ tables/
│        ├─ upload/
│        └─ feedback/
│
├─ db/
│  ├─ mysql/
│  │  ├─ README.md
│  │  ├─ schema/
│  │  │  ├─ 001_roles_users.sql
│  │  │  ├─ 002_clients.sql
│  │  │  ├─ 003_templates_offres.sql
│  │  │  ├─ 004_programmes.sql
│  │  │  ├─ 005_rubriques.sql
│  │  │  ├─ 006_medias.sql
│  │  │  ├─ 007_batiments_etages_lots.sql
│  │  │  ├─ 008_publications.sql
│  │  │  └─ 999_indexes.sql
│  │  ├─ seeds/
│  │  │  ├─ 001_roles.sql
│  │  │  ├─ 002_templates.sql
│  │  │  └─ 003_offres.sql
│  │  └─ migrations/
│  └─ diagrams/
│     ├─ modele-metier.drawio
│     └─ modele-donnees.drawio
│
├─ storage/
│  ├─ imports/
│  ├─ media-original/
│  ├─ media-optimized/
│  ├─ publications/
│  └─ exports/
│
├─ dist/
│  ├─ preview/
│  ├─ published-sites/
│  └─ ftp-packages/
│
├─ deploy/
│  ├─ ovh/
│  │  ├─ README.md
│  │  ├─ ftp/
│  │  │  ├─ deploy-site.mjs
│  │  │  ├─ rollback-site.mjs
│  │  │  └─ verify-site.mjs
│  │  ├─ mysql/
│  │  │  ├─ init.sql
│  │  │  └─ smoke-test.sql
│  │  └─ apache/
│  │     ├─ .htaccess.public
│  │     └─ routing-notes.md
│  │
│  ├─ staging/
│  │  ├─ build-preview.mjs
│  │  └─ publish-local.mjs
│  │
│  └─ scripts/
│     ├─ build-publication.mjs
│     ├─ validate-publication.mjs
│     ├─ package-publication.mjs
│     └─ deploy-publication.mjs
│
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  ├─ publisher/
│  └─ smoke/
│
└─ .codex/
   ├─ config.toml
   └─ prompts/
      ├─ cadrage.md
      ├─ sql-schema.md
      ├─ backoffice.md
      ├─ publisher.md
      └─ deploiement-ovh.md
```

## 4. Lecture fonctionnelle de l’arborescence

### 4.1. Le dossier docs/

Le dossier docs/ contient le socle de cadrage.
Il ne doit pas être vu comme un simple espace documentaire secondaire. Il constitue la référence du projet.

Chaque fichier y répond à une question précise :

- pourquoi le produit existe ;
- comment il est architecturé ;
- quels objets métier il manipule ;
- comment il sera déployé ;
- quelles contraintes imposent OVH Hosting Pro, le moteur PHP et le pipeline de publication.

Ce dossier doit rester lisible par un développeur, un architecte et un décideur projet.

### 4.2. Le dossier apps/

Le dossier apps/ rassemble les applications exécutables du projet.

Il contient les sous-ensembles distincts suivants :

- admin-php, qui porte désormais la cible d’exécution métier sur moteur PHP ;
- backoffice-web, qui sert à l’administration ;
- admin-api, qui correspond à un héritage Node maintenu temporairement en legacy ;
- publisher-cli, qui matérialise aujourd’hui le moteur de génération du minisite ;
- preview-server, qui permet de visualiser les builds localement ;
- site-template-default, qui contient le gabarit public généré.

C’est ici que se matérialise la séparation entre édition et publication.

### 4.3. Le dossier packages/

Le dossier packages/ mutualise les éléments partagés.

On y place :

- les types métier partagés ;
- la configuration transverse ;
- les utilitaires communs ;
- les composants UI réutilisables.

Cela permet d’éviter la duplication entre le backoffice, la couche métier PHP et le moteur de génération.

### 4.4. Le dossier db/

Le dossier db/ contient la modélisation SQL et ses compléments.

Le sous-dossier schema/ porte la définition structurante des tables.
Le sous-dossier seeds/ contient les données de référence initiales.
Le sous-dossier migrations/ permettra ensuite de faire vivre le schéma proprement.
Le sous-dossier diagrams/ sert à conserver la vue métier et logique.

### 4.5. Le dossier storage/

Le dossier storage/ correspond au stockage de travail hors exposition publique directe.

Il faut y séparer :

- les imports bruts ;
- les médias originaux ;
- les médias optimisés ;
- les builds de publication ;
- les exports.

Cela permet de ne pas mélanger les sources, les transformations et les livrables finaux.

### 4.6. Le dossier dist/

Le dossier dist/ contient les sorties générées.

Il ne doit contenir que des artefacts reconstruisibles :

- prévisualisations ;
- sites publiés générés ;
- packages prêts à déployer.

### 4.7. Le dossier deploy/

Le dossier deploy/ contient la logique de livraison opérationnelle.

Dans le contexte OVH Hosting Pro, c’est un dossier critique.
Il regroupe :

- les scripts FTP ;
- les tests de vérification ;
- les fichiers .htaccess et notes de routage ;
- les scripts de build et de packaging.

### 4.8. Le dossier .codex/

Le dossier .codex/ permet d’outiller le projet pour la génération assistée.

Il doit contenir :

- la configuration d’exécution ;
- des prompts spécialisés par chantier ;
- éventuellement des consignes de style et de découpage du travail.

## 5. Règles d’organisation à respecter

L’arborescence ne doit pas dériver vers un mélange entre métier et technique.

Les règles suivantes doivent être tenues :

- le site public généré ne doit pas être développé dans le même esprit que le backoffice ;
- les fichiers SQL ne doivent pas être dispersés dans les applications ;
- les scripts de déploiement doivent être regroupés et nommés clairement ;
- les données générées doivent rester hors du code source métier ;
- les types partagés doivent être centralisés ;
- les templates doivent être versionnables indépendamment du contenu métier.

## 6. Ordre logique de démarrage

L’arborescence doit être remplie dans l’ordre suivant :

- documentation de cadrage ;
- schéma SQL ;
- types partagés ;
- couche métier PHP ;
- backoffice web minimal ;
- moteur de génération ;
- template public par défaut ;
- scripts de packaging et de déploiement.

Cet ordre permet de ne pas construire le front avant d’avoir stabilisé le noyau métier et la publication.

## 7. Conclusion

L’arborescence du projet Abdou doit refléter la réalité du produit :

ce n’est pas un simple site web, mais une chaîne de production de minisites.

La structure retenue est donc organisée pour servir quatre finalités :

- administrer ;
- stocker ;
- générer ;
- publier.

Cette séparation devient indispensable dès lors que la cible finale doit faire cohabiter administration, génération et diffusion publique dans le même hébergement OVH.

