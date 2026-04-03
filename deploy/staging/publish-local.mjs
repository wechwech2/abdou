#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['deploy/staging/build-preview.mjs'], {
  stdio: 'inherit'
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('[publish-local] Preview assets ready in dist/preview');
console.log('[publish-local] URL: http://abdou.wechwech.tn/');
