#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const tasks = [
  {
    name: 'shared-types-runtime',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:shared-types']
        : ['run', 'test:smoke:shared-types'],
    timeoutMs: 120_000
  },
  {
    name: 'publication-workflow',
    command: process.execPath,
    args: ['tests/smoke/publication-workflow-smoke.mjs'],
    timeoutMs: 60_000
  },
  {
    name: 'deploy-rollback-workflow',
    command: process.execPath,
    args: ['tests/smoke/deploy-rollback-smoke.mjs'],
    timeoutMs: 60_000
  },
  {
    name: 'deploy-verify-workflow',
    command: process.execPath,
    args: ['tests/smoke/deploy-verify-smoke.mjs'],
    timeoutMs: 60_000
  },
  {
    name: 'contracts-catalog-consistency',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:contracts']
        : ['run', 'test:smoke:contracts'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-http-workflow',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:http']
        : ['run', 'test:smoke:admin-php:http'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-health-db',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:health-db']
        : ['run', 'test:smoke:admin-php:health-db'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-health-db-down',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:health-db-down']
        : ['run', 'test:smoke:admin-php:health-db-down'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-admin-page',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:admin-page']
        : ['run', 'test:smoke:admin-php:admin-page'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-dashboard-summary',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:dashboard-summary']
        : ['run', 'test:smoke:admin-php:dashboard-summary'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-dashboard-summary-db-down',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:dashboard-summary-db-down']
        : ['run', 'test:smoke:admin-php:dashboard-summary-db-down'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-not-found',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:not-found']
        : ['run', 'test:smoke:admin-php:not-found'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-route-surface',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:route-surface']
        : ['run', 'test:smoke:admin-php:route-surface'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-api-prefix',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:api-prefix']
        : ['run', 'test:smoke:admin-php:api-prefix'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-contracts',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:contracts']
        : ['run', 'test:smoke:admin-php:contracts'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-reference-read',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:reference-read']
        : ['run', 'test:smoke:admin-php:reference-read'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-workflow-detail-contract',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:workflow-detail-contract']
        : ['run', 'test:smoke:admin-php:workflow-detail-contract'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-rbac',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:rbac']
        : ['run', 'test:smoke:admin-php:rbac'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-auth-session',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:auth-session']
        : ['run', 'test:smoke:admin-php:auth-session'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-auth-errors',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:auth-errors']
        : ['run', 'test:smoke:admin-php:auth-errors'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-auth-logout',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:auth-logout']
        : ['run', 'test:smoke:admin-php:auth-logout'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-auth-matrix',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:auth-matrix']
        : ['run', 'test:smoke:admin-php:auth-matrix'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-php-validation',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-php:validation']
        : ['run', 'test:smoke:admin-php:validation'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-http-endpoints',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:http']
        : ['run', 'test:smoke:admin-api:http'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-dashboard-summary',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:dashboard-summary']
        : ['run', 'test:smoke:admin-api:dashboard-summary'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-db-down-matrix',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:db-down-matrix']
        : ['run', 'test:smoke:admin-api:db-down-matrix'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-envelope',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:envelope']
        : ['run', 'test:smoke:admin-api:envelope'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-technical-contract',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:technical-contract']
        : ['run', 'test:smoke:admin-api:technical-contract'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-methods',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:methods']
        : ['run', 'test:smoke:admin-api:methods'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-contract-guard',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:contract-guard']
        : ['run', 'test:smoke:admin-api:contract-guard'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-timeout',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:timeout']
        : ['run', 'test:smoke:admin-api:timeout'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-compat-catalog',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:compat-catalog']
        : ['run', 'test:smoke:admin-api:compat-catalog'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-guard-coverage',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:guard-coverage']
        : ['run', 'test:smoke:admin-api:guard-coverage'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-compat-snapshot',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:compat-snapshot']
        : ['run', 'test:smoke:admin-api:compat-snapshot'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-compat-auth-matrix',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:compat-auth-matrix']
        : ['run', 'test:smoke:admin-api:compat-auth-matrix'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-compat-response-policy',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:compat-response-policy']
        : ['run', 'test:smoke:admin-api:compat-response-policy'],
    timeoutMs: 120_000
  },
  {
    name: 'admin-api-compat-disabled',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:admin-api:compat-off']
        : ['run', 'test:smoke:admin-api:compat-off'],
    timeoutMs: 120_000
  },
  {
    name: 'backoffice-contract-parsing',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:backoffice:contract-parsing']
        : ['run', 'test:smoke:backoffice:contract-parsing'],
    timeoutMs: 60_000
  },
  {
    name: 'backoffice-dashboard-wiring',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:backoffice:dashboard-wiring']
        : ['run', 'test:smoke:backoffice:dashboard-wiring'],
    timeoutMs: 60_000
  },
  {
    name: 'backoffice-api-base',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:backoffice:api-base']
        : ['run', 'test:smoke:backoffice:api-base'],
    timeoutMs: 60_000
  },
  {
    name: 'backoffice-api-paths',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:backoffice:api-paths']
        : ['run', 'test:smoke:backoffice:api-paths'],
    timeoutMs: 60_000
  },
  {
    name: 'backoffice-workspace-partial',
    command: process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
    args:
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm run test:smoke:backoffice:workspace-partial']
        : ['run', 'test:smoke:backoffice:workspace-partial'],
    timeoutMs: 60_000
  }
];

