#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolvePhpBin } from './php-bin.mjs';

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForHealth(baseUrl, timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastError = '';
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
      lastError = `status=${response.status}`;
    } catch (error) {
      lastError = String(error instanceof Error ? error.message : error);
    }
    await sleep(200);
  }
  throw new Error(`health_timeout:${lastError}`);
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', ...(init.headers || {}) },
    ...init
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { response, json };
}

function assertCondition(condition, code) {
  if (!condition) {
    throw new Error(code);
  }
}

function assertNotFoundPayload(payload, expectedPath, codePrefix) {
  assertCondition(payload?.ok === false, `${codePrefix}_ok_false`);
  assertCondition(String(payload?.error || '') === 'not_found', `${codePrefix}_error_not_found`);
  assertCondition(String(payload?.path || '') === expectedPath, `${codePrefix}_path_mismatch`);
}

async function main() {
  const port = 3228;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let phpStdErr = '';
  phpServer.stderr.on('data', (chunk) => {
    phpStdErr += chunk.toString();
  });
  let hasFailure = true;

  try {
    await waitForHealth(baseUrl);

    const rootUnknown = await fetchJson(`${baseUrl}/__no_such_route__`);
    assertCondition(rootUnknown.response.status === 404, 'not_found_root_status');
    assertNotFoundPayload(rootUnknown.json, '/__no_such_route__', 'not_found_root');

    const apiUnknown = await fetchJson(`${baseUrl}/api/__no_such_route__`);
    assertCondition(apiUnknown.response.status === 404, 'not_found_api_status');
    assertNotFoundPayload(apiUnknown.json, '/__no_such_route__', 'not_found_api');

    const rootWrongMethod = await fetchJson(`${baseUrl}/health`, { method: 'POST' });
    assertCondition(rootWrongMethod.response.status === 404, 'not_found_root_wrong_method_status');
    assertNotFoundPayload(rootWrongMethod.json, '/health', 'not_found_root_wrong_method');

    const apiWrongMethod = await fetchJson(`${baseUrl}/api/health`, { method: 'POST' });
    assertCondition(apiWrongMethod.response.status === 404, 'not_found_api_wrong_method_status');
    assertNotFoundPayload(apiWrongMethod.json, '/health', 'not_found_api_wrong_method');

    console.log('[smoke] admin-php not-found contract ok');
    console.log('[smoke] checked=root/api unknown route + wrong method fallback');
    hasFailure = false;
  } finally {
    phpServer.kill();
    await sleep(150);
    if (hasFailure && phpStdErr.trim()) {
      console.log(`[smoke] admin-php stderr:\n${phpStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
