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
  const port = 3226;
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
    assertCondition(healthRoot.response.status === 200, 'health_db_health_root_status');
    assertCondition(healthApi.response.status === 200, 'health_db_health_api_status');
    assertCondition(healthRoot.json?.ok === true, 'health_db_health_root_ok');
    assertCondition(healthApi.json?.ok === true, 'health_db_health_api_ok');
    assertCondition(String(healthRoot.json?.service || '') === 'admin-php', 'health_db_health_root_service');
    assertCondition(String(healthApi.json?.service || '') === 'admin-php', 'health_db_health_api_service');
    assertCondition(String(healthRoot.json?.env || '') !== '', 'health_db_health_root_env');
    assertCondition(String(healthApi.json?.env || '') !== '', 'health_db_health_api_env');
    assertCondition(String(healthRoot.json?.timestamp || '') !== '', 'health_db_health_root_timestamp');
    assertCondition(String(healthApi.json?.timestamp || '') !== '', 'health_db_health_api_timestamp');

    const healthDbRoot = await fetchJson(`${baseUrl}/health/db`);
    const healthDbApi = await fetchJson(`${baseUrl}/api/health/db`);
    assertCondition(healthDbRoot.response.status === 200, 'health_db_root_status');
    assertCondition(healthDbApi.response.status === 200, 'health_db_api_status');
    assertCondition(healthDbRoot.json?.ok === true, 'health_db_root_ok');
    assertCondition(healthDbApi.json?.ok === true, 'health_db_api_ok');
    assertCondition(String(healthDbRoot.json?.service || '') === 'admin-php', 'health_db_root_service');
    assertCondition(String(healthDbApi.json?.service || '') === 'admin-php', 'health_db_api_service');
    assertCondition(String(healthDbRoot.json?.db || '') === 'up', 'health_db_root_db');
    assertCondition(String(healthDbApi.json?.db || '') === 'up', 'health_db_api_db');
    assertCondition(Number(healthDbRoot.json?.probe) === 1, 'health_db_root_probe');
    assertCondition(Number(healthDbApi.json?.probe) === 1, 'health_db_api_probe');
    assertCondition(String(healthDbRoot.json?.timestamp || '') !== '', 'health_db_root_timestamp');
    assertCondition(String(healthDbApi.json?.timestamp || '') !== '', 'health_db_api_timestamp');

    console.log('[smoke] admin-php health/db contract ok');
    console.log('[smoke] endpoints=/health,/api/health,/health/db,/api/health/db');
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
