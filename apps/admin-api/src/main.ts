import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import type {
  AdminApiCompatGuardsPayload,
  AdminApiCompatRoutesPayload,
  AdminApiCompatWriteGuardsPayload,
  AdminApiContractsPayload,
  AdminApiHealthPayload,
  AdminApiModuleDetailPayload,
  AdminApiModulesPayload
} from '@abdou/shared-types';
import { appModule } from './app.module.js';
import { sendJsonError, sendJsonSuccess } from './common/http.js';
import { readAdminApiEnv } from './config/env.js';
import { buildContractCatalog } from './modules/contracts.js';
import { listCompatRoutes, resolveCompatRoute } from './modules/compat-routes.js';
import { findModuleByCode } from './modules/module-catalog.js';
import { proxyGetToAdminPhp, proxyRequestToAdminPhp } from './modules/read-model-proxy.js';
import {
  listReadContractGuards,
  listWriteContractGuards,
  resolveReadContractGuard,
  resolveWriteContractGuard
} from './modules/upstream-contract-guards.js';

type SupportedHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function asSupportedHttpMethod(value: string | undefined): SupportedHttpMethod | null {
  if (value === 'GET' || value === 'POST' || value === 'PUT' || value === 'PATCH' || value === 'DELETE') {
    return value;
  }
  return null;
}

function normalizePath(rawUrl: string | undefined): string {
  if (!rawUrl) {
    return '/';
  }

  const [pathPart] = rawUrl.split('?');
  return pathPart || '/';
}

export async function bootstrap(): Promise<void> {
  const env = readAdminApiEnv();
  const server = createServer(async (request, response) => {
    const method = asSupportedHttpMethod(request.method);
    if (method === null) {
      response.setHeader('allow', 'GET, POST, PUT, PATCH, DELETE');
      sendJsonError(response, 405, 'method_not_allowed', `Unsupported HTTP method: ${String(request.method ?? '')}`);
      return;
    }
    const path = normalizePath(request.url);
    const search = request.url?.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';

    if (method === 'GET' && path === '/health') {
      const payload: AdminApiHealthPayload = {
        service: appModule.name,
        version: appModule.version,
        status: 'ok',
        environment: env.appEnv,
        timestamp: new Date().toISOString()
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/api/modules') {
      const payload: AdminApiModulesPayload = {
        modules: appModule.modules,
        routes: appModule.routes
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (method === 'GET' && path.startsWith('/api/modules/')) {
      const code = path.replace('/api/modules/', '').trim();
      const moduleDescriptor = findModuleByCode(code);
      if (moduleDescriptor === null) {
        sendJsonError(response, 404, 'module_not_found', `Unknown module code: ${code}`);
        return;
      }

      const payload: AdminApiModuleDetailPayload = {
        module: moduleDescriptor
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/api/contracts') {
      const payload: AdminApiContractsPayload = {
        contracts: buildContractCatalog()
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/api/compat/routes') {
      const payload: AdminApiCompatRoutesPayload = {
        routes: listCompatRoutes()
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/api/compat/guards') {
      const payload: AdminApiCompatGuardsPayload = {
        guards: listReadContractGuards()
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/api/compat/write-guards') {
      const payload: AdminApiCompatWriteGuardsPayload = {
        guards: listWriteContractGuards()
      };
      sendJsonSuccess(response, 200, payload);
      return;
    }

    if (!env.compatEnabled && path.startsWith('/api/')) {
      sendJsonError(response, 410, 'compat_disabled', 'admin_api_compat_routes_disabled', {
        hint: 'Set ADMIN_API_COMPAT_ENABLED=true to re-enable proxy compatibility routes.'
      });
      return;
    }

    const compatRoute = resolveCompatRoute(method, path);
    if (compatRoute !== null) {
      if (compatRoute.mode === 'read') {
        await proxyGetToAdminPhp(
          request,
          response,
          env,
          compatRoute.upstreamPath,
          search,
          resolveReadContractGuard(compatRoute.upstreamPath)
        );
        return;
      }

      await proxyRequestToAdminPhp(
        request,
        response,
        env,
        method,
        compatRoute.upstreamPath,
        search,
        resolveWriteContractGuard(compatRoute.upstreamPath)
      );
      return;
    }

    sendJsonError(response, 404, 'not_found', `No route matches ${method} ${path}`);
  });

  server.listen(env.port, env.host, () => {
    process.stdout.write(
      `[admin-api] listening on http://${env.host}:${env.port} (env=${env.appEnv}, compat=${env.compatEnabled ? 'on' : 'off'})\n`
    );
  });
}

const isDirectRun =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  bootstrap().catch((error: unknown) => {
    process.stderr.write(`[admin-api] fatal bootstrap error: ${String(error)}\n`);
    process.exitCode = 1;
  });
}
