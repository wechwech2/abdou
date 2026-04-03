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

async function main() {
  const port = 3223;
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

    const healthRoot = await fetchJson(`${baseUrl}/health`);
    const healthApi = await fetchJson(`${baseUrl}/api/health`);
    if (healthRoot.response.status !== 200 || healthApi.response.status !== 200) {
      throw new Error('api_prefix_health_status_mismatch');
    }
    if (healthRoot.json?.ok !== true || healthApi.json?.ok !== true) {
      throw new Error('api_prefix_health_payload_mismatch');
    }

    const unauthContractsRoot = await fetchJson(`${baseUrl}/contracts`);
    const unauthContractsApi = await fetchJson(`${baseUrl}/api/contracts`);
    if (unauthContractsRoot.response.status !== 401 || unauthContractsApi.response.status !== 401) {
      throw new Error('api_prefix_contracts_unauthorized_mismatch');
    }

    const login = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (login.response.status !== 200 || login.json?.ok !== true) {
      throw new Error(`api_prefix_login_failed:${login.response.status}`);
    }

    let cookie = mergeCookie('', login.response.headers.get('set-cookie'));

    const contractsRoot = await fetchJson(`${baseUrl}/contracts`, { headers: { cookie } });
    cookie = mergeCookie(cookie, contractsRoot.response.headers.get('set-cookie'));
    const contractsApi = await fetchJson(`${baseUrl}/api/contracts`, { headers: { cookie } });
    cookie = mergeCookie(cookie, contractsApi.response.headers.get('set-cookie'));

    if (contractsRoot.response.status !== 200 || contractsApi.response.status !== 200) {
      throw new Error('api_prefix_contracts_status_mismatch');
    }
    if (!Array.isArray(contractsRoot.json?.items?.client_status)) {
      throw new Error('api_prefix_contracts_root_invalid');
    }
    if (!Array.isArray(contractsApi.json?.items?.client_status)) {
      throw new Error('api_prefix_contracts_api_invalid');
    }
    if (contractsRoot.json.items.client_status.length !== contractsApi.json.items.client_status.length) {
      throw new Error('api_prefix_contracts_payload_length_mismatch');
    }

    const programmesRoot = await fetchJson(`${baseUrl}/programmes?limit=1&page=1`, { headers: { cookie } });
    const programmesApi = await fetchJson(`${baseUrl}/api/programmes?limit=1&page=1`, { headers: { cookie } });
    if (programmesRoot.response.status !== 200 || programmesApi.response.status !== 200) {
      throw new Error('api_prefix_programmes_status_mismatch');
    }
    if (!Array.isArray(programmesRoot.json?.items) || !Array.isArray(programmesApi.json?.items)) {
      throw new Error('api_prefix_programmes_items_invalid');
    }

    const meRoot = await fetchJson(`${baseUrl}/auth/me`, { headers: { cookie } });
    const meApi = await fetchJson(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    if (meRoot.response.status !== 200 || meApi.response.status !== 200) {
      throw new Error('api_prefix_auth_me_status_mismatch');
    }
    if (meRoot.json?.user?.email !== meApi.json?.user?.email || !String(meApi.json?.user?.email || '').includes('@')) {
      throw new Error('api_prefix_auth_me_payload_mismatch');
    }

    const dashboardRoot = await fetchJson(`${baseUrl}/dashboard/summary`, { headers: { cookie } });
    const dashboardApi = await fetchJson(`${baseUrl}/api/dashboard/summary`, { headers: { cookie } });
    if (dashboardRoot.response.status !== 200 || dashboardApi.response.status !== 200) {
      throw new Error('api_prefix_dashboard_summary_status_mismatch');
    }
    if (dashboardRoot.json?.ok !== true || dashboardApi.json?.ok !== true) {
      throw new Error('api_prefix_dashboard_summary_payload_invalid');
    }
    const rootPublicationsTotal = Number(dashboardRoot.json?.summary?.publications?.total ?? -1);
    const apiPublicationsTotal = Number(dashboardApi.json?.summary?.publications?.total ?? -1);
    if (!Number.isFinite(rootPublicationsTotal) || !Number.isFinite(apiPublicationsTotal)) {
      throw new Error('api_prefix_dashboard_summary_total_invalid');
    }
    if (rootPublicationsTotal !== apiPublicationsTotal) {
      throw new Error('api_prefix_dashboard_summary_total_mismatch');
    }

    const logoutApi = await fetchJson(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie }
    });
    cookie = mergeCookie(cookie, logoutApi.response.headers.get('set-cookie'));
    if (logoutApi.response.status !== 200 || logoutApi.json?.ok !== true) {
      throw new Error('api_prefix_auth_logout_failed');
    }

    const meAfterLogout = await fetchJson(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    if (meAfterLogout.response.status !== 401 || meAfterLogout.json?.error !== 'unauthorized') {
      throw new Error('api_prefix_auth_me_expected_401_after_logout');
    }

    console.log('[smoke] admin-php /api prefix compatibility ok');
    console.log(`[smoke] contracts_client_status_count=${contractsApi.json.items.client_status.length}`);
    console.log(`[smoke] programmes_count_root=${programmesRoot.json.items.length}`);
    console.log(`[smoke] programmes_count_api=${programmesApi.json.items.length}`);
    console.log(`[smoke] auth_user_email=${String(meApi.json?.user?.email || '-')}`);
    console.log(`[smoke] dashboard_publications_total=${apiPublicationsTotal}`);
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
