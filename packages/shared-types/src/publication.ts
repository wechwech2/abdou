import type { EntityId, IsoDateTimeString, Nullable } from './common.js';
import type {
  PublicationDeploymentStatus,
  PublicationDeploymentTargetType,
  PublicationStatus
} from './enums.js';

export interface Publication {
  id: EntityId;
  programmeId: EntityId;
  versionNumber: number;
  buildCode: string;
  templateId: EntityId;
  status: PublicationStatus;
  sourceSnapshotJson: Nullable<Record<string, unknown>>;
  buildPath: Nullable<string>;
  publicPath: Nullable<string>;
  publishedUrl: Nullable<string>;
  startedAt: Nullable<IsoDateTimeString>;
  generatedAt: Nullable<IsoDateTimeString>;
  deployedAt: Nullable<IsoDateTimeString>;
  createdBy: Nullable<EntityId>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface CreatePublicationInput {
  programmeId: EntityId;
  templateId: EntityId;
  buildCode: string;
  sourceSnapshotJson?: Nullable<Record<string, unknown>>;
  createdBy?: Nullable<EntityId>;
}

export interface UpdatePublicationStatusInput {
  status: PublicationStatus;
  buildPath?: Nullable<string>;
  publicPath?: Nullable<string>;
  publishedUrl?: Nullable<string>;
  startedAt?: Nullable<IsoDateTimeString>;
  generatedAt?: Nullable<IsoDateTimeString>;
  deployedAt?: Nullable<IsoDateTimeString>;
}

export interface PublicationAsset {
  id: EntityId;
  publicationId: EntityId;
  mediaId: Nullable<EntityId>;
  relativeOutputPath: string;
  assetType: string;
  createdAt: IsoDateTimeString;
}

export interface CreatePublicationAssetInput {
  publicationId: EntityId;
  mediaId?: Nullable<EntityId>;
  relativeOutputPath: string;
  assetType: string;
}

export interface PublicationDeployment {
  id: EntityId;
  publicationId: EntityId;
  targetType: PublicationDeploymentTargetType;
  targetLabel: string;
  targetHost: Nullable<string>;
  targetPath: string;
  deploymentStatus: PublicationDeploymentStatus;
  deployedBy: Nullable<EntityId>;
  startedAt: Nullable<IsoDateTimeString>;
  finishedAt: Nullable<IsoDateTimeString>;
  logExcerpt: Nullable<string>;
  createdAt: IsoDateTimeString;
}

export interface CreatePublicationDeploymentInput {
  publicationId: EntityId;
  targetType: PublicationDeploymentTargetType;
  targetLabel: string;
  targetHost?: Nullable<string>;
  targetPath: string;
  deployedBy?: Nullable<EntityId>;
}
