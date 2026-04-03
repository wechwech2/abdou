import type {
  AdminApiCompatAccessPolicy,
  AdminApiCompatResponsePolicy,
  AdminApiCompatRouteDescriptor,
  AdminApiCompatRouteMode
} from '@abdou/shared-types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface StaticCompatRoute {
  descriptor: AdminApiCompatRouteDescriptor;
}

interface DynamicCompatRoute {
  descriptor: AdminApiCompatRouteDescriptor;
  pattern: RegExp;
  toUpstreamPath: (matches: RegExpMatchArray) => string;
}

export interface ResolvedCompatRoute {
  upstreamPath: string;
  mode: AdminApiCompatRouteMode;
  accessPolicy: AdminApiCompatAccessPolicy;
  responsePolicy: AdminApiCompatResponsePolicy;
}

function inferAccessPolicy(path: string, mode: AdminApiCompatRouteMode): AdminApiCompatAccessPolicy {
  if (path === '/api/auth/login') {
    return 'public';
  }
  if (path === '/api/auth/me' || path === '/api/auth/logout') {
    return 'session';
  }
  return mode === 'write' ? 'admin' : 'session';
}

function buildDescriptor(
  method: HttpMethod,
  path: string,
  upstreamPath: string,
  mode: AdminApiCompatRouteMode
): AdminApiCompatRouteDescriptor {
  return {
    method,
    path,
    upstreamPath,
    mode,
    accessPolicy: inferAccessPolicy(path, mode),
    responsePolicy: 'proxy_passthrough'
  };
}

const staticRoutes: readonly StaticCompatRoute[] = [
  { descriptor: buildDescriptor('POST', '/api/auth/login', '/auth/login', 'write') },
  { descriptor: buildDescriptor('GET', '/api/auth/me', '/auth/me', 'read') },
  { descriptor: buildDescriptor('POST', '/api/auth/logout', '/auth/logout', 'write') },
  { descriptor: buildDescriptor('GET', '/api/dashboard/summary', '/dashboard/summary', 'read') },
  { descriptor: buildDescriptor('GET', '/api/clients', '/clients', 'read') },
  { descriptor: buildDescriptor('POST', '/api/clients', '/clients', 'write') },
  { descriptor: buildDescriptor('GET', '/api/roles', '/roles', 'read') },
  { descriptor: buildDescriptor('GET', '/api/users', '/users', 'read') },
  { descriptor: buildDescriptor('GET', '/api/templates', '/templates', 'read') },
  { descriptor: buildDescriptor('GET', '/api/offres', '/offres', 'read') },
  { descriptor: buildDescriptor('GET', '/api/programmes', '/programmes', 'read') },
  { descriptor: buildDescriptor('POST', '/api/programmes', '/programmes', 'write') },
  { descriptor: buildDescriptor('GET', '/api/rubriques', '/rubriques', 'read') },
  { descriptor: buildDescriptor('POST', '/api/rubriques', '/rubriques', 'write') },
  { descriptor: buildDescriptor('GET', '/api/medias', '/medias', 'read') },
  { descriptor: buildDescriptor('POST', '/api/medias', '/medias', 'write') },
  { descriptor: buildDescriptor('GET', '/api/lots', '/lots', 'read') },
  { descriptor: buildDescriptor('POST', '/api/lots', '/lots', 'write') },
  { descriptor: buildDescriptor('GET', '/api/publications', '/publications', 'read') },
  { descriptor: buildDescriptor('POST', '/api/publications', '/publications', 'write') }
];

