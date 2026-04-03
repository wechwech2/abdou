#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const root = process.cwd();
  const smokeRoot = resolve(root, 'tmp', 'smoke', 'deploy-rollback');
  const sourceDir = resolve(smokeRoot, 'source');
  const targetDir = resolve(smokeRoot, 'target');
  const targetOldIndex = '<!doctype html><title>old</title><h1>old-target</h1>\n';
  const sourceNewIndex = '<!doctype html><title>new</title><h1>new-source</h1>\n';

  await rm(smokeRoot, { recursive: true, force: true });
  await mkdir(sourceDir, { recursive: true });
  await mkdir(targetDir, { recursive: true });

  await writeFile(resolve(targetDir, 'index.html'), targetOldIndex, 'utf8');
  await writeFile(resolve(targetDir, 'old.txt'), 'old-target-file\n', 'utf8');
  await writeFile(resolve(sourceDir, 'index.html'), sourceNewIndex, 'utf8');
  await writeFile(resolve(sourceDir, 'new.txt'), 'new-source-file\n', 'utf8');

  const deployModuleUrl = pathToFileURL(resolve(root, 'deploy', 'ovh', 'ftp', 'deploy-site.mjs')).href;
  const { deploySite } = await import(deployModuleUrl);
  const deployResult = await deploySite({
    rootDir: root,
    source: sourceDir,
    target: targetDir,
    mode: 'local'
  });

  if (!deployResult.ok || !deployResult.manifest_path) {
    throw new Error('deploy_rollback_smoke_deploy_failed');
  }

  const deployedIndex = await readFile(resolve(targetDir, 'index.html'), 'utf8');
  if (deployedIndex !== sourceNewIndex) {
    throw new Error('deploy_rollback_smoke_target_not_updated_after_deploy');
  }

  const rollbackCmd = process.execPath;
  const rollbackArgs = ['deploy/ovh/ftp/rollback-site.mjs', `--manifest=${deployResult.manifest_path}`];
  const rollback = spawnSync(rollbackCmd, rollbackArgs, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: false
  });

  if (rollback.status !== 0) {
    throw new Error(
      `deploy_rollback_smoke_rollback_failed:${rollback.status}:${String(rollback.stderr || '').trim()}`
    );
  }

  const restoredIndex = await readFile(resolve(targetDir, 'index.html'), 'utf8');
  if (restoredIndex !== targetOldIndex) {
    throw new Error('deploy_rollback_smoke_target_not_restored');
  }

  if (!(await exists(resolve(targetDir, 'old.txt')))) {
    throw new Error('deploy_rollback_smoke_old_file_missing_after_rollback');
  }

  if (await exists(resolve(targetDir, 'new.txt'))) {
    throw new Error('deploy_rollback_smoke_new_file_still_present_after_rollback');
  }

  console.log('[smoke] deploy rollback workflow ok');
  console.log(`[smoke] manifest_path=${deployResult.manifest_path}`);
  console.log(`[smoke] target_dir=${targetDir}`);
  console.log(`[smoke] backup_path=${deployResult.backup_path || '-'}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
