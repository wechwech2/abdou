#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPreview } from '../staging/build-preview.mjs';

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

export async function buildPublication(publicationId, rootDir = resolve(process.cwd())) {
  const previewDir = resolve(rootDir, 'dist', 'preview');
  const previewIndex = resolve(previewDir, 'index.html');
  const publishedDir = resolve(rootDir, 'dist', 'published-sites');
  const logsDir = resolve(rootDir, 'dist', 'logs', 'publications');
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const buildCode = `publication-${publicationId}-${timestamp}`;
  const targetDir = resolve(publishedDir, buildCode);
  const targetFile = resolve(targetDir, 'index.html');
  const logFile = resolve(logsDir, `publication-${publicationId}.log`);

  const lines = [];
  const startedAt = new Date().toISOString();
  lines.push(`[${startedAt}] START publication_id=${publicationId}`);

  try {
    const previewFile = await buildPreview(rootDir);
    lines.push(`[${new Date().toISOString()}] PREVIEW ${previewFile}`);
  } catch (error) {
    lines.push(`[${new Date().toISOString()}] ERROR build-preview failed`);
    lines.push(String(error instanceof Error ? error.message : error));
    await mkdir(logsDir, { recursive: true });
    await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');
    return {
      ok: false,
      publicationId,
      outputPath: null,
      logPath: logFile,
      stdout: '',
      stderr: lines.join('\n'),
    };
  }

  await mkdir(targetDir, { recursive: true });
  if (existsSync(previewIndex)) {
    await copyFile(previewIndex, targetFile);
  } else {
    const fallbackHtml = `<!doctype html><html><body><h1>Publication ${publicationId}</h1></body></html>`;
    await writeFile(targetFile, fallbackHtml, 'utf8');
  }

  const content = await readFile(targetFile, 'utf8');
  if (!content.includes('Abdou')) {
    lines.push(`[${new Date().toISOString()}] WARN output_missing_abdou_marker`);
  }

  lines.push(`[${new Date().toISOString()}] OUTPUT ${targetFile}`);
  lines.push(`[${new Date().toISOString()}] DONE`);

  await mkdir(logsDir, { recursive: true });
  await writeFile(logFile, `${lines.join('\n')}\n`, 'utf8');

  return {
    ok: true,
    publicationId,
    outputPath: targetFile,
    logPath: logFile,
    stdout: `[build-publication] publication_id=${publicationId}
[build-publication] output=${targetFile}
[build-publication] log=${logFile}`,
    stderr: '',
  };
}

const executedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (executedAsScript) {
  const publicationId = parsePublicationId(process.argv.slice(2));
  if (publicationId === null) {
    console.error('[build-publication] Missing or invalid --publicationId=<int>.');
    process.exit(1);
  }

  const result = await buildPublication(publicationId);
  if (!result.ok) {
    process.stderr.write(`${result.stderr}\n`);
    process.exit(1);
  }
  console.log(result.stdout);
}
