#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const commands = [
  'test:smoke:admin-api:dashboard-summary-db-down',
  'test:smoke:admin-api:workflow-detail-db-down',
  'test:smoke:admin-api:publication-build-db-down',
  'test:smoke:admin-api:publication-deploy-db-down'
];

function runPnpmScript(script) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm';
  const args =
    process.platform === 'win32' ? ['/d', '/s', '/c', `pnpm run ${script}`] : ['run', script];

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false
  });

  return Number(result.status ?? 1);
}

function main() {
  for (const script of commands) {
    console.log(`[smoke] run=${script}`);
    const status = runPnpmScript(script);
    if (status !== 0) {
      console.error(`[smoke] failed=${script}`);
      process.exit(status);
    }
  }

  console.log('[smoke] admin-api db-down diagnostics ok');
  console.log('[smoke] mode=diagnostic_detailed');
}

main();
