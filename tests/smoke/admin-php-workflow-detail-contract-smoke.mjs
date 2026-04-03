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

function ensureObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`workflow_detail_contract_invalid_${label}`);
  }
}

function ensureKeys(value, label, keys) {
  ensureObject(value, label);
  for (const key of keys) {
    if (!(key in value)) {
      throw new Error(`workflow_detail_contract_missing_${label}_${key}`);
    }
  }
}

async function runBuildDeploy(publicationId) {
  const buildModuleUrl = pathToFileURL(resolve(process.cwd(), 'deploy', 'scripts', 'build-publication.mjs')).href;
  const deployModuleUrl = pathToFileURL(resolve(process.cwd(), 'deploy', 'scripts', 'deploy-publication.mjs')).href;
  const { buildPublication } = await import(buildModuleUrl);
  const { deployPublication } = await import(deployModuleUrl);
  const build = await buildPublication(publicationId);
  if (!build.ok) {
    throw new Error('workflow_detail_contract_build_failed');
  }
  const deploy = await deployPublication(publicationId);
  if (!deploy.ok) {
    throw new Error('workflow_detail_contract_deploy_failed');
  }
}

async function main() {
  const port = 3221;
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

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (!loginResponse.ok) {
      throw new Error(`workflow_detail_contract_login_failed:${loginResponse.status}`);
    }
    let cookie = mergeCookie('', loginResponse.headers.get('set-cookie'));

    async function fetchWithSession(url, init = {}) {
      const headers = {
        accept: 'application/json',
        cookie,
        ...(init.headers || {})
      };
      const response = await fetch(url, { ...init, headers });
      cookie = mergeCookie(cookie, response.headers.get('set-cookie'));
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      return { response, json };
    }

    const publicationsList = await fetchWithSession(`${baseUrl}/publications?limit=1&page=1`);
    if (!publicationsList.response.ok) {
      throw new Error(`workflow_detail_contract_publications_list_failed:${publicationsList.response.status}`);
    }

    let publicationId = Number(publicationsList.json?.items?.[0]?.id ?? 0);
    if (!Number.isFinite(publicationId) || publicationId <= 0) {
      const programmesList = await fetchWithSession(`${baseUrl}/programmes?limit=1&page=1`);
      if (!programmesList.response.ok) {
        throw new Error(
          `workflow_detail_contract_programmes_list_failed:${programmesList.response.status}`
        );
      }
      const programmeId = Number(programmesList.json?.items?.[0]?.id ?? 0);
      if (!Number.isFinite(programmeId) || programmeId <= 0) {
        throw new Error('workflow_detail_contract_missing_seed_programme');
      }
      const created = await fetchWithSession(`${baseUrl}/publications`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ programme_id: programmeId })
      });
      if (created.response.status !== 201) {
        throw new Error(`workflow_detail_contract_create_publication_failed:${created.response.status}`);
      }
      publicationId = Number(created.json?.item?.id ?? 0);
      if (!Number.isFinite(publicationId) || publicationId <= 0) {
        throw new Error('workflow_detail_contract_invalid_created_publication_id');
      }
    }

    await runBuildDeploy(publicationId);

    const workflow = await fetchWithSession(`${baseUrl}/publications/${publicationId}/workflow-detail`);
    const response = workflow.response;
    const payload = workflow.json;

    if (!response.ok) {
      throw new Error(`workflow_detail_contract_failed:${response.status}`);
    }
    ensureKeys(payload, 'root', [
      'ok',
      'publication_id',
      'detail',
      'deployments',
      'build_log',
      'deploy_log',
      'deploy_artifacts',
      'deploy_summary'
    ]);
    if (payload.ok !== true) {
      throw new Error('workflow_detail_contract_root_ok_false');
    }
    if (payload.publication_id !== publicationId) {
      throw new Error('workflow_detail_contract_publication_id_mismatch');
    }

    ensureKeys(payload.detail, 'detail', ['ok', 'item']);
    ensureKeys(payload.deployments, 'deployments', ['ok', 'count', 'items']);
    ensureKeys(payload.build_log, 'build_log', ['found', 'path', 'content']);
    ensureKeys(payload.deploy_log, 'deploy_log', ['found', 'path', 'content']);
    ensureKeys(payload.deploy_artifacts, 'deploy_artifacts', ['publication_id', 'manifest', 'verify_log']);
    ensureKeys(payload.deploy_artifacts.manifest, 'deploy_artifacts_manifest', ['found', 'path', 'content']);
    ensureKeys(payload.deploy_artifacts.verify_log, 'deploy_artifacts_verify_log', ['found', 'path', 'content']);
    ensureKeys(payload.deploy_summary, 'deploy_summary', [
      'publication_id',
      'source_dir',
      'target_dir',
      'mode',
      'verify_status',
      'status'
    ]);

    console.log('[smoke] admin-php workflow-detail contract ok');
    console.log(`[smoke] publication_id=${publicationId}`);
    console.log(`[smoke] deploy_summary_status=${String(payload.deploy_summary.status || '-')}`);
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
