#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolvePhpBin } from './php-bin.mjs';

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForHttp(baseUrl, timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastError = '';
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.status === 200) {
        return;
      }
      lastError = `status=${response.status}`;
    } catch (error) {
      lastError = String(error instanceof Error ? error.message : error);
    }
    await sleep(200);
  }
  throw new Error(`http_health_timeout:${lastError}`);
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
  const upPort = 3235;
  const downPort = 3236;
  const upBaseUrl = `http://127.0.0.1:${upPort}`;
  const downBaseUrl = `http://127.0.0.1:${downPort}`;
  const phpBin = resolvePhpBin();

  const upServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${upPort}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let upStdErr = '';
  upServer.stderr.on('data', (chunk) => {
    upStdErr += chunk.toString();
  });
  let hasFailure = true;
  let cookie = '';

  try {
    await waitForHttp(upBaseUrl);

    const login = await fetchJson(`${upBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(login.response.status === 200, 'dashboard_summary_db_down_login_up_status');

    cookie = mergeCookie('', login.response.headers.get('set-cookie'));
    assertCondition(cookie !== '', 'dashboard_summary_db_down_login_cookie_up');

    upServer.kill();
    await sleep(150);

    const downServer = spawn(
      phpBin,
      ['-S', `127.0.0.1:${downPort}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          MYSQL_HOST: '127.0.0.1',
          MYSQL_PORT: '1'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );

    let downStdErr = '';
    downServer.stderr.on('data', (chunk) => {
      downStdErr += chunk.toString();
    });

    try {
      await waitForHttp(downBaseUrl);

      const root = await fetchJson(`${downBaseUrl}/dashboard/summary`, { headers: { cookie } });
      cookie = mergeCookie(cookie, root.response.headers.get('set-cookie'));
      const api = await fetchJson(`${downBaseUrl}/api/dashboard/summary`, { headers: { cookie } });

      assertCondition(root.response.status === 500, 'dashboard_summary_db_down_root_status');
      assertCondition(api.response.status === 500, 'dashboard_summary_db_down_api_status');
      assertCondition(root.json?.ok === false, 'dashboard_summary_db_down_root_ok_false');
      assertCondition(api.json?.ok === false, 'dashboard_summary_db_down_api_ok_false');
      assertCondition(String(root.json?.error || '') === 'dashboard_summary_failed', 'dashboard_summary_db_down_root_error');
      assertCondition(String(api.json?.error || '') === 'dashboard_summary_failed', 'dashboard_summary_db_down_api_error');
      assertCondition(String(root.json?.message || '') !== '', 'dashboard_summary_db_down_root_message');
      assertCondition(String(api.json?.message || '') !== '', 'dashboard_summary_db_down_api_message');

      console.log('[smoke] admin-php dashboard summary db-down contract ok');
      console.log('[smoke] endpoints=/dashboard/summary,/api/dashboard/summary with invalid mysql port');
      hasFailure = false;
    } finally {
      downServer.kill();
      await sleep(150);
      if (hasFailure && downStdErr.trim()) {
        console.log(`[smoke] admin-php(stderr-down):\n${downStdErr.trim()}`);
      }
    }
  } finally {
    upServer.kill();
    await sleep(150);
    if (hasFailure && upStdErr.trim()) {
      console.log(`[smoke] admin-php(stderr-up):\n${upStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
