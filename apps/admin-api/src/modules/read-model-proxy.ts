import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AdminApiEnv } from '../config/env.js';
import { sendJsonError } from '../common/http.js';

export interface UpstreamResult {
  status: number;
  contentType: string;
  text: string;
  setCookie: string[];
  upstreamUrl: string;
}

export type UpstreamContractGuard = (status: number, body: unknown) => string | null;

export async function proxyRequestToAdminPhp(
  request: IncomingMessage,
  response: ServerResponse,
  env: AdminApiEnv,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  upstreamPath: string,
  search = '',
  guard?: UpstreamContractGuard
): Promise<void> {
  const upstreamUrl = `${env.adminPhpBaseUrl}${upstreamPath}${search}`;
  try {
    const result = await requestAdminPhp(request, env, method, upstreamPath, search);
    const guardError = runGuard(guard, result);
    if (guardError !== null) {
      sendJsonError(response, 502, 'upstream_contract_mismatch', 'admin_php_response_contract_mismatch', {
        upstream: result.upstreamUrl,
        upstream_path: upstreamPath,
        status: result.status,
        reason: guardError
      });
      return;
    }
    response.statusCode = result.status;
    response.setHeader('content-type', result.contentType);
    if (result.setCookie.length > 0) {
      response.setHeader('set-cookie', result.setCookie);
    }
    response.end(result.text);
  } catch (error) {
    const reason = isAbortError(error) ? 'timeout' : 'network_error';
    sendJsonError(response, 502, 'upstream_unavailable', 'admin_php_unreachable', {
      upstream: upstreamUrl,
      reason,
      timeout_ms: env.adminPhpTimeoutMs
    });
  }
}

export async function proxyGetToAdminPhp(
  request: IncomingMessage,
  response: ServerResponse,
  env: AdminApiEnv,
  upstreamPath: string,
  search = '',
  guard?: UpstreamContractGuard
): Promise<void> {
  await proxyRequestToAdminPhp(request, response, env, 'GET', upstreamPath, search, guard);
}

export async function requestAdminPhp(
  request: IncomingMessage,
  env: AdminApiEnv,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  upstreamPath: string,
  search = ''
): Promise<UpstreamResult> {
  const cookie = request.headers.cookie ?? '';
  const accept = request.headers.accept ?? 'application/json';
  const contentType = request.headers['content-type'] ?? 'application/json';
  const upstreamUrl = `${env.adminPhpBaseUrl}${upstreamPath}${search}`;

  let rawBody: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    rawBody = await readRequestBody(request);
  }

  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => {
    abortController.abort();
  }, env.adminPhpTimeoutMs);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: {
        accept,
        cookie,
        'content-type': String(contentType)
      },
      body: rawBody,
      signal: abortController.signal
    });
  } finally {
    clearTimeout(timeoutHandle);
  }

  return {
    status: upstreamResponse.status,
    contentType: upstreamResponse.headers.get('content-type') ?? 'application/json; charset=utf-8',
    text: await upstreamResponse.text(),
    setCookie: extractSetCookies(upstreamResponse),
    upstreamUrl
  };
}

function extractSetCookies(response: Response): string[] {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithSetCookie.getSetCookie === 'function') {
    return headersWithSetCookie.getSetCookie().filter((value) => String(value || '').trim() !== '');
  }

  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { name?: unknown };
  return String(candidate.name || '') === 'AbortError';
}

function runGuard(guard: UpstreamContractGuard | undefined, result: UpstreamResult): string | null {
  if (!guard || result.status < 200 || result.status >= 300) {
    return null;
  }
  if (!result.contentType.toLowerCase().includes('application/json')) {
    return 'expected_json_content_type';
  }

  let body: unknown;
  try {
    body = JSON.parse(result.text);
  } catch {
    return 'invalid_json_payload';
  }

  return guard(result.status, body);
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    request.on('error', reject);
  });
}
