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

async function main() {
  const port = 3231;
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

    const logoutRootNoSession = await fetchJson(`${baseUrl}/auth/logout`, { method: 'POST' });
    assertCondition(logoutRootNoSession.response.status === 200, 'auth_logout_root_no_session_status');
    assertCondition(logoutRootNoSession.json?.ok === true, 'auth_logout_root_no_session_ok');

    const logoutApiNoSession = await fetchJson(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    assertCondition(logoutApiNoSession.response.status === 200, 'auth_logout_api_no_session_status');
    assertCondition(logoutApiNoSession.json?.ok === true, 'auth_logout_api_no_session_ok');

    const loginRoot = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(loginRoot.response.status === 200, 'auth_logout_login_root_status');
    assertCondition(loginRoot.json?.ok === true, 'auth_logout_login_root_ok');
    let cookie = mergeCookie('', loginRoot.response.headers.get('set-cookie'));

    const meApi = await fetchJson(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assertCondition(meApi.response.status === 200, 'auth_logout_me_api_before_status');
    assertCondition(meApi.json?.ok === true, 'auth_logout_me_api_before_ok');

    const logoutApi = await fetchJson(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie }
    });
    cookie = mergeCookie(cookie, logoutApi.response.headers.get('set-cookie'));
    assertCondition(logoutApi.response.status === 200, 'auth_logout_api_status');
    assertCondition(logoutApi.json?.ok === true, 'auth_logout_api_ok');

    const meRootAfterApiLogout = await fetchJson(`${baseUrl}/auth/me`, { headers: { cookie } });
    assertCondition(meRootAfterApiLogout.response.status === 401, 'auth_logout_me_root_after_api_status');
    assertCondition(String(meRootAfterApiLogout.json?.error || '') === 'unauthorized', 'auth_logout_me_root_after_api_error');

    const logoutRootAgain = await fetchJson(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { cookie }
    });
    assertCondition(logoutRootAgain.response.status === 200, 'auth_logout_root_again_status');
    assertCondition(logoutRootAgain.json?.ok === true, 'auth_logout_root_again_ok');

    const loginApi = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    assertCondition(loginApi.response.status === 200, 'auth_logout_login_api_status');
    assertCondition(loginApi.json?.ok === true, 'auth_logout_login_api_ok');
    cookie = mergeCookie('', loginApi.response.headers.get('set-cookie'));

    const meRoot = await fetchJson(`${baseUrl}/auth/me`, { headers: { cookie } });
    assertCondition(meRoot.response.status === 200, 'auth_logout_me_root_before_status');
    assertCondition(meRoot.json?.ok === true, 'auth_logout_me_root_before_ok');

    const logoutRoot = await fetchJson(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { cookie }
    });
    cookie = mergeCookie(cookie, logoutRoot.response.headers.get('set-cookie'));
    assertCondition(logoutRoot.response.status === 200, 'auth_logout_root_status');
    assertCondition(logoutRoot.json?.ok === true, 'auth_logout_root_ok');

    const meApiAfterRootLogout = await fetchJson(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assertCondition(meApiAfterRootLogout.response.status === 401, 'auth_logout_me_api_after_root_status');
    assertCondition(String(meApiAfterRootLogout.json?.error || '') === 'unauthorized', 'auth_logout_me_api_after_root_error');

    console.log('[smoke] admin-php auth logout contract ok');
    console.log('[smoke] logout idempotent and root/api parity verified');
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
