import type { ServerResponse } from 'node:http';
import type { ApiErrorPayload, ApiSuccessPayload } from '@abdou/shared-types';

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

export function sendJsonSuccess<T extends object>(
  response: ServerResponse,
  statusCode: number,
  payload: T
): void {
  sendJson(response, statusCode, {
    ok: true,
    ...payload
  } satisfies ApiSuccessPayload<T>);
}

export function sendJsonError(
  response: ServerResponse,
  statusCode: number,
  error: string,
  message?: string,
  details?: unknown
): void {
  const payload: ApiErrorPayload = {
    ok: false,
    error
  };
  if (message) {
    payload.message = message;
  }
  if (details !== undefined) {
    payload.details = details;
  }
  sendJson(response, statusCode, payload);
}
