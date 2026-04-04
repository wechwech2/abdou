# 17-ovh-readiness-checklist.md

## 1. Objectif

Valider l'aptitude de la solution a tourner sur OVH Hosting Pro avant go-live.

## 2. Capacites et contraintes a verifier

1. Timeouts HTTP et appels upstream (`ADMIN_PHP_TIMEOUT_MS`).
2. I/O fichiers sur repertoires de publication/logs.
3. Quotas disque/base en ligne avec la charge prevue.
4. FTP deploy/rollback operationnels.
5. Cible web accessible pour `www/minisites/` via `https://abdou.wechwech.tn/minisites/:slug`.
6. Verification HTTP + HTTPS du minisite public (pas de 404/502 sur route programme).

## 3. Verification technique

1. `pnpm run test:smoke:admin-php:http`
2. `pnpm run test:smoke:deploy-verify`
3. `pnpm run test:smoke:deploy-rollback`
4. `pnpm run test:smoke:public-v1-flow`
5. `pnpm run test:smoke:release-readiness`
6. `pnpm run test:smoke:admin-php:content-media`
7. `pnpm run test:smoke:admin-php:batiments`
8. `pnpm run test:smoke:admin-php:etages`

## 4. Verification exploitation

1. Runbook incident disponible (`docs/13-runbook-incident.md`).
2. Checklist release disponible (`docs/14-release-checklist.md`).
3. Strategie secrets validee (`docs/16-configuration-secrets.md`).

## 5. Definition de ready

1. Gates de test verts.
2. Deploy + rollback verifies.
3. Observabilite minimale via logs smoke et deploiement.
4. Alignement valide `public_path=/minisites/:slug`, `target_path=www/minisites/:slug`, `published_url=https://<domain>/minisites/:slug`.
