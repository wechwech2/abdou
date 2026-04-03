#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildPreview } from '../staging/build-preview.mjs';

function parsePublicationId(argv) {
  const flag = argv.find((arg) => arg.startsWith('--publicationId='));
  if (!flag) {
    return null;
  }
  const raw = flag.split('=')[1] ?? '';
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function buildPublication(publicationId, rootDir = resolve(process.cwd())) {
  const publishedDir = resolve(rootDir, 'dist', 'published-sites');
  const logsDir = resolve(rootDir, 'dist', 'logs', 'publications');
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const buildCode = `publication-${publicationId}-${timestamp}`;
  const targetDir = resolve(publishedDir, buildCode);
  const targetRootIndex = resolve(targetDir, 'index.html');
  const logFile = resolve(logsDir, `publication-${publicationId}.log`);

  const lines = [];
  const startedAt = new Date().toISOString();
  lines.push(`[${startedAt}] START publication_id=${publicationId}`);

  const payload = loadPublicationPayload(rootDir, publicationId);
  let minisiteOutputPath = null;
  let minisiteRoute = null;

  if (payload !== null) {
    const programmeSlug = normalizeSlug(payload.programme?.slug, publicationId);
    const minisiteDir = resolve(targetDir, 'minisites', programmeSlug);
    minisiteOutputPath = resolve(minisiteDir, 'index.html');

    await mkdir(minisiteDir, { recursive: true });
    const programmeHtml = renderProgrammeHtml(payload, programmeSlug);
    await writeFile(minisiteOutputPath, programmeHtml, 'utf8');

    await mkdir(targetDir, { recursive: true });
    const rootIndexHtml = renderRootIndexHtml(payload, programmeSlug);
    await writeFile(targetRootIndex, rootIndexHtml, 'utf8');

    lines.push(`[${new Date().toISOString()}] PAYLOAD source=admin-php publication_id=${publicationId}`);
    lines.push(`[${new Date().toISOString()}] OUTPUT ${minisiteOutputPath}`);
    lines.push(`[${new Date().toISOString()}] ROUTE /minisites/${programmeSlug}`);
    minisiteRoute = `/minisites/${programmeSlug}`;
  } else {
    const previewDir = resolve(rootDir, 'dist', 'preview');
    const previewIndex = resolve(previewDir, 'index.html');
    try {
      const previewFile = await buildPreview(rootDir);
      lines.push(`[${new Date().toISOString()}] PREVIEW ${previewFile}`);
    } catch (error) {
      lines.push(`[${new Date().toISOString()}] ERROR build-preview failed`);
      lines.push(String(error instanceof Error ? error.message : error));
      await mkdir(logsDir, { recursive: true });
      await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');
      return {
        ok: false,
        publicationId,
        outputPath: null,
        logPath: logFile,
        stdout: '',
        stderr: lines.join('\n'),
      };
    }

    const fallbackSlug = `publication-${publicationId}`;
    await mkdir(targetDir, { recursive: true });
    if (!existsSync(previewIndex)) {
      const fallbackHtml = `<!doctype html><html><body><h1>Publication ${publicationId}</h1></body></html>`;
      await writeFile(previewIndex, fallbackHtml, 'utf8');
    }

    const fallbackRootIndex = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abdou - Publications</title>
  </head>
  <body>
    <h1>Abdou</h1>
    <p>Publication statique générée.</p>
    <p><a href="/minisites/${fallbackSlug}">Publication ${publicationId}</a></p>
  </body>
</html>`;
    await writeFile(targetRootIndex, fallbackRootIndex, 'utf8');

    const fallbackMinisiteDir = resolve(targetDir, 'minisites', fallbackSlug);
    minisiteOutputPath = resolve(fallbackMinisiteDir, 'index.html');
    await mkdir(fallbackMinisiteDir, { recursive: true });
    const fallbackContent = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abdou | Publication ${publicationId}</title>
  </head>
  <body>
    <h1>Abdou</h1>
    <h2>Publication ${publicationId}</h2>
    <p>Route publique programme: /minisites/${fallbackSlug}</p>
  </body>
</html>`;
    await writeFile(minisiteOutputPath, fallbackContent, 'utf8');

    lines.push(`[${new Date().toISOString()}] WARN payload_unavailable_fallback_preview`);
    lines.push(`[${new Date().toISOString()}] OUTPUT ${minisiteOutputPath}`);
    lines.push(`[${new Date().toISOString()}] ROUTE /minisites/${fallbackSlug}`);
    minisiteRoute = `/minisites/${fallbackSlug}`;
  }

  if (minisiteOutputPath === null) {
    await mkdir(logsDir, { recursive: true });
    await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');
    return {
      ok: false,
      publicationId,
      outputPath: null,
      logPath: logFile,
      stdout: '',
      stderr: lines.join('\n'),
    };
  }

  const content = await readFile(minisiteOutputPath, 'utf8');
  if (!content.includes('Abdou')) {
    lines.push(`[${new Date().toISOString()}] WARN output_missing_abdou_marker`);
  }

  lines.push(`[${new Date().toISOString()}] DONE`);
  await mkdir(logsDir, { recursive: true });
  await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');

  return {
    ok: true,
    publicationId,
    outputPath: minisiteOutputPath,
    logPath: logFile,
    stdout: `[build-publication] publication_id=${publicationId}
[build-publication] output=${minisiteOutputPath}
[build-publication] route=${minisiteRoute ?? ''}
[build-publication] log=${logFile}`,
    stderr: '',
  };
}

function resolvePhpBin() {
  if (process.env.XAMPP_PHP_BIN) {
    return process.env.XAMPP_PHP_BIN;
  }
  if (process.env.PHP_BIN) {
    return process.env.PHP_BIN;
  }
  if (process.platform === 'win32') {
    const candidates = ['C:\\xampp\\php\\php.exe', 'C:\\Program Files\\xampp\\php\\php.exe'];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return 'php';
}

function loadPublicationPayload(rootDir, publicationId) {
  const scriptPath = resolve(rootDir, 'apps', 'admin-php', 'scripts', 'export-publication-public-payload.php');
  if (!existsSync(scriptPath)) {
    return null;
  }

  const result = spawnSync(resolvePhpBin(), [scriptPath, `--publicationId=${publicationId}`], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: false,
  });

  if (Number(result.status ?? 1) !== 0) {
    return null;
  }

  const stdout = String(result.stdout ?? '').trim();
  if (!stdout) {
    return null;
  }

  try {
    const parsed = JSON.parse(stdout);
    if (!parsed || parsed.ok !== true) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function normalizeSlug(rawSlug, publicationId) {
  const normalized = String(rawSlug ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || `publication-${publicationId}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function trimText(value) {
  const text = String(value ?? '').trim();
  return text;
}

function renderRubriqueBody(rubrique) {
  const contentHtml = trimText(rubrique?.content_html);
  if (contentHtml !== '') {
    return contentHtml;
  }
  const contentText = trimText(rubrique?.content_text);
  if (contentText !== '') {
    return `<p>${escapeHtml(contentText)}</p>`;
  }
  return '<p>Contenu non renseigné.</p>';
}

function cleanPublicUrl(value) {
  const url = trimText(value);
  return url;
}

function renderRootIndexHtml(payload, programmeSlug) {
  const programmeName = trimText(payload?.programme?.name) || 'Minisite';
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abdou - Publications</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
      a { color: #0d4ed8; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>Abdou</h1>
    <p>Publication statique générée.</p>
    <p><a href="/minisites/${escapeHtml(programmeSlug)}">${escapeHtml(programmeName)}</a></p>
  </body>
</html>`;
}

function renderProgrammeHtml(payload, programmeSlug) {
  const programmeName = trimText(payload?.programme?.name) || `Programme ${programmeSlug}`;
  const headline = trimText(payload?.hero?.subtitle || payload?.programme?.headline || payload?.programme?.short_description);
  const description = trimText(payload?.programme?.full_description || payload?.programme?.short_description);
  const city = trimText(payload?.programme?.city);
  const seoTitle = trimText(payload?.programme?.seo_title) || `${programmeName} | Abdou`;

  const rubriques = Array.isArray(payload?.rubriques) ? payload.rubriques : [];
  const sortedRubriques = [...rubriques].sort(
    (a, b) => Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0)
  );
  const lots = Array.isArray(payload?.lots) ? payload.lots : [];
  const batiments = Array.isArray(payload?.batiments) ? payload.batiments : [];
  const images = Array.isArray(payload?.medias?.images) ? payload.medias.images : [];
  const videos = Array.isArray(payload?.medias?.videos) ? payload.medias.videos : [];
  const documents = Array.isArray(payload?.medias?.documents) ? payload.medias.documents : [];
  const sections = payload?.sections ?? {};

  const hasEnvironnement = Boolean(sections?.environnement?.enabled);
  const hasLots = Boolean(sections?.maquette_lots?.enabled) && lots.length > 0;
  const hasImages = Boolean(sections?.images?.enabled) && images.length > 0;
  const hasVideo = Boolean(sections?.video?.enabled) && videos.length > 0;
  const hasDocumentation = Boolean(sections?.documentation?.enabled) && documents.length > 0;

  const heroMediaUrl = cleanPublicUrl(payload?.hero?.media?.public_url);
  const heroMediaAlt =
    trimText(payload?.hero?.media?.alt_text) || trimText(payload?.hero?.media?.title) || programmeName;

  const menuItems = sortedRubriques
    .filter((item) => Number(item?.is_menu_visible ?? 1) === 1)
    .map((item) => {
      const title = trimText(item?.title) || trimText(item?.code) || 'Rubrique';
      const slug = normalizeSlug(item?.slug, 0);
      return `<li><a href="#rubrique-${escapeHtml(slug)}">${escapeHtml(title)}</a></li>`;
    })
    .join('');

  const rubriquesHtml = sortedRubriques
    .map((item) => {
      const title = trimText(item?.title) || trimText(item?.code) || 'Rubrique';
      const slug = normalizeSlug(item?.slug, 0);
      return `<section id="rubrique-${escapeHtml(slug)}"><h2>${escapeHtml(title)}</h2>${renderRubriqueBody(item)}</section>`;
    })
    .join('\n');

  const environnementSection = hasEnvironnement
    ? `<section id="environnement">
  <h2>Environnement</h2>
  ${sections?.environnement?.rubrique ? renderRubriqueBody(sections.environnement.rubrique) : ''}
  ${city ? `<p><strong>Ville:</strong> ${escapeHtml(city)}</p>` : ''}
</section>`
    : '';

  const lotBuildingFilters = batiments
    .map(
      (bat) =>
        `<button type="button" class="batiment-filter" data-batiment="${escapeHtml(String(bat?.id ?? ''))}">${escapeHtml(
          trimText(bat?.name) || trimText(bat?.code) || `Bâtiment ${bat?.id}`
        )}</button>`
    )
    .join('');

  const lotRows = lots
    .map((lot) => {
      const batimentId = Number(lot?.batiment_id ?? 0) || 0;
      const building = trimText(lot?.batiment_name) || trimText(lot?.batiment_code) || '-';
      return `<tr>
  <td data-batiment="${escapeHtml(String(batimentId))}">${escapeHtml(trimText(lot?.reference) || '-')}</td>
  <td>${escapeHtml(building)}</td>
  <td>${escapeHtml(trimText(lot?.typology) || '-')}</td>
  <td>${escapeHtml(trimText(lot?.surface_m2) || '-')}</td>
  <td>${escapeHtml(trimText(lot?.price_label) || '-')}</td>
</tr>`;
    })
    .join('\n');

  const lotSection = hasLots
    ? `<section id="lots">
  <h2>Maquette & lots</h2>
  ${sections?.maquette_lots?.rubrique ? renderRubriqueBody(sections.maquette_lots.rubrique) : ''}
  ${
    batiments.length > 0
      ? `<div id="batiments-nav"><button type="button" class="batiment-filter is-active" data-batiment="">Tous</button>${lotBuildingFilters}</div>`
      : ''
  }
  <input id="lot-search" type="search" placeholder="Recherche lot (référence, typologie, bâtiment)" />
  <table id="lots-table">
    <thead><tr><th>Référence</th><th>Bâtiment</th><th>Typologie</th><th>Surface m²</th><th>Prix</th></tr></thead>
    <tbody>${lotRows}</tbody>
  </table>
</section>`
    : '';

  const imagesSection = hasImages
    ? `<section id="images">
  <h2>Images</h2>
  ${sections?.images?.rubrique ? renderRubriqueBody(sections.images.rubrique) : ''}
  <div class="media-grid">
    ${images
      .map((media) => {
        const url = cleanPublicUrl(media?.public_url);
        if (!url) return '';
        const alt = trimText(media?.alt_text) || trimText(media?.title) || programmeName;
        const caption = trimText(media?.caption);
        return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" />${
          caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
        }</figure>`;
      })
      .join('')}
  </div>
</section>`
    : '';

  const videoSection = hasVideo
    ? `<section id="video">
  <h2>Vidéo</h2>
  ${sections?.video?.rubrique ? renderRubriqueBody(sections.video.rubrique) : ''}
  <ul class="media-list">
    ${videos
      .map((media) => {
        const url = cleanPublicUrl(media?.public_url);
        if (!url) return '';
        const title = trimText(media?.title) || 'Vidéo';
        if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
          return `<li><p>${escapeHtml(title)}</p><video controls preload="metadata" src="${escapeHtml(url)}"></video></li>`;
        }
        return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></li>`;
      })
      .join('')}
  </ul>
</section>`
    : '';

  const documentationSection = hasDocumentation
    ? `<section id="documentation">
  <h2>Documentation</h2>
  ${sections?.documentation?.rubrique ? renderRubriqueBody(sections.documentation.rubrique) : ''}
  <ul class="media-list">
    ${documents
      .map((media) => {
        const url = cleanPublicUrl(media?.public_url);
        if (!url) return '';
        const title = trimText(media?.title) || trimText(media?.original_filename) || 'Document';
        return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></li>`;
      })
      .join('')}
  </ul>
