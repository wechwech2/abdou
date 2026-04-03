
const API_BASE_CANDIDATES = (() => {
  const explicitBaseRaw =
    globalThis?.ABDOU_API_BASE ||
    document.querySelector('meta[name="abdou-api-base"]')?.getAttribute('content') ||
    '';
  const explicitBase = sanitizeExplicitApiBase(explicitBaseRaw);
  if (explicitBase) {
    return [explicitBase];
  }
  if (String(explicitBaseRaw || '').trim() !== '') {
    console.warn('[backoffice] ABDOU_API_BASE ignored: expected a root-relative base path (example: /api)');
  }
  return ['/api'];
})();

function normalizeApiBase(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '/') return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function sanitizeExplicitApiBase(value) {
  const normalized = normalizeApiBase(value);
  if (!normalized) return '';
  if (!normalized.startsWith('/')) return '';
  if (/^https?:\/\//i.test(normalized)) return '';
  if (!(normalized === '/api' || normalized.startsWith('/api/'))) return '';
  return normalized;
}

const authCard = document.querySelector('#auth-card');
const workspace = document.querySelector('#workspace');
const authStatus = document.querySelector('#auth-status');
const loginForm = document.querySelector('#login-form');
const logoutBtn = document.querySelector('#logout-btn');
const welcome = document.querySelector('#welcome');
const dashboardPanel = document.querySelector('#dashboard');
const rolesPanel = document.querySelector('#roles');
const usersPanel = document.querySelector('#users');
const clientsPanel = document.querySelector('#clients');
const templatesPanel = document.querySelector('#templates');
const offresPanel = document.querySelector('#offres');
const programmesPanel = document.querySelector('#programmes');
const rubriquesPanel = document.querySelector('#rubriques');
const mediasPanel = document.querySelector('#medias');
const lotsPanel = document.querySelector('#lots');
const publicationsPanel = document.querySelector('#publications');

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = {
  dashboard: dashboardPanel,
  roles: rolesPanel,
  users: usersPanel,
  clients: clientsPanel,
  templates: templatesPanel,
  offres: offresPanel,
  programmes: programmesPanel,
  rubriques: rubriquesPanel,
  medias: mediasPanel,
  lots: lotsPanel,
  publications: publicationsPanel
};

const filters = {
  roles: { q: '' },
  users: { q: '', role: 'all' },
  clients: { q: '', status: 'active', page: 1, limit: 20 },
  templates: { q: '', page: 1, limit: 20 },
  offres: { q: '', page: 1, limit: 20 },
  programmes: { q: '', status: 'all', client_id: '', offre_id: '', page: 1, limit: 20 },
  rubriques: { q: '', enabled: 'all', programme_id: '', page: 1, limit: 20 },
  medias: { q: '', status: 'all', type: 'all', page: 1, limit: 20 },
  lots: { q: '', published: 'all', programme_id: '', page: 1, limit: 20 },
  publications: { status: 'all', programme_id: '', page: 1, limit: 20 }
};

const contractCatalogDefaults = {
  clientStatus: ['active', 'inactive', 'archived'],
  roleCode: ['admin', 'content_operator', 'validator', 'technical_operator'],
  programmeStatus: ['draft', 'ready', 'archived'],
  programmePublicationStatus: ['not_published', 'generated', 'deployed', 'failed'],
  publicationStatus: ['draft', 'generating', 'generated', 'deployed', 'failed', 'archived'],
  mediaType: ['image', 'video', 'document'],
  mediaStatus: ['uploaded', 'optimized', 'published', 'archived'],
  publicationDeploymentTargetType: ['ovh_ftp', 'local_preview', 'manual'],
  publicationDeploymentStatus: ['pending', 'running', 'success', 'failed', 'rolled_back']
};

let contractCatalog = { ...contractCatalogDefaults };

const workflow = { publicationId: null };
const publicationDetailState = { token: 0, snapshot: null };
const publicationArtifactsState = { publicationId: null, artifacts: null };

function normalizeContractValues(value, fallback) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const out = value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return out.length > 0 ? out : [...fallback];
}

function optionsHtml(values, selectedValue, includeAll = false) {
  const options = [];
  if (includeAll) {
    options.push(`<option value="all" ${String(selectedValue) === 'all' ? 'selected' : ''}>all</option>`);
  }
  for (const value of values) {
    options.push(
      `<option value="${escapeHtml(value)}" ${String(selectedValue) === value ? 'selected' : ''}>${escapeHtml(value)}</option>`
    );
  }
  return options.join('');
}

function ensureObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}_invalid_object`);
  }
  return value;
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label}_invalid_array`);
  }
  return value;
}

function ensureMeta(value, label) {
  const candidate = ensureObject(value || {}, label);
  const total = Number(candidate.total ?? 0);
  const page = Number(candidate.page ?? 1);
  const limit = Number(candidate.limit ?? 20);
  return {
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20
  };
}

function expectPagedPayload(payload, label) {
  const root = ensureObject(payload, label);
  return {
    items: ensureArray(root.items, `${label}_items`),
    meta: ensureMeta(root.meta, `${label}_meta`)
  };
}

function ensureItemKeys(item, label, requiredKeys) {
  const row = ensureObject(item, label);
  requiredKeys.forEach((key) => {
    if (!(key in row)) {
      throw new Error(`${label}_missing_key_${key}`);
    }
  });
  return row;
}

function expectPagedPayloadWithItemKeys(payload, label, requiredKeys) {
  const data = expectPagedPayload(payload, label);
  return {
    items: data.items.map((item, index) => ensureItemKeys(item, `${label}_item_${index}`, requiredKeys)),
    meta: data.meta
  };
}

function expectListPayload(payload, label) {
  const root = ensureObject(payload, label);
  return ensureArray(root.items, `${label}_items`);
}

function expectItemPayload(payload, label) {
  const root = ensureObject(payload, label);
  const item = root.item ?? root;
  return ensureObject(item, `${label}_item`);
}

function expectItemPayloadWithKeys(payload, label, requiredKeys) {
  return ensureItemKeys(expectItemPayload(payload, label), label, requiredKeys);
}

function expectWorkflowDetailPayload(payload, label) {
  const root = ensureObject(payload, label);
  const detail = ensureObject(root.detail, `${label}_detail`);
  const deployments = ensureObject(root.deployments, `${label}_deployments`);
  const buildLog = ensureObject(root.build_log, `${label}_build_log`);
  const deployLog = ensureObject(root.deploy_log, `${label}_deploy_log`);
  const deployArtifacts = ensureObject(root.deploy_artifacts, `${label}_deploy_artifacts`);
  const deploySummary = ensureObject(root.deploy_summary, `${label}_deploy_summary`);

  return {
    ...root,
    detail: {
      ...detail,
      item: expectItemPayloadWithKeys(detail, `${label}_detail_item`, ['id', 'programme_id', 'build_code', 'status'])
    },
    deployments: {
      ...deployments,
      items: ensureArray(deployments.items, `${label}_deployments_items`)
    },
    build_log: buildLog,
    deploy_log: deployLog,
    deploy_artifacts: deployArtifacts,
    deploy_summary: deploySummary
  };
}

function expectDashboardSummaryPayload(payload, label) {
  const root = ensureObject(payload, label);
  const summary = ensureObject(root.summary, `${label}_summary`);
  const clients = ensureObject(summary.clients, `${label}_clients`);
  const programmes = ensureObject(summary.programmes, `${label}_programmes`);
  const publications = ensureObject(summary.publications, `${label}_publications`);
  const deployments = ensureObject(summary.deployments, `${label}_deployments`);

  ['total'].forEach((key) => {
    if (!Number.isFinite(Number(clients[key]))) throw new Error(`${label}_clients_total`);
    if (!Number.isFinite(Number(programmes[key]))) throw new Error(`${label}_programmes_total`);
    if (!Number.isFinite(Number(publications[key]))) throw new Error(`${label}_publications_total`);
    if (!Number.isFinite(Number(deployments[key]))) throw new Error(`${label}_deployments_total`);
  });

  return {
    summary: {
      clients,
      programmes,
      publications,
      deployments,
      timestamp: String(summary.timestamp || '')
    }
  };
}

function setStatus(message, kind = 'muted') {
  authStatus.textContent = message;
  authStatus.className = `status ${kind}`;
}

function setPanelStatus(panelId, message, kind = 'muted') {
  const node = document.querySelector(`#${panelId}-status`);
  if (!node) return;
  node.textContent = message;
  node.className = `panel-status ${kind}`;
}

function syncPublicationIdInputs(id) {
  const next = id ? String(id) : '';
  [
    '#publication-build-form input[name="id"]',
    '#publication-status-form input[name="id"]',
    '#publication-preview-form input[name="id"]',
    '#publication-deploy-form input[name="id"]',
    '#publication-detail-form input[name="id"]'
  ].forEach((selector) => {
    const input = document.querySelector(selector);
    if (input) {
      input.value = next;
    }
  });
}

