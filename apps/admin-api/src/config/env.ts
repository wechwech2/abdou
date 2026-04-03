export interface AdminApiEnv {
  appEnv: string;
  host: string;
  port: number;
  adminPhpBaseUrl: string;
  adminPhpTimeoutMs: number;
  compatEnabled: boolean;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value.trim() === '') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === null || value.trim() === '') {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

export function readAdminApiEnv(source: NodeJS.ProcessEnv = process.env): AdminApiEnv {
  return {
    appEnv: source.APP_ENV ?? 'development',
    host: source.ADMIN_API_HOST ?? '127.0.0.1',
    port: Number(source.ADMIN_API_PORT ?? 3001),
    adminPhpBaseUrl: (source.ADMIN_PHP_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, ''),
    adminPhpTimeoutMs: parsePositiveInt(source.ADMIN_PHP_TIMEOUT_MS, 15000),
    compatEnabled: parseBoolean(source.ADMIN_API_COMPAT_ENABLED, false)
  };
}
