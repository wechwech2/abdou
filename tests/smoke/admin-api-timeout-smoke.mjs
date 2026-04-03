#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
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

async function listenHangServer(port = 0) {
  const server = createServer((socket) => {
    socket.on('error', () => {});
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('hang_server_address_invalid');
  }
  return {
    server,
    port: address.port
  };
}

async function main() {
  const { server: hangServer, port: hangPort } = await listenHangServer(0);
  const timeoutMs = 200;
  const port = 3221;
  const baseUrl = `http://127.0.0.1:${port}`;
  const adminPhpBaseUrl = `http://127.0.0.1:${hangPort}`;

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
        ADMIN_PHP_TIMEOUT_MS: String(timeoutMs),
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

    const startedAt = Date.now();
    const clients = await fetchJson(`${baseUrl}/api/clients`);
    const elapsedMs = Date.now() - startedAt;

    if (clients.status !== 502) {
      throw new Error(`timeout_expected_502_got_${clients.status}`);
    }
    if (clients.json?.error !== 'upstream_unavailable') {
      throw new Error(`timeout_expected_upstream_unavailable_got_${String(clients.json?.error || '-')}`);
    }
    if (clients.json?.details?.reason !== 'timeout') {
      throw new Error(`timeout_expected_reason_timeout_got_${String(clients.json?.details?.reason || '-')}`);
    }
    if (Number(clients.json?.details?.timeout_ms || 0) !== timeoutMs) {
      throw new Error(`timeout_expected_timeout_ms_${timeoutMs}_got_${String(clients.json?.details?.timeout_ms || '-')}`);
    }
    if (elapsedMs > 5000) {
      throw new Error(`timeout_request_too_long_${elapsedMs}`);
    }

    console.log('[smoke] admin-api upstream timeout handling ok');
    console.log(`[smoke] timeout_ms=${timeoutMs}`);
    console.log(`[smoke] elapsed_ms=${elapsedMs}`);
  } finally {
    server.kill();
    await sleep(150);
    hangServer.close();
    if (serverStdErr.trim()) {
      console.log(`[smoke] admin-api stderr:\n${serverStdErr.trim()}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
