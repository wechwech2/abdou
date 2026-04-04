#!/usr/bin/env node

import { spawn } from 'node:child_process';
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

async function main() {
  const phpBin = resolvePhpBin();
  const port = 3215;
  const baseUrl = `http://127.0.0.1:${port}`;
  const marker = Date.now();

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

    const batimentCode = `BAT-E-${marker}`;
    const batiment = await fetchJson('/batiments', {
      method: 'POST',
      body: JSON.stringify({
        programme_id: 1,
        code: batimentCode,
        name: `Batiment Etages ${marker}`,
        display_order: 1,
        is_active: 1,
      }),
    });
    if (!batiment.response.ok || batiment.body?.ok !== true) {
      throw new Error(`batiment_create_failed:${batiment.response.status}`);
    }
    const batimentId = Number(batiment.body?.item?.id ?? 0);
    if (!Number.isInteger(batimentId) || batimentId <= 0) {
      throw new Error('batiment_id_invalid');
    }

    const created = await fetchJson('/etages', {
      method: 'POST',
      body: JSON.stringify({
        batiment_id: batimentId,
        code: `R+${marker % 50}`,
        name: `Etage ${marker}`,
        level_number: 1,
        display_order: 1,
      }),
    });
    if (!created.response.ok || created.body?.ok !== true) {
      throw new Error(`etage_create_failed:${created.response.status}`);
    }
    const etageId = Number(created.body?.item?.id ?? 0);
    if (!Number.isInteger(etageId) || etageId <= 0) {
      throw new Error('etage_id_invalid');
    }

    const updated = await fetchJson(`/etages/${etageId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: `Etage ${marker} updated`,
        level_number: 2,
      }),
    });
    if (!updated.response.ok || updated.body?.ok !== true) {
      throw new Error(`etage_update_failed:${updated.response.status}`);
    }

    const byBatiment = await fetchJson(`/batiments/${batimentId}/etages`);
    if (!byBatiment.response.ok || !Array.isArray(byBatiment.body?.items)) {
      throw new Error(`batiment_etages_failed:${byBatiment.response.status}`);
    }
    const foundByBatiment = byBatiment.body.items.some((item) => Number(item?.id ?? 0) === etageId);
    if (!foundByBatiment) {
      throw new Error('etage_not_found_in_batiment_list');
    }

    const list = await fetchJson(`/etages?batiment_id=${batimentId}&limit=100`);
    if (!list.response.ok || !Array.isArray(list.body?.items)) {
      throw new Error(`etages_list_failed:${list.response.status}`);
    }
    const foundInList = list.body.items.some((item) => Number(item?.id ?? 0) === etageId);
    if (!foundInList) {
      throw new Error('etage_not_found_in_etages_list');
    }

    console.log('[smoke] admin-php etages workflow ok');
    console.log(`[smoke] batiment_id=${batimentId}`);
    console.log(`[smoke] etage_id=${etageId}`);
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
