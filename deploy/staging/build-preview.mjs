#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function buildLandingHtml(generatedAt) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abdou - Preview</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        color: #111;
        background: #f8fafc;
      }

      main {
        max-width: 980px;
        margin: 0 auto;
        padding: 32px 20px;
      }

      .btn {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        text-decoration: none;
        font-weight: 600;
      }

      .btn-primary { background: #0f172a; color: #fff; border-color: #0f172a; }
      .btn-secondary { background: #fff; color: #0f172a; }

      .actions {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .meta {
        margin-top: 20px;
        color: #475569;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Abdou</h1>
      <p>Landing preview unifiée de la plateforme minisites.</p>
      <div class="actions">
        <a class="btn btn-primary" href="/minisites/residence-horizon/">Voir le minisite pilote</a>
        <a class="btn btn-secondary" href="/admin">Connexion admin</a>
      </div>
      <div class="meta">Generated: ${generatedAt}</div>
    </main>
  </body>
</html>`;
}

function buildMinisiteHtml(generatedAt) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Residence Horizon | Abdou</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #fff;
        color: #111;
      }

      .hero {
        padding: 28px 20px;
        background: #0f172a;
        color: #fff;
      }

      main {
        max-width: 980px;
        margin: 0 auto;
        padding: 24px 20px 40px;
      }

      .actions {
        margin-top: 18px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .btn {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        text-decoration: none;
        font-weight: 600;
        background: #fff;
        color: #0f172a;
      }
    </style>
  </head>
  <body>
    <section class="hero">
      <h1>Residence Horizon</h1>
      <p>Minisite public preview (fallback legacy)</p>
    </section>
    <main>
      <p>Ce rendu preview doit être remplacé par le flux publication V1 en production.</p>
      <div class="actions">
        <a class="btn" href="/">Retour accueil</a>
        <a class="btn" href="/admin">Connexion admin</a>
      </div>
      <p>Generated: <code>${generatedAt}</code></p>
    </main>
  </body>
</html>`;
}

export async function buildPreview(rootDir = resolve(process.cwd())) {
  const outDir = resolve(rootDir, 'dist', 'preview');
  const generatedAt = new Date().toISOString();

  const landingHtml = buildLandingHtml(generatedAt);
  const minisiteHtml = buildMinisiteHtml(generatedAt);

  await mkdir(outDir, { recursive: true });
  await mkdir(resolve(outDir, 'minisites', 'residence-horizon'), { recursive: true });

  const landingFile = resolve(outDir, 'index.html');
  const minisiteFile = resolve(outDir, 'minisites', 'residence-horizon', 'index.html');

  await writeFile(landingFile, landingHtml, 'utf8');
  await writeFile(minisiteFile, minisiteHtml, 'utf8');

  return landingFile;
}

const executedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (executedAsScript) {
  const outFile = await buildPreview();
  console.log(`[build-preview] Generated ${outFile}`);
}
