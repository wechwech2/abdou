#!/usr/bin/env node

import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

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

async function countFiles(root) {
  let total = 0;
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(root, entry.name);
    if (entry.isDirectory()) {
      total += await countFiles(full);
    } else if (entry.isFile()) {
      total += 1;
    }
  }
  return total;
}

async function cleanDir(path) {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

export async function deploySite(input) {
  const rootDir = input.rootDir ? resolve(input.rootDir) : resolve(process.cwd());
  const source = resolve(input.source);
  const target = resolve(input.target);
  const mode = input.mode ?? 'local';

  if (!(await exists(source))) {
    throw new Error(`source_not_found:${source}`);
  }

  const sourceIndex = resolve(source, 'index.html');
  if (!(await exists(sourceIndex))) {
    throw new Error(`source_missing_index:${sourceIndex}`);
  }

  const now = new Date();
  const deploymentId = now.toISOString().replace(/[.:]/g, '-');
  const distRoot = resolve(rootDir, 'dist');
  const logDir = resolve(distRoot, 'logs', 'deployments');
  const backupDir = resolve(distRoot, 'rollbacks', deploymentId, 'target-before');
  const manifestPath = resolve(logDir, `deploy-site-${deploymentId}.json`);

  await mkdir(logDir, { recursive: true });

  const targetExisted = await exists(target);
  if (targetExisted) {
    await mkdir(dirname(backupDir), { recursive: true });
    await cp(target, backupDir, { recursive: true, force: true });
  }

  const sourceFiles = await countFiles(source);

  if (mode === 'local') {
    await cleanDir(target);
    await cp(source, target, { recursive: true, force: true });
  } else if (mode !== 'dry-run') {
    throw new Error(`unsupported_mode:${mode}`);
  }

  const payload = {
    deployment_id: deploymentId,
    created_at: now.toISOString(),
    mode,
    source,
    target,
    source_files: sourceFiles,
    backup_path: targetExisted ? backupDir : null,
    status: 'ok',
  };

  await writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    ok: true,
    ...payload,
    manifest_path: manifestPath,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source ? resolve(args.source) : null;
  const target = args.target ? resolve(args.target) : null;
  const mode = args.mode ?? 'local';

  if (!source || !target) {
    console.error('[deploy-site] Usage: --source=<dir> --target=<dir> [--mode=local|dry-run]');
    process.exit(1);
  }

  try {
    const result = await deploySite({ source, target, mode });
    console.log(`[deploy-site] status=${result.status} mode=${result.mode}`);
    console.log(`[deploy-site] source=${result.source}`);
    console.log(`[deploy-site] target=${result.target}`);
    console.log(`[deploy-site] files=${result.source_files}`);
    console.log(`[deploy-site] manifest=${result.manifest_path}`);
    if (result.backup_path) {
      console.log(`[deploy-site] backup=${result.backup_path}`);
    }
  } catch (error) {
    console.error(`[deploy-site] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

const executedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (executedAsScript) {
  main();
}