const dynamicRoutes: readonly DynamicCompatRoute[] = [
  {
    descriptor: buildDescriptor('GET', '/api/clients/:id', '/clients/:id', 'read'),
    pattern: /^\/api\/clients\/(\d+)$/,
    toUpstreamPath: (matches) => `/clients/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('PUT', '/api/clients/:id', '/clients/:id', 'write'),
    pattern: /^\/api\/clients\/(\d+)$/,
    toUpstreamPath: (matches) => `/clients/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/users/:id', '/users/:id', 'read'),
    pattern: /^\/api\/users\/(\d+)$/,
    toUpstreamPath: (matches) => `/users/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/offres/:id', '/offres/:id', 'read'),
    pattern: /^\/api\/offres\/(\d+)$/,
    toUpstreamPath: (matches) => `/offres/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/templates/:id', '/templates/:id', 'read'),
    pattern: /^\/api\/templates\/(\d+)$/,
    toUpstreamPath: (matches) => `/templates/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/programmes/:id', '/programmes/:id', 'read'),
    pattern: /^\/api\/programmes\/(\d+)$/,
    toUpstreamPath: (matches) => `/programmes/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('PUT', '/api/programmes/:id', '/programmes/:id', 'write'),
    pattern: /^\/api\/programmes\/(\d+)$/,
    toUpstreamPath: (matches) => `/programmes/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/rubriques/:id', '/rubriques/:id', 'read'),
    pattern: /^\/api\/rubriques\/(\d+)$/,
    toUpstreamPath: (matches) => `/rubriques/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('PUT', '/api/rubriques/:id', '/rubriques/:id', 'write'),
    pattern: /^\/api\/rubriques\/(\d+)$/,
    toUpstreamPath: (matches) => `/rubriques/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/medias/:id', '/medias/:id', 'read'),
    pattern: /^\/api\/medias\/(\d+)$/,
    toUpstreamPath: (matches) => `/medias/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/lots/:id', '/lots/:id', 'read'),
    pattern: /^\/api\/lots\/(\d+)$/,
    toUpstreamPath: (matches) => `/lots/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('PUT', '/api/lots/:id', '/lots/:id', 'write'),
    pattern: /^\/api\/lots\/(\d+)$/,
    toUpstreamPath: (matches) => `/lots/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('GET', '/api/publications/:id', '/publications/:id', 'read'),
    pattern: /^\/api\/publications\/(\d+)$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}`
  },
  {
    descriptor: buildDescriptor('PUT', '/api/publications/:id/status', '/publications/:id/status', 'write'),
    pattern: /^\/api\/publications\/(\d+)\/status$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/status`
  },
  {
    descriptor: buildDescriptor('POST', '/api/publications/:id/build', '/publications/:id/build', 'write'),
    pattern: /^\/api\/publications\/(\d+)\/build$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/build`
  },
  {
    descriptor: buildDescriptor('GET', '/api/publications/:id/build-log', '/publications/:id/build-log', 'read'),
    pattern: /^\/api\/publications\/(\d+)\/build-log$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/build-log`
  },
  {
    descriptor: buildDescriptor('GET', '/api/publications/:id/deploy-log', '/publications/:id/deploy-log', 'read'),
    pattern: /^\/api\/publications\/(\d+)\/deploy-log$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deploy-log`
  },
  {
    descriptor: buildDescriptor(
      'GET',
      '/api/publications/:id/deploy-manifest',
      '/publications/:id/deploy-manifest',
      'read'
    ),
    pattern: /^\/api\/publications\/(\d+)\/deploy-manifest$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deploy-manifest`
  },
  {
    descriptor: buildDescriptor(
      'GET',
      '/api/publications/:id/deploy-verify-log',
      '/publications/:id/deploy-verify-log',
      'read'
    ),
    pattern: /^\/api\/publications\/(\d+)\/deploy-verify-log$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deploy-verify-log`
  },
  {
    descriptor: buildDescriptor(
      'GET',
      '/api/publications/:id/deploy-artifacts',
      '/publications/:id/deploy-artifacts',
      'read'
    ),
    pattern: /^\/api\/publications\/(\d+)\/deploy-artifacts$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deploy-artifacts`
  },
  {
    descriptor: buildDescriptor(
      'GET',
      '/api/publications/:id/deploy-summary',
      '/publications/:id/deploy-summary',
      'read'
    ),
    pattern: /^\/api\/publications\/(\d+)\/deploy-summary$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deploy-summary`
  },
  {
    descriptor: buildDescriptor(
      'GET',
      '/api/publications/:id/workflow-detail',
      '/publications/:id/workflow-detail',
      'read'
    ),
    pattern: /^\/api\/publications\/(\d+)\/workflow-detail$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/workflow-detail`
  },
  {
    descriptor: buildDescriptor(
      'GET',
      '/api/publications/:id/deployments',
      '/publications/:id/deployments',
      'read'
    ),
    pattern: /^\/api\/publications\/(\d+)\/deployments$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deployments`
  },
  {
    descriptor: buildDescriptor('POST', '/api/publications/:id/deploy', '/publications/:id/deploy', 'write'),
    pattern: /^\/api\/publications\/(\d+)\/deploy$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/deploy`
  },
  {
    descriptor: buildDescriptor('POST', '/api/publications/:id/preview', '/publications/:id/preview', 'write'),
    pattern: /^\/api\/publications\/(\d+)\/preview$/,
    toUpstreamPath: (matches) => `/publications/${matches[1]}/preview`
  }
];

export function listCompatRoutes(): AdminApiCompatRouteDescriptor[] {
  return [
    ...staticRoutes.map((route) => route.descriptor),
    ...dynamicRoutes.map((route) => route.descriptor)
  ];
}

export function resolveCompatRoute(method: string, path: string): ResolvedCompatRoute | null {
  const resolvedStatic = staticRoutes.find(
    (route) => route.descriptor.method === method && route.descriptor.path === path
  );
  if (resolvedStatic) {
    return {
      upstreamPath: resolvedStatic.descriptor.upstreamPath,
      mode: resolvedStatic.descriptor.mode,
      accessPolicy: resolvedStatic.descriptor.accessPolicy,
      responsePolicy: resolvedStatic.descriptor.responsePolicy
    };
  }

  for (const route of dynamicRoutes) {
    if (route.descriptor.method !== method) {
      continue;
    }
    const matches = path.match(route.pattern);
    if (matches === null) {
      continue;
    }

    return {
      upstreamPath: route.toUpstreamPath(matches),
      mode: route.descriptor.mode,
      accessPolicy: route.descriptor.accessPolicy,
      responsePolicy: route.descriptor.responsePolicy
    };
  }

  return null;
}
