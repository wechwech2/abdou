#!/usr/bin/env node

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function parsePublicationId(argv) {
  const flag = argv.find((arg) => arg.startsWith('--publicationId='));
  if (!flag) {
    return null;
  }
  const raw = flag.split('=')[1] ?? '';
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) {
      continue;
    }
    const [key, ...rest] = raw.slice(2).split('=');
    args[key] = rest.length > 0 ? rest.join('=') : 'true';
  }
  return args;
}

async function findLatestBuildDir(publicationId, rootDir) {
  const publishedDir = resolve(rootDir, 'dist', 'published-sites');
  if (!existsSync(publishedDir)) {
    return null;
  }

  const entries = await readdir(publishedDir, { withFileTypes: true });
  const matches = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const expectedPrefix = `publication-${publicationId}-`;
    if (!entry.name.startsWith(expectedPrefix)) {
      continue;
    }
    const fullPath = resolve(publishedDir, entry.name);
    const info = await stat(fullPath);
    matches.push({ fullPath, mtimeMs: info.mtimeMs });
  }

  if (matches.length === 0) {
    return null;
  }

  matches.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return matches[0].fullPath;
}

async function loadFtpTools(rootDir) {
  const deployModuleUrl = pathToFileURL(resolve(rootDir, 'deploy', 'ovh', 'ftp', 'deploy-site.mjs')).href;
  const verifyModuleUrl = pathToFileURL(resolve(rootDir, 'deploy', 'ovh', 'ftp', 'verify-site.mjs')).href;

  const deployModule = await import(deployModuleUrl);
  const verifyModule = await import(verifyModuleUrl);

  return {
    deploySite: deployModule.deploySite,
    verifySite: verifyModule.verifySite,
  };
}

function normalizeLines(input) {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function deployPublication(publicationId, rootDir = resolve(process.cwd())) {
  const logsDir = resolve(rootDir, 'dist', 'logs', 'deployments');
  const logFile = resolve(logsDir, `publication-${publicationId}.log`);
  const startedAt = new Date().toISOString();
  const lines = [`[${startedAt}] START publication_id=${publicationId}`];

  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode ?? process.env.DEPLOY_MODE ?? 'local';
  const targetDir = resolve(
    rootDir,
    args.targetDir ?? process.env.DEPLOY_TARGET_DIR ?? resolve('dist', 'preview')
  );
  const verifyUrl = args.verifyUrl ?? process.env.DEPLOY_VERIFY_URL ?? '';
  const verifyExpectRaw = args.verifyExpect ?? process.env.DEPLOY_VERIFY_EXPECT ?? '';
  const verifyExpect = normalizeLines(String(verifyExpectRaw).replaceAll(',', '\n'));

  let latestBuildDir = null;
  let deployResult = null;
  let verifyResult = null;

  try {
    latestBuildDir = await findLatestBuildDir(publicationId, rootDir);
    if (latestBuildDir === null) {
      lines.push(`[${new Date().toISOString()}] ERROR build_not_found publication_id=${publicationId}`);
      await mkdir(logsDir, { recursive: true });
      await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');
      return {
        ok: false,
        publicationId,
        logPath: logFile,
        stdout: '',
        stderr: lines.join('\n'),
        manifestPath: null,
        verifyLogPath: null,
        targetDir,
        sourceDir: null,
        mode,
        verifyStatus: 'failed',
      };
    }

    lines.push(`[${new Date().toISOString()}] SOURCE ${latestBuildDir}`);
    lines.push(`[${new Date().toISOString()}] TARGET ${targetDir}`);
    lines.push(`[${new Date().toISOString()}] MODE ${mode}`);

    const { deploySite, verifySite } = await loadFtpTools(rootDir);

    deployResult = await deploySite({
      rootDir,
      source: latestBuildDir,
      target: targetDir,
      mode,
    });

    lines.push(
      `[${new Date().toISOString()}] DEPLOY status=${deployResult.status} files=${deployResult.source_files} manifest=${deployResult.manifest_path}`
    );

    verifyResult = await verifySite({
      rootDir,
      target: targetDir,
      expects: verifyExpect,
    });
    lines.push(
      `[${new Date().toISOString()}] VERIFY mode=filesystem status=${verifyResult.status} checks=${verifyResult.checks.length} log=${verifyResult.log_path}`
    );

    if (verifyUrl) {
      const remoteVerify = await verifySite({
        rootDir,
        url: verifyUrl,
        expects: verifyExpect,
      });
      lines.push(
        `[${new Date().toISOString()}] VERIFY mode=http status=${remoteVerify.status} checks=${remoteVerify.checks.length} log=${remoteVerify.log_path}`
      );
      if (remoteVerify.status !== 'ok') {
        throw new Error(`verify_http_failed:${verifyUrl}`);
      }
    }

    if (verifyResult.status !== 'ok') {
      throw new Error('verify_filesystem_failed');
    }

    lines.push(`[${new Date().toISOString()}] DONE status=ok`);

    await mkdir(logsDir, { recursive: true });
    await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');

    return {
      ok: true,
      publicationId,
      logPath: logFile,
      stdout: `[deploy-publication] publication_id=${publicationId}
[deploy-publication] source=${latestBuildDir}
[deploy-publication] target=${targetDir}
[deploy-publication] mode=${mode}
[deploy-publication] manifest=${deployResult.manifest_path}
[deploy-publication] verify_log=${verifyResult.log_path}
[deploy-publication] log=${logFile}`,
      stderr: '',
      manifestPath: deployResult.manifest_path,
      verifyLogPath: verifyResult.log_path,
      targetDir,
      sourceDir: latestBuildDir,
      mode,
      verifyStatus: verifyResult.status,
    };
  } catch (error) {
    lines.push(`[${new Date().toISOString()}] ERROR ${String(error instanceof Error ? error.message : error)}`);
    lines.push(`[${new Date().toISOString()}] DONE status=failed`);
    await mkdir(logsDir, { recursive: true });
    await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');
    return {
      ok: false,
      publicationId,
      logPath: logFile,
      stdout: '',
      stderr: lines.join('\n'),
      manifestPath: deployResult?.manifest_path ?? null,
      verifyLogPath: verifyResult?.log_path ?? null,
      targetDir,
      sourceDir: latestBuildDir,
      mode,
      verifyStatus: verifyResult?.status ?? 'failed',
    };
  }
}

const executedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (executedAsScript) {
  const publicationId = parsePublicationId(process.argv.slice(2));
  if (publicationId === null) {
    console.error('[deploy-publication] Missing or invalid --publicationId=<int>.');
    process.exit(1);
  }

  const result = await deployPublication(publicationId);
  if (!result.ok) {
    process.stderr.write(`${result.stderr}\n`);
    process.exit(1);
  }
  console.log(result.stdout);
}
