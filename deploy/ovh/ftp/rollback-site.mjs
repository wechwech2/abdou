#!/usr/bin/env node

import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) {
      continue;
    }
    const [k, ...rest] = raw.slice(2).split('=');
    args[k] = rest.length > 0 ? rest.join('=') : 'true';
  }
  return args;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest ? resolve(args.manifest) : null;

  if (!manifestPath) {
    console.error('[rollback-site] Usage: --manifest=<deploy-site-*.json>');
    process.exit(1);
  }

  if (!(await exists(manifestPath))) {
    console.error(`[rollback-site] Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const raw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  const target = manifest.target ? resolve(manifest.target) : null;
  const backupPath = manifest.backup_path ? resolve(manifest.backup_path) : null;

  if (!target || !backupPath) {
    console.error('[rollback-site] Manifest missing target or backup_path.');
    process.exit(1);
  }

  if (!(await exists(backupPath))) {
    console.error(`[rollback-site] Backup path not found: ${backupPath}`);
    process.exit(1);
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(backupPath, target, { recursive: true, force: true });

  const now = new Date();
  const logDir = resolve(process.cwd(), 'dist', 'logs', 'deployments');
  const logPath = resolve(logDir, `rollback-site-${now.toISOString().replace(/[.:]/g, '-')}.json`);
  await mkdir(logDir, { recursive: true });

  const payload = {
    created_at: now.toISOString(),
    status: 'ok',
    restored_from_manifest: manifestPath,
    target,
    backup_path: backupPath,
  };

  await writeFile(logPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log('[rollback-site] status=ok');
  console.log(`[rollback-site] target=${target}`);
  console.log(`[rollback-site] backup=${backupPath}`);
  console.log(`[rollback-site] log=${logPath}`);
}

main().catch((error) => {
  console.error(`[rollback-site] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});