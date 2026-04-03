import type { ContractCatalog } from './contracts.js';
import type { IsoDateTimeString } from './common.js';

export interface DomainModuleDescriptor {
  code: string;
  basePath: string;
  description: string;
}

export interface RouteDescriptor {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
}

export interface AdminApiAppModuleDescriptor {
  name: string;
  version: string;
  routes: RouteDescriptor[];
  modules: DomainModuleDescriptor[];
}

export interface AdminApiHealthPayload {
  service: string;
  version: string;
  status: 'ok';
  environment: string;
  timestamp: IsoDateTimeString;
}

export interface AdminApiModulesPayload {
  modules: DomainModuleDescriptor[];
  routes: RouteDescriptor[];
}

export interface AdminApiModuleDetailPayload {
  module: DomainModuleDescriptor;
}

export interface AdminApiContractsPayload {
  contracts: ContractCatalog;
}

export interface AdminApiCompatRoutesPayload {
  routes: AdminApiCompatRouteDescriptor[];
}

export interface AdminApiCompatGuardsPayload {
  guards: Array<{
    path: string;
  }>;
}

export interface AdminApiCompatWriteGuardsPayload {
  guards: Array<{
    path: string;
  }>;
}

export type AdminApiCompatRouteMode = 'read' | 'write';

export type AdminApiCompatAccessPolicy = 'public' | 'session' | 'admin';

export type AdminApiCompatResponsePolicy = 'proxy_passthrough';

export interface AdminApiCompatRouteDescriptor {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  upstreamPath: string;
  mode: AdminApiCompatRouteMode;
  accessPolicy: AdminApiCompatAccessPolicy;
  responsePolicy: AdminApiCompatResponsePolicy;
}
