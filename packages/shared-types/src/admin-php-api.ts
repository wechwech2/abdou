import type { ApiSuccessPayload } from './http.js';

export interface AdminPhpPaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface AdminPhpAuthRole {
  id: number;
  code: string;
  label: string;
}

export interface AdminPhpAuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: AdminPhpAuthRole;
}

export type AdminPhpAuthLoginPayload = ApiSuccessPayload<{ user: AdminPhpAuthUser }>;

export type AdminPhpAuthMePayload = ApiSuccessPayload<{ user: AdminPhpAuthUser }>;

export type AdminPhpAuthLogoutPayload = ApiSuccessPayload<{}>;

export interface AdminPhpDashboardSummaryBlock {
  total: number;
  [key: string]: number;
}

export interface AdminPhpDashboardSummary {
  clients: AdminPhpDashboardSummaryBlock;
  programmes: AdminPhpDashboardSummaryBlock;
  publications: AdminPhpDashboardSummaryBlock;
  deployments: AdminPhpDashboardSummaryBlock;
  timestamp: string;
}

export type AdminPhpDashboardSummaryPayload = ApiSuccessPayload<{
  summary: AdminPhpDashboardSummary;
}>;

export type AdminPhpListPayload<TItem> = ApiSuccessPayload<{
  meta: AdminPhpPaginationMeta;
  items: TItem[];
}>;

export type AdminPhpItemPayload<TItem> = ApiSuccessPayload<{ item: TItem }>;

export interface AdminPhpRoleRecord {
  id: number;
  code: string;
  label: string;
  is_active: number;
}

