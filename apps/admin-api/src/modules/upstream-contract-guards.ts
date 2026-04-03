import type { UpstreamContractGuard } from './read-model-proxy.js';
import {
  isAdminPhpAuthLoginPayload,
  isAdminPhpAuthMePayload,
  isAdminPhpAuthLogoutPayload,
  isAdminPhpDashboardSummaryPayload,
  isAdminPhpClientItemPayload,
  isAdminPhpClientsListPayload,
  isAdminPhpOffreItemPayload,
  isAdminPhpOffresListPayload,
  isAdminPhpLotItemPayload,
  isAdminPhpLotsListPayload,
  isAdminPhpMediaItemPayload,
  isAdminPhpMediasListPayload,
  isAdminPhpProgrammeItemPayload,
  isAdminPhpProgrammesListPayload,
  isAdminPhpPublicationBuildPayload,
  isAdminPhpPublicationCreatePayload,
  isAdminPhpPublicationDeployPayload,
  isAdminPhpPublicationArtifactsPayload,
  isAdminPhpPublicationDeploymentsPayload,
  isAdminPhpPublicationDeploySummaryPayload,
  isAdminPhpPublicationItemPayload,
  isAdminPhpPublicationPreviewPayload,
  isAdminPhpPublicationStatusUpdatePayload,
  isAdminPhpPublicationTextArtifactPayload,
  isAdminPhpPublicationsListPayload,
  isAdminPhpRubriqueItemPayload,
  isAdminPhpRubriquesListPayload,
  isAdminPhpRolesListPayload,
  isAdminPhpTemplateItemPayload,
  isAdminPhpTemplatesListPayload,
  isAdminPhpUserItemPayload,
  isAdminPhpUsersListPayload,
  isAdminPhpPublicationWorkflowDetailPayload
} from '@abdou/shared-types';

interface GuardContext {
  path: string;
}

interface GuardEntry {
  path: string;
  match: (upstreamPath: string) => boolean;
  guard: UpstreamContractGuard;
}

function exactPath(path: string): (upstreamPath: string) => boolean {
  return (upstreamPath) => upstreamPath === path;
}

function regexPath(pattern: RegExp): (upstreamPath: string) => boolean {
  return (upstreamPath) => pattern.test(upstreamPath);
}