async function api(path, options = {}) {
  const candidates = API_BASE_CANDIDATES;
  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const base = candidates[index];
    const response = await fetch(`${base}${path}`, {
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    const raw = await response.text();
    let json = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (response.ok) {
      if (json && typeof json === 'object' && json.ok === false) {
        const message = json.error || json.message || `http_${response.status}`;
        throw new Error(message);
      }
      return json;
    }

    const message = json?.error || json?.message || `http_${response.status}`;
    lastError = new Error(message);
    const canRetry = index < candidates.length - 1;
    if (!canRetry || (response.status !== 404 && response.status !== 502)) {
      throw lastError;
    }
  }

  throw lastError || new Error('request_failed');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusChip(value) {
  const label = String(value ?? 'unknown');
  const code = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
  return `<span class="status-chip status-${escapeHtml(code)}">${escapeHtml(label)}</span>`;
}

function readForm(id) {
  const form = document.querySelector(`#${id}`);
  if (!form) return null;
  return Object.fromEntries(new FormData(form).entries());
}

function numberOrNull(value) {
  const str = String(value ?? '').trim();
  if (str === '') return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function formatTimestamp(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getStalenessInfo(value, maxAgeMinutes = 5) {
  if (!value) {
    return { label: 'unknown', age: '-' };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { label: 'unknown', age: '-' };
  }
  const ageMs = Date.now() - date.getTime();
  const ageMinutes = Math.max(0, Math.floor(ageMs / 60000));
  const label = ageMinutes > maxAgeMinutes ? 'stale' : 'fresh';
  return { label, age: `${ageMinutes}m` };
}

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const s = String(value ?? '').trim();
    if (s !== '') search.set(key, s);
  });
  const out = search.toString();
  return out ? `?${out}` : '';
}

function pagerHtml(panel, meta = { total: 0, page: 1, limit: 20 }) {
  const totalPages = Math.max(1, Math.ceil(Number(meta.total || 0) / Number(meta.limit || 20)));
  const page = Number(meta.page || 1);
  return `<div class="pager"><button type="button" data-page-panel="${panel}" data-page-dir="prev">Prev</button><span class="muted">Page ${escapeHtml(page)} / ${escapeHtml(totalPages)} (${escapeHtml(meta.total)} items)</span><button type="button" data-page-panel="${panel}" data-page-dir="next">Next</button></div>`;
}

function buildDashboardHtml(summary) {
  const cards = [
    ['Clients actifs', summary.clients.active, summary.clients.total],
    ['Programmes prets', summary.programmes.ready, summary.programmes.total],
    ['Publications deployees', summary.publications.deployed, summary.publications.total],
    ['Deployments success', summary.deployments.success, summary.deployments.total]
  ]
    .map(
      ([label, value, total]) => `
      <article class="kpi-card">
        <p class="kpi-label">${escapeHtml(label)}</p>
        <p class="kpi-value">${escapeHtml(value)}</p>
        <p class="kpi-sub muted">Total: ${escapeHtml(total)}</p>
      </article>`
    )
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <div class="actions-grid">
          <button type="button" id="dashboard-refresh-btn">Rafraichir synthese</button>
        </div>
        <p id="dashboard-status" class="panel-status muted">Pret</p>
      </div>

      <div class="kpi-grid">
        ${cards}
      </div>

      <div class="card">
        <h3>Synthese publication</h3>
        <table class="list">
          <thead><tr><th>Bloc</th><th>Details</th></tr></thead>
          <tbody>
            <tr><td>Clients</td><td>active=${escapeHtml(summary.clients.active)} | inactive=${escapeHtml(summary.clients.inactive)} | archived=${escapeHtml(summary.clients.archived)} | total=${escapeHtml(summary.clients.total)}</td></tr>
            <tr><td>Programmes</td><td>draft=${escapeHtml(summary.programmes.draft)} | ready=${escapeHtml(summary.programmes.ready)} | deployed=${escapeHtml(summary.programmes.deployed)} | failed=${escapeHtml(summary.programmes.failed)} | total=${escapeHtml(summary.programmes.total)}</td></tr>
            <tr><td>Publications</td><td>draft=${escapeHtml(summary.publications.draft)} | generating=${escapeHtml(summary.publications.generating)} | generated=${escapeHtml(summary.publications.generated)} | deployed=${escapeHtml(summary.publications.deployed)} | failed=${escapeHtml(summary.publications.failed)} | total=${escapeHtml(summary.publications.total)}</td></tr>
            <tr><td>Deployments</td><td>pending=${escapeHtml(summary.deployments.pending)} | running=${escapeHtml(summary.deployments.running)} | success=${escapeHtml(summary.deployments.success)} | failed=${escapeHtml(summary.deployments.failed)} | rolled_back=${escapeHtml(summary.deployments.rolled_back)} | total=${escapeHtml(summary.deployments.total)}</td></tr>
          </tbody>
        </table>
        <p class="muted">Derniere mise a jour: ${escapeHtml(formatTimestamp(summary.timestamp))}</p>
      </div>
    </div>
  `;
}

function buildRolesHtml(items) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.is_active ? 'yes' : 'no')}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="roles-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche role" value="${escapeHtml(filters.roles.q)}" />
          <button type="submit">Filtrer</button>
        </form>
        <p id="roles-status" class="panel-status muted">Pret</p>
      </div>

      <div class="card">
        <h3>Roles</h3>
        <table class="list"><thead><tr><th>ID</th><th>Code</th><th>Label</th><th>Active</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildUsersHtml(items) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.first_name)} ${escapeHtml(item.last_name)}</td><td>${escapeHtml(item.email)}</td><td>${escapeHtml(item.role_code || item.role_label)}</td><td>${escapeHtml(item.is_active ? 'yes' : 'no')}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="users-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche user" value="${escapeHtml(filters.users.q)}" />
          <select name="role">
            ${optionsHtml(contractCatalog.roleCode, filters.users.role, true)}
          </select>
          <button type="submit">Filtrer</button>
        </form>
        <form id="users-detail-form" class="filters-grid">
          <input name="id" placeholder="User ID" />
          <button type="submit">Detail</button>
        </form>
        <p id="users-status" class="panel-status muted">Pret</p>
      </div>

      <div id="users-detail-output"></div>

      <div class="card">
        <h3>Users</h3>
        <table class="list"><thead><tr><th>ID</th><th>Nom</th><th>Email</th><th>Role</th><th>Active</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildTemplatesHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.is_default ? 'yes' : 'no')}</td><td>${escapeHtml(item.version)}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="templates-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.templates.q)}" />
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.templates.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        <form id="templates-detail-form" class="filters-grid">
          <input name="id" placeholder="Template ID" />
          <button type="submit">Detail</button>
        </form>
        ${pagerHtml('templates', meta)}
        <p id="templates-status" class="panel-status muted">Pret</p>
      </div>

      <div id="templates-detail-output"></div>

      <div class="card">
        <h3>Templates</h3>
        <table class="list"><thead><tr><th>ID</th><th>Code</th><th>Nom</th><th>Defaut</th><th>Version</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildClientsHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.slug)}</td><td>${escapeHtml(item.status)}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="clients-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.clients.q)}" />
          <select name="status">
            ${optionsHtml(contractCatalog.clientStatus, filters.clients.status, true)}
          </select>
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.clients.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('clients', meta)}
      </div>

      <div class="card">
        <div class="actions-grid">
          <form id="client-create-form" class="mini-form">
            <h4>Nouveau client</h4>
            <input name="code" placeholder="Code (ex: CLT001)" required />
            <input name="name" placeholder="Nom" required />
            <input name="slug" placeholder="Slug" required />
            <button type="submit">Creer</button>
          </form>

          <form id="client-update-form" class="mini-form">
            <h4>Mettre a jour client</h4>
            <input name="id" placeholder="Client ID" required />
            <input name="name" placeholder="Nouveau nom" required />
            <button type="submit">Mettre a jour</button>
          </form>
        </div>
        <p id="clients-status" class="panel-status muted">Pret</p>
      </div>

      <div class="card">
        <h3>Clients</h3>
        <table class="list"><thead><tr><th>ID</th><th>Code</th><th>Nom</th><th>Slug</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildOffresHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.template_name || item.template_code || item.template_id)}</td><td>${escapeHtml(item.enable_lots ? 'yes' : 'no')}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="offres-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.offres.q)}" />
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.offres.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('offres', meta)}
      </div>

      <div class="card">
        <h3>Offres (template associe)</h3>
        <table class="list"><thead><tr><th>ID</th><th>Code</th><th>Nom</th><th>Template</th><th>Lots</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}
function buildProgrammesHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.client_name || item.client_id)}</td><td>${escapeHtml(item.offre_name || item.offre_id)}</td><td>${escapeHtml(item.status)}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="programmes-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.programmes.q)}" />
          <select name="status">
            ${optionsHtml(contractCatalog.programmeStatus, filters.programmes.status, true)}
          </select>
          <input name="client_id" placeholder="Client ID" value="${escapeHtml(filters.programmes.client_id)}" />
          <input name="offre_id" placeholder="Offre ID" value="${escapeHtml(filters.programmes.offre_id)}" />
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.programmes.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('programmes', meta)}
      </div>

      <div class="card">
        <div class="actions-grid">
          <form id="programme-create-form" class="mini-form">
            <h4>Nouveau programme</h4>
            <input name="client_id" placeholder="Client ID" required />
            <input name="offre_id" placeholder="Offre ID" value="1" required />
            <input name="code" placeholder="Code (ex: PRG001)" required />
            <input name="name" placeholder="Nom" required />
            <input name="slug" placeholder="Slug" required />
            <button type="submit">Creer</button>
          </form>

          <form id="programme-update-form" class="mini-form">
            <h4>Mettre a jour programme</h4>
            <input name="id" placeholder="Programme ID" required />
            <input name="name" placeholder="Nouveau nom" required />
            <select name="status">${optionsHtml(contractCatalog.programmeStatus, 'draft', false)}</select>
            <button type="submit">Mettre a jour</button>
          </form>

          <form id="programme-detail-form" class="mini-form">
            <h4>Detail programme</h4>
            <input name="id" placeholder="Programme ID" required />
            <button type="submit">Charger</button>
          </form>
        </div>
        <p id="programmes-status" class="panel-status muted">Pret</p>
      </div>

      <div id="programme-detail-output"></div>

      <div class="card">
        <h3>Programmes</h3>
        <table class="list"><thead><tr><th>ID</th><th>Code</th><th>Nom</th><th>Client</th><th>Offre</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function renderSimpleDetailCard(title, item) {
  if (!item) {
    return '';
  }

  const rows = Object.entries(item)
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  return `<div class="card"><h3>${escapeHtml(title)}</h3><table class="list"><tbody>${rows}</tbody></table></div>`;
}

function buildRubriquesHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.programme_id)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.slug)}</td><td>${escapeHtml(item.is_enabled)}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="rubriques-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.rubriques.q)}" />
          <select name="enabled">
            <option value="all" ${filters.rubriques.enabled === 'all' ? 'selected' : ''}>all</option>
            <option value="enabled" ${filters.rubriques.enabled === 'enabled' ? 'selected' : ''}>enabled</option>
            <option value="disabled" ${filters.rubriques.enabled === 'disabled' ? 'selected' : ''}>disabled</option>
          </select>
          <input name="programme_id" placeholder="Programme ID" value="${escapeHtml(filters.rubriques.programme_id)}" />
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.rubriques.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('rubriques', meta)}
      </div>

      <div class="card">
        <div class="actions-grid">
          <form id="rubrique-create-form" class="mini-form">
            <h4>Nouvelle rubrique</h4>
            <input name="programme_id" placeholder="Programme ID" required />
            <input name="code" placeholder="Code" required />
            <input name="title" placeholder="Titre" required />
            <input name="slug" placeholder="Slug" required />
            <button type="submit">Creer</button>
          </form>

          <form id="rubrique-update-form" class="mini-form">
            <h4>Mettre a jour rubrique</h4>
            <input name="id" placeholder="Rubrique ID" required />
            <input name="title" placeholder="Nouveau titre" required />
            <input name="slug" placeholder="Nouveau slug" required />
            <button type="submit">Mettre a jour</button>
          </form>
        </div>
        <p id="rubriques-status" class="panel-status muted">Pret</p>
      </div>

      <div class="card">
        <h3>Rubriques</h3>
        <table class="list"><thead><tr><th>ID</th><th>Programme</th><th>Code</th><th>Titre</th><th>Slug</th><th>Enabled</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildMediasHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.original_filename)}</td><td>${escapeHtml(item.storage_path)}</td><td>${escapeHtml(item.status)}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="medias-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.medias.q)}" />
          <select name="status">
            <option value="all" ${filters.medias.status === 'all' ? 'selected' : ''}>all</option>
            <option value="uploaded" ${filters.medias.status === 'uploaded' ? 'selected' : ''}>uploaded</option>
            <option value="optimized" ${filters.medias.status === 'optimized' ? 'selected' : ''}>optimized</option>
            <option value="published" ${filters.medias.status === 'published' ? 'selected' : ''}>published</option>
            <option value="archived" ${filters.medias.status === 'archived' ? 'selected' : ''}>archived</option>
          </select>
          <select name="type">
            <option value="all" ${filters.medias.type === 'all' ? 'selected' : ''}>all</option>
            <option value="image" ${filters.medias.type === 'image' ? 'selected' : ''}>image</option>
            <option value="video" ${filters.medias.type === 'video' ? 'selected' : ''}>video</option>
            <option value="document" ${filters.medias.type === 'document' ? 'selected' : ''}>document</option>
          </select>
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.medias.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('medias', meta)}
      </div>

      <div class="card">
        <div class="actions-grid">
          <form id="media-create-form" class="mini-form">
            <h4>Nouveau media</h4>
            <select name="type"><option value="image">image</option><option value="video">video</option><option value="document">document</option></select>
            <input name="mime_type" placeholder="Mime type" value="image/jpeg" required />
            <input name="original_filename" placeholder="Original filename" required />
            <input name="storage_filename" placeholder="Storage filename" required />
            <input name="storage_path" placeholder="Storage path" required />
            <button type="submit">Creer</button>
          </form>
        </div>
        <p id="medias-status" class="panel-status muted">Pret</p>
      </div>

      <div class="card">
        <h3>Medias</h3>
        <table class="list"><thead><tr><th>ID</th><th>Type</th><th>Nom</th><th>Path</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildLotsHtml(items, meta) {
  const rows = items
    .map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.programme_id)}</td><td>${escapeHtml(item.reference)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.typology)}</td><td>${escapeHtml(item.is_published)}</td></tr>`)
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="lots-filter-form" class="filters-grid">
          <input name="q" placeholder="Recherche" value="${escapeHtml(filters.lots.q)}" />
          <select name="published">
            <option value="all" ${filters.lots.published === 'all' ? 'selected' : ''}>all</option>
            <option value="published" ${filters.lots.published === 'published' ? 'selected' : ''}>published</option>
            <option value="unpublished" ${filters.lots.published === 'unpublished' ? 'selected' : ''}>unpublished</option>
          </select>
          <input name="programme_id" placeholder="Programme ID" value="${escapeHtml(filters.lots.programme_id)}" />
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.lots.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('lots', meta)}
      </div>

      <div class="card">
        <div class="actions-grid">
          <form id="lot-create-form" class="mini-form">
            <h4>Nouveau lot</h4>
            <input name="programme_id" placeholder="Programme ID" required />
            <input name="reference" placeholder="Reference" required />
            <input name="title" placeholder="Titre" />
            <input name="typology" placeholder="Typologie" />
            <button type="submit">Creer</button>
          </form>

          <form id="lot-update-form" class="mini-form">
            <h4>Mettre a jour lot</h4>
            <input name="id" placeholder="Lot ID" required />
            <input name="title" placeholder="Nouveau titre" />
            <input name="commercial_status" placeholder="Statut commercial" />
            <button type="submit">Mettre a jour</button>
          </form>
        </div>
        <p id="lots-status" class="panel-status muted">Pret</p>
      </div>

      <div class="card">
        <h3>Lots</h3>
        <table class="list"><thead><tr><th>ID</th><th>Programme</th><th>Reference</th><th>Titre</th><th>Typologie</th><th>Published</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function buildPublicationsHtml(items, meta) {
  const selectedId = Number(workflow.publicationId || 0);
  const rows = items
    .map((item) => {
      const isSelected = Number(item.id) === selectedId;
      const rowClass = isSelected ? ' class="publication-row-selected"' : '';
      return `<tr${rowClass}><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.build_code)}</td><td>${escapeHtml(item.programme_name || item.programme_id)}</td><td>${escapeHtml(item.version_number)}</td><td>${statusChip(item.status)}</td><td><div class="publication-actions-inline"><button type="button" data-publication-use="${escapeHtml(item.id)}">Utiliser</button><button type="button" data-publication-detail="${escapeHtml(item.id)}">Detail</button><button type="button" data-publication-build="${escapeHtml(item.id)}">Build</button><button type="button" data-publication-preview="${escapeHtml(item.id)}">Preview</button><button type="button" data-publication-deploy="${escapeHtml(item.id)}">Deploy</button></div></td></tr>`;
    })
    .join('');

  return `
    <div class="stack">
      <div class="card toolbar">
        <form id="publications-filter-form" class="filters-grid">
          <select name="status">
            ${optionsHtml(contractCatalog.publicationStatus, filters.publications.status, true)}
          </select>
          <input name="programme_id" placeholder="Programme ID" value="${escapeHtml(filters.publications.programme_id)}" />
          <input name="limit" placeholder="Limit" value="${escapeHtml(filters.publications.limit)}" />
          <button type="submit">Filtrer</button>
        </form>
        ${pagerHtml('publications', meta)}
      </div>

      <div class="card">
        <div class="actions-grid">
          <form id="publication-create-form" class="mini-form"><h4>Nouvelle publication</h4><input name="programme_id" placeholder="Programme ID" required /><button type="submit">Creer</button></form>
          <form id="publication-build-form" class="mini-form"><h4>Build publication</h4><input name="id" placeholder="Publication ID" required value="${escapeHtml(workflow.publicationId || '')}" /><button type="submit">Build</button></form>
          <form id="publication-status-form" class="mini-form"><h4>Changer statut</h4><input name="id" placeholder="Publication ID" required value="${escapeHtml(workflow.publicationId || '')}" /><select name="status">${optionsHtml(contractCatalog.publicationStatus, 'draft', false)}</select><button type="submit">Appliquer</button></form>
          <form id="publication-preview-form" class="mini-form"><h4>Generer preview</h4><input name="id" placeholder="Publication ID" required value="${escapeHtml(workflow.publicationId || '')}" /><button type="submit">Preview</button></form>
          <form id="publication-deploy-form" class="mini-form"><h4>Deploy</h4><input name="id" placeholder="Publication ID" required value="${escapeHtml(workflow.publicationId || '')}" /><input name="target_label" placeholder="Label cible" value="ovh-dev" required /><input name="target_host" placeholder="Host FTP" value="ftp.wechwech.tn" required /><input name="target_path" placeholder="Path distant" value="/www/abdou-dev/" required /><button type="submit">Deploy</button></form>
          <form id="publication-detail-form" class="mini-form"><h4>Detail publication</h4><input name="id" placeholder="Publication ID" required value="${escapeHtml(workflow.publicationId || '')}" /><button type="submit">Charger detail</button></form>
        </div>
        <div class="actions-grid"><form id="workflow-create-form" class="mini-form"><h4>Workflow publication</h4><input name="programme_id" placeholder="Programme ID" required /><button type="submit">1. Creer publication</button><button type="button" id="workflow-build-btn">2. Build</button><button type="button" id="workflow-preview-btn">3. Preview</button><button type="button" id="workflow-deploy-btn">4. Deploy</button><button type="button" id="workflow-refresh-btn">5. Refresh detail</button></form></div>
        <p id="publications-status" class="panel-status muted">Pret</p>
      </div>

      <div id="publication-detail-output"></div>

      <div class="card">
        <h3>Publications</h3>
        <table class="list"><thead><tr><th>ID</th><th>Build</th><th>Programme</th><th>Version</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">Aucune donnee.</td></tr>'}</tbody></table>
      </div>
    </div>
  `;
}

