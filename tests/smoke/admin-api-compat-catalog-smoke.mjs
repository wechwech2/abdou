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

function keyOf(route) {
  return `${String(route.method || '').toUpperCase()} ${String(route.path || '')}`;
}

function toKeySet(routes) {
  return new Set((routes || []).map((route) => keyOf(route)));
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

    const modulesResponse = await fetchJson(`${baseUrl}/api/modules`);
    if (!modulesResponse.ok) {
      throw new Error(`compat_catalog_modules_status_${modulesResponse.status}`);
    }
    if (modulesResponse.json?.ok !== true || !Array.isArray(modulesResponse.json?.routes)) {
      throw new Error('compat_catalog_modules_payload_invalid');
    }

    const compatCatalogResponse = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!compatCatalogResponse.ok) {
      throw new Error(`compat_catalog_routes_status_${compatCatalogResponse.status}`);
    }
    if (compatCatalogResponse.json?.ok !== true || !Array.isArray(compatCatalogResponse.json?.routes)) {
      throw new Error('compat_catalog_routes_payload_invalid');
    }

    const compatRoutes = compatCatalogResponse.json.routes;
    if (compatRoutes.length === 0) {
      throw new Error('compat_catalog_empty');
    }

    const technicalRoutes = new Set([
      'GET /api/modules',
      'GET /api/modules/:code',
      'GET /api/contracts',
      'GET /api/compat/routes',
      'GET /api/compat/guards',
      'GET /api/compat/write-guards'
    ]);
    const appCompatRoutes = modulesResponse.json.routes.filter((route) => {
      const key = keyOf(route);
      return String(route.path || '').startsWith('/api/') && !technicalRoutes.has(key);
    });

    const appKeySet = toKeySet(appCompatRoutes);
    const compatKeySet = toKeySet(compatRoutes);

    const duplicates = [];
    const seen = new Set();
    for (const route of compatRoutes) {
      const key = keyOf(route);
      if (seen.has(key)) {
        duplicates.push(key);
      }
      seen.add(key);
    }
    if (duplicates.length > 0) {
      throw new Error(`compat_catalog_duplicates:${duplicates.join(',')}`);
    }

    const missingInCompat = [...appKeySet].filter((key) => !compatKeySet.has(key));
    if (missingInCompat.length > 0) {
      throw new Error(`compat_catalog_missing_in_compat:${missingInCompat.join(',')}`);
    }

    const extraInCompat = [...compatKeySet].filter((key) => !appKeySet.has(key));
    if (extraInCompat.length > 0) {
      throw new Error(`compat_catalog_extra_in_compat:${extraInCompat.join(',')}`);
    }

    const invalidPolicies = compatRoutes.filter((route) => route.responsePolicy !== 'proxy_passthrough');
    if (invalidPolicies.length > 0) {
      throw new Error(`compat_catalog_invalid_response_policy:${invalidPolicies.map(keyOf).join(',')}`);
    }

    const invalidAuth = compatRoutes.filter((route) => {
      const key = keyOf(route);
      if (key === 'POST /api/auth/login') {
        return route.accessPolicy !== 'public';
      }
      if (key === 'GET /api/auth/me' || key === 'POST /api/auth/logout') {
        return route.accessPolicy !== 'session';
      }
      if (route.mode === 'write') {
        return route.accessPolicy !== 'admin';
      }
      return route.accessPolicy !== 'session';
    });
    if (invalidAuth.length > 0) {
      throw new Error(`compat_catalog_invalid_access_policy:${invalidAuth.map(keyOf).join(',')}`);
    }

    console.log('[smoke] admin-api compat catalog coherence ok');
    console.log(`[smoke] compat_routes=${compatRoutes.length}`);
    console.log(`[smoke] app_compat_routes=${appCompatRoutes.length}`);
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
