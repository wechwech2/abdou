#!/usr/bin/env node

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

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

async function main() {
  const upstreamPort = 3291;
  const apiPort = 3221;
  const baseUrl = `http://127.0.0.1:${apiPort}`;
  const upstreamBaseUrl = `http://127.0.0.1:${upstreamPort}`;

  const upstream = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/auth/login') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          user: { id: 1, email: 'admin@abdou.local', first_name: 'Admin', last_name: 'Abdou' }
        })
      );
      return;
    }

    if (req.method === 'POST' && req.url === '/auth/logout') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: 'true'
        })
      );
      return;
    }

    if (req.url === '/auth/me') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          user: { id: 1, email: 'admin@abdou.local', first_name: 'Admin', last_name: 'Abdou' }
        })
      );
      return;
    }

    if (req.url === '/dashboard/summary') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          summary: {
            clients: { total: '1' },
            programmes: { total: 1 },
            publications: { total: 1 },
            deployments: { total: 1 },
            timestamp: '2026-04-02T00:00:00.000Z'
          }
        })
      );
      return;
    }

    if (req.url === '/clients') {
      if (req.method === 'POST') {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            ok: true,
            item: { id: 2, code: 'C2', name: 'Client Two', status: 'active' }
          })
        );
        return;
      }

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          meta: { total: 1, page: 1, limit: 20 },
          items: [{ id: 1, code: 'C1', name: 'Client Test', slug: 'client-test', status: 'active' }]
        })
      );
      return;
    }

    if (req.url === '/clients/1') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          item: { id: 1, code: 'C1', name: 'Client Test', slug: 'client-test' }
        })
      );
      return;
    }

    if (req.url === '/users/1') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          item: { id: 1, email: 'admin@abdou.local', first_name: 'Admin', last_name: 'Abdou' }
        })
      );
      return;
    }

    if (req.url === '/programmes') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          meta: { total: 1, page: 1, limit: 20 },
          items: [{ id: 10, code: 'P1', name: 'Programme Test', slug: 'programme-test', client_id: 1, status: 'draft' }]
        })
      );
      return;
    }

    if (req.url === '/rubriques') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          meta: { total: 1, page: 1, limit: 20 },
          items: [{ id: 50, programme_id: 10, code: 'ACCUEIL', title: 'Accueil' }]
        })
      );
      return;
    }

    if (req.url === '/publications/10/workflow-detail') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          publication_id: 10,
          detail: { ok: true, item: { id: 10 } },
          deployments: { ok: true, count: 0, items: [] },
          build_log: { found: true, path: '/tmp/build.log', content: 'ok' },
          deploy_log: { found: true, path: '/tmp/deploy.log', content: 'ok' },
          deploy_artifacts: {
            publication_id: 10,
            manifest: { found: true, path: '/tmp/manifest.json', content: '{}' },
            verify_log: { found: true, path: '/tmp/verify.json', content: '{}' }
          },
          deploy_summary: {
            publication_id: 10,
            source_dir: '/tmp/source',
            target_dir: '/tmp/target',
            mode: 'local',
            verify_status: 'ok'
          }
        })
      );
      return;
    }

    if (req.url === '/publications/10/build-log') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          publication_id: 10,
          path: '/tmp/build.log'
        })
      );
      return;
    }

    if (req.url === '/publications/10/deployments') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          count: 1,
          items: [{ publication_id: 10, target_type: 'ftp', target_label: 'ovh', target_path: '/www' }]
        })
      );
      return;
    }

    if (req.method === 'POST' && req.url === '/publications/10/preview') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          preview: { path: '/tmp/preview/index.html' }
        })
      );
      return;
    }

    if (req.url === '/offres') {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('plain text instead of json');
      return;
    }

    if (req.url === '/medias') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end('{"ok":true');
      return;
    }

    res.statusCode = 404;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));
  });

  await new Promise((resolveStart) => upstream.listen(upstreamPort, '127.0.0.1', resolveStart));

  const server = spawn(
    process.execPath,
    [resolve(process.cwd(), 'apps', 'admin-api', 'dist', 'apps', 'admin-api', 'src', 'main.js')],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_API_HOST: '127.0.0.1',
        ADMIN_API_PORT: String(apiPort),
        ADMIN_PHP_BASE_URL: upstreamBaseUrl,
        ADMIN_API_COMPAT_ENABLED: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let serverStdErr = '';
  server.stderr.on('data', (chunk) => {
    serverStdErr += chunk.toString();
  });

  try {
    await waitForHealth(baseUrl);

    const okResponse = await fetch(`${baseUrl}/api/clients`, { headers: { accept: 'application/json' } });
    const okJson = await okResponse.json();
    if (!okResponse.ok || !Array.isArray(okJson?.items) || okJson.items.length !== 1) {
      throw new Error('guard_expected_pass_for_clients');
    }

    const authLoginMismatchResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    const authLoginMismatchJson = await authLoginMismatchResponse.json();
    if (authLoginMismatchResponse.status !== 502 || authLoginMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_auth_login_502_got_${authLoginMismatchResponse.status}`);
    }
    if (authLoginMismatchJson?.details?.upstream_path !== '/auth/login') {
      throw new Error('guard_missing_auth_login_upstream_path_detail');
    }
    if (authLoginMismatchJson?.details?.reason !== 'invalid_auth_login_payload') {
      throw new Error('guard_missing_auth_login_reason_detail');
    }

    const authMeMismatchResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { accept: 'application/json' } });
    const authMeMismatchJson = await authMeMismatchResponse.json();
    if (authMeMismatchResponse.status !== 502 || authMeMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_auth_me_502_got_${authMeMismatchResponse.status}`);
    }
    if (authMeMismatchJson?.details?.upstream_path !== '/auth/me') {
      throw new Error('guard_missing_auth_me_upstream_path_detail');
    }
    if (authMeMismatchJson?.details?.reason !== 'invalid_auth_me_payload') {
      throw new Error('guard_missing_auth_me_reason_detail');
    }

    const dashboardMismatchResponse = await fetch(`${baseUrl}/api/dashboard/summary`, {
      headers: { accept: 'application/json' }
    });
    const dashboardMismatchJson = await dashboardMismatchResponse.json();
    if (dashboardMismatchResponse.status !== 502 || dashboardMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_dashboard_summary_502_got_${dashboardMismatchResponse.status}`);
    }
    if (dashboardMismatchJson?.details?.upstream_path !== '/dashboard/summary') {
      throw new Error('guard_missing_dashboard_summary_upstream_path_detail');
    }
    if (dashboardMismatchJson?.details?.reason !== 'invalid_dashboard_summary_payload') {
      throw new Error('guard_missing_dashboard_summary_reason_detail');
    }

    const authLogoutMismatchResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' }
    });
    const authLogoutMismatchJson = await authLogoutMismatchResponse.json();
    if (authLogoutMismatchResponse.status !== 502 || authLogoutMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_auth_logout_502_got_${authLogoutMismatchResponse.status}`);
    }
    if (authLogoutMismatchJson?.details?.upstream_path !== '/auth/logout') {
      throw new Error('guard_missing_auth_logout_upstream_path_detail');
    }
    if (authLogoutMismatchJson?.details?.reason !== 'invalid_auth_logout_payload') {
      throw new Error('guard_missing_auth_logout_reason_detail');
    }

    const mismatchResponse = await fetch(`${baseUrl}/api/programmes`, { headers: { accept: 'application/json' } });
    const mismatchJson = await mismatchResponse.json();
    if (mismatchResponse.status !== 502 || mismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_502_got_${mismatchResponse.status}`);
    }
    if (mismatchJson?.details?.upstream_path !== '/programmes') {
      throw new Error('guard_missing_upstream_path_detail');
    }
    if (String(mismatchJson?.details?.reason || '') !== 'invalid_programmes_list_payload') {
      throw new Error('guard_missing_reason_detail');
    }

    const programmeWriteMismatchResponse = await fetch(`${baseUrl}/api/programmes`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'P1', name: 'Programme Test' })
    });
    const programmeWriteMismatchJson = await programmeWriteMismatchResponse.json();
    if (
      programmeWriteMismatchResponse.status !== 502 ||
      programmeWriteMismatchJson?.error !== 'upstream_contract_mismatch'
    ) {
      throw new Error(`guard_expected_programme_write_502_got_${programmeWriteMismatchResponse.status}`);
    }
    if (programmeWriteMismatchJson?.details?.upstream_path !== '/programmes') {
      throw new Error('guard_missing_programme_write_upstream_path_detail');
    }
    if (String(programmeWriteMismatchJson?.details?.reason || '') !== 'invalid_programme_item_payload') {
      throw new Error('guard_missing_programme_write_reason_detail');
    }

    const itemMismatchResponse = await fetch(`${baseUrl}/api/clients/1`, { headers: { accept: 'application/json' } });
    const itemMismatchJson = await itemMismatchResponse.json();
    if (itemMismatchResponse.status !== 502 || itemMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_item_502_got_${itemMismatchResponse.status}`);
    }
    if (itemMismatchJson?.details?.upstream_path !== '/clients/1') {
      throw new Error('guard_missing_item_upstream_path_detail');
    }
    if (itemMismatchJson?.details?.reason !== 'invalid_client_item_payload') {
      throw new Error('guard_missing_item_reason_detail');
    }

    const clientsWriteMismatchResponse = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'C2', name: 'Client Two' })
    });
    const clientsWriteMismatchJson = await clientsWriteMismatchResponse.json();
    if (clientsWriteMismatchResponse.status !== 502 || clientsWriteMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_clients_write_502_got_${clientsWriteMismatchResponse.status}`);
    }
    if (clientsWriteMismatchJson?.details?.upstream_path !== '/clients') {
      throw new Error('guard_missing_clients_write_upstream_path_detail');
    }
    if (clientsWriteMismatchJson?.details?.reason !== 'invalid_client_item_payload') {
      throw new Error('guard_missing_clients_write_reason_detail');
    }

    const userItemMismatchResponse = await fetch(`${baseUrl}/api/users/1`, { headers: { accept: 'application/json' } });
    const userItemMismatchJson = await userItemMismatchResponse.json();
    if (userItemMismatchResponse.status !== 502 || userItemMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_user_item_502_got_${userItemMismatchResponse.status}`);
    }
    if (userItemMismatchJson?.details?.upstream_path !== '/users/1') {
      throw new Error('guard_missing_user_item_upstream_path_detail');
    }
    if (userItemMismatchJson?.details?.reason !== 'invalid_user_item_payload') {
      throw new Error('guard_missing_user_item_reason_detail');
    }

    const rubriqueMismatchResponse = await fetch(`${baseUrl}/api/rubriques`, { headers: { accept: 'application/json' } });
    const rubriqueMismatchJson = await rubriqueMismatchResponse.json();
    if (rubriqueMismatchResponse.status !== 502 || rubriqueMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_rubriques_502_got_${rubriqueMismatchResponse.status}`);
    }
    if (rubriqueMismatchJson?.details?.upstream_path !== '/rubriques') {
      throw new Error('guard_missing_rubriques_upstream_path_detail');
    }
    if (rubriqueMismatchJson?.details?.reason !== 'invalid_rubriques_list_payload') {
      throw new Error('guard_missing_rubriques_reason_detail');
    }

    const offersContentTypeMismatchResponse = await fetch(`${baseUrl}/api/offres`, {
      headers: { accept: 'application/json' }
    });
    const offersContentTypeMismatchJson = await offersContentTypeMismatchResponse.json();
    if (
      offersContentTypeMismatchResponse.status !== 502 ||
      offersContentTypeMismatchJson?.error !== 'upstream_contract_mismatch'
    ) {
      throw new Error(`guard_expected_offres_content_type_502_got_${offersContentTypeMismatchResponse.status}`);
    }
    if (offersContentTypeMismatchJson?.details?.upstream_path !== '/offres') {
      throw new Error('guard_missing_offres_content_type_upstream_path_detail');
    }
    if (offersContentTypeMismatchJson?.details?.reason !== 'expected_json_content_type') {
      throw new Error('guard_missing_offres_content_type_reason_detail');
    }

    const mediasInvalidJsonResponse = await fetch(`${baseUrl}/api/medias`, {
      headers: { accept: 'application/json' }
    });
    const mediasInvalidJson = await mediasInvalidJsonResponse.json();
    if (mediasInvalidJsonResponse.status !== 502 || mediasInvalidJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_medias_invalid_json_502_got_${mediasInvalidJsonResponse.status}`);
    }
    if (mediasInvalidJson?.details?.upstream_path !== '/medias') {
      throw new Error('guard_missing_medias_invalid_json_upstream_path_detail');
    }
    if (mediasInvalidJson?.details?.reason !== 'invalid_json_payload') {
      throw new Error('guard_missing_medias_invalid_json_reason_detail');
    }

    const workflowMismatchResponse = await fetch(`${baseUrl}/api/publications/10/workflow-detail`, {
      headers: { accept: 'application/json' }
    });
    const workflowMismatchJson = await workflowMismatchResponse.json();
    if (
      workflowMismatchResponse.status !== 502 ||
      workflowMismatchJson?.error !== 'upstream_contract_mismatch'
    ) {
      throw new Error(`guard_expected_workflow_502_got_${workflowMismatchResponse.status}`);
    }
    if (workflowMismatchJson?.details?.upstream_path !== '/publications/10/workflow-detail') {
      throw new Error('guard_missing_workflow_upstream_path_detail');
    }
    if (workflowMismatchJson?.details?.reason !== 'invalid_workflow_detail_payload') {
      throw new Error('guard_missing_workflow_reason_detail');
    }

    const buildLogMismatchResponse = await fetch(`${baseUrl}/api/publications/10/build-log`, {
      headers: { accept: 'application/json' }
    });
    const buildLogMismatchJson = await buildLogMismatchResponse.json();
    if (buildLogMismatchResponse.status !== 502 || buildLogMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_build_log_502_got_${buildLogMismatchResponse.status}`);
    }
    if (buildLogMismatchJson?.details?.upstream_path !== '/publications/10/build-log') {
      throw new Error('guard_missing_build_log_upstream_path_detail');
    }
    if (buildLogMismatchJson?.details?.reason !== 'invalid_publication_build_log_payload') {
      throw new Error('guard_missing_build_log_reason_detail');
    }

    const deploymentsMismatchResponse = await fetch(`${baseUrl}/api/publications/10/deployments`, {
      headers: { accept: 'application/json' }
    });
    const deploymentsMismatchJson = await deploymentsMismatchResponse.json();
    if (
      deploymentsMismatchResponse.status !== 502 ||
      deploymentsMismatchJson?.error !== 'upstream_contract_mismatch'
    ) {
      throw new Error(`guard_expected_deployments_502_got_${deploymentsMismatchResponse.status}`);
    }
    if (deploymentsMismatchJson?.details?.upstream_path !== '/publications/10/deployments') {
      throw new Error('guard_missing_deployments_upstream_path_detail');
    }
    if (deploymentsMismatchJson?.details?.reason !== 'invalid_publication_deployments_payload') {
      throw new Error('guard_missing_deployments_reason_detail');
    }

    const previewMismatchResponse = await fetch(`${baseUrl}/api/publications/10/preview`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const previewMismatchJson = await previewMismatchResponse.json();
    if (previewMismatchResponse.status !== 502 || previewMismatchJson?.error !== 'upstream_contract_mismatch') {
      throw new Error(`guard_expected_preview_502_got_${previewMismatchResponse.status}`);
    }
    if (previewMismatchJson?.details?.upstream_path !== '/publications/10/preview') {
      throw new Error('guard_missing_preview_upstream_path_detail');
    }
    if (previewMismatchJson?.details?.reason !== 'invalid_publication_preview_payload') {
      throw new Error('guard_missing_preview_reason_detail');
    }

    const guardsResponse = await fetch(`${baseUrl}/api/compat/guards`, { headers: { accept: 'application/json' } });
    const guardsJson = await guardsResponse.json();
    if (!guardsResponse.ok || !Array.isArray(guardsJson?.guards) || guardsJson.guards.length === 0) {
      throw new Error('guards_catalog_unavailable');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/publications/:id/workflow-detail')) {
      throw new Error('guards_catalog_missing_workflow_detail_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/clients/:id')) {
      throw new Error('guards_catalog_missing_client_item_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/users/:id')) {
      throw new Error('guards_catalog_missing_user_item_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/auth/me')) {
      throw new Error('guards_catalog_missing_auth_me_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/dashboard/summary')) {
      throw new Error('guards_catalog_missing_dashboard_summary_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/rubriques')) {
      throw new Error('guards_catalog_missing_rubriques_list_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/publications/:id/deployments')) {
      throw new Error('guards_catalog_missing_publication_deployments_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/publications/:id/deploy-summary')) {
      throw new Error('guards_catalog_missing_publication_deploy_summary_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/publications/:id/build-log')) {
      throw new Error('guards_catalog_missing_publication_build_log_guard');
    }
    if (!guardsJson.guards.some((guard) => guard?.path === '/publications/:id/deploy-artifacts')) {
      throw new Error('guards_catalog_missing_publication_deploy_artifacts_guard');
    }

    console.log('[smoke] admin-api upstream contract guards ok');
    console.log('[smoke] /api/clients passes; /api/auth/login, /api/auth/me, /api/auth/logout, /api/dashboard/summary, /api/programmes(read+write), /api/clients(write+item), /api/users/:id, /api/rubriques, /api/offres(content-type), /api/medias(invalid-json), /api/publications/:id/workflow-detail, /api/publications/:id/build-log, /api/publications/:id/deployments and /api/publications/:id/preview mismatches return 502 upstream_contract_mismatch');
  } finally {
    server.kill();
    await sleep(150);
    await new Promise((resolveStop) => upstream.close(resolveStop));
    if (serverStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${serverStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