function renderPublicationDetail(detail, deployments, buildLog, deployLog, deployArtifacts, deploySummary) {
  const d = detail?.item || {};
  const depRows = (deployments?.items || []).map((it) => `<tr><td>${escapeHtml(it.id)}</td><td>${escapeHtml(it.target_label)}</td><td>${escapeHtml(it.target_host)}</td><td>${escapeHtml(it.target_path)}</td><td>${statusChip(it.deployment_status)}</td><td>${escapeHtml(it.created_at)}</td></tr>`).join('');
  const buildLogText = buildLog?.content ? escapeHtml(buildLog.content) : 'Aucun log de build.';
  const deployLogText = deployLog?.content ? escapeHtml(deployLog.content) : 'Aucun log de deploy.';
  const buildLastTs = extractLastLogTimestamp(buildLog?.content || '');
  const deployLastTs = extractLastLogTimestamp(deployLog?.content || '');
  const buildLogPath = buildLog?.path ? escapeHtml(buildLog.path) : '-';
  const deployLogPath = deployLog?.path ? escapeHtml(deployLog.path) : '-';
  const deployMeta = extractDeployMeta(deployLog?.content || '');
  const manifestPathRaw = deployArtifacts?.manifest?.path || deployMeta.manifestPath || '';
  const verifyLogPathRaw = deployArtifacts?.verify_log?.path || deployMeta.verifyLogPath || '';
  const manifestPath = manifestPathRaw || '-';
  const verifyLogPath = verifyLogPathRaw || '-';
  const artifactsLoaded = Number(Boolean(deployArtifacts?.manifest?.found)) + Number(Boolean(deployArtifacts?.verify_log?.found));
  const artifactsStatus = artifactsLoaded === 2 ? 'loaded' : artifactsLoaded === 1 ? 'partial' : 'missing';
  const artifactsChip = statusChip(`artifacts:${artifactsStatus}`);
  const summary = deploySummary || {};
  const summaryUpdatedAt = publicationDetailState.snapshot?.summary_updated_at || '';
  const artifactsUpdatedAt = publicationDetailState.snapshot?.artifacts_updated_at || '';
  const summaryStaleness = getStalenessInfo(summaryUpdatedAt);
  const artifactsStaleness = getStalenessInfo(artifactsUpdatedAt);
  return `<div class="card"><h3>Detail Publication #${escapeHtml(d.id)}</h3><p class="muted">Build: ${escapeHtml(d.build_code)} | Programme: ${escapeHtml(d.programme_name || d.programme_id)} | Status: ${statusChip(d.status)} | ${artifactsChip} (${artifactsLoaded}/2)</p><p class="muted">Derniere MAJ resume: ${escapeHtml(formatTimestamp(summaryUpdatedAt))} | ${statusChip(summaryStaleness.label)} (${escapeHtml(summaryStaleness.age)}) | Derniere MAJ artefacts: ${escapeHtml(formatTimestamp(artifactsUpdatedAt))} | ${statusChip(artifactsStaleness.label)} (${escapeHtml(artifactsStaleness.age)})</p><h4>Resume deploy</h4><p class="muted">Source: ${escapeHtml(summary.source_dir || '-')} | Target: ${escapeHtml(summary.target_dir || '-')} | Mode: ${escapeHtml(summary.mode || '-')} | Verify: ${statusChip(summary.verify_status || 'unknown')} | Resultat: ${statusChip(summary.status || 'unknown')}</p><h4>Build Log</h4><p class="muted">Path: ${buildLogPath} | Last: ${escapeHtml(buildLastTs || '-')}</p><pre>${buildLogText}</pre><h4>Deploy Log</h4><p class="muted">Path: ${deployLogPath} | Last: ${escapeHtml(deployLastTs || '-')}</p><p class="muted">Manifest: ${escapeHtml(manifestPath)} | Verify Log: ${escapeHtml(verifyLogPath)}</p><div class="toolbar"><button type="button" data-refresh-deploy-all="${escapeHtml(d.id)}">Recharger resume + artefacts</button><button type="button" data-refresh-deploy-summary="${escapeHtml(d.id)}">Recharger resume deploy</button><button type="button" data-refresh-artifacts="${escapeHtml(d.id)}">Recharger artefacts</button><button type="button" data-publication-manifest="${escapeHtml(d.id)}">Voir manifest</button><button type="button" data-publication-verify-log="${escapeHtml(d.id)}">Voir verify log</button><button type="button" data-copy-path="${escapeHtml(manifestPathRaw)}" data-copy-label="Manifest" ${manifestPathRaw ? '' : 'disabled'}>Copier path manifest</button><button type="button" data-copy-path="${escapeHtml(verifyLogPathRaw)}" data-copy-label="Verify log" ${verifyLogPathRaw ? '' : 'disabled'}>Copier path verify log</button><button type="button" data-copy-content="manifest" data-copy-label="Manifest" ${deployArtifacts?.manifest?.found ? '' : 'disabled'}>Copier contenu manifest</button><button type="button" data-copy-content="verify_log" data-copy-label="Verify log" ${deployArtifacts?.verify_log?.found ? '' : 'disabled'}>Copier contenu verify log</button><button type="button" data-download-artifact="manifest" data-publication-id="${escapeHtml(d.id)}" ${deployArtifacts?.manifest?.found ? '' : 'disabled'}>Telecharger manifest</button><button type="button" data-download-artifact="verify_log" data-publication-id="${escapeHtml(d.id)}" ${deployArtifacts?.verify_log?.found ? '' : 'disabled'}>Telecharger verify log</button></div><pre>${deployLogText}</pre><pre id="publication-deploy-extra-output" class="muted">Aucun fichier auxiliaire charge.</pre><h4>Deployments</h4><table class="list"><thead><tr><th>ID</th><th>Label</th><th>Host</th><th>Path</th><th>Status</th><th>Date</th></tr></thead><tbody>${depRows || '<tr><td colspan="6">Aucun deploiement.</td></tr>'}</tbody></table></div>`;
}

