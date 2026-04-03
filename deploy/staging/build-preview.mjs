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
    <title>Abdou - Accueil</title>
    <style>
      :root {
        --bg: #212121;
        --text-main: #ffffff;
        --text-soft: #a9a9a9;
        --line: rgba(255, 255, 255, 0.18);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: var(--text-main);
        background: var(--bg);
        min-height: 100vh;
      }

      .hero {
        min-height: 100vh;
        padding: 120px 6vw 72px;
        background:
          linear-gradient(to bottom, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.68)),
          url("https://cdn.myportfolio.com/8d6a3296-bf47-469a-9151-bc93998bbd9f/2758b0a5-c23f-49c1-940b-ddf06ab3063b_rwc_2210x1510x1579x1102x4096.jpg?h=4f81d9a58f5b67be6deb5f237bc3aaa6")
            center / cover no-repeat;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-bottom: 1px solid var(--line);
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(36px, 7vw, 70px);
        line-height: 1;
      }

      .hero p {
        margin: 14px 0 0;
        color: var(--text-soft);
        font-size: clamp(16px, 2vw, 22px);
      }

      .btn {
        display: inline-block;
        padding: 7px 11px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        text-decoration: none;
        color: var(--text-main);
        font-size: 13px;
        background: rgba(0, 0, 0, 0.32);
      }

      .btn:hover {
        background: rgba(0, 0, 0, 0.55);
      }

      .actions {
        margin-top: 18px;
        display: flex;
        gap: 8px;
      }

      .meta {
        margin-top: 18px;
        color: var(--text-soft);
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <section class="hero">
      <h1>Abdou</h1>
      <p>Point d'entree client</p>
      <div class="actions">
        <a class="btn" href="/admin">Login</a>
        <a class="btn" href="/minisite.html">Minisite</a>
      </div>
      <div class="meta">Generated: ${generatedAt}</div>
    </section>
  </body>
</html>`;
}

function buildMinisiteHtml(generatedAt) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abdou - Minisite Preview</title>
    <style>
      :root {
        --bg: #212121;
        --bg-elev: #191919;
        --text-main: #ffffff;
        --text-soft: #a9a9a9;
        --line: rgba(255, 255, 255, 0.18);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        background: var(--bg);
        color: var(--text-main);
      }

      .site-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
        height: 92px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 36px;
        background: rgba(25, 25, 25, 0.88);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid var(--line);
      }

      .brand {
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 22px;
        font-weight: 700;
      }

      .hero {
        min-height: 72vh;
        padding: 160px 6vw 80px;
        background:
          linear-gradient(to bottom, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.65)),
          url("https://cdn.myportfolio.com/8d6a3296-bf47-469a-9151-bc93998bbd9f/2758b0a5-c23f-49c1-940b-ddf06ab3063b_rwc_2210x1510x1579x1102x4096.jpg?h=4f81d9a58f5b67be6deb5f237bc3aaa6") center / cover no-repeat;
        border-bottom: 1px solid var(--line);
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(36px, 7vw, 68px);
        line-height: 1;
      }

      .hero p {
        margin: 16px 0 0;
        color: var(--text-soft);
        font-size: clamp(16px, 2vw, 24px);
      }

      .section {
        padding: 56px 6vw 72px;
      }

      .status {
        margin-top: 20px;
        background: var(--bg-elev);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
      }

      .status p { color: var(--text-soft); }
      .status code { color: var(--text-main); }

      a.back {
        color: #fff;
        text-decoration: none;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 8px 10px;
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <div class="brand">Abdou</div>
      <a class="back" href="/">Retour accueil</a>
    </header>

    <section class="hero">
      <h1>Abdou Visual Works</h1>
      <p>Preview statique du minisite client</p>
    </section>

    <section class="section">
      <div class="status">
        <p>Domain: <code>abdou.wechwech.tn</code></p>
        <p>Path: <code>/minisite.html</code></p>
        <p>Generated: <code>${generatedAt}</code></p>
      </div>
    </section>
  </body>
</html>`;
}

export async function buildPreview(rootDir = resolve(process.cwd())) {
  const outDir = resolve(rootDir, 'dist', 'preview');
  const generatedAt = new Date().toISOString();

  const landingHtml = buildLandingHtml(generatedAt);
  const minisiteHtml = buildMinisiteHtml(generatedAt);

  await mkdir(outDir, { recursive: true });

  const landingFile = resolve(outDir, 'index.html');
  const minisiteFile = resolve(outDir, 'minisite.html');

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
