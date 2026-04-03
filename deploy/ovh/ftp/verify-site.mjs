#!/usr/bin/env node

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = { expect: [] };
  for (const raw of argv) {
    if (!raw.startsWith('--')) {
      continue;
    }
    const [k, ...rest] = raw.slice(2).split('=');
    const value = rest.length > 0 ? rest.join('=') : 'true';
    if (k === 'expect') {
      args.expect.push(value);
    } else {
      args[k] = value;
    }
  }
  return args;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function verifySite(input) {
  const url = input.url ?? null;
  const target = input.target ? resolve(input.target) : null;
  const expects = Array.isArray(input.expects) ? input.expects.filter(Boolean) : [];
  const requestedTimeoutMs = Number(input.timeoutMs ?? input.timeout_ms ?? 10_000);
  const timeoutMs =
    Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0
      ? Math.trunc(requestedTimeoutMs)
      : 10_000;
  const rootDir = input.rootDir ? resolve(input.rootDir) : resolve(process.cwd());

  if (!url && !target) {
    throw new Error('missing_target_or_url');
  }

  const now = new Date();
  const verifyId = now.toISOString().replace(/[.:]/g, '-');
  const logDir = resolve(rootDir, 'dist', 'logs', 'deployments');
  const logPath = resolve(logDir, `verify-site-${verifyId}.json`);
  await mkdir(logDir, { recursive: true });

  let status = 'ok';
  const checks = [];

  if (target) {
    const indexPath = resolve(target, 'index.html');
    const hasIndex = await exists(indexPath);
    checks.push({ check: 'target_index_exists', ok: hasIndex, value: indexPath });
    if (!hasIndex) {
      status = 'failed';
    } else if (expects.length > 0) {
      const html = await readFile(indexPath, 'utf8');
      for (const marker of expects) {
        const ok = html.includes(marker);
        checks.push({ check: 'target_contains', ok, value: marker });
        if (!ok) {
          status = 'failed';
        }
      }
    }
  }

  if (url) {
    let response = null;
    let body = '';
    try {
      response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });
      body = await response.text();
    } catch (error) {
      checks.push({
        check: 'http_fetch',
        ok: false,
        value: error instanceof Error ? error.message : String(error),
        timeout_ms: timeoutMs,
      });
      status = 'failed';
    }

    if (response) {
      const okStatus = response.status >= 200 && response.status < 400;
      checks.push({ check: 'http_status', ok: okStatus, value: response.status });
      if (!okStatus) {
        status = 'failed';
      }
      for (const marker of expects) {
        const ok = body.includes(marker);
        checks.push({ check: 'http_contains', ok, value: marker });
        if (!ok) {
          status = 'failed';
        }
      }
    }
  }

  const payload = {
    verify_id: verifyId,
    created_at: now.toISOString(),
    source: url ? 'http' : 'filesystem',
    url,
    target,
    checks,
    status,
    timeout_ms: url ? timeoutMs : null,
    log_path: logPath,
  };

  await writeFile(logPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = args.url ?? null;
  const target = args.target ? resolve(args.target) : null;
  const expects = Array.isArray(args.expect) ? args.expect.filter(Boolean) : [];
  const timeoutMs = Number(args['timeout-ms'] ?? 10_000);

  if (!url && !target) {
    console.error(
      '[verify-site] Usage: --url=<https://...> | --target=<dir> [--expect=text] [--timeout-ms=10000]'
    );
    process.exit(1);
  }

  try {
    const result = await verifySite({ url, target, expects, timeoutMs });
    console.log(`[verify-site] status=${result.status}`);
    console.log(`[verify-site] checks=${result.checks.length}`);
    if (url) {
      console.log(`[verify-site] timeout_ms=${result.timeout_ms}`);
    }
    console.log(`[verify-site] log=${result.log_path}`);
    if (result.status !== 'ok') {
      process.exit(1);
    }
  } catch (error) {
    console.error(`[verify-site] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

const executedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (executedAsScript) {
  main();
}
