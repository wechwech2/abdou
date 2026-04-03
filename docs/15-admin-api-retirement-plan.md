# 15-admin-api-retirement-plan.md

## 1. Objectif

Retirer progressivement `admin-api` du chemin critique de production tout en gardant un filet de securite de compatibilite.

## 2. Conditions de bascule

1. Backoffice opere en mode normal sur `admin-php` sous `/api`.
2. Smokes `backoffice:api-base` + `backoffice:api-paths` verts.
3. Smokes `admin-php:http`, `admin-php:validation`, `admin-php:rbac` verts.

## 3. Plan en 3 phases

1. Phase A (actuelle): compat optionnelle (`ADMIN_API_COMPAT_ENABLED=false` par defaut).
2. Phase B: interdiction des nouveaux usages front de `admin-api` + monitoring des activations compat.
3. Phase C: retrait des routes metier proxy, conservation eventuelle des routes techniques temporaires.

## 4. Gates de securite

1. `pnpm run test:smoke:admin-api:compat-off`
2. `pnpm run test:smoke:admin-api:db-down-matrix`
3. `pnpm run test:smoke:release-readiness`

## 5. Definition de done

1. Aucun flux front metier ne depend de `admin-api`.
2. `admin-api` n'est plus requis en exploitation normale.
3. Documentation d'exploitation mise a jour sans chemin `admin-api` critique.
