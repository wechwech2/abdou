import type { EntityId, IsoDateTimeString, Nullable } from './common.js';

export interface Batiment {
  id: EntityId;
  programmeId: EntityId;
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertBatimentInput {
  programmeId: EntityId;
  code: string;
  name: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface Etage {
  id: EntityId;
  batimentId: EntityId;
  code: string;
  name: string;
  levelNumber: number;
  displayOrder: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertEtageInput {
  batimentId: EntityId;
  code: string;
  name: string;
  levelNumber: number;
  displayOrder?: number;
}

export interface Lot {
  id: EntityId;
  programmeId: EntityId;
  batimentId: Nullable<EntityId>;
  etageId: Nullable<EntityId>;
  reference: string;
  title: Nullable<string>;
  typology: Nullable<string>;
  surfaceM2: Nullable<number>;
  priceLabel: Nullable<string>;
  commercialStatus: Nullable<string>;
  shortDescription: Nullable<string>;
  displayOrder: number;
  isPublished: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertLotInput {
  programmeId: EntityId;
  batimentId?: Nullable<EntityId>;
  etageId?: Nullable<EntityId>;
  reference: string;
  title?: Nullable<string>;
  typology?: Nullable<string>;
  surfaceM2?: Nullable<number>;
  priceLabel?: Nullable<string>;
  commercialStatus?: Nullable<string>;
  shortDescription?: Nullable<string>;
  displayOrder?: number;
  isPublished?: boolean;
}
