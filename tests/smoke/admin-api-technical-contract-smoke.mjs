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

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}_invalid_object`);
  }
}

function assertHasKeys(value, label, keys) {
  assertObject(value, label);
  for (const key of keys) {
    if (!(key in value)) {
      throw new Error(`${label}_missing_${key}`);
    }
  }
}

async function main() {
  const port = 3217;
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
        ADMIN_API_COMPAT_ENABLED: 'true'
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
    if (!health.ok || health.json?.status !== 'ok') {
      throw new Error(`technical_health_failed:${health.status}`);
    }
    assertHasKeys(health.json, 'health', ['service', 'version', 'status', 'environment', 'timestamp']);

    const modules = await fetchJson(`${baseUrl}/api/modules`);
    if (!modules.ok || !Array.isArray(modules.json?.modules) || modules.json.modules.length === 0) {
      throw new Error(`technical_modules_failed:${modules.status}`);
    }
    if (!Array.isArray(modules.json?.routes) || modules.json.routes.length === 0) {
      throw new Error('technical_modules_missing_routes');
    }

    const moduleCode = String(modules.json.modules[0]?.code || '');
    if (!moduleCode) {
      throw new Error('technical_modules_invalid_first_code');
    }
    const moduleDetail = await fetchJson(`${baseUrl}/api/modules/${moduleCode}`);
    if (!moduleDetail.ok) {
      throw new Error(`technical_module_detail_failed:${moduleDetail.status}`);
    }
    assertHasKeys(moduleDetail.json?.module, 'module_detail', ['code', 'basePath', 'description']);
    if (moduleDetail.json.module.code !== moduleCode) {
      throw new Error('technical_module_detail_code_mismatch');
    }

    const contracts = await fetchJson(`${baseUrl}/api/contracts`);
    if (!contracts.ok) {
      throw new Error(`technical_contracts_failed:${contracts.status}`);
    }
    assertHasKeys(contracts.json?.contracts, 'contracts', [
      'clientStatus',
      'roleCode',
      'programmeStatus',
      'programmePublicationStatus',
      'publicationStatus',
      'mediaType',
      'mediaStatus',
      'publicationDeploymentTargetType',
      'publicationDeploymentStatus'
    ]);

    const compatRoutes = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!compatRoutes.ok || !Array.isArray(compatRoutes.json?.routes) || compatRoutes.json.routes.length === 0) {
      throw new Error(`technical_compat_routes_failed:${compatRoutes.status}`);
    }
    assertHasKeys(compatRoutes.json.routes[0], 'compat_route', [
      'method',
      'path',
      'upstreamPath',
      'mode',
      'accessPolicy',
      'responsePolicy'
    ]);

    const compatGuards = await fetchJson(`${baseUrl}/api/compat/guards`);
    if (!compatGuards.ok || !Array.isArray(compatGuards.json?.guards) || compatGuards.json.guards.length === 0) {
      throw new Error(`technical_compat_guards_failed:${compatGuards.status}`);
    }
    assertHasKeys(compatGuards.json.guards[0], 'compat_guard', ['path']);

    const compatWriteGuards = await fetchJson(`${baseUrl}/api/compat/write-guards`);
    if (
      !compatWriteGuards.ok ||
      !Array.isArray(compatWriteGuards.json?.guards) ||
      compatWriteGuards.json.guards.length === 0
    ) {
      throw new Error(`technical_compat_write_guards_failed:${compatWriteGuards.status}`);
    }
    assertHasKeys(compatWriteGuards.json.guards[0], 'compat_write_guard', ['path']);

    console.log('[smoke] admin-api technical endpoints contract ok');
    console.log(`[smoke] modules_count=${modules.json.modules.length}`);
    console.log(`[smoke] compat_routes_count=${compatRoutes.json.routes.length}`);
    console.log(`[smoke] compat_guards_count=${compatGuards.json.guards.length}`);
    console.log(`[smoke] compat_write_guards_count=${compatWriteGuards.json.guards.length}`);
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
