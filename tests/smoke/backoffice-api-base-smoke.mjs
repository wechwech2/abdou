#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function assertContains(source, pattern, code) {
  if (!pattern.test(source)) {
    throw new Error(code);
  }
}

function assertNotContains(source, pattern, code) {
  if (pattern.test(source)) {
    throw new Error(code);
  }
}

async function main() {
  const appPath = resolve(process.cwd(), 'apps', 'backoffice-web', 'public', 'app.js');
  const source = await readFile(appPath, 'utf8');

  assertContains(
    source,
    /const API_BASE_CANDIDATES = \(\(\) => \{[\s\S]*?const explicitBase = sanitizeExplicitApiBase\(explicitBaseRaw\);[\s\S]*?if \(explicitBase\) \{[\s\S]*?return \[explicitBase\];[\s\S]*?\}[\s\S]*?return \['\/api'\];[\s\S]*?\}\)\(\);/,
    'missing_default_api_base_api_only'
  );

  assertNotContains(
    source,
    /return \['\/api', ''\];/,
    'legacy_root_fallback_still_present'
  );

  assertNotContains(
    source,
    /return \[normalizeApiBase\(explicitBase\)\];/,
    'legacy_explicit_base_without_post_normalize_guard'
  );

  assertContains(source, /function sanitizeExplicitApiBase\(value\)\s*\{/, 'missing_sanitize_helper');
  assertContains(source, /const normalized = normalizeApiBase\(value\);/, 'missing_normalize_call_in_sanitize');
  assertContains(source, /if \(!normalized\) return '';/, 'missing_empty_guard_in_sanitize');
  assertContains(source, /if \(!normalized\.startsWith\('\/'\)\) return '';/, 'missing_root_prefix_guard_in_sanitize');
  assertContains(source, /if \(\/\^https\?:\\\/\\\/\/i\.test\(normalized\)\) return '';/, 'missing_absolute_url_guard_in_sanitize');
  assertContains(
    source,
    /if \(!\(normalized === '\/api' \|\| normalized\.startsWith\('\/api\/'\)\)\) return '';/,
    'missing_api_prefix_guard_in_sanitize'
  );
  assertContains(source, /return normalized;/, 'missing_return_normalized_in_sanitize');
  assertContains(
    source,
    /console\.warn\('\[backoffice\] ABDOU_API_BASE ignored: expected a root-relative base path \(example: \/api\)'\);/,
    'missing_invalid_explicit_base_warning'
  );

  assertNotContains(
    source,
    /API_BASE_CANDIDATES\.length\s*\?\s*API_BASE_CANDIDATES\s*:\s*\[''\]/,
    'legacy_runtime_root_fallback_in_api_helper'
  );

  console.log('[smoke] backoffice api base default ok');
  console.log('[smoke] default_api_base_candidates=/api');
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