const guards: readonly GuardEntry[] = [
  {
    path: '/auth/me',
    match: exactPath('/auth/me'),
    guard: (_status, body) => (isAdminPhpAuthMePayload(body) ? null : 'invalid_auth_me_payload')
  },
  {
    path: '/dashboard/summary',
    match: exactPath('/dashboard/summary'),
    guard: (_status, body) => (isAdminPhpDashboardSummaryPayload(body) ? null : 'invalid_dashboard_summary_payload')
  },
  {
    path: '/roles',
    match: exactPath('/roles'),
    guard: (_status, body) => (isAdminPhpRolesListPayload(body) ? null : 'invalid_roles_list_payload')
  },
  {
    path: '/users',
    match: exactPath('/users'),
    guard: (_status, body) => (isAdminPhpUsersListPayload(body) ? null : 'invalid_users_list_payload')
  },
  {
    path: '/users/:id',
    match: regexPath(/^\/users\/\d+$/),
    guard: (_status, body) => (isAdminPhpUserItemPayload(body) ? null : 'invalid_user_item_payload')
  },
  {
    path: '/templates',
    match: exactPath('/templates'),
    guard: (_status, body) => (isAdminPhpTemplatesListPayload(body) ? null : 'invalid_templates_list_payload')
  },
  {
    path: '/templates/:id',
    match: regexPath(/^\/templates\/\d+$/),
    guard: (_status, body) => (isAdminPhpTemplateItemPayload(body) ? null : 'invalid_template_item_payload')
  },
  {
    path: '/clients',
    match: exactPath('/clients'),
    guard: (_status, body) => (isAdminPhpClientsListPayload(body) ? null : 'invalid_clients_list_payload')
  },
  {
    path: '/clients/:id',
    match: regexPath(/^\/clients\/\d+$/),
    guard: (_status, body) => (isAdminPhpClientItemPayload(body) ? null : 'invalid_client_item_payload')
  },
  {
    path: '/offres',
    match: exactPath('/offres'),
    guard: (_status, body) => (isAdminPhpOffresListPayload(body) ? null : 'invalid_offres_list_payload')
  },
  {
    path: '/offres/:id',
    match: regexPath(/^\/offres\/\d+$/),
    guard: (_status, body) => (isAdminPhpOffreItemPayload(body) ? null : 'invalid_offre_item_payload')
  },
  {
    path: '/programmes',
    match: exactPath('/programmes'),
    guard: (_status, body) => (isAdminPhpProgrammesListPayload(body) ? null : 'invalid_programmes_list_payload')
  },
  {
    path: '/programmes/:id',
    match: regexPath(/^\/programmes\/\d+$/),
    guard: (_status, body) => (isAdminPhpProgrammeItemPayload(body) ? null : 'invalid_programme_item_payload')
  },
  {
    path: '/rubriques',
    match: exactPath('/rubriques'),
    guard: (_status, body) => (isAdminPhpRubriquesListPayload(body) ? null : 'invalid_rubriques_list_payload')
  },
  {
    path: '/rubriques/:id',
    match: regexPath(/^\/rubriques\/\d+$/),
    guard: (_status, body) => (isAdminPhpRubriqueItemPayload(body) ? null : 'invalid_rubrique_item_payload')
  },
  {
    path: '/medias',
    match: exactPath('/medias'),
    guard: (_status, body) => (isAdminPhpMediasListPayload(body) ? null : 'invalid_medias_list_payload')
  },
  {
    path: '/medias/:id',
    match: regexPath(/^\/medias\/\d+$/),
    guard: (_status, body) => (isAdminPhpMediaItemPayload(body) ? null : 'invalid_media_item_payload')
  },
  {
    path: '/lots',
    match: exactPath('/lots'),
    guard: (_status, body) => (isAdminPhpLotsListPayload(body) ? null : 'invalid_lots_list_payload')
  },
  {
    path: '/lots/:id',
    match: regexPath(/^\/lots\/\d+$/),
    guard: (_status, body) => (isAdminPhpLotItemPayload(body) ? null : 'invalid_lot_item_payload')
  },
  {
    path: '/publications',
    match: exactPath('/publications'),
    guard: (_status, body) => (isAdminPhpPublicationsListPayload(body) ? null : 'invalid_publications_list_payload')
  },
  {
    path: '/publications/:id',
    match: regexPath(/^\/publications\/\d+$/),
    guard: (_status, body) => (isAdminPhpPublicationItemPayload(body) ? null : 'invalid_publication_item_payload')
  },
  {
    path: '/publications/:id/workflow-detail',
    match: regexPath(/^\/publications\/\d+\/workflow-detail$/),
    guard: (_status, body) => (isAdminPhpPublicationWorkflowDetailPayload(body) ? null : 'invalid_workflow_detail_payload')
  },
  {
    path: '/publications/:id/build-log',
    match: regexPath(/^\/publications\/\d+\/build-log$/),
    guard: (_status, body) => (isAdminPhpPublicationTextArtifactPayload(body) ? null : 'invalid_publication_build_log_payload')
  },
  {
    path: '/publications/:id/deploy-log',
    match: regexPath(/^\/publications\/\d+\/deploy-log$/),
    guard: (_status, body) => (isAdminPhpPublicationTextArtifactPayload(body) ? null : 'invalid_publication_deploy_log_payload')
  },
  {
    path: '/publications/:id/deploy-manifest',
    match: regexPath(/^\/publications\/\d+\/deploy-manifest$/),
    guard: (_status, body) => (isAdminPhpPublicationTextArtifactPayload(body) ? null : 'invalid_publication_deploy_manifest_payload')
  },
  {
    path: '/publications/:id/deploy-verify-log',
    match: regexPath(/^\/publications\/\d+\/deploy-verify-log$/),
    guard: (_status, body) => (isAdminPhpPublicationTextArtifactPayload(body) ? null : 'invalid_publication_deploy_verify_log_payload')
  },
  {
    path: '/publications/:id/deploy-artifacts',
    match: regexPath(/^\/publications\/\d+\/deploy-artifacts$/),
    guard: (_status, body) => (isAdminPhpPublicationArtifactsPayload(body) ? null : 'invalid_publication_deploy_artifacts_payload')
  },
  {
    path: '/publications/:id/deployments',
    match: regexPath(/^\/publications\/\d+\/deployments$/),
    guard: (_status, body) => (isAdminPhpPublicationDeploymentsPayload(body) ? null : 'invalid_publication_deployments_payload')
  },
  {
    path: '/publications/:id/deploy-summary',
    match: regexPath(/^\/publications\/\d+\/deploy-summary$/),
    guard: (_status, body) => (isAdminPhpPublicationDeploySummaryPayload(body) ? null : 'invalid_publication_deploy_summary_payload')
  }
];

