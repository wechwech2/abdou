#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildPublication } from '../../deploy/scripts/build-publication.mjs';
import { deployPublication } from '../../deploy/scripts/deploy-publication.mjs';

function parsePublicationId(argv) {
  const flag = argv.find((arg) => arg.startsWith('--publicationId='));
  if (!flag) {
    return 999;
  }
  const raw = Number(flag.split('=')[1] ?? '');
  if (!Number.isInteger(raw) || raw <= 0) {
    return 999;
  }
  return raw;
}

async function main() {
  const publicationId = parsePublicationId(process.argv.slice(2));
  const rootDir = resolve(process.cwd());

  const build = await buildPublication(publicationId, rootDir);
  if (!build.ok || !build.outputPath || !build.logPath) {
    throw new Error('smoke_build_failed');
  }
  if (!existsSync(build.outputPath)) {
    throw new Error(`smoke_missing_build_output:${build.outputPath}`);
  }
  if (!existsSync(build.logPath)) {
    throw new Error(`smoke_missing_build_log:${build.logPath}`);
  }

  const buildLog = await readFile(build.logPath, 'utf8');
  if (!buildLog.includes('DONE')) {
    throw new Error('smoke_build_log_incomplete');
  }

  const deploy = await deployPublication(publicationId, rootDir);
  if (!deploy.ok || !deploy.logPath) {
    throw new Error('smoke_deploy_failed');
  }
  if (!existsSync(deploy.logPath)) {
    throw new Error(`smoke_missing_deploy_log:${deploy.logPath}`);
  }

  const deployLog = await readFile(deploy.logPath, 'utf8');
  if (!deployLog.includes('DONE')) {
    throw new Error('smoke_deploy_log_incomplete');
  }

  console.log('[smoke] publication workflow ok');
  console.log(`[smoke] publication_id=${publicationId}`);
  console.log(`[smoke] build_output=${build.outputPath}`);
  console.log(`[smoke] build_log=${build.logPath}`);
  console.log(`[smoke] deploy_log=${deploy.logPath}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
