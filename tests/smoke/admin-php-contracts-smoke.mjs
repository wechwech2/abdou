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

function mergeCookie(currentCookie, setCookieHeader) {
  const candidate = String(setCookieHeader || '').split(';')[0]?.trim();
  if (!candidate || !candidate.includes('=')) {
    return currentCookie;
  }
  if (!currentCookie) {
    return candidate;
  }
  const [name] = candidate.split('=');
  const parts = currentCookie
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !x.startsWith(`${name}=`));
  return [candidate, ...parts].join('; ');
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json };
}

function assertNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`contracts_${field}_invalid`);
  }
}

async function main() {
  const port = 3219;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
      },
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

    const unauthContracts = await fetchJson(`${baseUrl}/contracts`, {
      headers: { accept: 'application/json' }
    });
    if (unauthContracts.status !== 401 || unauthContracts.json?.error !== 'unauthorized') {
      throw new Error(`contracts_unauth_expected_401_got_${unauthContracts.status}`);
    }

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (!login.ok) {
      throw new Error(`contracts_login_failed:${login.status}`);
    }
    const cookie = mergeCookie('', login.headers.get('set-cookie'));

    const contracts = await fetchJson(`${baseUrl}/contracts`, {
      headers: {
        accept: 'application/json',
        cookie
      }
    });
    if (!contracts.ok || contracts.json?.ok !== true) {
      throw new Error(`contracts_auth_failed:${contracts.status}`);
    }

    const items = contracts.json?.items || {};
    assertNonEmptyArray(items.client_status, 'client_status');
    assertNonEmptyArray(items.role_code, 'role_code');
    assertNonEmptyArray(items.programme_status, 'programme_status');
    assertNonEmptyArray(items.publication_status, 'publication_status');
    assertNonEmptyArray(items.media_type, 'media_type');

    console.log('[smoke] admin-php contracts endpoint ok');
    console.log('[smoke] /contracts requires auth and returns non-empty contract arrays');
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
