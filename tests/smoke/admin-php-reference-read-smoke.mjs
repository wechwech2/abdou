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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json };
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label}_expected_array`);
  }
}

function ensurePositiveInt(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label}_expected_positive_integer`);
  }
}

async function main() {
  const port = 3220;
  const baseUrl = `http://127.0.0.1:${port}`;
  const phpBin = resolvePhpBin();

  const phpServer = spawn(
    phpBin,
    ['-S', `127.0.0.1:${port}`, '-t', 'apps/admin-php/public', 'apps/admin-php/public/index.php'],
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
  let hasFailure = true;

  try {
    await waitForHealth(baseUrl);

    const unauthOffres = await fetchJson(`${baseUrl}/offres`, {
      headers: { accept: 'application/json' }
    });
    if (unauthOffres.status !== 401 || unauthOffres.json?.error !== 'unauthorized') {
      throw new Error(`reference_read_unauth_expected_401_got_${unauthOffres.status}`);
    }

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@abdou.local', password: '0000' })
    });
    const loginText = await login.text();
    let loginJson = null;
    try {
      loginJson = JSON.parse(loginText);
    } catch {
      loginJson = { raw: loginText };
    }
    if (!login.ok || !loginJson?.ok) {
      throw new Error(`reference_read_login_failed:${login.status}`);
    }

    let cookie = mergeCookie('', login.headers.get('set-cookie'));
    const asAdmin = async (url, options = {}) => {
      const responseObj = await fetch(url, {
        ...options,
        headers: {
          accept: 'application/json',
          ...(options.headers || {}),
          cookie
        }
      });
      cookie = mergeCookie(cookie, responseObj.headers.get('set-cookie'));
      const text = await responseObj.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      return { status: responseObj.status, ok: responseObj.ok, json };
    };

    const offres = await asAdmin(`${baseUrl}/offres?limit=5`);
    if (!offres.ok || !offres.json?.ok) {
      throw new Error(`reference_read_offres_failed:${offres.status}`);
    }
    ensureArray(offres.json?.items, 'offres_items');
    ensurePositiveInt(Number(offres.json?.meta?.page), 'offres_meta_page');
    ensurePositiveInt(Number(offres.json?.meta?.limit), 'offres_meta_limit');
    const firstOffreId = Number(offres.json.items[0]?.id || 0);
    ensurePositiveInt(firstOffreId, 'offres_first_id');

    const offreDetail = await asAdmin(`${baseUrl}/offres/${firstOffreId}`);
    if (!offreDetail.ok || !offreDetail.json?.ok) {
      throw new Error(`reference_read_offre_detail_failed:${offreDetail.status}`);
    }
    if (Number(offreDetail.json?.item?.id || 0) !== firstOffreId) {
      throw new Error('reference_read_offre_detail_id_mismatch');
    }

    const templates = await asAdmin(`${baseUrl}/templates?limit=5`);
    if (!templates.ok || !templates.json?.ok) {
      throw new Error(`reference_read_templates_failed:${templates.status}`);
    }
    ensureArray(templates.json?.items, 'templates_items');
    const firstTemplateId = Number(templates.json.items[0]?.id || 0);
    ensurePositiveInt(firstTemplateId, 'templates_first_id');

    const templateDetail = await asAdmin(`${baseUrl}/templates/${firstTemplateId}`);
    if (!templateDetail.ok || !templateDetail.json?.ok) {
      throw new Error(`reference_read_template_detail_failed:${templateDetail.status}`);
    }
    if (Number(templateDetail.json?.item?.id || 0) !== firstTemplateId) {
      throw new Error('reference_read_template_detail_id_mismatch');
    }

    const roles = await asAdmin(`${baseUrl}/roles`);
    if (!roles.ok || !roles.json?.ok) {
      throw new Error(`reference_read_roles_failed:${roles.status}`);
    }
    ensureArray(roles.json?.items, 'roles_items');
    const roleCodes = new Set((roles.json.items || []).map((item) => String(item.code || '')));
    if (!roleCodes.has('admin')) {
      throw new Error('reference_read_roles_missing_admin_code');
    }
    if (roleCodes.size < 2) {
      throw new Error('reference_read_roles_expected_multiple_codes');
    }

    const users = await asAdmin(`${baseUrl}/users`);
    if (!users.ok || !users.json?.ok) {
      throw new Error(`reference_read_users_failed:${users.status}`);
    }
    ensureArray(users.json?.items, 'users_items');
    const firstUserId = Number(users.json.items[0]?.id || 0);
    ensurePositiveInt(firstUserId, 'users_first_id');

    const userDetail = await asAdmin(`${baseUrl}/users/${firstUserId}`);
    if (!userDetail.ok || !userDetail.json?.ok) {
      throw new Error(`reference_read_user_detail_failed:${userDetail.status}`);
    }
    if (Number(userDetail.json?.item?.id || 0) !== firstUserId) {
      throw new Error('reference_read_user_detail_id_mismatch');
    }

    console.log('[smoke] admin-php reference read endpoints ok');
    console.log('[smoke] unauth /offres -> 401');
    console.log(`[smoke] offre_id=${firstOffreId}`);
    console.log(`[smoke] template_id=${firstTemplateId}`);
    console.log(`[smoke] user_id=${firstUserId}`);
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