function extractLastLogTimestamp(content) {
  if (!content) return null;
  const lines = String(content).split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const match = lines[i].match(/^\[([^\]]+)\]/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function extractDeployMeta(content) {
  const lines = String(content || '').split(/\r?\n/).filter(Boolean);
  let manifestPath = '';
  let verifyLogPath = '';

  for (const line of lines) {
    const manifestMatch = line.match(/manifest=([^\s]+)/i);
    if (manifestMatch?.[1]) {
      manifestPath = manifestMatch[1];
    }
    const verifyMatch = line.match(/\blog=([^\s]+)/i);
    if (line.includes('VERIFY') && verifyMatch?.[1]) {
      verifyLogPath = verifyMatch[1];
    }
  }

  return { manifestPath, verifyLogPath };
}

function formatStatusSyncLabel(statusSync) {
  if (!statusSync || statusSync.ok !== true) {
    if (statusSync?.reason) {
      return `sync=${statusSync.reason}`;
    }
    if (typeof statusSync?.status === 'number') {
      return `sync=ko(${statusSync.status})`;
    }
    return 'sync=ko';
  }
  const statusCode = typeof statusSync.status === 'number' ? statusSync.status : 200;
  return `sync=ok(${statusCode})`;
}

async function loadPublicationDetailById(id, detailOutput) {
  const token = ++publicationDetailState.token;
  publicationArtifactsState.publicationId = id;
  publicationArtifactsState.artifacts = null;
  if (detailOutput) {
    detailOutput.innerHTML = `<div class="card"><p class="muted">Chargement du detail publication #${escapeHtml(id)}...</p></div>`;
  }
  try {
    const workflowDetail = expectWorkflowDetailPayload(
      await api(`/publications/${id}/workflow-detail`),
      'publication_workflow_detail'
    );
    if (token !== publicationDetailState.token) {
      return false;
    }
    publicationArtifactsState.artifacts = workflowDetail.deploy_artifacts || null;
    publicationDetailState.snapshot = {
      detail: workflowDetail.detail || {},
      deployments: workflowDetail.deployments || {},
      build_log: workflowDetail.build_log || { content: '' },
      deploy_log: workflowDetail.deploy_log || { content: '' },
      deploy_artifacts: workflowDetail.deploy_artifacts || null,
      deploy_summary: workflowDetail.deploy_summary || null,
      artifacts_updated_at: new Date().toISOString(),
      summary_updated_at: new Date().toISOString(),
    };
    detailOutput.innerHTML = renderPublicationDetail(
      workflowDetail.detail || {},
      workflowDetail.deployments || {},
      workflowDetail.build_log || { content: '' },
      workflowDetail.deploy_log || { content: '' },
      workflowDetail.deploy_artifacts || null,
      workflowDetail.deploy_summary || null
    );
    return true;
  } catch {
    const [detail, deployments, buildLog, deployLog, deployArtifacts] = await Promise.all([
      api(`/publications/${id}`).then((payload) => ({
        item: expectItemPayloadWithKeys(payload, 'publication_detail', ['id', 'programme_id', 'build_code', 'status'])
      })),
      api(`/publications/${id}/deployments`).then((payload) => {
        const root = ensureObject(payload, 'publication_deployments');
        return { ...root, items: ensureArray(root.items, 'publication_deployments_items') };
      }),
      api(`/publications/${id}/build-log`).catch(() => ({ content: '' })),
      api(`/publications/${id}/deploy-log`).catch(() => ({ content: '' })),
      api(`/publications/${id}/deploy-artifacts`).then((x) => x.artifacts || null).catch(() => null)
    ]);
    if (token !== publicationDetailState.token) {
      return false;
    }
    publicationArtifactsState.artifacts = deployArtifacts;
    publicationDetailState.snapshot = {
      detail,
      deployments,
      build_log: buildLog,
      deploy_log: deployLog,
      deploy_artifacts: deployArtifacts,
      deploy_summary: null,
      artifacts_updated_at: deployArtifacts ? new Date().toISOString() : '',
      summary_updated_at: '',
    };
    detailOutput.innerHTML = renderPublicationDetail(detail, deployments, buildLog, deployLog, deployArtifacts, null);
    return true;
  }
}

function rerenderPublicationDetailFromSnapshot(detailOutput) {
  if (!publicationDetailState.snapshot || !detailOutput) {
    return false;
  }
  detailOutput.innerHTML = renderPublicationDetail(
    publicationDetailState.snapshot.detail,
    publicationDetailState.snapshot.deployments,
    publicationDetailState.snapshot.build_log,
    publicationDetailState.snapshot.deploy_log,
    publicationDetailState.snapshot.deploy_artifacts,
    publicationDetailState.snapshot.deploy_summary
  );
  return true;
}

function renderProgrammeDetail(programme, rubriques, medias, publications) {
  const p = programme?.item || {};
  const rubriquesRows = (rubriques?.items || [])
    .map((it) => `<tr><td>${escapeHtml(it.id)}</td><td>${escapeHtml(it.code)}</td><td>${escapeHtml(it.title)}</td><td>${escapeHtml(it.is_enabled)}</td></tr>`)
    .join('');
  const mediasRows = (medias?.items || [])
    .map((it) => `<tr><td>${escapeHtml(it.id)}</td><td>${escapeHtml(it.type)}</td><td>${escapeHtml(it.original_filename)}</td><td>${escapeHtml(it.status)}</td></tr>`)
    .join('');
  const publicationsRows = (publications?.items || [])
    .map((it) => `<tr><td>${escapeHtml(it.id)}</td><td>${escapeHtml(it.build_code)}</td><td>${escapeHtml(it.status)}</td></tr>`)
    .join('');

  return `<div class="card"><h3>Programme #${escapeHtml(p.id)} - ${escapeHtml(p.name)}</h3>
  <p class="muted">Code: ${escapeHtml(p.code)} | Client: ${escapeHtml(p.client_id)} | Offre: ${escapeHtml(p.offre_id)} | Status: ${escapeHtml(p.status)}</p>
  <h4>Rubriques</h4><table class="list"><thead><tr><th>ID</th><th>Code</th><th>Titre</th><th>Enabled</th></tr></thead><tbody>${rubriquesRows || '<tr><td colspan="4">Aucune rubrique.</td></tr>'}</tbody></table>
  <h4>Medias</h4><table class="list"><thead><tr><th>ID</th><th>Type</th><th>Nom</th><th>Status</th></tr></thead><tbody>${mediasRows || '<tr><td colspan="4">Aucun media.</td></tr>'}</tbody></table>
  <h4>Publications</h4><table class="list"><thead><tr><th>ID</th><th>Build</th><th>Status</th></tr></thead><tbody>${publicationsRows || '<tr><td colspan="3">Aucune publication.</td></tr>'}</tbody></table>
  </div>`;
}

function bindPager() {
  document.querySelectorAll('[data-page-panel]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const panel = btn.getAttribute('data-page-panel');
      const dir = btn.getAttribute('data-page-dir');
      if (!panel || !filters[panel]) return;
      const current = Number(filters[panel].page || 1);
      filters[panel].page = dir === 'next' ? current + 1 : Math.max(1, current - 1);
      await reloadPanel(panel);
    });
  });
}

