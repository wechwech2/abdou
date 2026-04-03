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

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
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
  const port = 3229;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
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

  let phpStdErr = '';
  phpServer.stderr.on('data', (chunk) => {
    phpStdErr += chunk.toString();
  });
  let hasFailure = true;

  try {
    await waitForHttp(baseUrl);

    const health = await fetchJson(`${baseUrl}/health`);
    assertCondition(health.response.status === 200, 'health_db_down_health_status');
    assertCondition(health.json?.ok === true, 'health_db_down_health_ok');

    const dbRoot = await fetchJson(`${baseUrl}/health/db`);
    const dbApi = await fetchJson(`${baseUrl}/api/health/db`);

    assertCondition(dbRoot.response.status === 500, 'health_db_down_root_status');
    assertCondition(dbApi.response.status === 500, 'health_db_down_api_status');
    assertCondition(dbRoot.json?.ok === false, 'health_db_down_root_ok_false');
    assertCondition(dbApi.json?.ok === false, 'health_db_down_api_ok_false');
    assertCondition(String(dbRoot.json?.service || '') === 'admin-php', 'health_db_down_root_service');
    assertCondition(String(dbApi.json?.service || '') === 'admin-php', 'health_db_down_api_service');
    assertCondition(String(dbRoot.json?.db || '') === 'down', 'health_db_down_root_db');
    assertCondition(String(dbApi.json?.db || '') === 'down', 'health_db_down_api_db');
    assertCondition(String(dbRoot.json?.error || '') !== '', 'health_db_down_root_error');
    assertCondition(String(dbApi.json?.error || '') !== '', 'health_db_down_api_error');
    assertCondition(String(dbRoot.json?.timestamp || '') !== '', 'health_db_down_root_timestamp');
    assertCondition(String(dbApi.json?.timestamp || '') !== '', 'health_db_down_api_timestamp');

    console.log('[smoke] admin-php health/db down contract ok');
    console.log('[smoke] endpoints=/health/db,/api/health/db with invalid mysql port');
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
