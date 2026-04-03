#!/usr/bin/env node

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function runVerifyCli(root, args) {
  const result = spawnSync(process.execPath, ['deploy/ovh/ftp/verify-site.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: false
  });
  return result;
}

function runVerifyCliAsync(root, args) {
  return new Promise((resolveCli) => {
    const child = spawn(process.execPath, ['deploy/ovh/ftp/verify-site.mjs', ...args], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      resolveCli({ status: 1, stdout, stderr, error });
    });

    child.on('close', (code) => {
      resolveCli({ status: code ?? 1, stdout, stderr, error: null });
    });
  });
}

async function main() {
  const root = process.cwd();
  const smokeRoot = resolve(root, 'tmp', 'smoke', 'deploy-verify');
  const targetDir = resolve(smokeRoot, 'target');
  const marker = 'deploy-verify-smoke-marker';
  let httpUrl = '';

  await rm(smokeRoot, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await writeFile(
    resolve(targetDir, 'index.html'),
    `<!doctype html><html><body><h1>${marker}</h1></body></html>\n`,
    'utf8'
  );

  const verifyModuleUrl = pathToFileURL(resolve(root, 'deploy', 'ovh', 'ftp', 'verify-site.mjs')).href;
  const { verifySite } = await import(verifyModuleUrl);

  const okResult = await verifySite({
    rootDir: root,
    target: targetDir,
    expects: [marker]
  });

  if (okResult.status !== 'ok') {
    throw new Error('deploy_verify_smoke_module_expected_ok');
  }
  if (!(await exists(okResult.log_path))) {
    throw new Error('deploy_verify_smoke_module_log_missing');
  }

  const failedCli = runVerifyCli(root, [`--target=${targetDir}`, '--expect=missing-marker']);
  if (failedCli.status === 0) {
    throw new Error('deploy_verify_smoke_cli_should_fail_when_marker_missing');
  }

  const okCli = runVerifyCli(root, [`--target=${targetDir}`, `--expect=${marker}`]);
  if (okCli.status !== 0) {
    throw new Error(
      `deploy_verify_smoke_cli_expected_ok:${okCli.status}:${String(okCli.stderr || '').trim()}`
    );
  }

  const server = createServer(async (_req, res) => {
    const html = await readFile(resolve(targetDir, 'index.html'), 'utf8');
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(html);
  });
  await new Promise((resolveStart, rejectStart) => {
    server.once('error', rejectStart);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectStart);
      resolveStart();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('deploy_verify_smoke_http_address_unavailable');
  }
  httpUrl = `http://127.0.0.1:${address.port}`;

  try {
    const httpOkResult = await verifySite({
      rootDir: root,
      url: httpUrl,
      expects: [marker]
    });
    if (httpOkResult.status !== 'ok') {
      throw new Error('deploy_verify_smoke_http_module_expected_ok');
    }

    const httpFailedCli = await runVerifyCliAsync(root, [`--url=${httpUrl}`, '--expect=missing-marker']);
    if (httpFailedCli.status === 0) {
      throw new Error('deploy_verify_smoke_http_cli_should_fail_when_marker_missing');
    }

    const httpOkCli = await runVerifyCliAsync(root, [`--url=${httpUrl}`, `--expect=${marker}`]);
    if (httpOkCli.status !== 0) {
      throw new Error(
        `deploy_verify_smoke_http_cli_expected_ok:${httpOkCli.status}:${String(httpOkCli.stderr || '').trim()}`
      );
    }

    const timeoutResult = await verifySite({
      rootDir: root,
      url: 'http://127.0.0.1:1',
      expects: [marker],
      timeoutMs: 200
    });
    if (timeoutResult.status !== 'failed') {
      throw new Error('deploy_verify_smoke_http_timeout_expected_failed');
    }
    const hasHttpFetchFailure = timeoutResult.checks.some(
      (entry) => entry && entry.check === 'http_fetch' && entry.ok === false
    );
    if (!hasHttpFetchFailure) {
      throw new Error('deploy_verify_smoke_http_timeout_check_missing');
    }
  } finally {
    await new Promise((resolveStop) => server.close(resolveStop));
  }

  const logs = await readFile(okResult.log_path, 'utf8');
  if (!logs.includes('"status": "ok"') && !logs.includes('"status":"ok"')) {
    throw new Error('deploy_verify_smoke_log_does_not_contain_ok_status');
  }

  console.log('[smoke] deploy verify workflow ok');
  console.log(`[smoke] target_dir=${targetDir}`);
  console.log(`[smoke] verify_log=${okResult.log_path}`);
  console.log(`[smoke] verify_url=${httpUrl}`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
