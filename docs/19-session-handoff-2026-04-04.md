# 19-session-handoff-2026-04-04.md

## 1. Objet

Document de reprise rapide après la session du **04 avril 2026**.

## 2. État livré

### 2.1 Public V1

- route publique programme: `/minisites/:programme-slug`
- rendu data-driven par publication/programme (pas de home générique sur l’URL programme)
- sections V1 conditionnelles: hero, rubriques actives, environnement, maquette & lots, images, vidéo, documentation, footer
- navigation bâtiment + recherche simple de lot

### 2.2 Publication / déploiement

- pipeline branché: build -> deploy -> published_url
- alignement:
  - `public_path=/minisites/:slug`
  - `target_path=www/minisites/:slug`
  - `published_url=https://<domain>/minisites/:slug`
- statuts déploiement corrigés:
  - `pending -> running -> success|failed`
- vérification déploiement locale + URL distante HTTP/HTTPS

### 2.3 Backoffice PHP (MVP)

- programme: édition
- rubriques: CRUD minimal
- médias: création + association programme
- bâtiments: CRUD minimal
- étages: CRUD minimal
- lots: CRUD minimal existant

## 3. Commits récents utiles

- `1e106c6` feat(publication): align deploy paths/statuses and add batiments admin CRUD smoke
- `0a0d5ac` feat(admin-php): add minimal etages CRUD with admin UI and smoke coverage

## 4. Commandes de vérification

### 4.1 Rapides

- `pnpm run test:smoke:public-v1-flow`
- `pnpm run test:smoke:admin-php:content-media`
- `pnpm run test:smoke:admin-php:batiments`
- `pnpm run test:smoke:admin-php:etages`

### 4.2 Gate complet

- `pnpm run test:smoke:release-readiness`

## 5. URLs de contrôle

- landing: `https://abdou.wechwech.tn/`
- admin: `https://abdou.wechwech.tn/admin`
- minisite pilote: `https://abdou.wechwech.tn/minisites/residence-horizon`

## 6. Reprise recommandée (prochaines tâches)

1. Brancher le formulaire lots admin avec sélection guidée bâtiment/étage.
2. Ajouter l’upload média local (pas uniquement URL) et la copie publication dans `assets/`.
3. Mettre en place la validation opérateur -> validateur -> admin avant publication.
4. Refaire un run de `release-readiness` après chaque bloc.

## 7. Checklist avant pause prolongée

- pousser `main`
- conserver ce document à jour avec date + commits
- relancer au minimum:
  - `pnpm run test:smoke:public-v1-flow`
  - `pnpm run test:smoke:release-readiness`