function runTask(task) {
  const startedAt = Date.now();
  const result = spawnSync(task.command, task.args, {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
    timeout: task.timeoutMs,
    killSignal: 'SIGTERM'
  });
  const elapsedMs = Date.now() - startedAt;
  return {
    ...task,
    elapsedMs,
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ? String(result.error.message ?? result.error) : '',
    timedOut: Boolean(result.error && String(result.error.message || '').toLowerCase().includes('timed out'))
  };
}

function tail(text, maxChars = 2000) {
  const value = String(text ?? '');
  if (value.length <= maxChars) {
    return value;
  }
  return value.slice(value.length - maxChars);
}

async function writeSummaryReport(results) {
  const generatedAt = new Date().toISOString();
  const totalElapsedMs = results.reduce((acc, result) => acc + Number(result.elapsedMs || 0), 0);
  const payload = {
    generated_at: generatedAt,
    total: results.length,
    passed: results.filter((r) => r.status === 0).length,
    failed: results.filter((r) => r.status !== 0).length,
    total_elapsed_ms: totalElapsedMs,
    runtime: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    },
    tasks: results.map((result) => ({
      name: result.name,
      command: `${result.command} ${(result.args || []).join(' ')}`.trim(),
      status: result.status === 0 ? 'ok' : 'failed',
      exit_code: result.status,
      elapsed_ms: result.elapsedMs,
      timeout_ms: result.timeoutMs ?? null,
      timed_out: result.timedOut,
      stdout_tail: tail(result.stdout),
      stderr_tail: tail(result.stderr),
      error: result.error || '',
    })),
  };

  const logsDir = resolve(process.cwd(), 'dist', 'logs');
  await mkdir(logsDir, { recursive: true });
  const summaryPath = resolve(logsDir, 'smoke-summary.json');
  const summaryMarkdownPath = resolve(logsDir, 'smoke-summary.md');
  await writeFile(summaryPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(summaryMarkdownPath, buildMarkdownSummary(payload), 'utf8');
  console.log(`[smoke] summary_report=${summaryPath}`);
  console.log(`[smoke] summary_report_markdown=${summaryMarkdownPath}`);
}

function escapeMdCell(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ');
}

function trimBlock(value, maxChars = 500) {
  const text = String(value ?? '').trim();
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}...`;
}

function buildMarkdownSummary(payload) {
  const header = [
    '# Smoke Summary',
    '',
    `- Generated at: \`${payload.generated_at}\``,
    `- Result: **${payload.passed}/${payload.total} passed**`,
    `- Total elapsed: \`${payload.total_elapsed_ms}ms\``,
    `- Runtime: \`${payload.runtime.node_version}\` on \`${payload.runtime.platform}/${payload.runtime.arch}\``,
    ''
  ];

  const table = [
    '| Task | Status | Exit | Duration (ms) | Timeout (ms) |',
    '|---|---|---:|---:|---:|'
  ];

  for (const task of payload.tasks) {
    table.push(
      `| ${escapeMdCell(task.name)} | ${escapeMdCell(task.status)} | ${task.exit_code} | ${task.elapsed_ms} | ${task.timeout_ms ?? '-'} |`
    );
  }

  const failures = payload.tasks.filter((task) => task.status !== 'ok');
  if (failures.length === 0) {
    return `${header.join('\n')}${table.join('\n')}\n\nAll smoke tasks passed.\n`;
  }

  const failureBlocks = failures.map((task) => {
    const lines = [
      `## Failure: ${task.name}`,
      '',
      `- Command: \`${task.command}\``,
      `- Exit code: \`${task.exit_code}\``,
      `- Timed out: \`${task.timed_out}\``,
      ''
    ];
    if (String(task.stderr_tail || '').trim()) {
      lines.push('### stderr tail', '', '```text', trimBlock(task.stderr_tail), '```', '');
    }
    if (String(task.stdout_tail || '').trim()) {
      lines.push('### stdout tail', '', '```text', trimBlock(task.stdout_tail), '```', '');
    }
    if (String(task.error || '').trim()) {
      lines.push('### error', '', '```text', trimBlock(task.error), '```', '');
    }
    return lines.join('\n');
  });

  return `${header.join('\n')}${table.join('\n')}\n\n${failureBlocks.join('\n')}\n`;
}

async function main() {
  const results = tasks.map(runTask);

  for (const result of results) {
    const state = result.status === 0 ? 'OK' : 'FAILED';
    console.log(`[smoke][${state}] ${result.name} (${result.elapsedMs}ms)`);
    if (result.stdout.trim()) {
      console.log(result.stdout.trim());
    }
    if (result.status !== 0 && result.error) {
      console.error(result.error);
    }
    if (result.timedOut) {
      console.error(`[smoke] task timed out after ${result.timeoutMs}ms`);
    }
    if (result.status !== 0 && result.stderr.trim()) {
      console.error(result.stderr.trim());
    }
  }

  const failed = results.filter((r) => r.status !== 0);
  await writeSummaryReport(results);
  if (failed.length > 0) {
    console.error(`[smoke] summary: ${failed.length}/${results.length} failed`);
    process.exit(1);
  }

  console.log(`[smoke] summary: ${results.length}/${results.length} passed`);
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
