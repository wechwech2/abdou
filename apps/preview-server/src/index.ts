export interface PreviewServerOptions {
  port?: number;
  rootDir?: string;
}

export function startPreviewServer(options: PreviewServerOptions): void {
  const port = options.port ?? 4173;
  const rootDir = options.rootDir ?? 'dist/preview';
  process.stdout.write(`[preview-server] placeholder start on :${port} serving ${rootDir}\n`);
}
