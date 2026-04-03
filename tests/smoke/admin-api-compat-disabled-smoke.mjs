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
  return { status: response.status, ok: response.ok, json };
}

async function main() {
  const port = 3213;
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

    const contracts = await fetchJson(`${baseUrl}/api/contracts`);
    if (!contracts.ok || !contracts.json?.contracts?.publicationStatus) {
      throw new Error('compat_disabled_contracts_unavailable');
    }

    const compatRoutes = await fetchJson(`${baseUrl}/api/compat/routes`);
    if (!compatRoutes.ok || !Array.isArray(compatRoutes.json?.routes) || compatRoutes.json.routes.length === 0) {
      throw new Error('compat_disabled_compat_routes_unavailable');
    }

    const compatGuards = await fetchJson(`${baseUrl}/api/compat/guards`);
    if (!compatGuards.ok || !Array.isArray(compatGuards.json?.guards) || compatGuards.json.guards.length === 0) {
      throw new Error('compat_disabled_compat_guards_unavailable');
    }

    const compatWriteGuards = await fetchJson(`${baseUrl}/api/compat/write-guards`);
    if (
      !compatWriteGuards.ok ||
      !Array.isArray(compatWriteGuards.json?.guards) ||
      compatWriteGuards.json.guards.length === 0
    ) {
      throw new Error('compat_disabled_compat_write_guards_unavailable');
    }

    const modules = await fetchJson(`${baseUrl}/api/modules`);
    if (!modules.ok || !Array.isArray(modules.json?.modules) || modules.json.modules.length === 0) {
      throw new Error('compat_disabled_modules_unavailable');
    }

    const moduleAuth = await fetchJson(`${baseUrl}/api/modules/auth`);
    if (!moduleAuth.ok || moduleAuth.json?.module?.code !== 'auth') {
      throw new Error('compat_disabled_module_auth_unavailable');
    }

    const clients = await fetchJson(`${baseUrl}/api/clients`);
    if (clients.status !== 410 || clients.json?.error !== 'compat_disabled') {
      throw new Error(`compat_disabled_clients_expected_410_got_${clients.status}`);
    }

    const publications = await fetchJson(`${baseUrl}/api/publications`);
    if (publications.status !== 410 || publications.json?.error !== 'compat_disabled') {
      throw new Error(`compat_disabled_publications_expected_410_got_${publications.status}`);
    }

    const dashboardSummary = await fetchJson(`${baseUrl}/api/dashboard/summary`);
    if (dashboardSummary.status !== 410 || dashboardSummary.json?.error !== 'compat_disabled') {
      throw new Error(`compat_disabled_dashboard_summary_expected_410_got_${dashboardSummary.status}`);
    }

    const authLogin = await fetchJson(`${baseUrl}/api/auth/login`, { method: 'POST' });
    if (authLogin.status !== 410 || authLogin.json?.error !== 'compat_disabled') {
      throw new Error(`compat_disabled_auth_login_expected_410_got_${authLogin.status}`);
    }

    console.log('[smoke] admin-api compat-disabled mode ok');
    console.log('[smoke] technical routes remain available; proxy compatibility routes return 410 compat_disabled');
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