async function loadDashboard() {
  const data = expectDashboardSummaryPayload(await api('/dashboard/summary'), 'dashboard_summary');
  dashboardPanel.innerHTML = buildDashboardHtml(data.summary);
  bindDashboardActions();
}

async function loadClients() {
  const data = expectPagedPayloadWithItemKeys(
    await api(`/clients${buildQuery(filters.clients)}`),
    'clients_list',
    ['id', 'code', 'name', 'slug', 'status']
  );
  clientsPanel.innerHTML = buildClientsHtml(data.items, data.meta);
  bindClientsActions();
  bindPager();
}

async function loadRoles() {
  const itemsRaw = expectListPayload(await api('/roles'), 'roles_list');
  const q = filters.roles.q.trim().toLowerCase();
  const items = itemsRaw.filter((item) => {
    if (!q) return true;
    const payload = `${item.code || ''} ${item.label || ''}`.toLowerCase();
    return payload.includes(q);
  });
  rolesPanel.innerHTML = buildRolesHtml(items);
  bindRolesActions();
}

async function loadUsers() {
  const itemsRaw = expectListPayload(await api('/users'), 'users_list');
  const q = filters.users.q.trim().toLowerCase();
  const role = filters.users.role;
  const items = itemsRaw.filter((item) => {
    if (role !== 'all' && String(item.role_code || '').toLowerCase() !== role.toLowerCase()) {
      return false;
    }
    if (!q) return true;
    const payload = `${item.first_name || ''} ${item.last_name || ''} ${item.email || ''}`.toLowerCase();
    return payload.includes(q);
  });
  usersPanel.innerHTML = buildUsersHtml(items);
  bindUsersActions();
}

async function loadTemplates() {
  const data = await api(`/templates${buildQuery(filters.templates)}`);
  templatesPanel.innerHTML = buildTemplatesHtml(data.items || [], data.meta);
  bindTemplatesActions();
  bindPager();
}

async function loadOffres() {
  const data = await api(`/offres${buildQuery(filters.offres)}`);
  offresPanel.innerHTML = buildOffresHtml(data.items || [], data.meta);
  bindOffresActions();
  bindPager();
}

async function loadProgrammes() {
  const data = expectPagedPayloadWithItemKeys(
    await api(`/programmes${buildQuery(filters.programmes)}`),
    'programmes_list',
    ['id', 'code', 'name', 'slug', 'client_id', 'offre_id', 'status']
  );
  programmesPanel.innerHTML = buildProgrammesHtml(data.items, data.meta);
  bindProgrammesActions();
  bindPager();
}

async function loadRubriques() {
  const data = expectPagedPayloadWithItemKeys(
    await api(`/rubriques${buildQuery(filters.rubriques)}`),
    'rubriques_list',
    ['id', 'programme_id', 'code', 'title', 'slug', 'is_enabled']
  );
  rubriquesPanel.innerHTML = buildRubriquesHtml(data.items, data.meta);
  bindRubriquesActions();
  bindPager();
}

async function loadMedias() {
  const data = expectPagedPayloadWithItemKeys(
    await api(`/medias${buildQuery(filters.medias)}`),
    'medias_list',
    ['id', 'type', 'original_filename', 'storage_path', 'status']
  );
  mediasPanel.innerHTML = buildMediasHtml(data.items, data.meta);
  bindMediasActions();
  bindPager();
}

async function loadLots() {
  const data = expectPagedPayloadWithItemKeys(
    await api(`/lots${buildQuery(filters.lots)}`),
    'lots_list',
    ['id', 'programme_id', 'reference', 'title', 'typology', 'is_published']
  );
  lotsPanel.innerHTML = buildLotsHtml(data.items, data.meta);
  bindLotsActions();
  bindPager();
}

async function loadPublications() {
  const data = expectPagedPayloadWithItemKeys(
    await api(`/publications${buildQuery(filters.publications)}`),
    'publications_list',
    ['id', 'programme_id', 'build_code', 'version_number', 'status']
  );
  publicationsPanel.innerHTML = buildPublicationsHtml(data.items, data.meta);
  bindPublicationsActions();
  bindPager();
}

async function reloadPanel(panel) {
  if (panel === 'dashboard') await loadDashboard();
  if (panel === 'roles') await loadRoles();
  if (panel === 'users') await loadUsers();
  if (panel === 'clients') await loadClients();
  if (panel === 'templates') await loadTemplates();
  if (panel === 'offres') await loadOffres();
  if (panel === 'programmes') await loadProgrammes();
  if (panel === 'rubriques') await loadRubriques();
  if (panel === 'medias') await loadMedias();
  if (panel === 'lots') await loadLots();
  if (panel === 'publications') await loadPublications();
}

async function loadContracts() {
  try {
    const payload = await api('/contracts');
    const source = payload?.contracts || payload?.items || {};

    contractCatalog = {
      clientStatus: normalizeContractValues(source.clientStatus || source.client_status, contractCatalogDefaults.clientStatus),
      roleCode: normalizeContractValues(source.roleCode || source.role_code, contractCatalogDefaults.roleCode),
      programmeStatus: normalizeContractValues(
        source.programmeStatus || source.programme_status,
        contractCatalogDefaults.programmeStatus
      ),
      programmePublicationStatus: normalizeContractValues(
        source.programmePublicationStatus || source.programme_publication_status,
        contractCatalogDefaults.programmePublicationStatus
      ),
      publicationStatus: normalizeContractValues(
        source.publicationStatus || source.publication_status,
        contractCatalogDefaults.publicationStatus
      ),
      mediaType: normalizeContractValues(source.mediaType || source.media_type, contractCatalogDefaults.mediaType),
      mediaStatus: normalizeContractValues(source.mediaStatus || source.media_status, contractCatalogDefaults.mediaStatus),
      publicationDeploymentTargetType: normalizeContractValues(
        source.publicationDeploymentTargetType || source.publication_deployment_target_type,
        contractCatalogDefaults.publicationDeploymentTargetType
      ),
      publicationDeploymentStatus: normalizeContractValues(
        source.publicationDeploymentStatus || source.publication_deployment_status,
        contractCatalogDefaults.publicationDeploymentStatus
      )
    };
  } catch {
    contractCatalog = { ...contractCatalogDefaults };
  }
}

async function loadWorkspace() {
  const me = await api('/auth/me');
  welcome.textContent = `Session: ${me.user.first_name} ${me.user.last_name}`;
  await loadContracts();

  const panelLoaders = [
    { code: 'dashboard', run: loadDashboard },
    { code: 'roles', run: loadRoles },
    { code: 'users', run: loadUsers },
    { code: 'clients', run: loadClients },
    { code: 'templates', run: loadTemplates },
    { code: 'offres', run: loadOffres },
    { code: 'programmes', run: loadProgrammes },
    { code: 'rubriques', run: loadRubriques },
    { code: 'medias', run: loadMedias },
    { code: 'lots', run: loadLots },
    { code: 'publications', run: loadPublications }
  ];

  const results = await Promise.allSettled(panelLoaders.map((loader) => loader.run()));
  const failedPanels = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failedPanels.push(panelLoaders[index].code);
      setPanelStatus(panelLoaders[index].code, `Erreur chargement: ${result.reason?.message || 'unknown_error'}`, 'error');
    }
  });

  return failedPanels;
}

function bindRolesActions() {
  const filterForm = document.querySelector('#roles-filter-form');
  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('roles-filter-form');
    if (!values) return;
    filters.roles.q = String(values.q || '');
    await loadRoles();
  });
}