export interface AdminPhpUserRecord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_code: string;
  role_label: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AdminPhpTemplateRecord {
  id: number;
  code: string;
  name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPhpOffreRecord {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  template_id: number;
  max_rubriques: number | null;
  enable_lots: number;
  enable_documents: number;
  enable_gallery: number;
  enable_map: number;
  enable_contact_block: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPhpClientRecord {
  id: number;
  code: string;
  name: string;
  slug: string;
  legal_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  status: 'active' | 'inactive' | 'archived';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPhpProgrammeListItem {
  id: number;
  code: string;
  name: string;
  slug: string;
  status: 'draft' | 'ready' | 'archived';
  publication_status: 'not_published' | 'generated' | 'deployed' | 'failed';
  city: string | null;
  target_domain: string | null;
  target_path: string | null;
  created_at: string;
  updated_at: string;
  client_id: number;
  client_code: string;
  client_name: string;
  offre_id: number;
  offre_code: string;
  offre_name: string;
  template_id: number | null;
  template_code: string | null;
  template_name: string | null;
}

export interface AdminPhpProgrammeDetailItem extends AdminPhpProgrammeListItem {
  headline: string | null;
  short_description: string | null;
  full_description: string | null;
  address_line: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface AdminPhpPublicationListItem {
  id: number;
  programme_id: number;
  version_number: number;
  build_code: string;
  template_id: number;
  status: 'draft' | 'generating' | 'generated' | 'deployed' | 'failed' | 'archived';
  build_path: string | null;
  public_path: string | null;
  published_url: string | null;
  started_at: string | null;
  generated_at: string | null;
  deployed_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  programme_code: string;
  programme_name: string;
}

export interface AdminPhpPublicationDetailItem extends AdminPhpPublicationListItem {
  source_snapshot_json: string | null;
}

export interface AdminPhpRubriqueRecord {
  id: number;
  programme_id: number;
  code: string;
  title: string;
  slug: string;
  display_order: number;
  is_enabled: number;
  is_menu_visible: number;
  created_at: string;
  updated_at: string;
  programme_code: string;
  programme_name: string;
}

export interface AdminPhpMediaRecord {
  id: number;
  uuid: string;
  type: string;
  mime_type: string;
  original_filename: string;
  storage_filename: string;
  storage_path: string;
  status: string;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPhpLotRecord {
  id: number;
  programme_id: number;
  batiment_id: number | null;
  etage_id: number | null;
  reference: string;
  display_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
  programme_code: string;
  programme_name: string;
}

export interface AdminPhpPublicationDeploymentRecord {
  id: number;
  publication_id: number;
  target_type: string;
  target_label: string;
  target_host: string | null;
  target_path: string;
  deployment_status: string;
  deployed_by: number | null;
  started_at: string | null;
  finished_at: string | null;
  log_excerpt: string | null;
  created_at: string;
}

export type AdminPhpRolesListPayload = ApiSuccessPayload<{ items: AdminPhpRoleRecord[] }>;
export type AdminPhpUsersListPayload = ApiSuccessPayload<{ items: AdminPhpUserRecord[] }>;
export type AdminPhpUserItemPayload = AdminPhpItemPayload<AdminPhpUserRecord>;
export type AdminPhpTemplatesListPayload = AdminPhpListPayload<AdminPhpTemplateRecord>;
export type AdminPhpTemplateItemPayload = AdminPhpItemPayload<AdminPhpTemplateRecord>;
export type AdminPhpOffresListPayload = AdminPhpListPayload<AdminPhpOffreRecord>;
export type AdminPhpOffreItemPayload = AdminPhpItemPayload<AdminPhpOffreRecord>;
export type AdminPhpClientsListPayload = AdminPhpListPayload<AdminPhpClientRecord>;
export type AdminPhpClientItemPayload = AdminPhpItemPayload<AdminPhpClientRecord>;
export type AdminPhpProgrammesListPayload = AdminPhpListPayload<AdminPhpProgrammeListItem>;
export type AdminPhpProgrammeItemPayload = AdminPhpItemPayload<AdminPhpProgrammeDetailItem>;
export type AdminPhpRubriquesListPayload = AdminPhpListPayload<AdminPhpRubriqueRecord>;
export type AdminPhpRubriqueItemPayload = AdminPhpItemPayload<AdminPhpRubriqueRecord>;
export type AdminPhpMediasListPayload = AdminPhpListPayload<AdminPhpMediaRecord>;
export type AdminPhpMediaItemPayload = AdminPhpItemPayload<AdminPhpMediaRecord>;
export type AdminPhpLotsListPayload = AdminPhpListPayload<AdminPhpLotRecord>;
export type AdminPhpLotItemPayload = AdminPhpItemPayload<AdminPhpLotRecord>;
export type AdminPhpPublicationsListPayload = AdminPhpListPayload<AdminPhpPublicationListItem>;
export type AdminPhpPublicationItemPayload = AdminPhpItemPayload<AdminPhpPublicationDetailItem>;

export type AdminPhpPublicationCreatePayload = ApiSuccessPayload<{
  item: AdminPhpPublicationDetailItem;
}>;

export type AdminPhpPublicationStatusUpdatePayload = ApiSuccessPayload<{
  item: AdminPhpPublicationDetailItem;
}>;

export type AdminPhpPublicationDeploymentsPayload = ApiSuccessPayload<{
  count: number;
  items: AdminPhpPublicationDeploymentRecord[];
}>;

export interface AdminPhpLocalDeployInfo {
  ok: boolean;
  log_path: string | null;
  manifest_path: string | null;
  verify_log_path: string | null;
  source_dir: string | null;
  target_dir: string | null;
  mode: string;
  verify_status: string;
  stdout: string;
  stderr: string;
}

export type AdminPhpPublicationDeployPayload = ApiSuccessPayload<{
  deployment: AdminPhpPublicationDeploymentRecord;
  publication: AdminPhpPublicationDetailItem | null;
  local_deploy: AdminPhpLocalDeployInfo;
}>;

export interface AdminPhpPublicationBuildStatusSync {
  ok: boolean;
  status?: number;
  reason?: string;
}

export type AdminPhpPublicationBuildPayload = {
  ok: boolean;
  publication_id: number;
  output_path: string | null;
  log_path: string | null;
  stdout: string;
  stderr: string;
  status_sync: AdminPhpPublicationBuildStatusSync;
};

export type AdminPhpPublicationPreviewPayload = ApiSuccessPayload<{
  preview: {
    build_code: string;
    path: string;
  };
}>;

export interface AdminPhpPublicationTextArtifact {
  ok: true;
  publication_id: number;
  path: string;
  content: string;
}

export type AdminPhpPublicationBuildLogPayload = AdminPhpPublicationTextArtifact;
export type AdminPhpPublicationDeployLogPayload = AdminPhpPublicationTextArtifact;
export type AdminPhpPublicationDeployManifestPayload = AdminPhpPublicationTextArtifact;
export type AdminPhpPublicationDeployVerifyLogPayload = AdminPhpPublicationTextArtifact;

export interface AdminPhpPublicationArtifactFile {
  found: boolean;
  path: string;
  content: string;
}

export interface AdminPhpPublicationArtifactsPayloadData {
  publication_id: number;
  manifest: AdminPhpPublicationArtifactFile;
  verify_log: AdminPhpPublicationArtifactFile;
}

export type AdminPhpPublicationArtifactsPayload = ApiSuccessPayload<{
  publication_id: number;
  artifacts: AdminPhpPublicationArtifactsPayloadData;
}>;

export interface AdminPhpPublicationDeploySummaryData {
  publication_id: number;
  source_dir: string;
  target_dir: string;
  mode: string;
  verify_status: string;
  status: string;
}

export type AdminPhpPublicationDeploySummaryPayload = ApiSuccessPayload<{
  publication_id: number;
  summary: AdminPhpPublicationDeploySummaryData;
}>;

export interface AdminPhpPublicationWorkflowDetailPayload {
  ok: true;
  publication_id: number;
  detail: AdminPhpPublicationItemPayload;
  deployments: AdminPhpPublicationDeploymentsPayload;
  build_log: {
    found: boolean;
    path: string;
    content: string;
  };
  deploy_log: {
    found: boolean;
    path: string;
    content: string;
  };
  deploy_artifacts: AdminPhpPublicationArtifactsPayloadData;
  deploy_summary: AdminPhpPublicationDeploySummaryData;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasBoolean(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'boolean';
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'string';
}

function hasNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'number' && Number.isFinite(value[key] as number);
}

function isAdminPhpAuthRole(value: unknown): value is AdminPhpAuthRole {
  if (!isObject(value)) {
    return false;
  }
  return hasNumber(value, 'id') && hasString(value, 'code') && hasString(value, 'label');
}

function isAdminPhpAuthUser(value: unknown): value is AdminPhpAuthUser {
  if (!isObject(value) || !isObject(value.role)) {
    return false;
  }
  return (
    hasNumber(value, 'id') &&
    hasString(value, 'email') &&
    hasString(value, 'first_name') &&
    hasString(value, 'last_name') &&
    isAdminPhpAuthRole(value.role)
  );
}

function isAdminPhpListEnvelope(value: unknown): value is { ok: true; meta: AdminPhpPaginationMeta; items: unknown[] } {
  if (!isObject(value) || value.ok !== true || !Array.isArray(value.items) || !isObject(value.meta)) {
    return false;
  }
  return (
    hasNumber(value.meta, 'total') &&
    hasNumber(value.meta, 'page') &&
    hasNumber(value.meta, 'limit')
  );
}

function isAdminPhpItemEnvelope(value: unknown): value is { ok: true; item: unknown } {
  return isObject(value) && value.ok === true && 'item' in value;
}

function isAdminPhpCountItemsEnvelope(value: unknown): value is { ok: true; count: number; items: unknown[] } {
  if (!isObject(value) || value.ok !== true || !Array.isArray(value.items)) {
    return false;
  }
  return hasNumber(value, 'count');
}

export function isAdminPhpAuthMePayload(value: unknown): value is AdminPhpAuthMePayload {
  if (!isObject(value) || value.ok !== true || !isObject(value.user)) {
    return false;
  }
  return isAdminPhpAuthUser(value.user);
}

export function isAdminPhpAuthLoginPayload(value: unknown): value is AdminPhpAuthLoginPayload {
  if (!isObject(value) || value.ok !== true || !isObject(value.user)) {
    return false;
  }
  return isAdminPhpAuthUser(value.user);
}

export function isAdminPhpAuthLogoutPayload(value: unknown): value is AdminPhpAuthLogoutPayload {
  return isObject(value) && value.ok === true;
}

export function isAdminPhpDashboardSummaryPayload(value: unknown): value is AdminPhpDashboardSummaryPayload {
  if (!isObject(value) || value.ok !== true || !isObject(value.summary)) {
    return false;
  }

  const summary = value.summary;
  if (
    !isObject(summary.clients) ||
    !isObject(summary.programmes) ||
    !isObject(summary.publications) ||
    !isObject(summary.deployments) ||
    !hasString(summary, 'timestamp')
  ) {
    return false;
  }

  return (
    hasNumber(summary.clients, 'total') &&
    hasNumber(summary.programmes, 'total') &&
    hasNumber(summary.publications, 'total') &&
    hasNumber(summary.deployments, 'total')
  );
}

export function isAdminPhpPublicationCreatePayload(value: unknown): value is AdminPhpPublicationCreatePayload {
  return isAdminPhpPublicationItemPayload(value);
}

export function isAdminPhpPublicationStatusUpdatePayload(value: unknown): value is AdminPhpPublicationStatusUpdatePayload {
  return isAdminPhpPublicationItemPayload(value);
}

export function isAdminPhpClientsListPayload(value: unknown): value is AdminPhpClientsListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasString(item, 'code') &&
      hasString(item, 'name') &&
      hasString(item, 'slug') &&
      hasString(item, 'status')
    );
  });
}

export function isAdminPhpOffresListPayload(value: unknown): value is AdminPhpOffresListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasString(item, 'code') &&
      hasString(item, 'name') &&
      hasString(item, 'slug') &&
      hasNumber(item, 'template_id')
    );
  });
}

