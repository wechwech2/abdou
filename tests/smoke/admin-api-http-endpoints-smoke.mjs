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

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
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
  const phpPort = 3210;
  const port = 3211;
  const baseUrl = `http://127.0.0.1:${port}`;
  const adminPhpBaseUrl = `http://127.0.0.1:${phpPort}`;
  const phpBin = resolvePhpBin();

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

  let phpStdErr = '';
  phpServer.stderr.on('data', (chunk) => {
    phpStdErr += chunk.toString();
  });

  const server = spawn(
    process.execPath,
    [resolve(process.cwd(), 'apps', 'admin-api', 'dist', 'apps', 'admin-api', 'src', 'main.js')],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_API_HOST: '127.0.0.1',
        ADMIN_API_PORT: String(port),
        ADMIN_PHP_BASE_URL: adminPhpBaseUrl,
        ADMIN_API_COMPAT_ENABLED: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let serverStdErr = '';
  server.stderr.on('data', (chunk) => {
    serverStdErr += chunk.toString();
  });
  let hasFailure = true;

  try {
    await waitForHealth(adminPhpBaseUrl);
    await waitForHealth(baseUrl);

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    if (!loginResponse.ok) {
      throw new Error(`http_login_failed:${loginResponse.status}`);
    }
    const loginSetCookie = loginResponse.headers.get('set-cookie');
    if (!loginSetCookie) {
      throw new Error('http_login_missing_set_cookie');
    }
    let cookie = mergeCookie('', loginSetCookie);

    const fetchWithSession = async (url, init = {}) => {
      const headers = {
        accept: 'application/json',
        cookie,
        ...(init.headers || {})
      };
      const response = await fetch(url, {
        ...init,
        headers
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

    const programmes = await fetchWithSession(`${baseUrl}/api/programmes?limit=1&page=1`);
    if (!programmes.ok || !Array.isArray(programmes.json?.items) || programmes.json.items.length === 0) {
      throw new Error('http_programmes_list_failed');
    }
    const programmeId = Number(programmes.json.items[0]?.id ?? 0);
    if (!Number.isFinite(programmeId) || programmeId <= 0) {
      throw new Error('http_programme_id_invalid');
    }

    const createdPublication = await fetchWithSession(`${baseUrl}/api/publications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ programme_id: programmeId })
    });
    if (createdPublication.status !== 201) {
      throw new Error(`http_publication_create_failed:${createdPublication.status}`);
    }
    const publicationId = Number(createdPublication.json?.item?.id ?? 0);
    if (!Number.isFinite(publicationId) || publicationId <= 0) {
      throw new Error('http_publication_id_invalid');
    }

    const build = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/build`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!build.ok || build.json?.ok !== true || !build.json?.output_path) {
      throw new Error(`http_build_failed:${build.status}`);
    }

    const deploy = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/deploy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'local' })
    });
    if (!deploy.ok || deploy.json?.local_deploy?.ok !== true) {
      throw new Error(`http_deploy_failed:${deploy.status}`);
    }

    const manifest = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/deploy-manifest`);
    if (!manifest.ok) {
      throw new Error(`http_manifest_failed:${manifest.status}`);
    }
    if (!String(manifest.json?.content || '').includes('"deployment_id"')) {
      throw new Error('http_manifest_unexpected_content');
    }

    const verifyLog = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/deploy-verify-log`);
    if (!verifyLog.ok) {
      throw new Error(`http_verify_log_failed:${verifyLog.status}`);
    }
    if (!String(verifyLog.json?.content || '').includes('"checks"')) {
      throw new Error('http_verify_log_unexpected_content');
    }

    const artifacts = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/deploy-artifacts`);
    if (!artifacts.ok) {
      throw new Error(`http_deploy_artifacts_failed:${artifacts.status}`);
    }
    if (!artifacts.json?.artifacts?.manifest?.found || !artifacts.json?.artifacts?.verify_log?.found) {
      throw new Error('http_deploy_artifacts_unexpected_content');
    }

    const summary = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/deploy-summary`);
    if (!summary.ok) {
      throw new Error(`http_deploy_summary_failed:${summary.status}`);
    }
    if (!summary.json?.summary?.source_dir || !summary.json?.summary?.target_dir || !summary.json?.summary?.mode) {
      throw new Error('http_deploy_summary_unexpected_content');
    }

    const workflowDetail = await fetchWithSession(`${baseUrl}/api/publications/${publicationId}/workflow-detail`);
    if (!workflowDetail.ok) {
      throw new Error(`http_workflow_detail_failed:${workflowDetail.status}`);
    }
    if (!workflowDetail.json?.deploy_summary?.mode) {
      throw new Error('http_workflow_detail_missing_deploy_summary');
    }
    if (!workflowDetail.json?.deploy_artifacts?.manifest || !workflowDetail.json?.deploy_artifacts?.verify_log) {
      throw new Error('http_workflow_detail_missing_deploy_artifacts');
    }

    const missingId = publicationId + 999_999;
    const missingManifest = await fetchWithSession(`${baseUrl}/api/publications/${missingId}/deploy-manifest`);
    if (missingManifest.status !== 404 || missingManifest.json?.error !== 'deploy_manifest_not_found') {
      throw new Error('http_manifest_expected_not_found');
    }

    const missingVerify = await fetchWithSession(`${baseUrl}/api/publications/${missingId}/deploy-verify-log`);
    if (missingVerify.status !== 404 || missingVerify.json?.error !== 'deploy_verify_log_not_found') {
      throw new Error('http_verify_expected_not_found');
    }

    const missingArtifacts = await fetchWithSession(`${baseUrl}/api/publications/${missingId}/deploy-artifacts`);
    if (missingArtifacts.status !== 404 || missingArtifacts.json?.error !== 'deploy_artifacts_not_found') {
      throw new Error('http_artifacts_expected_not_found');
    }

    const missingSummary = await fetchWithSession(`${baseUrl}/api/publications/${missingId}/deploy-summary`);
    if (missingSummary.status !== 404 || missingSummary.json?.error !== 'deploy_summary_not_found') {
      throw new Error('http_summary_expected_not_found');
    }

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        cookie
      }
    });
    if (!logoutResponse.ok) {
      throw new Error(`http_logout_failed:${logoutResponse.status}`);
    }
    if (!logoutResponse.headers.get('set-cookie')) {
      throw new Error('http_logout_missing_set_cookie');
    }

    console.log('[smoke] admin-api http publication endpoints ok');
    console.log(`[smoke] publication_id=${publicationId}`);
    console.log(`[smoke] manifest_path=${manifest.json?.path || '-'}`);
    console.log(`[smoke] verify_log_path=${verifyLog.json?.path || '-'}`);
    console.log(`[smoke] deploy_summary_mode=${summary.json?.summary?.mode || '-'}`);
    console.log('[smoke] workflow_detail_check=ok');
    hasFailure = false;
  } finally {
    server.kill();
    phpServer.kill();
    await sleep(150);
    if (hasFailure && serverStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${serverStdErr.trim()}`);
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
