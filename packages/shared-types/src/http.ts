export type ApiSuccessPayload<T extends object> = T & { ok: true };

export interface ApiErrorPayload {
  ok: false;
  error: string;
  message?: string;
  details?: unknown;
}
