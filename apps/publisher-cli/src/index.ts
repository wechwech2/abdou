export interface PublisherRunOptions {
  publicationId?: number;
  outputDir?: string;
}

export function runPublisherCli(options: PublisherRunOptions): void {
  const idLabel = options.publicationId ?? 'N/A';
  const outLabel = options.outputDir ?? 'dist/published-sites';
  process.stdout.write(`[publisher-cli] placeholder run for publication ${idLabel} -> ${outLabel}\n`);
}
