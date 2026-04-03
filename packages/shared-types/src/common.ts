export type EntityId = number;
export type IsoDateTimeString = string;
export type Nullable<T> = T | null;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  meta: PaginationMeta;
  items: T[];
}
