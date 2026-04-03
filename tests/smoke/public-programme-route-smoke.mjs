#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildPublication } from '../../deploy/scripts/build-publication.mjs';

function parsePublicationId(argv) {
  const flag = argv.find((arg) => arg.startsWith('--publicationId='));
  if (!flag) {
    return null;
  }
  const value = Number(flag.split('=')[1] ?? '');
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

function resolvePhpBin() {
  if (process.env.XAMPP_PHP_BIN) return process.env.XAMPP_PHP_BIN;
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\xampp\\php\\php.exe';
  }
  return 'php';
}

function createPilotPublication() {
  const php = resolvePhpBin();
  const script = resolve(process.cwd(), 'apps', 'admin-php', 'scripts', 'create-publication.php');
  const result = spawnSync(php, [script, '--programmeId=1', '--createdBy=1'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });
  if (Number(result.status ?? 1) !== 0) {
    throw new Error(`public_programme_route_create_publication_failed:${String(result.stderr || '').trim()}`);
  }
  const id = Number(String(result.stdout || '').trim());
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('public_programme_route_invalid_created_publication_id');
  }
  return id;
}

async function main() {
  const publicationId = parsePublicationId(process.argv.slice(2)) ?? createPilotPublication();
  const build = await buildPublication(publicationId, resolve(process.cwd()));
  if (!build.ok || !build.outputPath) {
    throw new Error('public_programme_route_build_failed');
  }

  const normalized = build.outputPath.replaceAll('\\', '/');
  if (!normalized.includes('/minisites/')) {
    throw new Error('public_programme_route_missing_minisites_path');
  }

  if (!existsSync(build.outputPath)) {
    throw new Error('public_programme_route_missing_output');
  }

  const html = await readFile(build.outputPath, 'utf8');
  if (html.includes("Point d'entree client")) {
    throw new Error('public_programme_route_fallback_to_generic_home_detected');
  }
  if (!html.includes('Abdou')) {
    throw new Error('public_programme_route_missing_abdou_marker');
  }
  if (!html.includes('id="hero"')) {
    throw new Error('public_programme_route_missing_hero');
  }
  if (!html.includes('<nav>')) {
    throw new Error('public_programme_route_missing_rubriques_nav');
  }
  if (!html.includes('<footer>')) {
    throw new Error('public_programme_route_missing_footer');
  }
  if (!html.includes('id="lots"')) {
    throw new Error('public_programme_route_missing_lots_section');
  }
  if (!html.includes('id="lot-search"')) {
    throw new Error('public_programme_route_missing_lot_search');
  }

  const buildRoot = normalized.slice(0, normalized.indexOf('/minisites/'));
  const rootIndexPath = resolve(buildRoot, 'index.html');
  if (!existsSync(rootIndexPath)) {
    throw new Error('public_programme_route_missing_root_index');
  }

  const rootIndex = await readFile(rootIndexPath, 'utf8');
  if (!rootIndex.includes('/minisites/')) {
    throw new Error('public_programme_route_missing_route_link');
  }

  console.log('[smoke] public programme route ok');
  console.log(`[smoke] publication_id=${publicationId}`);
  console.log(`[smoke] output=${build.outputPath}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