export function isAdminPhpProgrammesListPayload(value: unknown): value is AdminPhpProgrammesListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasString(item, 'code') &&
      hasString(item, 'name') &&
      hasString(item, 'slug') &&
      hasNumber(item, 'client_id') &&
      hasNumber(item, 'offre_id') &&
      hasString(item, 'status') &&
      hasString(item, 'publication_status')
    );
  });
}

export function isAdminPhpPublicationsListPayload(value: unknown): value is AdminPhpPublicationsListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasNumber(item, 'programme_id') &&
      hasNumber(item, 'version_number') &&
      hasString(item, 'build_code') &&
      hasNumber(item, 'template_id') &&
      hasString(item, 'status')
    );
  });
}

export function isAdminPhpRubriquesListPayload(value: unknown): value is AdminPhpRubriquesListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasNumber(item, 'programme_id') &&
      hasString(item, 'code') &&
      hasString(item, 'title') &&
      hasString(item, 'slug')
    );
  });
}

export function isAdminPhpMediasListPayload(value: unknown): value is AdminPhpMediasListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasString(item, 'uuid') &&
      hasString(item, 'type') &&
      hasString(item, 'mime_type') &&
      hasString(item, 'original_filename') &&
      hasString(item, 'storage_filename') &&
      hasString(item, 'storage_path') &&
      hasString(item, 'status')
    );
  });
}

