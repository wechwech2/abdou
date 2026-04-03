export interface RuntimeEnv {
  appEnv: string;
  mysqlHost: string;
  mysqlPort: number;
}

export function readRuntimeEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  return {
    appEnv: source.APP_ENV ?? 'development',
    mysqlHost: source.MYSQL_HOST ?? '127.0.0.1',
    mysqlPort: Number(source.MYSQL_PORT ?? 3306)
  };
}
