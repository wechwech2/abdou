# 14-release-checklist.md

## 1. Preconditions

1. Branche cible a jour.
2. Variables d'environnement valides (pas de placeholders secrets).
3. Aucun changement non relu sur les flux publication/auth.

## 2. Gate technique obligatoire

1. `pnpm install --frozen-lockfile`
2. `pnpm run check`
3. `pnpm run test:smoke:release-readiness`
4. `pnpm run test:smoke:go-live-rehearsal`

## 3. Verification fonctionnelle minimale

1. Login admin + chargement dashboard.
2. CRUD rapide client/programme/publication.
3. Build + preview + deploy + refresh workflow-detail.

## 4. Artefacts et logs

1. Verifier `dist/logs/smoke-summary.json`.
2. Verifier `dist/logs/smoke-summary.md`.
3. Conserver les logs de run dans l'artefact CI.

## 5. Decision de release

Release autorisee si:
1. Tous les gates sont verts.
2. Aucun blocage P1/P2 ouvert.
3. Rollback procedure disponible et testee.
