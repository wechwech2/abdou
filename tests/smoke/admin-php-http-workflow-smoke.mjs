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

async function loadWorkflowScripts() {
  const buildModuleUrl = pathToFileURL(resolve(process.cwd(), 'deploy', 'scripts', 'build-publication.mjs')).href;
  const deployModuleUrl = pathToFileURL(resolve(process.cwd(), 'deploy', 'scripts', 'deploy-publication.mjs')).href;

  const buildModule = await import(buildModuleUrl);
  const deployModule = await import(deployModuleUrl);

  return {
    buildPublication: buildModule.buildPublication,
    deployPublication: deployModule.deployPublication,
  };
}

async function main() {
  const publicationId = 1201;
  const port = 3212;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const { buildPublication, deployPublication } = await loadWorkflowScripts();
  const build = await buildPublication(publicationId);
  if (!build.ok) {
    throw new Error('admin_php_smoke_build_failed');
  }
  const deploy = await deployPublication(publicationId);
  if (!deploy.ok) {
    throw new Error('admin_php_smoke_deploy_failed');
  }

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

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (!loginResponse.ok) {
      throw new Error(`admin_php_login_failed:${loginResponse.status}`);
    }
    let cookie = mergeCookie('', loginResponse.headers.get('set-cookie'));

    const fetchWithSession = async (url) => {
      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          cookie
        }
      });
      cookie = mergeCookie(cookie, response.headers.get('set-cookie'));
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      return { status: response.status, ok: response.ok, json };
    };

    const contracts = await fetchWithSession(`${baseUrl}/contracts`);
    if (!contracts.ok) {
      throw new Error(`admin_php_contracts_failed:${contracts.status}`);
    }

    const manifest = await fetchWithSession(`${baseUrl}/publications/${publicationId}/deploy-manifest`);
    if (!manifest.ok) {
      throw new Error(`admin_php_manifest_failed:${manifest.status}`);
    }
    if (!String(manifest.json?.content || '').includes('"deployment_id"')) {
      throw new Error('admin_php_manifest_unexpected_content');
    }

    const verifyLog = await fetchWithSession(`${baseUrl}/publications/${publicationId}/deploy-verify-log`);
    if (!verifyLog.ok) {
      throw new Error(`admin_php_verify_failed:${verifyLog.status}`);
    }
    if (!String(verifyLog.json?.content || '').includes('"checks"')) {
      throw new Error('admin_php_verify_unexpected_content');
    }

    const summary = await fetchWithSession(`${baseUrl}/publications/${publicationId}/deploy-summary`);
    if (!summary.ok) {
      throw new Error(`admin_php_summary_failed:${summary.status}`);
    }
    if (!summary.json?.summary?.mode || !summary.json?.summary?.target_dir) {
      throw new Error('admin_php_summary_unexpected_content');
    }

    console.log('[smoke] admin-php http workflow endpoints ok');
    console.log(`[smoke] publication_id=${publicationId}`);
    console.log(`[smoke] manifest_path=${manifest.json?.path || '-'}`);
    console.log(`[smoke] verify_log_path=${verifyLog.json?.path || '-'}`);
    console.log(`[smoke] deploy_summary_mode=${summary.json?.summary?.mode || '-'}`);
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
