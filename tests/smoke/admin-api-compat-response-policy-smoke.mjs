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

async function main() {
  const port = 3224;
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
      throw new Error(`compat_response_policy_routes_status_${response.status}`);
    }

    const routes = response.json.routes;
    if (routes.length === 0) {
      throw new Error('compat_response_policy_empty');
    }

    const dashboardRoute = routes.find(
      (route) =>
        String(route?.method || '').toUpperCase() === 'GET' &&
        String(route?.path || '') === '/api/dashboard/summary'
    );
    if (!dashboardRoute) {
      throw new Error('compat_response_policy_missing_dashboard_summary_route');
    }
    if (String(dashboardRoute.responsePolicy || '') !== 'proxy_passthrough') {
      throw new Error(
        `compat_response_policy_dashboard_summary_${String(dashboardRoute.responsePolicy || '-')}`
      );
    }

    const violations = routes
      .filter((route) => String(route?.responsePolicy || '') !== 'proxy_passthrough')
      .map((route) => `${routeKey(route)}=${String(route?.responsePolicy || '-')}`);

    if (violations.length > 0) {
      throw new Error(`compat_response_policy_mismatch:${violations.join(',')}`);
    }

    console.log('[smoke] admin-api compat response policy matrix ok');
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
