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

async function main() {
  const port = 3214;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
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
    await waitForHealth(baseUrl);

    const unauthUsers = await fetchJson(`${baseUrl}/users`, {
      headers: { accept: 'application/json' }
    });
    if (unauthUsers.status !== 401 || unauthUsers.json?.error !== 'unauthorized') {
      throw new Error(`rbac_unauth_users_expected_401_got_${unauthUsers.status}`);
    }

    const loginOperator = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'operator@abdou.local', password: '0000' })
    });
    const loginOperatorText = await loginOperator.text();
    let loginOperatorJson = null;
    try {
      loginOperatorJson = JSON.parse(loginOperatorText);
    } catch {
      loginOperatorJson = { raw: loginOperatorText };
    }
    if (!loginOperator.ok) {
      throw new Error(`rbac_operator_login_failed:${loginOperator.status}`);
    }
    if (!loginOperatorJson?.ok) {
      throw new Error('rbac_operator_login_payload_invalid');
    }

    const cookie = mergeCookie('', loginOperator.headers.get('set-cookie'));

    const asOperator = async (url, options = {}) =>
      fetchJson(url, {
        ...options,
        headers: {
          accept: 'application/json',
          ...(options.headers || {}),
          cookie
        }
      });

    const readClients = await asOperator(`${baseUrl}/clients`);
    if (!readClients.ok) {
      throw new Error(`rbac_operator_read_clients_failed:${readClients.status}`);
    }

    const writeClients = await asOperator(`${baseUrl}/clients`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'TMP-RBAC', name: 'Tmp RBAC', slug: 'tmp-rbac', status: 'active' })
    });
    if (writeClients.status !== 403 || writeClients.json?.error !== 'forbidden') {
      throw new Error(`rbac_operator_write_clients_expected_403_got_${writeClients.status}`);
    }

    const writeProgrammes = await asOperator(`${baseUrl}/programmes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: 1, offre_id: 1, code: 'TMP-RBAC-PRG', name: 'Tmp RBAC PRG', slug: 'tmp-rbac-prg' })
    });
    if (writeProgrammes.status !== 403 || writeProgrammes.json?.error !== 'forbidden') {
      throw new Error(`rbac_operator_write_programmes_expected_403_got_${writeProgrammes.status}`);
    }

    const writeDeploy = await asOperator(`${baseUrl}/publications/1/deploy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target_label: 'rbac-check' })
    });
    if (writeDeploy.status !== 403 || writeDeploy.json?.error !== 'forbidden') {
      throw new Error(`rbac_operator_write_deploy_expected_403_got_${writeDeploy.status}`);
    }

    console.log('[smoke] admin-php rbac rules ok');
    console.log('[smoke] unauth read protected endpoints -> 401');
    console.log('[smoke] operator write endpoints -> 403');
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
