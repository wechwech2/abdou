import type { EntityId, IsoDateTimeString, Nullable } from './common.js';

export type RubriqueSettings = Record<string, unknown>;

export interface Rubrique {
  id: EntityId;
  programmeId: EntityId;
  code: string;
  title: string;
  slug: string;
  contentHtml: Nullable<string>;
  contentText: Nullable<string>;
  displayOrder: number;
  isEnabled: boolean;
  isMenuVisible: boolean;
  settingsJson: Nullable<RubriqueSettings>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface UpsertRubriqueInput {
  programmeId: EntityId;
  code: string;
  title: string;
  slug: string;
  contentHtml?: Nullable<string>;
  contentText?: Nullable<string>;
  displayOrder?: number;
  isEnabled?: boolean;
  isMenuVisible?: boolean;
  settingsJson?: Nullable<RubriqueSettings>;
}
