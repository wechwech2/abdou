#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function assertContains(source, pattern, code) {
  if (!pattern.test(source)) {
    throw new Error(code);
  }
}

async function main() {
  const appPath = resolve(process.cwd(), 'apps', 'backoffice-web', 'public', 'app.js');
  const source = await readFile(appPath, 'utf8');

  assertContains(
    source,
    /async function loadWorkspace\(\)\s*{[\s\S]*?Promise\.allSettled\(/,
    'missing_load_workspace_all_settled'
  );
  assertContains(
    source,
    /const panelLoaders = \[[\s\S]*?\{\s*code:\s*'dashboard',\s*run:\s*loadDashboard\s*\}/,
    'missing_dashboard_loader_in_workspace'
  );
  assertContains(
    source,
    /const failedPanels = \[\];[\s\S]*?failedPanels\.push\(/,
    'missing_failed_panels_collect'
  );
  assertContains(
    source,
    /setPanelStatus\([\s\S]*?Erreur chargement:/,
    'missing_panel_error_status_on_reject'
  );
  assertContains(
    source,
    /return failedPanels;/,
    'missing_failed_panels_return'
  );

  assertContains(
    source,
    /async function tryRestoreSession\(\)\s*{[\s\S]*?const failedPanels = await loadWorkspace\(\);[\s\S]*?Session active \(partiel:/,
    'missing_partial_session_restore_status'
  );
  assertContains(
    source,
    /await api\('\/auth\/login'[\s\S]*?const failedPanels = await loadWorkspace\(\);[\s\S]*?Connecte \(partiel:/,
    'missing_partial_login_status'
  );

  console.log('[smoke] backoffice workspace partial-failure resilience guards present');
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
