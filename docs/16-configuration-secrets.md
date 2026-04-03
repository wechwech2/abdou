# 16-configuration-secrets.md

## 1. Objectif

Formaliser la strategie de configuration par environnement et la gestion des secrets.

## 2. Sources de configuration

1. `.env.example` pour le schema de variables.
2. Variables injectees par environnement (`dev`, `staging`, `prod`).
3. Aucun secret reel dans le depot.

## 3. Regles

1. `MYSQL_PASSWORD`, `FTP_PASSWORD` et credentials similaires ne doivent jamais rester a `change_me` hors local.
2. Les secrets CI passent uniquement via GitHub Secrets.
3. Les valeurs OVH (`FTP_*`, `OVH_*`, `PUBLIC_BASE_URL`) sont scopees par environnement.

## 4. Verification minimale avant release

1. Verifier que les placeholders de `.env.example` ne sont pas utilises en staging/prod.
2. Verifier la coherence des URLs de base (`ADMIN_PHP_BASE_URL`, `PUBLIC_BASE_URL`).
3. Verifier `ADMIN_API_COMPAT_ENABLED=false` par defaut.

## 5. Rotation et incident

1. Rotation immediate des secrets en cas de fuite suspectee.
2. Mise a jour des environnements + verification par smoke `release-readiness`.