export function isAdminPhpLotsListPayload(value: unknown): value is AdminPhpLotsListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasNumber(item, 'programme_id') &&
      hasString(item, 'reference') &&
      hasNumber(item, 'display_order') &&
      hasNumber(item, 'is_published')
    );
  });
}

export function isAdminPhpRolesListPayload(value: unknown): value is AdminPhpRolesListPayload {
  if (!isAdminPhpCountItemsEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return hasNumber(item, 'id') && hasString(item, 'code') && hasString(item, 'label');
  });
}

export function isAdminPhpUsersListPayload(value: unknown): value is AdminPhpUsersListPayload {
  if (!isAdminPhpCountItemsEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasString(item, 'email') &&
      hasString(item, 'first_name') &&
      hasString(item, 'last_name') &&
      hasNumber(item, 'role_id') &&
      hasString(item, 'role_code') &&
      hasString(item, 'role_label')
    );
  });
}

export function isAdminPhpTemplatesListPayload(value: unknown): value is AdminPhpTemplatesListPayload {
  if (!isAdminPhpListEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasString(item, 'code') &&
      hasString(item, 'name') &&
      hasString(item, 'version')
    );
  });
}

export function isAdminPhpClientItemPayload(value: unknown): value is AdminPhpClientItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasString(item, 'code') &&
    hasString(item, 'name') &&
    hasString(item, 'slug') &&
    hasString(item, 'status')
  );
}

export function isAdminPhpOffreItemPayload(value: unknown): value is AdminPhpOffreItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasString(item, 'code') &&
    hasString(item, 'name') &&
    hasString(item, 'slug') &&
    hasNumber(item, 'template_id')
  );
}

export function isAdminPhpProgrammeItemPayload(value: unknown): value is AdminPhpProgrammeItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasString(item, 'code') &&
    hasString(item, 'name') &&
    hasString(item, 'slug') &&
    hasNumber(item, 'client_id') &&
    hasNumber(item, 'offre_id') &&
    hasString(item, 'status') &&
    hasString(item, 'publication_status')
  );
}

