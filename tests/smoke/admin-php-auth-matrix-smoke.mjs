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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json };
}

async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!response.ok || json?.ok !== true) {
    throw new Error(`auth_matrix_login_failed:${email}:${response.status}`);
  }
  return mergeCookie('', response.headers.get('set-cookie'));
}

function assertStatus(actualStatus, expectedStatus, label) {
  if (actualStatus !== expectedStatus) {
    throw new Error(`auth_matrix_${label}_expected_${expectedStatus}_got_${actualStatus}`);
  }
}

function assertNotAuthDenied(actualStatus, label) {
  if (actualStatus === 401 || actualStatus === 403) {
    throw new Error(`auth_matrix_${label}_unexpected_auth_denied_${actualStatus}`);
  }
}

async function main() {
  const port = 3224;
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

      const publicHealth = await fetchJson(`${baseUrl}/health`);
      assertStatus(publicHealth.status, 200, 'public_health');

      const publicLoginMissing = await fetchJson(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({})
      });
      assertStatus(publicLoginMissing.status, 400, 'public_login_missing_credentials');

      const operatorCookie = await login(baseUrl, 'operator@abdou.local', '0000');
      const adminCookie = await login(baseUrl, 'admin@abdou.local', '0000');

      const sessionRoutes = [
      '/contracts',
      '/dashboard/summary',
      '/offres',
      '/templates',
      '/offres/1',
      '/templates/1',
      '/clients',
      '/clients/1',
      '/programmes',
      '/programmes/1',
      '/rubriques',
      '/rubriques/1',
      '/medias',
      '/medias/1',
      '/lots',
      '/lots/1',
      '/publications',
      '/publications/1',
      '/publications/1/deployments',
      '/publications/1/build-log',
      '/publications/1/deploy-log',
      '/publications/1/deploy-manifest',
      '/publications/1/deploy-verify-log',
      '/publications/1/deploy-artifacts',
      '/publications/1/deploy-summary',
      '/publications/1/workflow-detail',
      '/roles',
      '/users',
      '/users/1',
      '/auth/me'
    ];

      for (const routePath of sessionRoutes) {
        const unauth = await fetchJson(`${baseUrl}${routePath}`, {
          headers: { accept: 'application/json' }
        });
        assertStatus(unauth.status, 401, `session_unauth_${routePath.replaceAll('/', '_')}`);

        const asOperator = await fetchJson(`${baseUrl}${routePath}`, {
          headers: { accept: 'application/json', cookie: operatorCookie }
        });
        assertNotAuthDenied(asOperator.status, `session_operator_${routePath.replaceAll('/', '_')}`);

        const asAdmin = await fetchJson(`${baseUrl}${routePath}`, {
          headers: { accept: 'application/json', cookie: adminCookie }
        });
        assertNotAuthDenied(asAdmin.status, `session_admin_${routePath.replaceAll('/', '_')}`);
      }

      const adminRoutes = [
      { method: 'POST', path: '/clients', body: {} },
      { method: 'PUT', path: '/clients/1', body: {} },
      { method: 'POST', path: '/programmes', body: {} },
      { method: 'PUT', path: '/programmes/1', body: {} },
      { method: 'POST', path: '/rubriques', body: {} },
      { method: 'PUT', path: '/rubriques/1', body: {} },
      { method: 'POST', path: '/medias', body: {} },
      { method: 'POST', path: '/lots', body: {} },
      { method: 'PUT', path: '/lots/1', body: {} },
      { method: 'POST', path: '/publications', body: {} },
      { method: 'PUT', path: '/publications/1/status', body: {} },
      { method: 'POST', path: '/publications/1/build', body: {} },
      { method: 'POST', path: '/publications/1/deploy', body: {} },
      { method: 'POST', path: '/publications/1/preview', body: {} }
    ];

      for (const route of adminRoutes) {
        const unauth = await fetchJson(`${baseUrl}${route.path}`, {
          method: route.method,
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify(route.body)
        });
        assertStatus(unauth.status, 401, `admin_unauth_${route.method}_${route.path.replaceAll('/', '_')}`);

        const asOperator = await fetchJson(`${baseUrl}${route.path}`, {
          method: route.method,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            cookie: operatorCookie
          },
          body: JSON.stringify(route.body)
        });
        assertStatus(asOperator.status, 403, `admin_operator_${route.method}_${route.path.replaceAll('/', '_')}`);

        const asAdmin = await fetchJson(`${baseUrl}${route.path}`, {
          method: route.method,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            cookie: adminCookie
          },
          body: JSON.stringify(route.body)
        });
        assertNotAuthDenied(asAdmin.status, `admin_admin_${route.method}_${route.path.replaceAll('/', '_')}`);
      }

      const apiPrefixChecks = [
      { method: 'GET', path: '/api/clients', expected: 401 },
      { method: 'GET', path: '/api/dashboard/summary', expected: 401 },
      { method: 'POST', path: '/api/clients', expected: 401 },
      { method: 'GET', path: '/api/publications/1/workflow-detail', expected: 401 },
      { method: 'POST', path: '/api/publications/1/deploy', expected: 401 }
    ];

      for (const check of apiPrefixChecks) {
        const result = await fetchJson(`${baseUrl}${check.path}`, {
          method: check.method,
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: check.method === 'POST' ? JSON.stringify({}) : undefined
        });
        assertStatus(result.status, check.expected, `api_prefix_${check.method}_${check.path.replaceAll('/', '_')}`);
      }

      console.log('[smoke] admin-php auth matrix ok');
      console.log(`[smoke] session_routes_checked=${sessionRoutes.length}`);
      console.log(`[smoke] admin_routes_checked=${adminRoutes.length}`);
      console.log(`[smoke] api_prefix_checks=${apiPrefixChecks.length}`);
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
