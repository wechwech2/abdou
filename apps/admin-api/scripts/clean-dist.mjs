#!/usr/bin/env node

import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const distPath = resolve(process.cwd(), 'dist');

async function main() {
  try {
    await rm(distPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 120
    });
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    process.stderr.write(`[admin-api][clean-dist] warning: unable to fully clean dist (${message})\n`);
  }
}

main();
