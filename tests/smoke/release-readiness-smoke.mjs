#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const scripts = [
  'test:smoke:admin-php:http',
  'test:smoke:admin-php:content-media',
  'test:smoke:admin-php:batiments',
  'test:smoke:admin-php:rbac',
  'test:smoke:admin-php:validation',
  'test:smoke:admin-php:workflow-detail-contract',
  'test:smoke:admin-api:compat-off',
  'test:smoke:admin-api:db-down-matrix',
  'test:smoke:public-v1-flow',
  'test:smoke:backoffice:contract-parsing',
  'test:smoke:backoffice:api-base',
  'test:smoke:backoffice:api-paths',
  'test:smoke:backoffice:workspace-partial'
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
    console.log(`[smoke] release_readiness_run=${script}`);
    const status = runScript(script);
    if (status !== 0) {
      console.error(`[smoke] release_readiness_failed=${script}`);
      process.exit(status);
    }
  }
  console.log('[smoke] release_readiness_ok');
}

main();
