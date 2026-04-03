# 18-closeout-steps-1-14.md

## Objectif

Tracer l'execution des 14 premiers steps de finalisation projet.

## Matrice d'execution

1. MVP criteria figes: `docs/12-roadmap-mvp.md` (sections 2, 14).
2. Convergence front `admin-php`: backoffice `/api` + smokes `backoffice:api-base`, `backoffice:api-paths`.
3. `admin-api` en compat optionnelle + plan retrait: `apps/admin-api/README.md`, `docs/15-admin-api-retirement-plan.md`.
4. CRUD prioritaires + validations: `apps/admin-php/README.md` + smoke `admin-php:validation`.
5. RBAC complet prioritaire: smoke `admin-php:rbac`, `admin-php:auth-matrix`.
6. Workflow publication stabilise: smoke `admin-php:http`, `admin-php:workflow-detail-contract`, `deploy-verify`, `deploy-rollback`.
7. Gestion d'erreurs durcie: smokes `admin-api:envelope`, `admin-api:methods`, `admin-api:timeout`.
8. Flux medias/lots/rubriques: routes + gardes payloads + smoke `backoffice:contract-parsing`.
9. Couverture parcours critiques: smoke gate `test:smoke:release-readiness`.
10. Non-regression front: smokes `backoffice:api-base`, `backoffice:api-paths`, `backoffice:workspace-partial`.
11. Documentation exploitation: `docs/13-runbook-incident.md`, `docs/14-release-checklist.md`.
12. Strategie env/secrets: `docs/08-environnements-dev-staging-prod.md`, `docs/16-configuration-secrets.md`, `.env.example`.
13. Exploitabilite OVH: `docs/17-ovh-readiness-checklist.md` + smokes deploy.
14. Pipeline release: `.github/workflows/release-readiness.yml` + CI `.github/workflows/ci.yml`.

## Commande de validation finale

`pnpm run check`