function bindDashboardActions() {
  const refreshBtn = document.querySelector('#dashboard-refresh-btn');
  refreshBtn?.addEventListener('click', async () => {
    setPanelStatus('dashboard', 'Rafraichissement en cours...');
    try {
      await loadDashboard();
      setPanelStatus('dashboard', 'Synthese mise a jour', 'ok');
    } catch (error) {
      setPanelStatus('dashboard', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindUsersActions() {
  const filterForm = document.querySelector('#users-filter-form');
  const detailForm = document.querySelector('#users-detail-form');
  const detailOutput = document.querySelector('#users-detail-output');
  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('users-filter-form');
    if (!values) return;
    filters.users.q = String(values.q || '');
    filters.users.role = String(values.role || 'all');
    await loadUsers();
  });

  detailForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('users-detail-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('users', 'User ID invalide', 'error');
    try {
      const detail = await api(`/users/${id}`);
      detailOutput.innerHTML = renderSimpleDetailCard(`User #${id}`, expectItemPayload(detail, 'user_detail'));
      setPanelStatus('users', 'Detail user charge', 'ok');
    } catch (error) {
      setPanelStatus('users', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindTemplatesActions() {
  const filterForm = document.querySelector('#templates-filter-form');
  const detailForm = document.querySelector('#templates-detail-form');
  const detailOutput = document.querySelector('#templates-detail-output');
  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('templates-filter-form');
    if (!values) return;
    filters.templates.q = String(values.q || '');
    filters.templates.limit = Number(values.limit || 20) || 20;
    filters.templates.page = 1;
    await loadTemplates();
  });

  detailForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('templates-detail-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('templates', 'Template ID invalide', 'error');
    try {
      const detail = await api(`/templates/${id}`);
      detailOutput.innerHTML = renderSimpleDetailCard(`Template #${id}`, expectItemPayload(detail, 'template_detail'));
      setPanelStatus('templates', 'Detail template charge', 'ok');
    } catch (error) {
      setPanelStatus('templates', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindOffresActions() {
  const filterForm = document.querySelector('#offres-filter-form');
  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('offres-filter-form');
    if (!values) return;
    filters.offres.q = String(values.q || '');
    filters.offres.limit = Number(values.limit || 20) || 20;
    filters.offres.page = 1;
    await loadOffres();
  });
}

function bindClientsActions() {
  const filterForm = document.querySelector('#clients-filter-form');
  const createForm = document.querySelector('#client-create-form');
  const updateForm = document.querySelector('#client-update-form');

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('clients-filter-form');
    if (!values) return;
    filters.clients.q = String(values.q || '');
    filters.clients.status = String(values.status || 'active');
    filters.clients.limit = Number(values.limit || 20) || 20;
    filters.clients.page = 1;
    await loadClients();
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('client-create-form');
    if (!values) return;
    setPanelStatus('clients', 'Creation client en cours...');
    try {
      await api('/clients', { method: 'POST', body: JSON.stringify({ code: String(values.code).trim(), name: String(values.name).trim(), slug: String(values.slug).trim(), status: 'active' }) });
      setPanelStatus('clients', 'Client cree', 'ok');
      await loadClients();
    } catch (error) {
      setPanelStatus('clients', `Erreur: ${error.message}`, 'error');
    }
  });

  updateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('client-update-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('clients', 'ID client invalide', 'error');
    setPanelStatus('clients', 'Mise a jour client en cours...');
    try {
      await api(`/clients/${id}`, { method: 'PUT', body: JSON.stringify({ name: String(values.name).trim() }) });
      setPanelStatus('clients', 'Client mis a jour', 'ok');
      await loadClients();
    } catch (error) {
      setPanelStatus('clients', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindProgrammesActions() {
  const filterForm = document.querySelector('#programmes-filter-form');
  const createForm = document.querySelector('#programme-create-form');
  const updateForm = document.querySelector('#programme-update-form');
  const detailForm = document.querySelector('#programme-detail-form');
  const detailOutput = document.querySelector('#programme-detail-output');

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('programmes-filter-form');
    if (!values) return;
    filters.programmes.q = String(values.q || '');
    filters.programmes.status = String(values.status || 'all');
    filters.programmes.client_id = String(values.client_id || '');
    filters.programmes.offre_id = String(values.offre_id || '');
    filters.programmes.limit = Number(values.limit || 20) || 20;
    filters.programmes.page = 1;
    await loadProgrammes();
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('programme-create-form');
    if (!values) return;
    const clientId = numberOrNull(values.client_id);
    const offreId = numberOrNull(values.offre_id);
    if (!clientId || !offreId) return setPanelStatus('programmes', 'Client ID ou Offre ID invalide', 'error');
    setPanelStatus('programmes', 'Creation programme en cours...');
    try {
      await api('/programmes', { method: 'POST', body: JSON.stringify({ client_id: clientId, offre_id: offreId, code: String(values.code).trim(), name: String(values.name).trim(), slug: String(values.slug).trim(), status: 'draft', publication_status: 'not_published' }) });
      setPanelStatus('programmes', 'Programme cree', 'ok');
      await loadProgrammes();
    } catch (error) {
      setPanelStatus('programmes', `Erreur: ${error.message}`, 'error');
    }
  });

  updateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('programme-update-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('programmes', 'ID programme invalide', 'error');
    setPanelStatus('programmes', 'Mise a jour programme en cours...');
    try {
      await api(`/programmes/${id}`, { method: 'PUT', body: JSON.stringify({ name: String(values.name).trim(), status: String(values.status) }) });
      setPanelStatus('programmes', 'Programme mis a jour', 'ok');
      await loadProgrammes();
    } catch (error) {
      setPanelStatus('programmes', `Erreur: ${error.message}`, 'error');
    }
  });

  detailForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('programme-detail-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('programmes', 'Programme ID invalide', 'error');
    setPanelStatus('programmes', 'Chargement detail programme...');
    try {
      const [programmeRaw, rubriquesRaw, mediasRaw, publicationsRaw] = await Promise.all([
        api(`/programmes/${id}`),
        api(`/rubriques${buildQuery({ programme_id: id, enabled: 'all', page: 1, limit: 20 })}`),
        api(`/medias${buildQuery({ page: 1, limit: 20, status: 'all', type: 'all' })}`),
        api(`/publications${buildQuery({ programme_id: id, status: 'all', page: 1, limit: 20 })}`),
      ]);
      const programme = { item: expectItemPayload(programmeRaw, 'programme_detail') };
      const rubriques = expectPagedPayload(rubriquesRaw, 'rubriques_list');
      const medias = expectPagedPayload(mediasRaw, 'medias_list');
      const publications = expectPagedPayload(publicationsRaw, 'publications_list');
      detailOutput.innerHTML = renderProgrammeDetail(programme, rubriques, medias, publications);
      setPanelStatus('programmes', 'Detail programme charge', 'ok');
    } catch (error) {
      setPanelStatus('programmes', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindLotsActions() {
  const filterForm = document.querySelector('#lots-filter-form');
  const createForm = document.querySelector('#lot-create-form');
  const updateForm = document.querySelector('#lot-update-form');

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('lots-filter-form');
    if (!values) return;
    filters.lots.q = String(values.q || '');
    filters.lots.published = String(values.published || 'all');
    filters.lots.programme_id = String(values.programme_id || '');
    filters.lots.limit = Number(values.limit || 20) || 20;
    filters.lots.page = 1;
    await loadLots();
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('lot-create-form');
    if (!values) return;
    const programmeId = numberOrNull(values.programme_id);
    if (!programmeId) return setPanelStatus('lots', 'Programme ID invalide', 'error');
    try {
      await api('/lots', {
        method: 'POST',
        body: JSON.stringify({
          programme_id: programmeId,
          reference: String(values.reference).trim(),
          title: String(values.title || '').trim() || null,
          typology: String(values.typology || '').trim() || null
        })
      });
      setPanelStatus('lots', 'Lot cree', 'ok');
      await loadLots();
    } catch (error) {
      setPanelStatus('lots', `Erreur: ${error.message}`, 'error');
    }
  });

  updateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('lot-update-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('lots', 'Lot ID invalide', 'error');
    try {
      await api(`/lots/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: String(values.title || '').trim() || null,
          commercial_status: String(values.commercial_status || '').trim() || null
        })
      });
      setPanelStatus('lots', 'Lot mis a jour', 'ok');
      await loadLots();
    } catch (error) {
      setPanelStatus('lots', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindRubriquesActions() {
  const filterForm = document.querySelector('#rubriques-filter-form');
  const createForm = document.querySelector('#rubrique-create-form');
  const updateForm = document.querySelector('#rubrique-update-form');

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('rubriques-filter-form');
    if (!values) return;
    filters.rubriques.q = String(values.q || '');
    filters.rubriques.enabled = String(values.enabled || 'all');
    filters.rubriques.programme_id = String(values.programme_id || '');
    filters.rubriques.limit = Number(values.limit || 20) || 20;
    filters.rubriques.page = 1;
    await loadRubriques();
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('rubrique-create-form');
    if (!values) return;
    const programmeId = numberOrNull(values.programme_id);
    if (!programmeId) return setPanelStatus('rubriques', 'Programme ID invalide', 'error');
    try {
      await api('/rubriques', {
        method: 'POST',
        body: JSON.stringify({
          programme_id: programmeId,
          code: String(values.code).trim(),
          title: String(values.title).trim(),
          slug: String(values.slug).trim()
        })
      });
      setPanelStatus('rubriques', 'Rubrique creee', 'ok');
      await loadRubriques();
    } catch (error) {
      setPanelStatus('rubriques', `Erreur: ${error.message}`, 'error');
    }
  });

  updateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('rubrique-update-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('rubriques', 'Rubrique ID invalide', 'error');
    try {
      await api(`/rubriques/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: String(values.title).trim(),
          slug: String(values.slug).trim()
        })
      });
      setPanelStatus('rubriques', 'Rubrique mise a jour', 'ok');
      await loadRubriques();
    } catch (error) {
      setPanelStatus('rubriques', `Erreur: ${error.message}`, 'error');
    }
  });
}

function bindMediasActions() {
  const filterForm = document.querySelector('#medias-filter-form');
  const createForm = document.querySelector('#media-create-form');

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('medias-filter-form');
    if (!values) return;
    filters.medias.q = String(values.q || '');
    filters.medias.status = String(values.status || 'all');
    filters.medias.type = String(values.type || 'all');
    filters.medias.limit = Number(values.limit || 20) || 20;
    filters.medias.page = 1;
    await loadMedias();
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('media-create-form');
    if (!values) return;
    try {
      await api('/medias', {
        method: 'POST',
        body: JSON.stringify({
          type: String(values.type).trim(),
          mime_type: String(values.mime_type).trim(),
          original_filename: String(values.original_filename).trim(),
          storage_filename: String(values.storage_filename).trim(),
          storage_path: String(values.storage_path).trim()
        })
      });
      setPanelStatus('medias', 'Media cree', 'ok');
      await loadMedias();
    } catch (error) {
      setPanelStatus('medias', `Erreur: ${error.message}`, 'error');
    }
  });
}

async function workflowEnsureId() {
  if (!workflow.publicationId) throw new Error('workflow_publication_missing');
  return workflow.publicationId;
}

function setCurrentPublicationId(id) {
  workflow.publicationId = id || null;
  syncPublicationIdInputs(workflow.publicationId);
}

function bindPublicationsActions() {
  let actionBusy = false;
  const filterForm = document.querySelector('#publications-filter-form');
  const createForm = document.querySelector('#publication-create-form');
  const buildForm = document.querySelector('#publication-build-form');
  const statusForm = document.querySelector('#publication-status-form');
  const previewForm = document.querySelector('#publication-preview-form');
  const deployForm = document.querySelector('#publication-deploy-form');
  const detailForm = document.querySelector('#publication-detail-form');
  const workflowForm = document.querySelector('#workflow-create-form');
  const workflowBuildBtn = document.querySelector('#workflow-build-btn');
  const workflowPreviewBtn = document.querySelector('#workflow-preview-btn');
  const workflowDeployBtn = document.querySelector('#workflow-deploy-btn');
  const workflowRefreshBtn = document.querySelector('#workflow-refresh-btn');
  const detailOutput = document.querySelector('#publication-detail-output');

  function bindPublicationDetailActions() {
    detailOutput?.querySelectorAll('[data-refresh-deploy-all]').forEach((node) => {
      node.addEventListener('click', async () => {
        const id = numberOrNull(node.getAttribute('data-refresh-deploy-all'));
        if (!id) return;
        if (!publicationDetailState.snapshot) {
          setPanelStatus('publications', 'Detail publication non charge', 'error');
          return;
        }
        await withPublicationActionLock(async () => {
          setPanelStatus('publications', `Rechargement resume + artefacts (#${id})...`, 'muted');
          try {
            const [summaryCall, artifactsCall] = await Promise.all([
              api(`/publications/${id}/deploy-summary`)
                .then((value) => ({ ok: true, value }))
                .catch((error) => ({ ok: false, error })),
              api(`/publications/${id}/deploy-artifacts`)
                .then((value) => ({ ok: true, value }))
                .catch((error) => ({ ok: false, error })),
            ]);

            const summaryResult = summaryCall.ok ? summaryCall.value : null;
            const artifactsResult = artifactsCall.ok ? artifactsCall.value : null;
            let refreshedCount = 0;

            if (summaryResult?.summary) {
              refreshedCount += 1;
              publicationDetailState.snapshot.deploy_summary = summaryResult.summary;
              publicationDetailState.snapshot.summary_updated_at = new Date().toISOString();
            }
            if (artifactsResult?.artifacts) {
              refreshedCount += 1;
              publicationArtifactsState.publicationId = id;
              publicationArtifactsState.artifacts = artifactsResult.artifacts;
              publicationDetailState.snapshot.deploy_artifacts = artifactsResult.artifacts;
              publicationDetailState.snapshot.artifacts_updated_at = new Date().toISOString();
            }

            rerenderPublicationDetailFromSnapshot(detailOutput);
            bindPublicationDetailActions();
            if (refreshedCount === 2) {
              setPanelStatus('publications', `Resume + artefacts recharges (#${id})`, 'ok');
            } else if (refreshedCount === 1) {
              const missingPart = summaryResult ? 'artefacts' : 'resume';
              setPanelStatus('publications', `Refresh partiel (#${id}) : ${missingPart} indisponible`, 'error');
            } else {
              setPanelStatus('publications', `Echec refresh resume + artefacts (#${id})`, 'error');
            }
          } catch (error) {
            setPanelStatus('publications', `Erreur refresh resume+artefacts: ${error.message}`, 'error');
          }
        });
      });
    });

    detailOutput?.querySelectorAll('[data-refresh-deploy-summary]').forEach((node) => {
      node.addEventListener('click', async () => {
        const id = numberOrNull(node.getAttribute('data-refresh-deploy-summary'));
        if (!id) return;
        if (!publicationDetailState.snapshot) {
          setPanelStatus('publications', 'Detail publication non charge', 'error');
          return;
        }
        await withPublicationActionLock(async () => {
          setPanelStatus('publications', `Rechargement resume deploy (#${id})...`, 'muted');
          try {
            const result = await api(`/publications/${id}/deploy-summary`);
            const summary = result?.summary || null;
            publicationDetailState.snapshot.deploy_summary = summary;
            publicationDetailState.snapshot.summary_updated_at = new Date().toISOString();
            rerenderPublicationDetailFromSnapshot(detailOutput);
            bindPublicationDetailActions();
            setPanelStatus('publications', `Resume deploy recharge (#${id})`, 'ok');
          } catch (error) {
            setPanelStatus('publications', `Erreur resume deploy: ${error.message}`, 'error');
          }
        });
      });
    });

    detailOutput?.querySelectorAll('[data-refresh-artifacts]').forEach((node) => {
      node.addEventListener('click', async () => {
        const id = numberOrNull(node.getAttribute('data-refresh-artifacts'));
        if (!id) return;
        if (!publicationDetailState.snapshot) {
          setPanelStatus('publications', 'Detail publication non charge', 'error');
          return;
        }
        await withPublicationActionLock(async () => {
          setPanelStatus('publications', `Rechargement artefacts (#${id})...`, 'muted');
          try {
            const result = await api(`/publications/${id}/deploy-artifacts`);
            const artifacts = result?.artifacts || null;
            publicationArtifactsState.publicationId = id;
            publicationArtifactsState.artifacts = artifacts;
            publicationDetailState.snapshot.deploy_artifacts = artifacts;
            publicationDetailState.snapshot.artifacts_updated_at = new Date().toISOString();
            rerenderPublicationDetailFromSnapshot(detailOutput);
            bindPublicationDetailActions();
            setPanelStatus('publications', `Artefacts recharges (#${id})`, 'ok');
          } catch (error) {
            setPanelStatus('publications', `Erreur refresh artefacts: ${error.message}`, 'error');
          }
        });
      });
    });

    detailOutput?.querySelectorAll('[data-publication-manifest]').forEach((node) => {
      node.addEventListener('click', () => {
        const id = numberOrNull(node.getAttribute('data-publication-manifest'));
        if (!id) return;
        const output = detailOutput.querySelector('#publication-deploy-extra-output');
        const manifest = publicationArtifactsState.artifacts?.manifest;
        if (!manifest?.found) {
          if (output) output.textContent = 'Manifest non disponible.';
          setPanelStatus('publications', `Manifest indisponible (#${id})`, 'error');
          return;
        }
        if (output) output.textContent = `Path: ${manifest.path || '-'}\n\n${manifest.content || ''}`;
        setPanelStatus('publications', `Manifest charge (#${id})`, 'ok');
      });
    });

    detailOutput?.querySelectorAll('[data-publication-verify-log]').forEach((node) => {
      node.addEventListener('click', () => {
        const id = numberOrNull(node.getAttribute('data-publication-verify-log'));
        if (!id) return;
        const output = detailOutput.querySelector('#publication-deploy-extra-output');
        const verifyLog = publicationArtifactsState.artifacts?.verify_log;
        if (!verifyLog?.found) {
          if (output) output.textContent = 'Verify log non disponible.';
          setPanelStatus('publications', `Verify log indisponible (#${id})`, 'error');
          return;
        }
        if (output) output.textContent = `Path: ${verifyLog.path || '-'}\n\n${verifyLog.content || ''}`;
        setPanelStatus('publications', `Verify log charge (#${id})`, 'ok');
      });
    });

    detailOutput?.querySelectorAll('[data-copy-path]').forEach((node) => {
      node.addEventListener('click', async () => {
        const rawPath = String(node.getAttribute('data-copy-path') || '').trim();
        const label = String(node.getAttribute('data-copy-label') || 'Path');
        if (!rawPath) {
          setPanelStatus('publications', `${label}: path vide`, 'error');
          return;
        }
        try {
          await navigator.clipboard.writeText(rawPath);
          setPanelStatus('publications', `${label} copie dans le presse-papiers`, 'ok');
        } catch {
          const output = detailOutput.querySelector('#publication-deploy-extra-output');
          if (output) output.textContent = `Copie auto indisponible.\n${label}: ${rawPath}`;
          setPanelStatus('publications', `${label}: copie auto indisponible`, 'error');
        }
      });
    });

    detailOutput?.querySelectorAll('[data-copy-content]').forEach((node) => {
      node.addEventListener('click', async () => {
        const key = String(node.getAttribute('data-copy-content') || '').trim();
        const label = String(node.getAttribute('data-copy-label') || 'Contenu');
        const bucket = key === 'manifest'
          ? publicationArtifactsState.artifacts?.manifest
          : key === 'verify_log'
            ? publicationArtifactsState.artifacts?.verify_log
            : null;
        const content = String(bucket?.content || '');
        if (!bucket?.found || !content) {
          setPanelStatus('publications', `${label}: contenu indisponible`, 'error');
          return;
        }
        try {
          await navigator.clipboard.writeText(content);
          setPanelStatus('publications', `${label} contenu copie`, 'ok');
        } catch {
          const output = detailOutput.querySelector('#publication-deploy-extra-output');
          if (output) output.textContent = `Copie auto indisponible.\n${label} contenu:\n${content}`;
          setPanelStatus('publications', `${label}: copie auto indisponible`, 'error');
        }
      });
    });

    detailOutput?.querySelectorAll('[data-download-artifact]').forEach((node) => {
      node.addEventListener('click', () => {
        const key = String(node.getAttribute('data-download-artifact') || '').trim();
        const publicationId = numberOrNull(node.getAttribute('data-publication-id')) || workflow.publicationId || 'unknown';
        const bucket = key === 'manifest'
          ? publicationArtifactsState.artifacts?.manifest
          : key === 'verify_log'
            ? publicationArtifactsState.artifacts?.verify_log
            : null;
        const content = String(bucket?.content || '');
        if (!bucket?.found || !content) {
          setPanelStatus('publications', 'Telechargement impossible: contenu indisponible', 'error');
          return;
        }

        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const filename = `publication-${publicationId}-${key}.json`;
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);

        setPanelStatus('publications', `Fichier telecharge: ${filename}`, 'ok');
      });
    });
  }

  function setPublicationActionsDisabled(disabled) {
    publicationsPanel?.querySelectorAll(
      '#publication-create-form button, #publication-build-form button, #publication-status-form button, #publication-preview-form button, #publication-deploy-form button, #publication-detail-form button, #workflow-create-form button, [data-publication-use], [data-publication-detail], [data-publication-build], [data-publication-preview], [data-publication-deploy], [data-refresh-deploy-all], [data-refresh-deploy-summary], [data-refresh-artifacts]'
    ).forEach((node) => {
      node.disabled = disabled;
    });
    document.querySelectorAll(
      '#publication-detail-output [data-publication-manifest], #publication-detail-output [data-publication-verify-log], #publication-detail-output [data-copy-path], #publication-detail-output [data-copy-content], #publication-detail-output [data-download-artifact]'
    ).forEach((node) => {
      node.disabled = disabled;
    });
  }

  async function withPublicationActionLock(callback) {
    if (actionBusy) return false;
    actionBusy = true;
    setPublicationActionsDisabled(true);
    setPanelStatus('publications', 'Operation en cours...', 'muted');
    try {
      await callback();
      return true;
    } finally {
      actionBusy = false;
      setPublicationActionsDisabled(false);
    }
  }

  async function runBuildAction(id, statusLabel) {
    return await withPublicationActionLock(async () => {
      const build = await api(`/publications/${id}/build`, { method: 'POST', body: '{}' });
      const applied = await loadPublicationDetailById(id, detailOutput);
      if (!applied) return;
      bindPublicationDetailActions();
      setPanelStatus('publications', `${statusLabel} (${build.output_path || 'ok'}, ${formatStatusSyncLabel(build.status_sync)})`, 'ok');
      await loadPublications();
    });
  }

  async function runPreviewAction(id, statusLabel) {
    return await withPublicationActionLock(async () => {
      const result = await api(`/publications/${id}/preview`, { method: 'POST', body: '{}' });
      const applied = await loadPublicationDetailById(id, detailOutput);
      if (!applied) return;
      bindPublicationDetailActions();
      setPanelStatus('publications', `${statusLabel} (${result.preview?.path || 'ok'})`, 'ok');
      await loadPublications();
    });
  }

  async function runDeployAction(id, payload, statusLabel) {
    return await withPublicationActionLock(async () => {
      const result = await api(`/publications/${id}/deploy`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const applied = await loadPublicationDetailById(id, detailOutput);
      if (!applied) return;
      bindPublicationDetailActions();
      const local = result.local_deploy || {};
      const deployLabel = local.ok
        ? `local=${local.mode || 'local'}/${local.verify_status || 'ok'}`
        : 'local=failed';
      setPanelStatus('publications', `${statusLabel} (${result.deployment?.deployment_status || 'success'}, ${deployLabel})`, local.ok ? 'ok' : 'error');
      await loadPublications();
    });
  }

  function getDeployPayloadFromFormValues(values) {
    return {
      target_type: 'ovh_ftp',
      target_label: String(values?.target_label || 'ovh-dev').trim(),
      target_host: String(values?.target_host || 'ftp.wechwech.tn').trim(),
      target_path: String(values?.target_path || '/www/abdou-dev/').trim()
    };
  }

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publications-filter-form');
    if (!values) return;
    filters.publications.status = String(values.status || 'all');
    filters.publications.programme_id = String(values.programme_id || '');
    filters.publications.limit = Number(values.limit || 20) || 20;
    filters.publications.page = 1;
    await loadPublications();
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publication-create-form');
    if (!values) return;
    const programmeId = numberOrNull(values.programme_id);
    if (!programmeId) return setPanelStatus('publications', 'Programme ID invalide', 'error');
    setPanelStatus('publications', 'Creation publication en cours...');
    await withPublicationActionLock(async () => {
      try {
        const result = await api('/publications', { method: 'POST', body: JSON.stringify({ programme_id: programmeId }) });
        setCurrentPublicationId(Number(result.item?.id || 0) || workflow.publicationId);
        setPanelStatus('publications', `Publication creee: #${workflow.publicationId}`, 'ok');
        await loadPublications();
      } catch (error) {
        setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
      }
    });
  });

  buildForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publication-build-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('publications', 'Publication ID invalide', 'error');
    setCurrentPublicationId(id);
    try {
      await runBuildAction(id, 'Build OK:');
    } catch (error) {
      setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
    }
  });

  statusForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publication-status-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('publications', 'Publication ID invalide', 'error');
    setCurrentPublicationId(id);
    await withPublicationActionLock(async () => {
      try {
        await api(`/publications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: String(values.status) }) });
        setPanelStatus('publications', 'Statut publication mis a jour', 'ok');
        await loadPublications();
      } catch (error) {
        setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
      }
    });
  });

  previewForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publication-preview-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('publications', 'Publication ID invalide', 'error');
    setCurrentPublicationId(id);
    try {
      await runPreviewAction(id, 'Preview OK:');
    } catch (error) {
      setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
    }
  });

  deployForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publication-deploy-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('publications', 'Publication ID invalide', 'error');
    setCurrentPublicationId(id);
    try {
      await runDeployAction(
        id,
        getDeployPayloadFromFormValues(values),
        'Deploy OK:'
      );
    } catch (error) {
      setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
    }
  });

  detailForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('publication-detail-form');
    if (!values) return;
    const id = numberOrNull(values.id);
    if (!id) return setPanelStatus('publications', 'Publication ID invalide', 'error');
    setCurrentPublicationId(id);
    await withPublicationActionLock(async () => {
      try {
        const applied = await loadPublicationDetailById(id, detailOutput);
        if (!applied) return;
        bindPublicationDetailActions();
        setPanelStatus('publications', 'Detail publication charge', 'ok');
        await loadPublications();
      } catch (error) {
        setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
      }
    });
  });

  workflowForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm('workflow-create-form');
    if (!values) return;
    const programmeId = numberOrNull(values.programme_id);
    if (!programmeId) return setPanelStatus('publications', 'Workflow: programme ID invalide', 'error');
    await withPublicationActionLock(async () => {
      try {
        const result = await api('/publications', { method: 'POST', body: JSON.stringify({ programme_id: programmeId }) });
        setCurrentPublicationId(Number(result.item?.id || 0) || null);
        setPanelStatus('publications', `Workflow: publication #${workflow.publicationId} creee`, 'ok');
        await loadPublications();
      } catch (error) {
        setPanelStatus('publications', `Workflow erreur: ${error.message}`, 'error');
      }
    });
  });

  workflowBuildBtn?.addEventListener('click', async () => {
    try {
      const id = await workflowEnsureId();
      await runBuildAction(id, 'Workflow: build termine');
    } catch (error) {
      setPanelStatus('publications', `Workflow erreur: ${error.message}`, 'error');
    }
  });

  workflowPreviewBtn?.addEventListener('click', async () => {
    try {
      const id = await workflowEnsureId();
      await runPreviewAction(id, 'Workflow: preview');
    } catch (error) {
      setPanelStatus('publications', `Workflow erreur: ${error.message}`, 'error');
    }
  });

  workflowDeployBtn?.addEventListener('click', async () => {
    try {
      const id = await workflowEnsureId();
      const currentDeployValues = readForm('publication-deploy-form');
      await runDeployAction(
        id,
        getDeployPayloadFromFormValues(currentDeployValues),
        'Workflow: deploy termine'
      );
    } catch (error) {
      setPanelStatus('publications', `Workflow erreur: ${error.message}`, 'error');
    }
  });

  workflowRefreshBtn?.addEventListener('click', async () => {
    await withPublicationActionLock(async () => {
      try {
        const id = await workflowEnsureId();
        const applied = await loadPublicationDetailById(id, detailOutput);
        if (!applied) return;
        bindPublicationDetailActions();
        setPanelStatus('publications', `Workflow: detail recharge (#${id})`, 'ok');
        await loadPublications();
      } catch (error) {
        setPanelStatus('publications', `Workflow erreur: ${error.message}`, 'error');
      }
    });
  });

  document.querySelectorAll('[data-publication-use]').forEach((node) => {
    node.addEventListener('click', async () => {
      const raw = node.getAttribute('data-publication-use');
      const id = numberOrNull(raw);
      if (!id) return;
      setCurrentPublicationId(id);
      if (actionBusy) {
        setPanelStatus('publications', `Publication selectionnee: #${id}`, 'ok');
        return;
      }
      setPanelStatus('publications', `Publication selectionnee: #${id} (chargement detail...)`, 'muted');
      const applied = await loadPublicationDetailById(id, detailOutput);
      if (!applied) return;
      bindPublicationDetailActions();
      setPanelStatus('publications', `Publication selectionnee: #${id}`, 'ok');
      await loadPublications();
    });
  });

  document.querySelectorAll('[data-publication-detail]').forEach((node) => {
    node.addEventListener('click', async () => {
      const raw = node.getAttribute('data-publication-detail');
      const id = numberOrNull(raw);
      if (!id) return;
      setCurrentPublicationId(id);
      await withPublicationActionLock(async () => {
        const applied = await loadPublicationDetailById(id, detailOutput);
        if (!applied) return;
        bindPublicationDetailActions();
        setPanelStatus('publications', `Detail charge (#${id})`, 'ok');
        await loadPublications();
      });
    });
  });

  document.querySelectorAll('[data-publication-build]').forEach((node) => {
    node.addEventListener('click', async () => {
      const raw = node.getAttribute('data-publication-build');
      const id = numberOrNull(raw);
      if (!id) return;
      setCurrentPublicationId(id);
      try {
        await runBuildAction(id, 'Quick build');
      } catch (error) {
        setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
      }
    });
  });

  document.querySelectorAll('[data-publication-preview]').forEach((node) => {
    node.addEventListener('click', async () => {
      const raw = node.getAttribute('data-publication-preview');
      const id = numberOrNull(raw);
      if (!id) return;
      setCurrentPublicationId(id);
      try {
        await runPreviewAction(id, 'Quick preview');
      } catch (error) {
        setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
      }
    });
  });

  document.querySelectorAll('[data-publication-deploy]').forEach((node) => {
    node.addEventListener('click', async () => {
      const raw = node.getAttribute('data-publication-deploy');
      const id = numberOrNull(raw);
      if (!id) return;
      setCurrentPublicationId(id);
      try {
        const currentDeployValues = readForm('publication-deploy-form');
        await runDeployAction(
          id,
          getDeployPayloadFromFormValues(currentDeployValues),
          'Quick deploy'
        );
      } catch (error) {
        setPanelStatus('publications', `Erreur: ${error.message}`, 'error');
      }
    });
  });
}

