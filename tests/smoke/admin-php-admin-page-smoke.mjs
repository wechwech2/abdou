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

function assertCondition(condition, code) {
  if (!condition) {
    throw new Error(code);
  }
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { accept: 'text/html,*/*' } });
  const text = await response.text();
  return { response, text };
}

async function main() {
  const port = 3227;
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

    const adminRoot = await fetchText(`${baseUrl}/admin`);
    const adminApi = await fetchText(`${baseUrl}/api/admin`);

    assertCondition(adminRoot.response.status === 200, 'admin_page_root_status');
    assertCondition(adminApi.response.status === 200, 'admin_page_api_status');

    const contentTypeRoot = String(adminRoot.response.headers.get('content-type') || '').toLowerCase();
    const contentTypeApi = String(adminApi.response.headers.get('content-type') || '').toLowerCase();
    assertCondition(contentTypeRoot.includes('text/html'), 'admin_page_root_content_type');
    assertCondition(contentTypeApi.includes('text/html'), 'admin_page_api_content_type');

    const checks = [
      '<title>Abdou Admin</title>',
      '<h1>Abdou Admin PHP</h1>',
      'id="btn-login"',
      'id="btn-logout"',
      'MVP admin en cours de migration vers OVH Hosting Pro.'
    ];
    for (const check of checks) {
      assertCondition(adminRoot.text.includes(check), `admin_page_root_missing:${check}`);
      assertCondition(adminApi.text.includes(check), `admin_page_api_missing:${check}`);
    }

    const normalizedRoot = adminRoot.text.replace(/\s+/g, ' ').trim();
    const normalizedApi = adminApi.text.replace(/\s+/g, ' ').trim();
    assertCondition(normalizedRoot === normalizedApi, 'admin_page_root_api_parity');

    console.log('[smoke] admin-php admin page contract ok');
    console.log('[smoke] endpoints=/admin,/api/admin');
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
