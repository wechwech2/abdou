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

function assertErrorEnvelope(payload, expectedError, codePrefix) {
  assertCondition(payload?.ok === false, `${codePrefix}_ok_false`);
  assertCondition(String(payload?.error || '') === expectedError, `${codePrefix}_error_${expectedError}`);
}

async function main() {
  const port = 3230;
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

    const missingRoot = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    assertCondition(missingRoot.response.status === 400, 'auth_errors_missing_root_status');
    assertErrorEnvelope(missingRoot.json, 'missing_credentials', 'auth_errors_missing_root');

    const missingApi = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    assertCondition(missingApi.response.status === 400, 'auth_errors_missing_api_status');
    assertErrorEnvelope(missingApi.json, 'missing_credentials', 'auth_errors_missing_api');

    const invalidRoot = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: 'wrong-password' })
    });
    assertCondition(invalidRoot.response.status === 401, 'auth_errors_invalid_root_status');
    assertErrorEnvelope(invalidRoot.json, 'invalid_credentials', 'auth_errors_invalid_root');

    const invalidApi = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: 'wrong-password' })
    });
    assertCondition(invalidApi.response.status === 401, 'auth_errors_invalid_api_status');
    assertErrorEnvelope(invalidApi.json, 'invalid_credentials', 'auth_errors_invalid_api');

    const validRoot = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(validRoot.response.status === 200, 'auth_errors_valid_root_status');
    assertCondition(validRoot.json?.ok === true, 'auth_errors_valid_root_ok');

    const validApi = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(validApi.response.status === 200, 'auth_errors_valid_api_status');
    assertCondition(validApi.json?.ok === true, 'auth_errors_valid_api_ok');

    console.log('[smoke] admin-php auth error contract ok');
    console.log('[smoke] login errors checked: missing_credentials + invalid_credentials (root/api)');
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
