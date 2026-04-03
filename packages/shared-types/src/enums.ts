export const CLIENT_STATUSES = ['active', 'inactive', 'archived'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const ROLE_CODES = ['admin', 'content_operator', 'validator', 'technical_operator'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const PROGRAMME_STATUSES = ['draft', 'ready', 'archived'] as const;
export type ProgrammeStatus = (typeof PROGRAMME_STATUSES)[number];

export const PROGRAMME_PUBLICATION_STATUSES = [
  'not_published',
  'generated',
  'deployed',
  'failed'
] as const;
export type ProgrammePublicationStatus = (typeof PROGRAMME_PUBLICATION_STATUSES)[number];

export const PUBLICATION_STATUSES = [
  'draft',
  'generating',
  'generated',
  'deployed',
  'failed',
  'archived'
] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const MEDIA_TYPES = ['image', 'video', 'document'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_STATUSES = ['uploaded', 'optimized', 'published', 'archived'] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const PUBLICATION_DEPLOYMENT_TARGET_TYPES = ['ovh_ftp', 'local_preview', 'manual'] as const;
export type PublicationDeploymentTargetType = (typeof PUBLICATION_DEPLOYMENT_TARGET_TYPES)[number];

export const PUBLICATION_DEPLOYMENT_STATUSES = [
  'pending',
  'running',
  'success',
  'failed',
  'rolled_back'
] as const;
export type PublicationDeploymentStatus = (typeof PUBLICATION_DEPLOYMENT_STATUSES)[number];
