import type { EntityId, IsoDateTimeString, Nullable } from './common.js';

export interface Offre {
  id: EntityId;
  code: string;
  name: string;
  slug: string;
  description: Nullable<string>;
  templateId: EntityId;
  maxRubriques: Nullable<number>;
  enableLots: boolean;
  enableDocuments: boolean;
  enableGallery: boolean;
  enableMap: boolean;
  enableContactBlock: boolean;
  isActive: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertOffreInput {
  code: string;
  name: string;
  slug: string;
  description?: Nullable<string>;
  templateId: EntityId;
  maxRubriques?: Nullable<number>;
  enableLots?: boolean;
  enableDocuments?: boolean;
  enableGallery?: boolean;
  enableMap?: boolean;
  enableContactBlock?: boolean;
  isActive?: boolean;
}