</section>`
    : '';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(seoTitle)}</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #111; line-height: 1.5; background: #fff; }
      .hero { background: #0f172a; color: #fff; padding: 24px 20px; }
      .hero img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 14px; }
      nav { background: #e2e8f0; padding: 10px 20px; }
      nav ul { margin: 0; padding-left: 18px; display: flex; flex-wrap: wrap; gap: 14px; }
      main { padding: 20px; max-width: 1024px; }
      section { margin-bottom: 28px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
      footer { padding: 16px 20px; background: #f1f5f9; color: #334155; }
      #lot-search { max-width: 320px; width: 100%; padding: 8px; margin-bottom: 12px; }
      #batiments-nav { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 12px; }
      .batiment-filter { border: 1px solid #94a3b8; background: #fff; padding: 6px 10px; cursor: pointer; }
      .batiment-filter.is-active { background: #0f172a; color: #fff; border-color: #0f172a; }
      .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
      .media-grid figure { margin: 0; }
      .media-grid img { width: 100%; height: 170px; object-fit: cover; border-radius: 6px; background: #f1f5f9; }
      .media-list { padding-left: 18px; }
      video { width: 100%; max-width: 640px; border-radius: 6px; background: #000; }
    </style>
  </head>
  <body>
    <header id="hero" class="hero">
      <h1>${escapeHtml(programmeName)}</h1>
      ${headline ? `<p>${escapeHtml(headline)}</p>` : ''}
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      ${heroMediaUrl ? `<img src="${escapeHtml(heroMediaUrl)}" alt="${escapeHtml(heroMediaAlt)}" />` : ''}
    </header>
    ${menuItems ? `<nav><ul>${menuItems}</ul></nav>` : ''}
    <main>
      ${rubriquesHtml}
      ${environnementSection}
      ${lotSection}
      ${imagesSection}
      ${videoSection}
      ${documentationSection}
    </main>
    <footer>
      <p>Abdou - minisite public V1</p>
      <p>Programme: <strong>${escapeHtml(programmeName)}</strong></p>
      <p>Slug: <code>${escapeHtml(programmeSlug)}</code></p>
    </footer>
    <script>
      (function () {
        const input = document.getElementById('lot-search');
        const table = document.getElementById('lots-table');
        const nav = document.getElementById('batiments-nav');
        if (!input || !table) return;
        let selectedBatiment = '';
        function applyFilters() {
          const query = String(input.value || '').trim().toLowerCase();
          const rows = table.querySelectorAll('tbody tr');
          rows.forEach((row) => {
            const refCell = row.children[0];
            const ref = String(refCell?.textContent || '').toLowerCase();
            const batiment = String(row.children[1]?.textContent || '').toLowerCase();
            const typology = String(row.children[2]?.textContent || '').toLowerCase();
            const batimentId = String(refCell?.getAttribute('data-batiment') || '');
            const queryOk =
              query === '' || ref.includes(query) || batiment.includes(query) || typology.includes(query);
            const batimentOk = selectedBatiment === '' || batimentId === selectedBatiment;
            row.style.display = queryOk && batimentOk ? '' : 'none';
          });
        }
        input.addEventListener('input', applyFilters);
        if (nav) {
          nav.addEventListener('click', function (event) {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.classList.contains('batiment-filter')) return;
            selectedBatiment = String(target.getAttribute('data-batiment') || '');
            nav.querySelectorAll('.batiment-filter').forEach((button) => button.classList.remove('is-active'));
            target.classList.add('is-active');
            applyFilters();
          });
        }
        applyFilters();
      })();
    </script>
  </body>
</html>`;
}

const executedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (executedAsScript) {
  const publicationId = parsePublicationId(process.argv.slice(2));
  if (publicationId === null) {
    console.error('[build-publication] Missing or invalid --publicationId=<int>.');
    process.exit(1);
  }

  const result = await buildPublication(publicationId);
  if (!result.ok) {
    process.stderr.write(`${result.stderr}\n`);
    process.exit(1);
  }
  console.log(result.stdout);
}
