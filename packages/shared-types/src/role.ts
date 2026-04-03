import type { EntityId, IsoDateTimeString } from './common.js';

export interface Role {
  id: EntityId;
  code: string;
  label: string;
  isActive: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertRoleInput {
  code: string;
  label: string;
  isActive?: boolean;
}
