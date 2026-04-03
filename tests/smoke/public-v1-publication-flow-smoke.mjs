#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function resolvePhpBin() {
  if (process.env.XAMPP_PHP_BIN) return process.env.XAMPP_PHP_BIN;
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (process.platform === 'win32') {
    const candidates = ['C:\\xampp\\php\\php.exe', 'C:\\Program Files\\xampp\\php\\php.exe'];
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
  }
  return 'php';
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    shell: false,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (Number(result.status ?? 1) !== 0) {
    throw new Error(`${label}_failed:${String(result.stderr || result.stdout || '').trim()}`);
  }
  return String(result.stdout || '').trim();
}

function runWithStatus(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    shell: false,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function sleep(ms) {
  const clamped = Number.isFinite(ms) && ms > 0 ? Math.trunc(ms) : 0;
  if (clamped <= 0) return;
  const shared = new SharedArrayBuffer(4);
  const view = new Int32Array(shared);
  Atomics.wait(view, 0, 0, clamped);
}

function createPublication() {
  const script = resolve(process.cwd(), 'apps', 'admin-php', 'scripts', 'create-publication.php');
  const phpBin = resolvePhpBin();
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = runWithStatus(phpBin, [script, '--programmeId=1', '--createdBy=1']);
    if (Number(result.status ?? 1) === 0) {
      const publicationId = Number(String(result.stdout || '').trim());
      if (!Number.isInteger(publicationId) || publicationId <= 0) {
        throw new Error('invalid_publication_id');
      }
      return publicationId;
    }
    const stderr = String(result.stderr || '').trim();
    const isDuplicateBuildCode = stderr.includes('uq_publications_build_code');
    if (!isDuplicateBuildCode || attempt === maxAttempts) {
      throw new Error(`create_publication_failed:${stderr}`);
    }
    sleep(1100);
  }
  throw new Error('create_publication_failed');
}

function loadPayload(publicationId) {
  const script = resolve(process.cwd(), 'apps', 'admin-php', 'scripts', 'export-publication-public-payload.php');
  const stdout = run(resolvePhpBin(), [script, `--publicationId=${publicationId}`], 'load_public_payload');
  const payload = JSON.parse(stdout);
  if (!payload || payload.ok !== true) {
    throw new Error('invalid_public_payload');
  }
  return payload;
}

function runNodeScript(scriptPath, args, label) {
  return run(process.execPath, [scriptPath, ...args], label);
}

async function main() {
  const publicationId = createPublication();
  const initialPayload = loadPayload(publicationId);
  const programmeName = String(initialPayload?.programme?.name ?? '').trim();
  const programmeSlug = String(initialPayload?.programme?.slug ?? '').trim();
  if (!programmeName || !programmeSlug) {
    throw new Error('missing_programme_identity');
  }

  const buildOut = runNodeScript(
    'deploy/scripts/build-publication.mjs',
    [`--publicationId=${publicationId}`],
    'build_publication'
  );
  if (!buildOut.includes('[build-publication] output=')) {
    throw new Error('missing_build_output_marker');
  }
  if (!buildOut.includes(`[build-publication] route=/minisites/${programmeSlug}`)) {
    throw new Error('missing_build_route_marker');
  }

  const deployOut = runNodeScript(
    'deploy/scripts/deploy-publication.mjs',
    [`--publicationId=${publicationId}`, '--targetDir=dist/preview', '--mode=local', `--verifyExpect=${programmeName}`],
    'deploy_publication'
  );
  if (!deployOut.includes('[deploy-publication] target=')) {
    throw new Error('missing_deploy_target_marker');
  }

  const publishedUrl = String(initialPayload?.publication?.published_url ?? '').trim();
  if (publishedUrl !== `https://abdou.wechwech.tn/minisites/${programmeSlug}`) {
    throw new Error('published_url_not_v1_programme_route');
  }

  const previewHtmlPath = resolve(process.cwd(), 'dist', 'preview', 'minisites', programmeSlug, 'index.html');
  if (!existsSync(previewHtmlPath)) {
    throw new Error('preview_programme_html_missing');
  }
  const html = await readFile(previewHtmlPath, 'utf8');

  if (html.includes("Point d'entree client")) {
    throw new Error('generic_home_detected_in_programme_page');
  }
  if (!html.includes(`>${programmeName}<`) && !html.includes(programmeName)) {
    throw new Error('programme_name_not_rendered');
  }

  const sections = initialPayload?.sections ?? {};
  const expectedSectionIds = [
    { key: 'environnement', id: 'environnement' },
    { key: 'maquette_lots', id: 'lots' },
    { key: 'images', id: 'images' },
    { key: 'video', id: 'video' },
    { key: 'documentation', id: 'documentation' },
  ];

  for (const item of expectedSectionIds) {
    const shouldExist = Boolean(sections?.[item.key]?.enabled);
    const exists = html.includes(`id="${item.id}"`);
    if (shouldExist && !exists) {
      throw new Error(`missing_expected_section_${item.id}`);
    }
    if (!shouldExist && exists) {
      throw new Error(`unexpected_section_${item.id}`);
    }
  }

  if (Boolean(sections?.maquette_lots?.enabled) && Array.isArray(initialPayload?.lots) && initialPayload.lots.length > 0) {
    if (!html.includes('id="lot-search"')) {
      throw new Error('missing_lot_search_input');
    }
    const firstLotRef = String(initialPayload.lots[0]?.reference ?? '').trim();
    if (firstLotRef !== '' && !html.includes(firstLotRef)) {
      throw new Error('missing_first_lot_reference');
    }
    if (Array.isArray(initialPayload?.batiments) && initialPayload.batiments.length > 0) {
      if (!html.includes('id="batiments-nav"')) {
        throw new Error('missing_batiments_navigation');
      }
    }
  }

  const verifyOut = runNodeScript(
    'deploy/ovh/ftp/verify-site.mjs',
    ['--url=https://abdou.wechwech.tn/minisites/residence-horizon', `--expect=${programmeName}`, '--timeout-ms=15000'],
    'verify_public_url'
  );
  if (!verifyOut.includes('[verify-site] status=ok')) {
    throw new Error('public_url_not_accessible');
  }

  console.log('[smoke] public V1 publication flow ok');
  console.log(`[smoke] publication_id=${publicationId}`);
  console.log(`[smoke] published_url=${publishedUrl}`);
  console.log(`[smoke] preview_html=${previewHtmlPath}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
