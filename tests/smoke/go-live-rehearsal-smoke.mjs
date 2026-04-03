#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const scripts = [
  'test:smoke:release-readiness',
  'test:smoke:deploy-verify',
  'test:smoke:deploy-rollback'
];

function runScript(script) {
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
  for (const script of scripts) {
    console.log(`[smoke] go_live_rehearsal_run=${script}`);
    const status = runScript(script);
    if (status !== 0) {
      console.error(`[smoke] go_live_rehearsal_failed=${script}`);
      process.exit(status);
    }
  }

  console.log('[smoke] go_live_rehearsal_ok');
}

main();