function activateTab(code) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === code));
  Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle('active', key === code));
}

async function tryRestoreSession() {
  try {
    const failedPanels = await loadWorkspace();
    authCard.classList.add('hidden');
    workspace.classList.remove('hidden');
    if (failedPanels.length > 0) {
      setStatus(`Session active (partiel: ${failedPanels.join(', ')})`, 'error');
    } else {
      setStatus('Session active', 'ok');
    }
  } catch {
    authCard.classList.remove('hidden');
    workspace.classList.add('hidden');
    setStatus('Session inactive', 'muted');
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;
  setStatus('Connexion en cours...', 'muted');
  try {
    await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const failedPanels = await loadWorkspace();
    authCard.classList.add('hidden');
    workspace.classList.remove('hidden');
    if (failedPanels.length > 0) {
      setStatus(`Connecte (partiel: ${failedPanels.join(', ')})`, 'error');
    } else {
      setStatus('Connecte', 'ok');
    }
  } catch (error) {
    setStatus(`Echec connexion: ${error.message}`, 'error');
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST', body: '{}' });
  } catch {
    // no-op
  }
  authCard.classList.remove('hidden');
  workspace.classList.add('hidden');
  setStatus('Session fermee', 'muted');
});

tabs.forEach((tab) => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));

tryRestoreSession();
