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

function assertSummaryShape(payload, codePrefix) {
  assertCondition(payload?.ok === true, `${codePrefix}_ok_true`);
  assertCondition(payload?.summary && typeof payload.summary === 'object', `${codePrefix}_summary_object`);
  const { summary } = payload;
  assertCondition(typeof summary.timestamp === 'string' && summary.timestamp.length > 0, `${codePrefix}_timestamp`);
  for (const block of ['clients', 'programmes', 'publications', 'deployments']) {
    const value = summary[block];
    assertCondition(value && typeof value === 'object', `${codePrefix}_${block}_object`);
    assertCondition(Number.isFinite(Number(value.total)), `${codePrefix}_${block}_total_number`);
  }
}

async function main() {
  const port = 3232;
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

    const unauthRoot = await fetchJson(`${baseUrl}/dashboard/summary`);
    assertCondition(unauthRoot.response.status === 401, 'dashboard_summary_unauth_root_status');

    const unauthApi = await fetchJson(`${baseUrl}/api/dashboard/summary`);
    assertCondition(unauthApi.response.status === 401, 'dashboard_summary_unauth_api_status');

    const login = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(login.response.status === 200, 'dashboard_summary_login_status');

    let cookie = mergeCookie('', login.response.headers.get('set-cookie'));
    assertCondition(cookie !== '', 'dashboard_summary_login_cookie');

    const root = await fetchJson(`${baseUrl}/dashboard/summary`, {
      headers: { cookie }
    });
    cookie = mergeCookie(cookie, root.response.headers.get('set-cookie'));
    assertCondition(root.response.status === 200, 'dashboard_summary_root_status');
    assertSummaryShape(root.json, 'dashboard_summary_root');

    const api = await fetchJson(`${baseUrl}/api/dashboard/summary`, {
      headers: { cookie }
    });
    assertCondition(api.response.status === 200, 'dashboard_summary_api_status');
    assertSummaryShape(api.json, 'dashboard_summary_api');

    assertCondition(
      Number(api.json?.summary?.publications?.total) === Number(root.json?.summary?.publications?.total),
      'dashboard_summary_root_api_parity_publications_total'
    );

    console.log('[smoke] admin-php dashboard summary contract ok');
    console.log('[smoke] endpoints=/dashboard/summary,/api/dashboard/summary');
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
