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
    /loadDashboard\(\)\s*{[\s\S]*?expectDashboardSummaryPayload\([\s\S]*?'dashboard_summary'/,
    'missing_dashboard_summary_contract_guard'
  );
  assertContains(
    source,
    /loadClients\(\)\s*{[\s\S]*?expectPagedPayloadWithItemKeys\([\s\S]*?'clients_list'[\s\S]*?\['id', 'code', 'name', 'slug', 'status'\]/,
    'missing_clients_contract_guard'
  );
  assertContains(
    source,
    /loadProgrammes\(\)\s*{[\s\S]*?expectPagedPayloadWithItemKeys\([\s\S]*?'programmes_list'[\s\S]*?\['id', 'code', 'name', 'slug', 'client_id', 'offre_id', 'status'\]/,
    'missing_programmes_contract_guard'
  );
  assertContains(
    source,
    /loadPublications\(\)\s*{[\s\S]*?expectPagedPayloadWithItemKeys\([\s\S]*?'publications_list'[\s\S]*?\['id', 'programme_id', 'build_code', 'version_number', 'status'\]/,
    'missing_publications_contract_guard'
  );
  assertContains(
    source,
    /loadRubriques\(\)\s*{[\s\S]*?expectPagedPayloadWithItemKeys\([\s\S]*?'rubriques_list'[\s\S]*?\['id', 'programme_id', 'code', 'title', 'slug', 'is_enabled'\]/,
    'missing_rubriques_contract_guard'
  );
  assertContains(
    source,
    /loadMedias\(\)\s*{[\s\S]*?expectPagedPayloadWithItemKeys\([\s\S]*?'medias_list'[\s\S]*?\['id', 'type', 'original_filename', 'storage_path', 'status'\]/,
    'missing_medias_contract_guard'
  );
  assertContains(
    source,
    /loadLots\(\)\s*{[\s\S]*?expectPagedPayloadWithItemKeys\([\s\S]*?'lots_list'[\s\S]*?\['id', 'programme_id', 'reference', 'title', 'typology', 'is_published'\]/,
    'missing_lots_contract_guard'
  );
  assertContains(
    source,
    /expectWorkflowDetailPayload\([\s\S]*?publication_workflow_detail/,
    'missing_workflow_detail_guard'
  );

  console.log('[smoke] backoffice contract parsing guards present');
}

main().catch((error) => {
  console.error(`[smoke] failed: ${String(error instanceof Error ? error.message : error)}`);
  process.exit(1);
});
