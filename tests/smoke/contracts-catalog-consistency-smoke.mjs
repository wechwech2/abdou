#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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

function sortValues(values) {
  return [...values].map((value) => String(value)).sort();
}

function normalizePhpContracts(items) {
  return {
    clientStatus: Array.isArray(items?.client_status) ? items.client_status : [],
    roleCode: Array.isArray(items?.role_code) ? items.role_code : [],
    programmeStatus: Array.isArray(items?.programme_status) ? items.programme_status : [],
    programmePublicationStatus: Array.isArray(items?.programme_publication_status)
      ? items.programme_publication_status
      : [],
    publicationStatus: Array.isArray(items?.publication_status) ? items.publication_status : [],
    mediaType: Array.isArray(items?.media_type) ? items.media_type : [],
    mediaStatus: Array.isArray(items?.media_status) ? items.media_status : [],
    publicationDeploymentTargetType: Array.isArray(items?.publication_deployment_target_type)
      ? items.publication_deployment_target_type
      : [],
    publicationDeploymentStatus: Array.isArray(items?.publication_deployment_status)
      ? items.publication_deployment_status
      : []
  };
}

function assertCatalogsEqual(name, actual, expected) {
  const expectedKeys = Object.keys(expected);
  for (const key of expectedKeys) {
    const left = sortValues(actual?.[key] || []);
    const right = sortValues(expected?.[key] || []);
    if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
      throw new Error(`${name}_mismatch_${key}`);
    }
  }
}

async function main() {
  const phpPort = 3216;
  const apiPort = 3217;
  const phpBaseUrl = `http://127.0.0.1:${phpPort}`;
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const phpBin = resolvePhpBin();

  const contractsModuleUrl = pathToFileURL(
    resolve(process.cwd(), 'packages', 'shared-types', 'dist', 'contracts.js')
  ).href;
  const contractsModule = await import(contractsModuleUrl);
  const expectedCatalog = contractsModule.buildContractCatalog();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${phpPort}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

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
        ADMIN_API_COMPAT_ENABLED: 'false'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let phpStdErr = '';
  phpServer.stderr.on('data', (chunk) => {
    phpStdErr += chunk.toString();
  });

  let apiStdErr = '';
  apiServer.stderr.on('data', (chunk) => {
    apiStdErr += chunk.toString();
  });
  let hasFailure = true;

  try {
    await waitForHealth(phpBaseUrl);
    await waitForHealth(apiBaseUrl);

    const login = await fetch(`${phpBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (!login.ok) {
      throw new Error(`contracts_login_failed:${login.status}`);
    }
    const cookie = mergeCookie('', login.headers.get('set-cookie'));

    const phpContracts = await fetchJson(`${phpBaseUrl}/contracts`, {
      headers: {
        accept: 'application/json',
        cookie
      }
    });
    if (!phpContracts.ok || phpContracts.json?.ok !== true) {
      throw new Error(`contracts_php_failed:${phpContracts.status}`);
    }

    const apiContracts = await fetchJson(`${apiBaseUrl}/api/contracts`, {
      headers: { accept: 'application/json' }
    });
    if (!apiContracts.ok || apiContracts.json?.ok !== true) {
      throw new Error(`contracts_admin_api_failed:${apiContracts.status}`);
    }

    const normalizedPhpCatalog = normalizePhpContracts(phpContracts.json?.items);
    const adminApiCatalog = apiContracts.json?.contracts || {};

    assertCatalogsEqual('php_contracts', normalizedPhpCatalog, expectedCatalog);
    assertCatalogsEqual('admin_api_contracts', adminApiCatalog, expectedCatalog);

    console.log('[smoke] contracts catalog consistency ok');
    console.log(`[smoke] keys=${Object.keys(expectedCatalog).join(',')}`);
    hasFailure = false;
  } finally {
    apiServer.kill();
    phpServer.kill();
    await sleep(150);
    if (hasFailure && apiStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${apiStdErr.trim()}`);
    }
    if (hasFailure && phpStdErr.trim()) {
      console.log(`[smoke] admin-php stderr:\n${phpStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
