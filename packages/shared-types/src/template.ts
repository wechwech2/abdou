import type { EntityId, IsoDateTimeString } from './common.js';

export interface Template {
  id: EntityId;
  code: string;
  name: string;
  version: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertTemplateInput {
  code: string;
  name: string;
  version: string;
  isDefault?: boolean;
  isActive?: boolean;
}
