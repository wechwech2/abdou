# 13-runbook-incident.md

## 1. Objet

Runbook incident pour l'exploitation quotidienne du projet Abdou.

## 2. Triage initial (5 minutes)

1. Identifier l'impact: admin indisponible, publication bloquee, ou erreur partielle.
2. Capturer heure + endpoint + utilisateur + message d'erreur.
3. Verifier l'etat du socle:
- `pnpm run dev:start` (local)
- `GET /health`
- `GET /health/db`

## 3. Diagnostic rapide

1. Contrat/flux critiques:
- `pnpm run test:smoke:admin-php:http`
- `pnpm run test:smoke:admin-php:validation`
- `pnpm run test:smoke:admin-php:rbac`
2. Compat legacy si concernée:
- `pnpm run test:smoke:admin-api:compat-off`
- `pnpm run test:smoke:admin-api:db-down-diagnostics`
3. Front backoffice:
- `pnpm run test:smoke:backoffice:api-base`
- `pnpm run test:smoke:backoffice:api-paths`
- `pnpm run test:smoke:backoffice:workspace-partial`

## 4. Actions correctives standard

1. Incident DB:
- verifier variables MySQL;
- restaurer la connectivite;
- relancer checks `/health/db` et smoke DB-down.
2. Incident publication:
- relancer `workflow-detail`;
- verifier logs `build-log`, `deploy-log`, `deploy-artifacts`;
- relancer preview/deploy une fois cause corrigee.
3. Incident auth/RBAC:
- verifier session/cookies;
- verifier role utilisateur;
- rejouer smokes auth/rbac.

## 5. Critere de sortie incident

1. Les endpoints de sante sont verts.
2. Le smoke cible de l'incident repasse.
3. Les impacts utilisateurs sont clos.
4. Un compte-rendu court est ajoute au journal d'exploitation.
