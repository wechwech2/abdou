import type { EntityId, IsoDateTimeString, Nullable } from './common.js';
import type { ClientStatus } from './enums.js';

export interface Client {
  id: EntityId;
  code: string;
  name: string;
  slug: string;
  legalName: Nullable<string>;
  contactName: Nullable<string>;
  contactEmail: Nullable<string>;
  contactPhone: Nullable<string>;
  brandPrimaryColor: Nullable<string>;
  brandSecondaryColor: Nullable<string>;
  logoMediaId: Nullable<EntityId>;
  status: ClientStatus;
  notes: Nullable<string>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertClientInput {
  code: string;
  name: string;
  slug: string;
  legalName?: Nullable<string>;
  contactName?: Nullable<string>;
  contactEmail?: Nullable<string>;
  contactPhone?: Nullable<string>;
  brandPrimaryColor?: Nullable<string>;
  brandSecondaryColor?: Nullable<string>;
  logoMediaId?: Nullable<EntityId>;
  status?: ClientStatus;
  notes?: Nullable<string>;
}
