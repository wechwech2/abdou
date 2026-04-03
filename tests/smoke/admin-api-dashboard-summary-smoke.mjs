#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
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

function assertCondition(condition, code) {
  if (!condition) {
    throw new Error(code);
  }
}

async function main() {
  const phpPort = 3233;
  const port = 3234;
  const phpBaseUrl = `http://127.0.0.1:${phpPort}`;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${phpPort}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
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

  const server = spawn(
    process.execPath,
    [resolve(process.cwd(), 'apps', 'admin-api', 'dist', 'apps', 'admin-api', 'src', 'main.js')],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_API_HOST: '127.0.0.1',
        ADMIN_API_PORT: String(port),
        ADMIN_PHP_BASE_URL: phpBaseUrl,
        ADMIN_API_COMPAT_ENABLED: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let serverStdErr = '';
  server.stderr.on('data', (chunk) => {
    serverStdErr += chunk.toString();
  });
  let hasFailure = true;

  try {
    await waitForHealth(phpBaseUrl);
    await waitForHealth(baseUrl);

    const unauth = await fetchJson(`${baseUrl}/api/dashboard/summary`);
    assertCondition(unauth.response.status === 401, 'admin_api_dashboard_summary_unauthorized_status');
    assertCondition(String(unauth.json?.error || '') === 'unauthorized', 'admin_api_dashboard_summary_unauthorized_error');

    const login = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(login.response.status === 200, 'admin_api_dashboard_summary_login_status');

    const cookie = mergeCookie('', login.response.headers.get('set-cookie'));
    assertCondition(cookie !== '', 'admin_api_dashboard_summary_login_cookie');

    const summary = await fetchJson(`${baseUrl}/api/dashboard/summary`, {
      headers: { cookie }
    });
    assertCondition(summary.response.status === 200, 'admin_api_dashboard_summary_status');
    assertCondition(summary.json?.ok === true, 'admin_api_dashboard_summary_ok');
    assertCondition(Number.isFinite(Number(summary.json?.summary?.clients?.total)), 'admin_api_dashboard_summary_clients_total');
    assertCondition(
      Number.isFinite(Number(summary.json?.summary?.publications?.total)),
      'admin_api_dashboard_summary_publications_total'
    );

    console.log('[smoke] admin-api dashboard summary proxy ok');
    console.log(`[smoke] publications_total=${summary.json?.summary?.publications?.total ?? -1}`);
    hasFailure = false;
  } finally {
    server.kill();
    phpServer.kill();
    await sleep(150);
    if (hasFailure && serverStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${serverStdErr.trim()}`);
    }
    if (hasFailure && phpStdErr.trim()) {
      console.log(`[smoke] admin-php stderr:\n${phpStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
