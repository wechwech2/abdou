import type { EntityId, IsoDateTimeString, Nullable } from './common.js';
import type { ProgrammePublicationStatus, ProgrammeStatus } from './enums.js';

export interface Programme {
  id: EntityId;
  clientId: EntityId;
  offreId: EntityId;
  templateId: Nullable<EntityId>;
  code: string;
  name: string;
  slug: string;
  headline: Nullable<string>;
  shortDescription: Nullable<string>;
  fullDescription: Nullable<string>;
  city: Nullable<string>;
  addressLine: Nullable<string>;
  postalCode: Nullable<string>;
  latitude: Nullable<number>;
  longitude: Nullable<number>;
  heroMediaId: Nullable<EntityId>;
  status: ProgrammeStatus;
  publicationStatus: ProgrammePublicationStatus;
  targetPath: Nullable<string>;
  targetDomain: Nullable<string>;
  seoTitle: Nullable<string>;
  seoDescription: Nullable<string>;
  createdBy: Nullable<EntityId>;
  updatedBy: Nullable<EntityId>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertProgrammeInput {
  clientId: EntityId;
  offreId: EntityId;
  templateId?: Nullable<EntityId>;
  code: string;
  name: string;
  slug: string;
  headline?: Nullable<string>;
  shortDescription?: Nullable<string>;
  fullDescription?: Nullable<string>;
  city?: Nullable<string>;
  addressLine?: Nullable<string>;
  postalCode?: Nullable<string>;
  latitude?: Nullable<number>;
  longitude?: Nullable<number>;
  heroMediaId?: Nullable<EntityId>;
  status?: ProgrammeStatus;
  publicationStatus?: ProgrammePublicationStatus;
  targetPath?: Nullable<string>;
  targetDomain?: Nullable<string>;
  seoTitle?: Nullable<string>;
  seoDescription?: Nullable<string>;
}
