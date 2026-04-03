import type { EntityId, IsoDateTimeString, Nullable } from './common.js';

export interface User {
  id: EntityId;
  roleId: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: Nullable<IsoDateTimeString>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertUserInput {
  roleId: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isActive?: boolean;
  lastLoginAt?: Nullable<IsoDateTimeString>;
}
