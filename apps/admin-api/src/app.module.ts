import { domainModules } from './modules/module-catalog.js';
import type { AdminApiAppModuleDescriptor } from '@abdou/shared-types';
import { listCompatRoutes } from './modules/compat-routes.js';

const technicalRoutes = [
  { method: 'GET', path: '/health', description: 'Probe de sante de l API' },
  { method: 'GET', path: '/api/modules', description: 'Catalogue des domaines metier exposes' },
  { method: 'GET', path: '/api/modules/:code', description: 'Detail d un module metier' },
  { method: 'GET', path: '/api/contracts', description: 'Contrats metier partages (types et statuts)' },
  { method: 'GET', path: '/api/compat/routes', description: 'Catalogue technique des routes de compatibilite proxy' },
  { method: 'GET', path: '/api/compat/guards', description: 'Gardes de contrat actives sur les lectures proxy' },
  { method: 'GET', path: '/api/compat/write-guards', description: 'Gardes de contrat actives sur les ecritures proxy' }
] as const;

function buildCompatRouteDescription(path: string, mode: 'read' | 'write'): string {
  const resourcePath = path.replace(/^\/api\//, '').replace(/\/:id/g, '/{id}');
  const action = mode === 'read' ? 'Lecture' : 'Ecriture';
  return `${action} compat via source metier PHP (${resourcePath})`;
}

const compatRoutes = listCompatRoutes().map((route) => ({
  method: route.method,
  path: route.path,
  description: buildCompatRouteDescription(route.path, route.mode)
}));

export const appModule: AdminApiAppModuleDescriptor = {
  name: 'admin-api',
  version: '0.1.0',
  routes: [...technicalRoutes, ...compatRoutes],
  modules: domainModules
};