export function isAdminPhpPublicationItemPayload(value: unknown): value is AdminPhpPublicationItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasNumber(item, 'programme_id') &&
    hasNumber(item, 'version_number') &&
    hasString(item, 'build_code') &&
    hasNumber(item, 'template_id') &&
    hasString(item, 'status')
  );
}

export function isAdminPhpRubriqueItemPayload(value: unknown): value is AdminPhpRubriqueItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasNumber(item, 'programme_id') &&
    hasString(item, 'code') &&
    hasString(item, 'title') &&
    hasString(item, 'slug')
  );
}

export function isAdminPhpMediaItemPayload(value: unknown): value is AdminPhpMediaItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasString(item, 'uuid') &&
    hasString(item, 'type') &&
    hasString(item, 'mime_type') &&
    hasString(item, 'original_filename') &&
    hasString(item, 'storage_filename') &&
    hasString(item, 'storage_path') &&
    hasString(item, 'status')
  );
}

export function isAdminPhpLotItemPayload(value: unknown): value is AdminPhpLotItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasNumber(item, 'programme_id') &&
    hasString(item, 'reference') &&
    hasNumber(item, 'display_order') &&
    hasNumber(item, 'is_published')
  );
}

export function isAdminPhpUserItemPayload(value: unknown): value is AdminPhpUserItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasString(item, 'email') &&
    hasString(item, 'first_name') &&
    hasString(item, 'last_name') &&
    hasNumber(item, 'role_id') &&
    hasString(item, 'role_code') &&
    hasString(item, 'role_label')
  );
}

export function isAdminPhpTemplateItemPayload(value: unknown): value is AdminPhpTemplateItemPayload {
  if (!isAdminPhpItemEnvelope(value) || !isObject(value.item)) {
    return false;
  }
  const item = value.item;
  return (
    hasNumber(item, 'id') &&
    hasString(item, 'code') &&
    hasString(item, 'name') &&
    hasString(item, 'version')
  );
}

export function isAdminPhpPublicationDeploySummaryData(
  value: unknown
): value is AdminPhpPublicationDeploySummaryData {
  if (!isObject(value)) {
    return false;
  }
  return (
    hasNumber(value, 'publication_id') &&
    hasString(value, 'source_dir') &&
    hasString(value, 'target_dir') &&
    hasString(value, 'mode') &&
    hasString(value, 'verify_status') &&
    hasString(value, 'status')
  );
}

export function isAdminPhpPublicationDeploymentsPayload(
  value: unknown
): value is AdminPhpPublicationDeploymentsPayload {
  if (!isAdminPhpCountItemsEnvelope(value)) {
    return false;
  }
  return value.items.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      hasNumber(item, 'id') &&
      hasNumber(item, 'publication_id') &&
      hasString(item, 'target_type') &&
      hasString(item, 'target_label') &&
      hasString(item, 'target_path') &&
      hasString(item, 'deployment_status') &&
      hasString(item, 'created_at')
    );
  });
}

export function isAdminPhpPublicationDeploySummaryPayload(
  value: unknown
): value is AdminPhpPublicationDeploySummaryPayload {
  if (!isObject(value) || value.ok !== true || !hasNumber(value, 'publication_id')) {
    return false;
  }
  return isAdminPhpPublicationDeploySummaryData(value.summary);
}

export function isAdminPhpPublicationTextArtifactPayload(
  value: unknown
): value is AdminPhpPublicationTextArtifact {
  if (!isObject(value) || value.ok !== true) {
    return false;
  }
  return hasNumber(value, 'publication_id') && hasString(value, 'path') && hasString(value, 'content');
}

export function isAdminPhpPublicationArtifactsPayload(
  value: unknown
): value is AdminPhpPublicationArtifactsPayload {
  if (!isObject(value) || value.ok !== true || !hasNumber(value, 'publication_id') || !isObject(value.artifacts)) {
    return false;
  }
  const artifacts = value.artifacts;
  if (!hasNumber(artifacts, 'publication_id')) {
    return false;
  }
  const manifest = artifacts.manifest;
  const verifyLog = artifacts.verify_log;
  if (
    !isObject(manifest) ||
    !hasBoolean(manifest, 'found') ||
    !hasString(manifest, 'path') ||
    !hasString(manifest, 'content') ||
    !isObject(verifyLog) ||
    !hasBoolean(verifyLog, 'found') ||
    !hasString(verifyLog, 'path') ||
    !hasString(verifyLog, 'content')
  ) {
    return false;
  }
  return true;
}

