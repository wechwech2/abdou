import type { EntityId, IsoDateTimeString, Nullable } from './common.js';
import type { MediaStatus, MediaType } from './enums.js';

export interface Media {
  id: EntityId;
  uuid: string;
  type: MediaType;
  mimeType: string;
  originalFilename: string;
  storageFilename: string;
  storagePath: string;
  publicUrl: Nullable<string>;
  title: Nullable<string>;
  altText: Nullable<string>;
  caption: Nullable<string>;
  width: Nullable<number>;
  height: Nullable<number>;
  fileSize: Nullable<number>;
  checksum: Nullable<string>;
  status: MediaStatus;
  uploadedBy: Nullable<EntityId>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface ProgrammeMediaLink {
  id: EntityId;
  programmeId: EntityId;
  mediaId: EntityId;
  rubriqueId: Nullable<EntityId>;
  lotId: Nullable<EntityId>;
  usageCode: string;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
