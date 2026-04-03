#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

function normalizeRoute(route) {
  return {
    method: String(route?.method || '').toUpperCase(),
    path: String(route?.path || ''),
    upstreamPath: String(route?.upstreamPath || ''),
    mode: String(route?.mode || ''),
    accessPolicy: String(route?.accessPolicy || ''),
    responsePolicy: String(route?.responsePolicy || '')
  };
}

function routeKey(route) {
  return `${route.method} ${route.path}`;
}

function stableSortRoutes(routes) {
  return [...routes].sort((a, b) => routeKey(a).localeCompare(routeKey(b)));
}

function computeDiff(expected, actual) {
  const expectedMap = new Map(expected.map((item) => [routeKey(item), item]));
  const actualMap = new Map(actual.map((item) => [routeKey(item), item]));

  const missing = [];
  const extra = [];
  const changed = [];

  for (const [key, expectedItem] of expectedMap.entries()) {
    if (!actualMap.has(key)) {
      missing.push(key);
      continue;
    }
    const actualItem = actualMap.get(key);
    if (JSON.stringify(expectedItem) !== JSON.stringify(actualItem)) {
      changed.push(key);
    }
  }
  for (const key of actualMap.keys()) {
    if (!expectedMap.has(key)) {
      extra.push(key);
    }
  }

  return { missing, extra, changed };
}

async function main() {
  const port = 3222;
  const baseUrl = `http://127.0.0.1:${port}`;
  const snapshotPath = resolve(
    process.cwd(),
    'tests',
    'smoke',
    'snapshots',
    'admin-api-compat-routes.snapshot.json'
  );
  const shouldUpdate = String(process.env.UPDATE_COMPAT_SNAPSHOT || '').trim() === '1';

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
    const response = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!response.ok || !Array.isArray(response.json?.routes)) {
      throw new Error(`compat_snapshot_routes_status_${response.status}`);
    }

    const actual = stableSortRoutes(response.json.routes.map(normalizeRoute));

    if (shouldUpdate) {
      await mkdir(resolve(process.cwd(), 'tests', 'smoke', 'snapshots'), { recursive: true });
      await writeFile(snapshotPath, `${JSON.stringify(actual, null, 2)}\n`, 'utf8');
      console.log(`[smoke] snapshot updated: ${snapshotPath}`);
      console.log(`[smoke] compat_routes=${actual.length}`);
      return;
    }

    let expectedRaw;
    try {
      expectedRaw = await readFile(snapshotPath, 'utf8');
    } catch {
      throw new Error('compat_snapshot_missing_file');
    }

    let expected;
    try {
      const parsed = JSON.parse(expectedRaw);
      if (!Array.isArray(parsed)) {
        throw new Error('invalid_snapshot_array');
      }
      expected = stableSortRoutes(parsed.map(normalizeRoute));
    } catch {
      throw new Error('compat_snapshot_invalid_json');
    }

    const diff = computeDiff(expected, actual);
    if (diff.missing.length > 0 || diff.extra.length > 0 || diff.changed.length > 0) {
      throw new Error(
        `compat_snapshot_drift:missing=${diff.missing.length},extra=${diff.extra.length},changed=${diff.changed.length}`
      );
    }

    console.log('[smoke] admin-api compat routes snapshot stable');
    console.log(`[smoke] compat_routes=${actual.length}`);
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
