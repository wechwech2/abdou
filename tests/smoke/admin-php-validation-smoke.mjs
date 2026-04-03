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

function assertValidation(caseName, response, expectedStatus, expectedError) {
  if (response.status !== expectedStatus) {
    throw new Error(`validation_${caseName}_expected_status_${expectedStatus}_got_${response.status}`);
  }
  if (response.json?.error !== expectedError) {
    throw new Error(`validation_${caseName}_expected_error_${expectedError}_got_${String(response.json?.error || '-')}`);
  }
}

async function main() {
  const port = 3215;
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

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (!login.ok) {
      throw new Error(`validation_login_failed:${login.status}`);
    }
    const cookie = mergeCookie('', login.headers.get('set-cookie'));

    const asAdmin = async (path, options = {}) =>
      fetchJson(`${baseUrl}${path}`, {
        ...options,
        headers: {
          accept: 'application/json',
          ...(options.headers || {}),
          cookie
        }
      });

    const invalidClientsStatus = await asAdmin('/clients?status=broken');
    assertValidation('clients_status_query', invalidClientsStatus, 400, 'invalid_status');

    const invalidClientCreateStatus = await asAdmin('/clients', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'TMPVAL', name: 'Tmp Validation', slug: 'tmp-validation', status: 'paused' })
    });
    assertValidation('client_create_status', invalidClientCreateStatus, 400, 'invalid_status');

    const invalidProgrammesClientQuery = await asAdmin('/programmes?client_id=abc');
    assertValidation('programmes_client_query', invalidProgrammesClientQuery, 400, 'invalid_client_id_query');

    const invalidPublicationsProgrammeQuery = await asAdmin('/publications?programme_id=abc');
    assertValidation('publications_programme_query', invalidPublicationsProgrammeQuery, 400, 'invalid_programme_id_query');

    const invalidPublicationStatus = await asAdmin('/publications/1/status', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'unknown' })
    });
    assertValidation('publication_status', invalidPublicationStatus, 400, 'invalid_status');

    console.log('[smoke] admin-php validation rules ok');
    console.log('[smoke] clients/programmes/publications invalid payload checks -> 400');
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
