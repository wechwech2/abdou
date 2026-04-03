import {
  CLIENT_STATUSES,
  MEDIA_STATUSES,
  MEDIA_TYPES,
  PROGRAMME_PUBLICATION_STATUSES,
  PROGRAMME_STATUSES,
  PUBLICATION_DEPLOYMENT_STATUSES,
  PUBLICATION_DEPLOYMENT_TARGET_TYPES,
  PUBLICATION_STATUSES,
  ROLE_CODES
} from './enums.js';

export interface ContractCatalog {
  clientStatus: readonly string[];
  roleCode: readonly string[];
  programmeStatus: readonly string[];
  programmePublicationStatus: readonly string[];
  publicationStatus: readonly string[];
  mediaType: readonly string[];
  mediaStatus: readonly string[];
  publicationDeploymentTargetType: readonly string[];
  publicationDeploymentStatus: readonly string[];
}

export function buildContractCatalog(): ContractCatalog {
  return {
    clientStatus: CLIENT_STATUSES,
    roleCode: ROLE_CODES,
    programmeStatus: PROGRAMME_STATUSES,
    programmePublicationStatus: PROGRAMME_PUBLICATION_STATUSES,
    publicationStatus: PUBLICATION_STATUSES,
    mediaType: MEDIA_TYPES,
    mediaStatus: MEDIA_STATUSES,
    publicationDeploymentTargetType: PUBLICATION_DEPLOYMENT_TARGET_TYPES,
    publicationDeploymentStatus: PUBLICATION_DEPLOYMENT_STATUSES
  };
}
