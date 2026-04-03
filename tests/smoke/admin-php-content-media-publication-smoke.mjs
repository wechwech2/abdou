#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolvePhpBin } from './php-bin.mjs';

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForHealth(baseUrl, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(200);
  }
  throw new Error('health_timeout');
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

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    shell: false,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (Number(result.status ?? 1) !== 0) {
    throw new Error(`${label}_failed:${String(result.stderr || result.stdout || '').trim()}`);
  }
  return String(result.stdout || '').trim();
}

function runWithStatus(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    shell: false,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function createPublicationId() {
  const script = resolve(process.cwd(), 'apps', 'admin-php', 'scripts', 'create-publication.php');
  const phpBin = resolvePhpBin();
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const result = runWithStatus(phpBin, [script, '--programmeId=1', '--createdBy=1']);
    if (Number(result.status ?? 1) === 0) {
      const publicationId = Number(String(result.stdout || '').trim());
      if (!Number.isInteger(publicationId) || publicationId <= 0) {
        throw new Error('invalid_publication_id');
      }
      return publicationId;
    }
    const stderr = String(result.stderr || '').trim();
    if (!stderr.includes('uq_publications_build_code') || attempt === 4) {
      throw new Error(`create_publication_failed:${stderr}`);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1100);
  }
  throw new Error('create_publication_failed');
}

async function main() {
  const phpBin = resolvePhpBin();
  const port = 3213;
  const baseUrl = `http://127.0.0.1:${port}`;
  const marker = `SMOKE-${Date.now()}`;
  const mediaUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c';
  const mediaName = `smoke-${Date.now()}.jpg`;

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
    {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stderr = '';
  phpServer.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForHealth(baseUrl);

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' }),
    });
    if (!login.ok) {
      throw new Error(`login_failed:${login.status}`);
    }
    let cookie = mergeCookie('', login.headers.get('set-cookie'));

    const fetchJson = async (path, init = {}) => {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          cookie,
          ...(init.headers ?? {}),
        },
      });
      cookie = mergeCookie(cookie, response.headers.get('set-cookie'));
      const text = await response.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
      return { response, body };
    };

    const programmeUpdate = await fetchJson('/programmes/1', {
      method: 'PUT',
      body: JSON.stringify({
        headline: `Headline ${marker}`,
        short_description: `Short ${marker}`,
        full_description: `Full ${marker}`,
        city: 'Tunis',
      }),
    });
    if (!programmeUpdate.response.ok) {
      throw new Error(`programme_update_failed:${programmeUpdate.response.status}`);
    }

    const rubriques = await fetchJson('/rubriques?programme_id=1&limit=100');
    if (!rubriques.response.ok || !Array.isArray(rubriques.body?.items) || rubriques.body.items.length === 0) {
      throw new Error('rubriques_list_failed');
    }
    const rubriqueId = Number(rubriques.body.items[0]?.id ?? 0);
    if (!rubriqueId) {
      throw new Error('rubrique_id_missing');
    }

    const rubriqueUpdate = await fetchJson(`/rubriques/${rubriqueId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: `Rubrique ${marker}`,
        content_text: `Rubrique content ${marker}`,
        is_enabled: 1,
        is_menu_visible: 1,
      }),
    });
    if (!rubriqueUpdate.response.ok) {
      throw new Error(`rubrique_update_failed:${rubriqueUpdate.response.status}`);
    }

    const mediaCreate = await fetchJson('/medias', {
      method: 'POST',
      body: JSON.stringify({
        type: 'image',
        mime_type: 'image/jpeg',
        original_filename: mediaName,
        storage_filename: mediaName,
        storage_path: mediaUrl,
        public_url: mediaUrl,
        title: `Media ${marker}`,
        alt_text: `Alt ${marker}`,
        caption: `Caption ${marker}`,
        status: 'published',
      }),
    });
    if (!mediaCreate.response.ok) {
      throw new Error(`media_create_failed:${mediaCreate.response.status}`);
    }
    const mediaId = Number(mediaCreate.body?.item?.id ?? 0);
    if (!mediaId) {
      throw new Error('media_id_missing');
    }

    const mediaAttach = await fetchJson('/programmes/1/medias', {
      method: 'POST',
      body: JSON.stringify({
        media_id: mediaId,
        usage_code: 'gallery',
        is_published: 1,
        is_featured: 0,
      }),
    });
    if (!mediaAttach.response.ok) {
      throw new Error(`media_attach_failed:${mediaAttach.response.status}`);
    }

    const publicationId = createPublicationId();
    run(process.execPath, ['deploy/scripts/build-publication.mjs', `--publicationId=${publicationId}`], 'build_publication');
    run(
      process.execPath,
      ['deploy/scripts/deploy-publication.mjs', `--publicationId=${publicationId}`, '--targetDir=dist/preview', '--mode=local'],
      'deploy_publication'
    );

    const previewPath = resolve(process.cwd(), 'dist', 'preview', 'minisites', 'residence-horizon', 'index.html');
    if (!existsSync(previewPath)) {
      throw new Error('preview_programme_html_missing');
    }
    const html = await readFile(previewPath, 'utf8');

    if (!html.includes(`Headline ${marker}`) || !html.includes(`Rubrique content ${marker}`)) {
      throw new Error('updated_editorial_content_not_rendered');
    }
    if (!html.includes('id="images"') || !html.includes(mediaUrl)) {
      throw new Error('updated_media_content_not_rendered');
    }

    console.log('[smoke] admin-php content/media publication workflow ok');
    console.log(`[smoke] marker=${marker}`);
    console.log(`[smoke] publication_id=${publicationId}`);
    console.log(`[smoke] preview=${previewPath}`);
  } finally {
    phpServer.kill();
    await sleep(100);
    if (stderr.trim() !== '') {
      console.log(`[smoke] php_stderr_tail=${stderr.trim().split('\n').slice(-4).join(' | ')}`);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});

