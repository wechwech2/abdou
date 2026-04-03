#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

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

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json };
}

function assertOkTrue(caseName, payload) {
  if (payload?.ok !== true) {
    throw new Error(`envelope_${caseName}_expected_ok_true`);
  }
}

function assertOkFalse(caseName, payload, expectedError) {
  if (payload?.ok !== false) {
    throw new Error(`envelope_${caseName}_expected_ok_false`);
  }
  if (payload?.error !== expectedError) {
    throw new Error(`envelope_${caseName}_expected_error_${expectedError}_got_${String(payload?.error || '-')}`);
  }
}

async function main() {
  const port = 3218;
  const baseUrl = `http://127.0.0.1:${port}`;

  const server = spawn(
    process.execPath,
    [resolve(process.cwd(), 'apps', 'admin-api', 'dist', 'apps', 'admin-api', 'src', 'main.js')],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_API_HOST: '127.0.0.1',
        ADMIN_API_PORT: String(port),
        ADMIN_API_COMPAT_ENABLED: 'false'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let serverStdErr = '';
  server.stderr.on('data', (chunk) => {
    serverStdErr += chunk.toString();
  });

  try {
    await waitForHealth(baseUrl);

    const health = await fetchJson(`${baseUrl}/health`);
    if (!health.ok) {
      throw new Error(`envelope_health_status_${health.status}`);
    }
    assertOkTrue('health', health.json);

    const modules = await fetchJson(`${baseUrl}/api/modules`);
    if (!modules.ok || !Array.isArray(modules.json?.modules)) {
      throw new Error(`envelope_modules_status_${modules.status}`);
    }
    assertOkTrue('modules', modules.json);

    const moduleUnknown = await fetchJson(`${baseUrl}/api/modules/unknown`);
    if (moduleUnknown.status !== 404) {
      throw new Error(`envelope_module_unknown_expected_404_got_${moduleUnknown.status}`);
    }
    assertOkFalse('module_unknown', moduleUnknown.json, 'module_not_found');

    const contracts = await fetchJson(`${baseUrl}/api/contracts`);
    if (!contracts.ok || !contracts.json?.contracts?.publicationStatus) {
      throw new Error(`envelope_contracts_status_${contracts.status}`);
    }
    assertOkTrue('contracts', contracts.json);

    const compatRoutes = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!compatRoutes.ok || !Array.isArray(compatRoutes.json?.routes) || compatRoutes.json.routes.length === 0) {
      throw new Error(`envelope_compat_routes_status_${compatRoutes.status}`);
    }
    assertOkTrue('compat_routes', compatRoutes.json);

    const compatGuards = await fetchJson(`${baseUrl}/api/compat/guards`);
    if (!compatGuards.ok || !Array.isArray(compatGuards.json?.guards) || compatGuards.json.guards.length === 0) {
      throw new Error(`envelope_compat_guards_status_${compatGuards.status}`);
    }
    assertOkTrue('compat_guards', compatGuards.json);

    const compatRoute = await fetchJson(`${baseUrl}/api/clients`);
    if (compatRoute.status !== 410) {
      throw new Error(`envelope_compat_expected_410_got_${compatRoute.status}`);
    }
    assertOkFalse('compat_disabled', compatRoute.json, 'compat_disabled');

    const notFound = await fetchJson(`${baseUrl}/does-not-exist`);
    if (notFound.status !== 404) {
      throw new Error(`envelope_not_found_expected_404_got_${notFound.status}`);
    }
    assertOkFalse('not_found', notFound.json, 'not_found');

    console.log('[smoke] admin-api envelope rules ok');
    console.log('[smoke] ok=true for technical success, ok=false for controlled errors');
  } finally {
    server.kill();
    await sleep(150);
    if (serverStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${serverStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
