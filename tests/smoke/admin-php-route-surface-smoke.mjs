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

async function main() {
  const port = 3222;
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

    const health = await fetchJson(`${baseUrl}/health`);
    if (health.response.status !== 200 || health.json?.ok !== true) {
      throw new Error('route_surface_health_failed');
    }

    const unauthorizedRoutes = [
      '/contracts',
      '/dashboard/summary',
      '/offres',
      '/templates',
      '/clients',
      '/programmes',
      '/rubriques',
      '/medias',
      '/lots',
      '/publications',
      '/roles',
      '/users'
    ];

    for (const path of unauthorizedRoutes) {
      const result = await fetchJson(`${baseUrl}${path}`);
      if (result.response.status !== 401) {
        throw new Error(`route_surface_expected_401:${path}:${result.response.status}`);
      }
      if (result.json?.error !== 'unauthorized') {
        throw new Error(`route_surface_expected_unauthorized_error:${path}`);
      }
    }

    const notFound = await fetchJson(`${baseUrl}/__missing__route__`);
    if (notFound.response.status !== 404) {
      throw new Error(`route_surface_expected_404:${notFound.response.status}`);
    }
    if (notFound.json?.error !== 'not_found') {
      throw new Error('route_surface_expected_not_found_error');
    }

    console.log('[smoke] admin-php route surface ok');
    console.log(`[smoke] protected_routes_checked=${unauthorizedRoutes.length}`);
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
