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

function spawnPhp(port, extraEnv = {}) {
  const phpBin = resolvePhpBin();
  const server = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let stdErr = '';
  server.stderr.on('data', (chunk) => {
    stdErr += chunk.toString();
  });

  return { server, getStdErr: () => stdErr };
}

async function main() {
  const phpPort = 3237;
  const apiPort = 3238;
  const phpBaseUrl = `http://127.0.0.1:${phpPort}`;
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;

  const phpUp = spawnPhp(phpPort);
  const apiServer = spawn(
    process.execPath,
    [resolve(process.cwd(), 'apps', 'admin-api', 'dist', 'apps', 'admin-api', 'src', 'main.js')],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_API_HOST: '127.0.0.1',
        ADMIN_API_PORT: String(apiPort),
        ADMIN_PHP_BASE_URL: phpBaseUrl,
        ADMIN_API_COMPAT_ENABLED: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let apiStdErr = '';
  apiServer.stderr.on('data', (chunk) => {
    apiStdErr += chunk.toString();
  });

  let hasFailure = true;

  try {
    await waitForHealth(phpBaseUrl);
    await waitForHealth(apiBaseUrl);

    const login = await fetchJson(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(login.response.status === 200, 'admin_api_dashboard_summary_db_down_login_status');

    let cookie = mergeCookie('', login.response.headers.get('set-cookie'));
    assertCondition(cookie !== '', 'admin_api_dashboard_summary_db_down_login_cookie');

    phpUp.server.kill();
    await sleep(150);

    const phpDown = spawnPhp(phpPort, {
      MYSQL_HOST: '127.0.0.1',
      MYSQL_PORT: '1'
    });

    try {
      await waitForHealth(phpBaseUrl);

      const summary = await fetchJson(`${apiBaseUrl}/api/dashboard/summary`, {
        headers: { cookie }
      });
      cookie = mergeCookie(cookie, summary.response.headers.get('set-cookie'));

      assertCondition(summary.response.status === 500, 'admin_api_dashboard_summary_db_down_status');
      assertCondition(summary.json?.ok === false, 'admin_api_dashboard_summary_db_down_ok_false');
      assertCondition(
        String(summary.json?.error || '') === 'dashboard_summary_failed',
        'admin_api_dashboard_summary_db_down_error'
      );
      assertCondition(String(summary.json?.message || '') !== '', 'admin_api_dashboard_summary_db_down_message');

      console.log('[smoke] admin-api dashboard summary db-down contract ok');
      console.log('[smoke] endpoint=/api/dashboard/summary with invalid mysql port');
      hasFailure = false;
    } finally {
      phpDown.server.kill();
      await sleep(150);
      if (hasFailure && phpDown.getStdErr().trim()) {
        console.log(`[smoke] admin-php(stderr-down):\n${phpDown.getStdErr().trim()}`);
      }
    }
  } finally {
    apiServer.kill();
    phpUp.server.kill();
    await sleep(150);

    if (hasFailure && apiStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${apiStdErr.trim()}`);
    }
    if (hasFailure && phpUp.getStdErr().trim()) {
      console.log(`[smoke] admin-php(stderr-up):\n${phpUp.getStdErr().trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
