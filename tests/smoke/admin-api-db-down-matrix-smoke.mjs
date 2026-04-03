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
  const phpPort = 3245;
  const apiPort = 3246;
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
    assertCondition(login.response.status === 200, 'admin_api_db_down_matrix_login_status');

    let cookie = mergeCookie('', login.response.headers.get('set-cookie'));
    assertCondition(cookie !== '', 'admin_api_db_down_matrix_login_cookie');

    let publicationId = 0;
    const list = await fetchJson(`${apiBaseUrl}/api/publications?limit=1&page=1`, {
      headers: { cookie }
    });
    cookie = mergeCookie(cookie, list.response.headers.get('set-cookie'));
    assertCondition(list.response.status === 200, 'admin_api_db_down_matrix_publications_list_status');

    publicationId = Number(list.json?.items?.[0]?.id ?? 0);
    if (!Number.isFinite(publicationId) || publicationId <= 0) {
      const programmes = await fetchJson(`${apiBaseUrl}/api/programmes?limit=1&page=1`, {
        headers: { cookie }
      });
      cookie = mergeCookie(cookie, programmes.response.headers.get('set-cookie'));
      assertCondition(programmes.response.status === 200, 'admin_api_db_down_matrix_programmes_status');

      const programmeId = Number(programmes.json?.items?.[0]?.id ?? 0);
      assertCondition(Number.isFinite(programmeId) && programmeId > 0, 'admin_api_db_down_matrix_programme_id_invalid');

      const created = await fetchJson(`${apiBaseUrl}/api/publications`, {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ programme_id: programmeId })
      });
      cookie = mergeCookie(cookie, created.response.headers.get('set-cookie'));
      assertCondition(created.response.status === 201, 'admin_api_db_down_matrix_create_publication_status');

      publicationId = Number(created.json?.item?.id ?? 0);
      assertCondition(
        Number.isFinite(publicationId) && publicationId > 0,
        'admin_api_db_down_matrix_created_publication_id_invalid'
      );
    }

    phpUp.server.kill();
    await sleep(150);

    const phpDown = spawnPhp(phpPort, {
      MYSQL_HOST: '127.0.0.1',
      MYSQL_PORT: '1'
    });

    try {
      await waitForHealth(phpBaseUrl);

      const checks = [
        {
          name: 'dashboard_summary',
          url: `${apiBaseUrl}/api/dashboard/summary`,
          method: 'GET',
          expectedError: 'dashboard_summary_failed'
        },
        {
          name: 'workflow_detail',
          url: `${apiBaseUrl}/api/publications/${publicationId}/workflow-detail`,
          method: 'GET',
          expectedError: 'publication_workflow_detail_failed'
        },
        {
          name: 'publication_build',
          url: `${apiBaseUrl}/api/publications/${publicationId}/build`,
          method: 'POST',
          expectedError: 'publication_build_failed',
          body: {}
        },
        {
          name: 'publication_deploy',
          url: `${apiBaseUrl}/api/publications/${publicationId}/deploy`,
          method: 'POST',
          expectedError: 'publication_deploy_failed',
          body: { mode: 'local' }
        }
      ];

      for (const check of checks) {
        const response = await fetchJson(check.url, {
          method: check.method,
          headers: {
            cookie,
            ...(check.method !== 'GET' ? { 'content-type': 'application/json' } : {})
          },
          ...(check.body ? { body: JSON.stringify(check.body) } : {})
        });

        cookie = mergeCookie(cookie, response.response.headers.get('set-cookie'));

        assertCondition(response.response.status === 500, `admin_api_db_down_matrix_${check.name}_status`);
        assertCondition(response.json?.ok === false, `admin_api_db_down_matrix_${check.name}_ok_false`);
        assertCondition(
          String(response.json?.error || '') === check.expectedError,
          `admin_api_db_down_matrix_${check.name}_error`
        );
        assertCondition(String(response.json?.message || '') !== '', `admin_api_db_down_matrix_${check.name}_message`);
      }

      console.log('[smoke] admin-api db-down matrix contract ok');
      console.log(`[smoke] publication_id=${publicationId}`);
      console.log('[smoke] checked=/api/dashboard/summary,/api/publications/:id/workflow-detail,/api/publications/:id/build,/api/publications/:id/deploy');
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
