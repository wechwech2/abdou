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

function toSet(values) {
  return new Set(values.map((value) => String(value)));
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

    const routesResponse = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!routesResponse.ok || routesResponse.json?.ok !== true || !Array.isArray(routesResponse.json?.routes)) {
      throw new Error(`guard_coverage_routes_unavailable:${routesResponse.status}`);
    }
    const guardsResponse = await fetchJson(`${baseUrl}/api/compat/guards`);
    if (!guardsResponse.ok || guardsResponse.json?.ok !== true || !Array.isArray(guardsResponse.json?.guards)) {
      throw new Error(`guard_coverage_guards_unavailable:${guardsResponse.status}`);
    }
    const writeGuardsResponse = await fetchJson(`${baseUrl}/api/compat/write-guards`);
    if (
      !writeGuardsResponse.ok ||
      writeGuardsResponse.json?.ok !== true ||
      !Array.isArray(writeGuardsResponse.json?.guards)
    ) {
      throw new Error(`guard_coverage_write_guards_unavailable:${writeGuardsResponse.status}`);
    }

    const readUpstreamPaths = routesResponse.json.routes
      .filter((route) => route?.mode === 'read')
      .map((route) => route?.upstreamPath)
      .filter((value) => typeof value === 'string');

    const guardPaths = guardsResponse.json.guards
      .map((guard) => guard?.path)
      .filter((value) => typeof value === 'string');

    const readSet = toSet(readUpstreamPaths);
    const guardSet = toSet(guardPaths);

    const missingGuards = [...readSet].filter((path) => !guardSet.has(path));
    if (missingGuards.length > 0) {
      throw new Error(`guard_coverage_missing:${missingGuards.join(',')}`);
    }

    const orphanGuards = [...guardSet].filter((path) => !readSet.has(path));
    if (orphanGuards.length > 0) {
      throw new Error(`guard_coverage_orphan:${orphanGuards.join(',')}`);
    }

    const writeUpstreamPaths = routesResponse.json.routes
      .filter((route) => route?.mode === 'write')
      .map((route) => route?.upstreamPath)
      .filter((value) => typeof value === 'string');

    const writeGuardPaths = writeGuardsResponse.json.guards
      .map((guard) => guard?.path)
      .filter((value) => typeof value === 'string');

    const writeSet = toSet(writeUpstreamPaths);
    const writeGuardSet = toSet(writeGuardPaths);

    const missingWriteGuards = [...writeSet].filter((path) => !writeGuardSet.has(path));
    if (missingWriteGuards.length > 0) {
      throw new Error(`guard_coverage_write_missing:${missingWriteGuards.join(',')}`);
    }

    const orphanWriteGuards = [...writeGuardSet].filter((path) => !writeSet.has(path));
    if (orphanWriteGuards.length > 0) {
      throw new Error(`guard_coverage_write_orphan:${orphanWriteGuards.join(',')}`);
    }

    console.log('[smoke] admin-api read guard coverage ok');
    console.log(`[smoke] read_routes=${readSet.size}`);
    console.log(`[smoke] guard_paths=${guardSet.size}`);
    console.log(`[smoke] write_routes=${writeSet.size}`);
    console.log(`[smoke] write_guard_paths=${writeGuardSet.size}`);
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
