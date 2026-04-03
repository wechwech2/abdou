#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function assertContains(source, pattern, code) {
  if (!pattern.test(source)) {
    throw new Error(code);
  }
}

async function main() {
  const indexPath = resolve(process.cwd(), 'apps', 'backoffice-web', 'public', 'index.html');
  const appPath = resolve(process.cwd(), 'apps', 'backoffice-web', 'public', 'app.js');

  const [indexSource, appSource] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readFile(appPath, 'utf8')
  ]);

  assertContains(
    indexSource,
    /<button\s+data-tab="dashboard"[^>]*>\s*Dashboard\s*<\/button>/i,
    'missing_dashboard_tab_button'
  );
  assertContains(
    indexSource,
    /<section\s+id="dashboard"\s+class="tab-panel active"><\/section>/i,
    'missing_dashboard_panel_section'
  );

  assertContains(
    appSource,
    /const dashboardPanel = document\.querySelector\('#dashboard'\);/,
    'missing_dashboard_panel_binding'
  );
  assertContains(
    appSource,
    /panels\s*=\s*{[\s\S]*?dashboard:\s*dashboardPanel[\s\S]*?}/,
    'missing_dashboard_in_panels_map'
  );
  assertContains(
    appSource,
    /async function loadDashboard\(\)\s*{[\s\S]*?api\('\/dashboard\/summary'\)/,
    'missing_dashboard_loader_call'
  );
  assertContains(
    appSource,
    /const panelLoaders = \[[\s\S]*?\{\s*code:\s*'dashboard',\s*run:\s*loadDashboard\s*\}/,
    'missing_dashboard_in_workspace_loaders'
  );

  console.log('[smoke] backoffice dashboard wiring guards present');
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
