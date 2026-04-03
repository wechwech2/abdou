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

function assertStatus(response, expectedStatus, code) {
  if (response.status !== expectedStatus) {
    throw new Error(`${code}_expected_${expectedStatus}_got_${response.status}`);
  }
}

async function main() {
  const port = 3225;
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
  let dumpPhpStdErr = false;

  try {
    try {
      await waitForHealth(baseUrl);

      const meRootUnauth = await fetchJson(`${baseUrl}/auth/me`);
      const meApiUnauth = await fetchJson(`${baseUrl}/api/auth/me`);
      assertStatus(meRootUnauth.response, 401, 'auth_session_me_root_unauth');
      assertStatus(meApiUnauth.response, 401, 'auth_session_me_api_unauth');

      const loginRoot = await fetchJson(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
      });
      assertStatus(loginRoot.response, 200, 'auth_session_login_root');
      if (loginRoot.json?.ok !== true || String(loginRoot.json?.user?.email || '') !== 'admin@abdou.local') {
        throw new Error('auth_session_login_root_payload_invalid');
      }
      let cookie = mergeCookie('', loginRoot.response.headers.get('set-cookie'));

      const meApiWithRootSession = await fetchJson(`${baseUrl}/api/auth/me`, { headers: { cookie } });
      assertStatus(meApiWithRootSession.response, 200, 'auth_session_me_api_with_root_session');
      if (String(meApiWithRootSession.json?.user?.email || '') !== 'admin@abdou.local') {
        throw new Error('auth_session_me_api_user_mismatch');
      }

      const logoutApi = await fetchJson(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { cookie }
      });
      cookie = mergeCookie(cookie, logoutApi.response.headers.get('set-cookie'));
      assertStatus(logoutApi.response, 200, 'auth_session_logout_api');
      if (logoutApi.json?.ok !== true) {
        throw new Error('auth_session_logout_api_payload_invalid');
      }

      const meRootAfterApiLogout = await fetchJson(`${baseUrl}/auth/me`, { headers: { cookie } });
      assertStatus(meRootAfterApiLogout.response, 401, 'auth_session_me_root_after_api_logout');

      const loginApi = await fetchJson(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
      });
      assertStatus(loginApi.response, 200, 'auth_session_login_api');
      if (loginApi.json?.ok !== true || String(loginApi.json?.user?.email || '') !== 'admin@abdou.local') {
        throw new Error('auth_session_login_api_payload_invalid');
      }
      cookie = mergeCookie('', loginApi.response.headers.get('set-cookie'));

      const meRootWithApiSession = await fetchJson(`${baseUrl}/auth/me`, { headers: { cookie } });
      assertStatus(meRootWithApiSession.response, 200, 'auth_session_me_root_with_api_session');
      if (String(meRootWithApiSession.json?.user?.email || '') !== 'admin@abdou.local') {
        throw new Error('auth_session_me_root_user_mismatch');
      }

      const logoutRoot = await fetchJson(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { cookie }
      });
      cookie = mergeCookie(cookie, logoutRoot.response.headers.get('set-cookie'));
      assertStatus(logoutRoot.response, 200, 'auth_session_logout_root');
      if (logoutRoot.json?.ok !== true) {
        throw new Error('auth_session_logout_root_payload_invalid');
      }

      const meApiAfterRootLogout = await fetchJson(`${baseUrl}/api/auth/me`, { headers: { cookie } });
      assertStatus(meApiAfterRootLogout.response, 401, 'auth_session_me_api_after_root_logout');

      console.log('[smoke] admin-php auth session parity ok');
      console.log('[smoke] flow_1=/auth/login -> /api/auth/me -> /api/auth/logout -> /auth/me');
      console.log('[smoke] flow_2=/api/auth/login -> /auth/me -> /auth/logout -> /api/auth/me');
    } catch (error) {
      dumpPhpStdErr = true;
      throw error;
    }
  } finally {
    phpServer.kill();
    await sleep(150);
    if (dumpPhpStdErr && phpStdErr.trim()) {
      console.log(`[smoke] admin-php stderr:\n${phpStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