export function isAdminPhpPublicationBuildPayload(value: unknown): value is AdminPhpPublicationBuildPayload {
  if (!isObject(value) || !hasBoolean(value, 'ok') || !hasNumber(value, 'publication_id')) {
    return false;
  }
  const outputPath = value.output_path;
  const logPath = value.log_path;
  if (!(typeof outputPath === 'string' || outputPath === null)) {
    return false;
  }
  if (!(typeof logPath === 'string' || logPath === null)) {
    return false;
  }
  if (!hasString(value, 'stdout') || !hasString(value, 'stderr') || !isObject(value.status_sync)) {
    return false;
  }
  const statusSync = value.status_sync;
  if (!hasBoolean(statusSync, 'ok')) {
    return false;
  }
  if ('status' in statusSync && !(typeof statusSync.status === 'number' && Number.isFinite(statusSync.status))) {
    return false;
  }
  if ('reason' in statusSync && typeof statusSync.reason !== 'string') {
    return false;
  }
  return true;
}

export function isAdminPhpPublicationPreviewPayload(value: unknown): value is AdminPhpPublicationPreviewPayload {
  if (!isObject(value) || value.ok !== true || !isObject(value.preview)) {
    return false;
  }
  return hasString(value.preview, 'build_code') && hasString(value.preview, 'path');
}

export function isAdminPhpPublicationDeployPayload(value: unknown): value is AdminPhpPublicationDeployPayload {
  if (!isObject(value) || value.ok !== true || !isObject(value.deployment) || !isObject(value.local_deploy)) {
    return false;
  }

  const deployment = value.deployment;
  if (
    !hasNumber(deployment, 'id') ||
    !hasNumber(deployment, 'publication_id') ||
    !hasString(deployment, 'target_type') ||
    !hasString(deployment, 'target_label') ||
    !hasString(deployment, 'target_path') ||
    !hasString(deployment, 'deployment_status') ||
    !hasString(deployment, 'created_at')
  ) {
    return false;
  }

  const publication = value.publication;
  if (!(publication === null || isAdminPhpPublicationItemPayload({ ok: true, item: publication }))) {
    return false;
  }

  const localDeploy = value.local_deploy;
  return (
    hasBoolean(localDeploy, 'ok') &&
    hasString(localDeploy, 'mode') &&
    hasString(localDeploy, 'verify_status') &&
    hasString(localDeploy, 'stdout') &&
    hasString(localDeploy, 'stderr')
  );
}

export function isAdminPhpPublicationWorkflowDetailPayload(
  value: unknown
): value is AdminPhpPublicationWorkflowDetailPayload {
  if (!isObject(value)) {
    return false;
  }
  if (value.ok !== true || !hasNumber(value, 'publication_id')) {
    return false;
  }

  const detail = value.detail;
  if (!isObject(detail) || detail.ok !== true || !isObject(detail.item)) {
    return false;
  }

  const deployments = value.deployments;
  if (
    !isObject(deployments) ||
    deployments.ok !== true ||
    !hasNumber(deployments, 'count') ||
    !Array.isArray(deployments.items)
  ) {
    return false;
  }

  const buildLog = value.build_log;
  if (!isObject(buildLog) || !hasBoolean(buildLog, 'found') || !hasString(buildLog, 'path') || !hasString(buildLog, 'content')) {
    return false;
  }

  const deployLog = value.deploy_log;
  if (!isObject(deployLog) || !hasBoolean(deployLog, 'found') || !hasString(deployLog, 'path') || !hasString(deployLog, 'content')) {
    return false;
  }

  const artifacts = value.deploy_artifacts;
  if (!isObject(artifacts) || !hasNumber(artifacts, 'publication_id')) {
    return false;
  }
  const manifest = artifacts.manifest;
  const verifyLog = artifacts.verify_log;
  if (
    !isObject(manifest) ||
    !hasBoolean(manifest, 'found') ||
    !hasString(manifest, 'path') ||
    !hasString(manifest, 'content') ||
    !isObject(verifyLog) ||
    !hasBoolean(verifyLog, 'found') ||
    !hasString(verifyLog, 'path') ||
    !hasString(verifyLog, 'content')
  ) {
    return false;
  }

  return isAdminPhpPublicationDeploySummaryData(value.deploy_summary);
}