const writeGuards: readonly GuardEntry[] = [
  {
    path: '/auth/login',
    match: exactPath('/auth/login'),
    guard: (_status, body) => (isAdminPhpAuthLoginPayload(body) ? null : 'invalid_auth_login_payload')
  },
  {
    path: '/auth/logout',
    match: exactPath('/auth/logout'),
    guard: (_status, body) => (isAdminPhpAuthLogoutPayload(body) ? null : 'invalid_auth_logout_payload')
  },
  {
    path: '/clients',
    match: exactPath('/clients'),
    guard: (_status, body) => (isAdminPhpClientItemPayload(body) ? null : 'invalid_client_item_payload')
  },
  {
    path: '/clients/:id',
    match: regexPath(/^\/clients\/\d+$/),
    guard: (_status, body) => (isAdminPhpClientItemPayload(body) ? null : 'invalid_client_item_payload')
  },
  {
    path: '/programmes',
    match: exactPath('/programmes'),
    guard: (_status, body) => (isAdminPhpProgrammeItemPayload(body) ? null : 'invalid_programme_item_payload')
  },
  {
    path: '/programmes/:id',
    match: regexPath(/^\/programmes\/\d+$/),
    guard: (_status, body) => (isAdminPhpProgrammeItemPayload(body) ? null : 'invalid_programme_item_payload')
  },
  {
    path: '/rubriques',
    match: exactPath('/rubriques'),
    guard: (_status, body) => (isAdminPhpRubriqueItemPayload(body) ? null : 'invalid_rubrique_item_payload')
  },
  {
    path: '/rubriques/:id',
    match: regexPath(/^\/rubriques\/\d+$/),
    guard: (_status, body) => (isAdminPhpRubriqueItemPayload(body) ? null : 'invalid_rubrique_item_payload')
  },
  {
    path: '/medias',
    match: exactPath('/medias'),
    guard: (_status, body) => (isAdminPhpMediaItemPayload(body) ? null : 'invalid_media_item_payload')
  },
  {
    path: '/lots',
    match: exactPath('/lots'),
    guard: (_status, body) => (isAdminPhpLotItemPayload(body) ? null : 'invalid_lot_item_payload')
  },
  {
    path: '/lots/:id',
    match: regexPath(/^\/lots\/\d+$/),
    guard: (_status, body) => (isAdminPhpLotItemPayload(body) ? null : 'invalid_lot_item_payload')
  },
  {
    path: '/publications',
    match: exactPath('/publications'),
    guard: (_status, body) => (isAdminPhpPublicationCreatePayload(body) ? null : 'invalid_publication_create_payload')
  },
  {
    path: '/publications/:id/status',
    match: regexPath(/^\/publications\/\d+\/status$/),
    guard: (_status, body) =>
      (isAdminPhpPublicationStatusUpdatePayload(body) ? null : 'invalid_publication_status_update_payload')
  },
  {
    path: '/publications/:id/build',
    match: regexPath(/^\/publications\/\d+\/build$/),
    guard: (_status, body) => (isAdminPhpPublicationBuildPayload(body) ? null : 'invalid_publication_build_payload')
  },
  {
    path: '/publications/:id/deploy',
    match: regexPath(/^\/publications\/\d+\/deploy$/),
    guard: (_status, body) => (isAdminPhpPublicationDeployPayload(body) ? null : 'invalid_publication_deploy_payload')
  },
  {
    path: '/publications/:id/preview',
    match: regexPath(/^\/publications\/\d+\/preview$/),
    guard: (_status, body) =>
      (isAdminPhpPublicationPreviewPayload(body) ? null : 'invalid_publication_preview_payload')
  }
];

export function resolveReadContractGuard(upstreamPath: string): UpstreamContractGuard | undefined {
  const entry = guards.find((candidate) => candidate.match(upstreamPath));
  return entry?.guard;
}

export function listReadContractGuards(): GuardContext[] {
  return guards.map((entry) => ({ path: entry.path }));
}

export function resolveWriteContractGuard(upstreamPath: string): UpstreamContractGuard | undefined {
  const entry = writeGuards.find((candidate) => candidate.match(upstreamPath));
  return entry?.guard;
}

export function listWriteContractGuards(): GuardContext[] {
  return writeGuards.map((entry) => ({ path: entry.path }));
}
