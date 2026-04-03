#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const PUBLIC_URL = process.env.CLIENT_PREVIEW_URL || 'https://abdou.wechwech.tn';

const steps = [
  {
    name: 'go-live-rehearsal',
    command:
      process.platform === 'win32'
        ? 'pnpm run test:smoke:go-live-rehearsal'
        : 'pnpm run test:smoke:go-live-rehearsal'
  },
  {
    name: 'preview-publish',
    command: process.platform === 'win32' ? 'pnpm run preview:publish' : 'pnpm run preview:publish'
  },
  {
    name: 'verify-preview-files',
    command:
      `node deploy/ovh/ftp/verify-site.mjs ` +
      `--target=dist/preview ` +
      `--expect=Abdou ` +
      `--expect=abdou.wechwech.tn`
  },
  {
    name: 'verify-public-url',
    command:
      `node deploy/ovh/ftp/verify-site.mjs ` +
      `--url=${PUBLIC_URL} ` +
      `--expect=Abdou ` +
      `--timeout-ms=15000`
  }
];

function run(command) {
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', command], {
      stdio: 'inherit',
      shell: false
    });
  }
  return spawnSync('sh', ['-lc', command], { stdio: 'inherit', shell: false });
}

function main() {
  for (const step of steps) {
    console.log(`[smoke] client_phase_local_step=${step.name}`);
    const result = run(step.command);
    const status = Number(result.status ?? 1);
    if (status !== 0) {
      console.error(`[smoke] client_phase_local_failed=${step.name}`);
      process.exit(status);
    }
  }

  console.log('[smoke] client_phase_local_ready');
  console.log(`[smoke] client_preview_url=${PUBLIC_URL}`);
}

main();
