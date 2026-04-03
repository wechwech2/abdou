#!/usr/bin/env node

import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const args = ['--filter', '@abdou/admin-api', 'run', 'start'];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ADMIN_API_COMPAT_ENABLED: 'true'
  }
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
