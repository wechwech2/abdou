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

function routeKey(route) {
  return `${String(route?.method || '').toUpperCase()} ${String(route?.path || '')}`;
}

function expectedPolicy(route) {
  const key = routeKey(route);
  if (key === 'POST /api/auth/login') {
    return 'public';
  }
  if (key === 'GET /api/auth/me' || key === 'POST /api/auth/logout') {
    return 'session';
  }
  if (String(route?.mode || '') === 'write') {
    return 'admin';
  }
  return 'session';
}

async function main() {
  const port = 3223;
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

    const response = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!response.ok || !Array.isArray(response.json?.routes)) {
      throw new Error(`compat_auth_matrix_routes_status_${response.status}`);
    }

    const routes = response.json.routes;
    if (routes.length === 0) {
      throw new Error('compat_auth_matrix_empty');
    }

    const dashboardRoute = routes.find(
      (route) =>
        String(route?.method || '').toUpperCase() === 'GET' &&
        String(route?.path || '') === '/api/dashboard/summary'
    );
    if (!dashboardRoute) {
      throw new Error('compat_auth_matrix_missing_dashboard_summary_route');
    }
    if (String(dashboardRoute.mode || '') !== 'read') {
      throw new Error(`compat_auth_matrix_dashboard_summary_mode_${String(dashboardRoute.mode || '-')}`);
    }

    const violations = [];
    for (const route of routes) {
      const expected = expectedPolicy(route);
      const actual = String(route?.accessPolicy || '');
      if (actual !== expected) {
        violations.push(`${routeKey(route)} expected=${expected} actual=${actual}`);
      }
    }

    if (violations.length > 0) {
      throw new Error(`compat_auth_matrix_mismatch:${violations.join(',')}`);
    }

    console.log('[smoke] admin-api compat auth matrix ok');
    console.log(`[smoke] compat_routes=${routes.length}`);
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
