import type { DomainModuleDescriptor } from '@abdou/shared-types';

export const domainModules: DomainModuleDescriptor[] = [
  { code: 'auth', basePath: '/api/auth', description: 'Authentification et session' },
  { code: 'users', basePath: '/api/users', description: 'Gestion des utilisateurs' },
  { code: 'roles', basePath: '/api/roles', description: 'Gestion des roles' },
  { code: 'clients', basePath: '/api/clients', description: 'Gestion des clients' },
  { code: 'offres', basePath: '/api/offres', description: 'Gestion des offres' },
  { code: 'templates', basePath: '/api/templates', description: 'Gestion des templates' },
  { code: 'programmes', basePath: '/api/programmes', description: 'Gestion des programmes' },
  { code: 'rubriques', basePath: '/api/rubriques', description: 'Gestion des rubriques' },
  { code: 'medias', basePath: '/api/medias', description: 'Gestion des medias' },
  { code: 'lots', basePath: '/api/lots', description: 'Gestion des lots' },
  { code: 'publications', basePath: '/api/publications', description: 'Gestion des publications' },
  { code: 'deploy', basePath: '/api/deploy', description: 'Orchestration de deploiement' }
];

export function findModuleByCode(code: string): DomainModuleDescriptor | null {
  const normalized = code.trim().toLowerCase();
  return domainModules.find((module) => module.code === normalized) ?? null;
}
