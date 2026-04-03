#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

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

function runOrExit(command, args, errorCode) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (Number(result.status ?? 1) !== 0) {
    process.exit(errorCode);
  }
  return result;
}

function createPilotPublicationId() {
  const script = resolve(process.cwd(), 'apps', 'admin-php', 'scripts', 'create-publication.php');
  const result = spawnSync(resolvePhpBin(), [script, '--programmeId=1', '--createdBy=1'], {
    stdio: 'pipe',
    shell: false,
    encoding: 'utf8',
  });
  if (Number(result.status ?? 1) !== 0) {
    process.stderr.write(String(result.stderr ?? ''));
    process.exit(2);
  }
  const id = Number(String(result.stdout ?? '').trim());
  if (!Number.isInteger(id) || id <= 0) {
    process.stderr.write('[publish-local] invalid_publication_id_from_php\n');
    process.exit(2);
  }
  return id;
}

const publicationId = Number(process.env.PUBLICATION_ID || '') > 0
  ? Number(process.env.PUBLICATION_ID)
  : createPilotPublicationId();

runOrExit(process.execPath, ['deploy/scripts/build-publication.mjs', `--publicationId=${publicationId}`], 1);
runOrExit(
  process.execPath,
  ['deploy/scripts/deploy-publication.mjs', `--publicationId=${publicationId}`, '--targetDir=dist/preview', '--mode=local'],
  1
);

console.log('[publish-local] Preview assets ready in dist/preview from publication workflow');
console.log(`[publish-local] publication_id=${publicationId}`);
console.log('[publish-local] URL: https://abdou.wechwech.tn/minisites/residence-horizon');
