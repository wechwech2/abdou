#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function assertCondition(condition, code) {
  if (!condition) {
    throw new Error(code);
  }
}

async function main() {
  const appPath = resolve(process.cwd(), 'apps', 'backoffice-web', 'public', 'app.js');
  const source = await readFile(appPath, 'utf8');

  const apiCallPattern = /api\(\s*(['"`])([^'"`]+)\1/g;
  const paths = [];
  let match = null;
  while ((match = apiCallPattern.exec(source)) !== null) {
    paths.push(String(match[2] || ''));
  }

  assertCondition(paths.length > 0, 'no_api_calls_found');

  const invalidAbsolute = paths.filter((p) => /^https?:\/\//i.test(p));
  assertCondition(invalidAbsolute.length === 0, 'absolute_api_path_found');

  const invalidApiPrefixed = paths.filter((p) => p.startsWith('/api/'));
  assertCondition(invalidApiPrefixed.length === 0, 'double_api_prefix_path_found');

  const invalidNonRoot = paths.filter((p) => !p.startsWith('/'));
  assertCondition(invalidNonRoot.length === 0, 'non_root_relative_api_path_found');

  console.log('[smoke] backoffice api paths consistency ok');
  console.log(`[smoke] api_call_count=${paths.length}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
