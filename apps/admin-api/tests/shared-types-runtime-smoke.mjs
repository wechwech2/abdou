#!/usr/bin/env node

import {
  buildContractCatalog,
  CLIENT_STATUSES,
  MEDIA_STATUSES,
  MEDIA_TYPES,
  PROGRAMME_PUBLICATION_STATUSES,
  PROGRAMME_STATUSES,
  PUBLICATION_DEPLOYMENT_STATUSES,
  PUBLICATION_DEPLOYMENT_TARGET_TYPES,
  PUBLICATION_STATUSES,
  ROLE_CODES
} from '@abdou/shared-types';

function assertArray(name, value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
}

function main() {
  assertArray('CLIENT_STATUSES', CLIENT_STATUSES);
  assertArray('PROGRAMME_STATUSES', PROGRAMME_STATUSES);
  assertArray('PROGRAMME_PUBLICATION_STATUSES', PROGRAMME_PUBLICATION_STATUSES);
  assertArray('PUBLICATION_STATUSES', PUBLICATION_STATUSES);
  assertArray('ROLE_CODES', ROLE_CODES);
  assertArray('MEDIA_TYPES', MEDIA_TYPES);
  assertArray('MEDIA_STATUSES', MEDIA_STATUSES);
  assertArray('PUBLICATION_DEPLOYMENT_TARGET_TYPES', PUBLICATION_DEPLOYMENT_TARGET_TYPES);
  assertArray('PUBLICATION_DEPLOYMENT_STATUSES', PUBLICATION_DEPLOYMENT_STATUSES);
  const contracts = buildContractCatalog();
  assertArray('contracts.roleCode', contracts.roleCode);

  console.log('[smoke] shared-types runtime import ok');
  console.log(`[smoke] publication_status_values=${PUBLICATION_STATUSES.join(',')}`);
}

main();
