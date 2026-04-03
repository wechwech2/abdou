# Deploiement OVH mutualise

Ce dossier contient des squelettes de scripts pour :
- generation de package de publication ;
- transfert FTP ;
- verification post-deploiement ;
- rollback minimum.

Principe : la cible publique OVH ne calcule pas, elle diffuse des fichiers statiques.

Scripts disponibles :
- `ftp/deploy-site.mjs` : deploiement local ou dry-run avec manifest JSON et backup de la cible.
- `ftp/verify-site.mjs` : verification rapide d un site via URL HTTP ou dossier local (avec timeout configurable).
- `ftp/rollback-site.mjs` : restauration de la cible depuis le backup d un manifest `deploy-site`.

Exemples rapides :
- `node deploy/ovh/ftp/deploy-site.mjs --source=dist/published-sites/publication-123 --target=dist/preview/site --mode=local`
- `node deploy/ovh/ftp/verify-site.mjs --target=dist/preview/site`
- `node deploy/ovh/ftp/verify-site.mjs --url=https://abdou.wechwech.tn --expect=Abdou --timeout-ms=10000`
- `node deploy/ovh/ftp/rollback-site.mjs --manifest=dist/logs/deployments/deploy-site-<id>.json`

Smoke tests relies :
- `pnpm run test:smoke:deploy-verify`
- `pnpm run test:smoke:deploy-rollback`
