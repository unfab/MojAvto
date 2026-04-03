// ═══════════════════════════════════════════════════════════════════════════════
// Admin Panel — MojAvto.si
// Modular admin controller: 12 modules, sidebar SPA navigation
// ═══════════════════════════════════════════════════════════════════════════════

import {
    checkAdminRole, getUserRole, getDashboardStats, getRecentListings,
    getAllListings, adminUpdateListingStatus, adminDeleteListing, adminSetFeatured,
    getAllUsers, adminUpdateUserRole, adminBanUser, getUserListingsCount,
    getBrands, createBrand, updateBrand, deleteBrand,
    getModels, createModel, updateModel, deleteModel,
    importTaxonomyRows, getReports, resolveReport,
    getSiteSettings, updateSiteSettings,
    getSeoPages, upsertSeoPage,
    getTopBrands, getListingsByDay, getAuditLogs, addAuditLog,
} from '../services/adminService.js';

// ── Global admin state ────────────────────────────────────────────────────────
let _adminUser = null;
let _adminRole = null;
let _activeSection = 'dashboard';
let _listingsPage = { lastDoc: null, filters: {} };
let _chart = null;

// ── Entry point ───────────────────────────────────────────────────────────────
export async function initAdminPage() {
    const user = window.__currentUser;
    if (!user) { window.location.hash = '/prijava'; return; }

    const isAdmin = await checkAdminRole(user.uid);
    if (!isAdmin) {
        document.getElementById('app-container').innerHTML = `
          <div style="text-align:center;padding:6rem 2rem;">
            <div style="font-size:4rem;margin-bottom:1rem;">🔒</div>
            <h2 style="color:#dc2626;margin:0 0 0.5rem;">Dostop zavrnjen</h2>
            <p style="color:#6b7280;">Nimate administratorskih pravic.</p>
            <a href="#/" style="color:#2563eb;font-weight:600;">← Nazaj domov</a>
          </div>`;
        return;
    }

    _adminUser = user;
    _adminRole = await getUserRole(user.uid);

    renderShell();
    attachSidebarNav();
    navigateTo('dashboard');
}

// ── Shell layout ──────────────────────────────────────────────────────────────
function renderShell() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
    <div class="adm-wrap">
      <!-- Sidebar -->
      <aside class="adm-sidebar" id="adm-sidebar">
        <div class="adm-brand">
          <span class="adm-brand-icon">🚗</span>
          <span class="adm-brand-text">MojAvto<em>Admin</em></span>
        </div>
        <nav class="adm-nav">
          ${navItem('dashboard',   '📊', 'Dashboard')}
          ${navItem('listings',    '📋', 'Oglasi')}
          ${navItem('users',       '👥', 'Uporabniki')}
          ${navItem('taxonomy',    '🏷️', 'Taksonomija')}
          ${navItem('featured',    '⭐', 'Sponzorirani')}
          ${navItem('reports',     '🚩', 'Poročila')}
          ${navItem('analytics',   '📈', 'Analitika')}
          ${navItem('seo',         '🔍', 'SEO')}
          ${navItem('payments',    '💳', 'Plačila')}
          ${navItem('media',       '🖼️', 'Mediji')}
          ${navItem('audit',       '📜', 'Audit log')}
          ${navItem('settings',    '⚙️', 'Nastavitve')}
        </nav>
        <div class="adm-sidebar-footer">
          <div class="adm-user-badge">
            <span class="adm-user-avatar">${(_adminUser.displayName || 'A')[0].toUpperCase()}</span>
            <div>
              <div class="adm-user-name">${_adminUser.displayName || _adminUser.email}</div>
              <div class="adm-user-role">${roleLabel(_adminRole)}</div>
            </div>
          </div>
          <a href="#/" class="adm-logout-btn">← Na stran</a>
        </div>
      </aside>

      <!-- Main content -->
      <div class="adm-main">
        <header class="adm-topbar">
          <button class="adm-menu-toggle" id="adm-menu-toggle" aria-label="Menu">☰</button>
          <div class="adm-topbar-title" id="adm-topbar-title">Dashboard</div>
          <div class="adm-topbar-actions">
            <input class="adm-global-search" id="adm-global-search" type="search" placeholder="Išči oglas, uporabnik, znamka…" />
          </div>
        </header>
        <div class="adm-content" id="adm-content">
          <div class="adm-loading">Nalagam…</div>
        </div>
      </div>
    </div>`;
}

function navItem(id, icon, label) {
    return `<button class="adm-nav-item" data-section="${id}">
      <span class="adm-nav-icon">${icon}</span>
      <span class="adm-nav-label">${label}</span>
    </button>`;
}

function roleLabel(role) {
    return { admin: 'Administrator', moderator: 'Moderator', editor: 'Urednik', user: 'Uporabnik' }[role] || role;
}

// ── Sidebar navigation ────────────────────────────────────────────────────────
function attachSidebarNav() {
    document.querySelectorAll('.adm-nav-item').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.section));
    });

    document.getElementById('adm-menu-toggle').addEventListener('click', () => {
        document.getElementById('adm-sidebar').classList.toggle('adm-sidebar--open');
    });

    document.getElementById('adm-global-search').addEventListener('input', debounce(onGlobalSearch, 400));
}

function navigateTo(section) {
    _activeSection = section;
    document.querySelectorAll('.adm-nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === section));
    document.getElementById('adm-topbar-title').textContent = sectionTitle(section);
    document.getElementById('adm-content').innerHTML = '<div class="adm-loading"><div class="adm-spinner"></div> Nalagam…</div>';
    sections[section]?.();
}

function sectionTitle(s) {
    return { dashboard: 'Dashboard', listings: 'Upravljanje oglasov', users: 'Upravljanje uporabnikov',
             taxonomy: 'Taksonomija vozil', featured: 'Sponzorirani oglasi', reports: 'Poročila in moderacija',
             analytics: 'Analitika', seo: 'SEO Management', payments: 'Plačila & Subscription',
             media: 'Upravljanje medijev', audit: 'Audit log', settings: 'Nastavitve sistema' }[s] || s;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION RENDERERS
// ══════════════════════════════════════════════════════════════════════════════

const sections = {
    dashboard: renderDashboard,
    listings:  renderListings,
    users:     renderUsers,
    taxonomy:  renderTaxonomy,
    featured:  renderFeatured,
    reports:   renderReports,
    analytics: renderAnalytics,
    seo:       renderSeo,
    payments:  renderPayments,
    media:     renderMedia,
    audit:     renderAudit,
    settings:  renderSettings,
};

// ── 1. DASHBOARD ──────────────────────────────────────────────────────────────
async function renderDashboard() {
    const c = document.getElementById('adm-content');
    try {
        const [stats, recent, topBrands, chartData] = await Promise.all([
            getDashboardStats(), getRecentListings(8),
            getTopBrands(6), getListingsByDay(14),
        ]);

        c.innerHTML = `
          <div class="adm-kpi-grid">
            ${kpi('Skupaj oglasov', stats.totalListings, '📋', 'blue')}
            ${kpi('Aktivnih',       stats.activeCount,   '✅', 'green')}
            ${kpi('V pregledu',     stats.pendingCount,  '⏳', 'yellow')}
            ${kpi('Uporabnikov',    stats.totalUsers,    '👥', 'purple')}
            ${kpi('Novih danes',    stats.newToday,      '🆕', 'orange')}
            ${kpi('Znamk',          stats.totalBrands,   '🏷️', 'teal')}
          </div>

          <div class="adm-grid-2">
            <div class="adm-card">
              <div class="adm-card-header">
                <h3>Novi oglasi (14 dni)</h3>
              </div>
              <canvas id="adm-chart-listings" height="180"></canvas>
            </div>
            <div class="adm-card">
              <div class="adm-card-header">
                <h3>Top znamke (aktivni oglasi)</h3>
              </div>
              <div class="adm-top-brands">
                ${topBrands.map((b, i) => `
                  <div class="adm-brand-row">
                    <span class="adm-brand-rank">#${i + 1}</span>
                    <span class="adm-brand-name">${b.name}</span>
                    <div class="adm-brand-bar-wrap">
                      <div class="adm-brand-bar" style="width:${Math.round((b.count / (topBrands[0]?.count || 1)) * 100)}%"></div>
                    </div>
                    <span class="adm-brand-count">${b.count}</span>
                  </div>`).join('')}
              </div>
            </div>
          </div>

          <div class="adm-card">
            <div class="adm-card-header">
              <h3>Zadnji oglasi</h3>
              <button class="adm-btn adm-btn-sm" onclick="window.__adminNav('listings')">Vsi oglasi →</button>
            </div>
            <div class="adm-table-wrap">
              <table class="adm-table">
                <thead><tr>
                  <th>Oglas</th><th>Status</th><th>Avtor</th><th>Cena</th><th>Datum</th><th>Akcija</th>
                </tr></thead>
                <tbody>
                  ${recent.map(l => `
                    <tr>
                      <td><strong>${escHtml(l.make || '')} ${escHtml(l.model || '')}</strong><br><small style="color:#6b7280">${escHtml(l.variant || '')}</small></td>
                      <td>${statusBadge(l.status)}</td>
                      <td style="font-size:.8rem">${escHtml(l.authorName || l.authorId?.slice(0,8) || '—')}</td>
                      <td>${fmtPrice(l.priceEur || l.price)}</td>
                      <td style="font-size:.8rem">${fmtDate(l.createdAt)}</td>
                      <td>
                        <button class="adm-btn adm-btn-xs adm-btn-green" onclick="window.__adminApprove('${l.id}')">✓</button>
                        <button class="adm-btn adm-btn-xs adm-btn-red"   onclick="window.__adminReject('${l.id}')">✗</button>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;

        // Chart.js bar chart
        drawListingsChart(chartData);

        window.__adminNav = navigateTo;
        window.__adminApprove = id => quickStatus(id, 'active');
        window.__adminReject  = id => openRejectModal(id);

    } catch (e) {
        c.innerHTML = errBox(e);
    }
}

function drawListingsChart(data) {
    if (typeof Chart === 'undefined') return;
    if (_chart) { _chart.destroy(); _chart = null; }
    const canvas = document.getElementById('adm-chart-listings');
    if (!canvas) return;
    _chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.date.slice(5)),
            datasets: [{ label: 'Oglasi', data: data.map(d => d.count),
                backgroundColor: 'rgba(37,99,235,0.7)', borderRadius: 4 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } },
                   scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    });
}

// ── 2. LISTINGS ───────────────────────────────────────────────────────────────
async function renderListings() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-toolbar">
        <div class="adm-filter-group">
          <select id="lst-filter-status" class="adm-select">
            <option value="">Vsi statusi</option>
            <option value="active">Aktiven</option>
            <option value="pending">V pregledu</option>
            <option value="rejected">Zavrnjen</option>
            <option value="expired">Potekel</option>
          </select>
          <select id="lst-filter-cat" class="adm-select">
            <option value="">Vse kategorije</option>
            <option value="avto">Avto</option>
            <option value="moto">Moto</option>
            <option value="gospodarska">Gospodarska</option>
          </select>
          <button class="adm-btn" id="lst-filter-btn">Filtriraj</button>
        </div>
        <div class="adm-bulk-group" id="lst-bulk-group" style="display:none">
          <span id="lst-selected-count">0 izbranih</span>
          <button class="adm-btn adm-btn-green" id="lst-bulk-approve">✓ Odobri</button>
          <button class="adm-btn adm-btn-red"   id="lst-bulk-reject">✗ Zavrni</button>
          <button class="adm-btn adm-btn-red"   id="lst-bulk-delete">🗑 Izbriši</button>
        </div>
      </div>
      <div class="adm-card">
        <div class="adm-table-wrap" id="lst-table-wrap">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
        <div class="adm-pagination" id="lst-pagination"></div>
      </div>`;

    document.getElementById('lst-filter-btn').addEventListener('click', () => {
        _listingsPage = {
            filters: {
                status: document.getElementById('lst-filter-status').value,
                category: document.getElementById('lst-filter-cat').value,
            },
            lastDoc: null,
        };
        loadListingsTable();
    });

    loadListingsTable();
    setupBulkActions();
}

async function loadListingsTable() {
    const wrap = document.getElementById('lst-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="adm-loading"><div class="adm-spinner"></div></div>';

    try {
        const { docs } = await getAllListings(_listingsPage.filters, 50, _listingsPage.lastDoc);
        if (docs.length === 0) {
            wrap.innerHTML = '<div class="adm-empty">Ni oglasov za prikaz.</div>';
            return;
        }

        wrap.innerHTML = `
          <table class="adm-table adm-table--selectable">
            <thead><tr>
              <th><input type="checkbox" id="lst-select-all"></th>
              <th>Oglas</th><th>Kategorija</th><th>Status</th>
              <th>Avtor</th><th>Cena</th><th>Objavljeno</th><th>Akcije</th>
            </tr></thead>
            <tbody id="lst-tbody">
              ${docs.map(l => `
                <tr data-id="${l.id}">
                  <td><input type="checkbox" class="lst-row-check" value="${l.id}"></td>
                  <td>
                    <div class="adm-listing-cell">
                      ${l.images?.exterior?.[0] ? `<img src="${l.images.exterior[0]}" class="adm-thumb">` : '<div class="adm-thumb adm-thumb--empty">🚗</div>'}
                      <div>
                        <strong>${escHtml(l.make || '')} ${escHtml(l.model || '')} ${escHtml(l.variant || '')}</strong>
                        <div class="adm-sub">${l.year || ''} · ${fmtMileage(l.mileageKm || l.mileage)} · ${escHtml(l.fuel || '')}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="adm-cat-badge adm-cat-${l.category || 'avto'}">${l.category || 'avto'}</span></td>
                  <td>${statusBadge(l.status)}</td>
                  <td class="adm-sub">${escHtml(l.authorName || l.authorId?.slice(0, 8) || '—')}</td>
                  <td><strong>${fmtPrice(l.priceEur || l.price)}</strong></td>
                  <td class="adm-sub">${fmtDate(l.createdAt)}</td>
                  <td class="adm-actions">
                    <button class="adm-btn adm-btn-xs adm-btn-green" title="Odobri" onclick="window.__lstApprove('${l.id}')">✓</button>
                    <button class="adm-btn adm-btn-xs adm-btn-yellow" title="Zavrni" onclick="window.__lstReject('${l.id}')">✗</button>
                    <button class="adm-btn adm-btn-xs" title="Featured" onclick="window.__lstFeatured('${l.id}')">⭐</button>
                    <button class="adm-btn adm-btn-xs adm-btn-red" title="Izbriši" onclick="window.__lstDelete('${l.id}')">🗑</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`;

        // Select-all toggle
        document.getElementById('lst-select-all').addEventListener('change', e => {
            document.querySelectorAll('.lst-row-check').forEach(cb => cb.checked = e.target.checked);
            updateBulkBar();
        });
        document.querySelectorAll('.lst-row-check').forEach(cb =>
            cb.addEventListener('change', updateBulkBar)
        );

        window.__lstApprove  = id => quickStatus(id, 'active');
        window.__lstReject   = id => openRejectModal(id);
        window.__lstFeatured = id => openFeaturedModal(id);
        window.__lstDelete   = id => confirmAction(`Izbrisati oglas ${id}?`, () => doDeleteListing(id));

    } catch (e) {
        wrap.innerHTML = errBox(e);
    }
}

function setupBulkActions() {
    const bulkGroup = document.getElementById('lst-bulk-group');
    if (!bulkGroup) return;

    document.getElementById('lst-bulk-approve')?.addEventListener('click', () => {
        getSelected().forEach(id => quickStatus(id, 'active'));
    });
    document.getElementById('lst-bulk-reject')?.addEventListener('click', () => {
        getSelected().forEach(id => quickStatus(id, 'rejected'));
    });
    document.getElementById('lst-bulk-delete')?.addEventListener('click', () => {
        const ids = getSelected();
        confirmAction(`Izbrisati ${ids.length} oglasov?`, () => ids.forEach(doDeleteListing));
    });
}

function getSelected() {
    return [...document.querySelectorAll('.lst-row-check:checked')].map(cb => cb.value);
}

function updateBulkBar() {
    const sel = getSelected();
    const bulkGroup = document.getElementById('lst-bulk-group');
    const selCount = document.getElementById('lst-selected-count');
    if (!bulkGroup) return;
    bulkGroup.style.display = sel.length > 0 ? 'flex' : 'none';
    if (selCount) selCount.textContent = `${sel.length} izbranih`;
}

async function quickStatus(id, status) {
    try {
        await adminUpdateListingStatus(id, status);
        await addAuditLog(_adminUser.uid, _adminUser.displayName, `LISTING_${status.toUpperCase()}`, id);
        showToast(`Oglas ${status === 'active' ? 'odobren' : 'posodobljen'}.`, 'success');
        loadListingsTable();
    } catch (e) { showToast('Napaka: ' + e.message, 'error'); }
}

async function doDeleteListing(id) {
    try {
        await adminDeleteListing(id);
        await addAuditLog(_adminUser.uid, _adminUser.displayName, 'LISTING_DELETE', id);
        showToast('Oglas izbrisan.', 'success');
        loadListingsTable();
    } catch (e) { showToast('Napaka: ' + e.message, 'error'); }
}

// ── 3. USERS ──────────────────────────────────────────────────────────────────
async function renderUsers() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>Vsi uporabniki</h3>
          <input class="adm-input adm-input-sm" id="user-search" placeholder="Išči po imenu / emailu…">
        </div>
        <div class="adm-table-wrap" id="usr-table-wrap">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    document.getElementById('user-search').addEventListener('input', debounce(() => filterUsersTable(), 300));

    let _allUsers = [];
    try {
        _allUsers = await getAllUsers(200);
        renderUsersTable(_allUsers);
    } catch (e) {
        document.getElementById('usr-table-wrap').innerHTML = errBox(e);
    }

    function filterUsersTable() {
        const q = document.getElementById('user-search').value.toLowerCase();
        const filtered = _allUsers.filter(u =>
            (u.displayName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
        renderUsersTable(filtered);
    }

    window.__usrBan    = uid => confirmAction('Ban/unban tega uporabnika?', () => doToggleBan(uid, _allUsers));
    window.__usrRole   = uid => openRoleModal(uid, _allUsers);
    window.__usrGlassi = uid => navigateTo('listings'); // shortcut
}

function renderUsersTable(users) {
    const wrap = document.getElementById('usr-table-wrap');
    if (!wrap) return;
    if (users.length === 0) { wrap.innerHTML = '<div class="adm-empty">Ni uporabnikov.</div>'; return; }
    wrap.innerHTML = `
      <table class="adm-table">
        <thead><tr>
          <th>Uporabnik</th><th>Email</th><th>Vloga</th>
          <th>Status</th><th>Registriran</th><th>Akcije</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>
                <div class="adm-user-cell">
                  ${u.photoURL ? `<img src="${escHtml(u.photoURL)}" class="adm-avatar">` : `<div class="adm-avatar adm-avatar--placeholder">${(u.displayName || u.email || '?')[0].toUpperCase()}</div>`}
                  <strong>${escHtml(u.displayName || '—')}</strong>
                </div>
              </td>
              <td class="adm-sub">${escHtml(u.email || '—')}</td>
              <td>${roleBadge(u.role)}</td>
              <td>${u.status === 'banned' ? '<span class="adm-badge adm-badge-red">Blokiran</span>' : '<span class="adm-badge adm-badge-green">Aktiven</span>'}</td>
              <td class="adm-sub">${fmtDate(u.createdAt)}</td>
              <td class="adm-actions">
                <button class="adm-btn adm-btn-xs" onclick="window.__usrRole('${u.id}')">🔑 Vloga</button>
                <button class="adm-btn adm-btn-xs ${u.status === 'banned' ? 'adm-btn-green' : 'adm-btn-red'}" onclick="window.__usrBan('${u.id}')">
                  ${u.status === 'banned' ? '✓ Odblokiraj' : '🚫 Blokiraj'}
                </button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
}

async function doToggleBan(uid, users) {
    const u = users.find(x => x.id === uid);
    const banned = u?.status !== 'banned';
    try {
        await adminBanUser(uid, banned);
        await addAuditLog(_adminUser.uid, _adminUser.displayName, banned ? 'USER_BAN' : 'USER_UNBAN', uid);
        showToast(banned ? 'Uporabnik blokiran.' : 'Uporabnik odblokiran.', 'success');
        renderUsers();
    } catch (e) { showToast('Napaka: ' + e.message, 'error'); }
}

// ── 4. TAXONOMY ───────────────────────────────────────────────────────────────
async function renderTaxonomy() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-tabs" id="tax-tabs">
        <button class="adm-tab active" data-tab="brands">Znamke</button>
        <button class="adm-tab" data-tab="models">Modeli</button>
        <button class="adm-tab" data-tab="import">Excel uvoz</button>
      </div>
      <div id="tax-content"></div>`;

    const tabs = document.querySelectorAll('#tax-tabs .adm-tab');
    tabs.forEach(t => t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        taxSwitch(t.dataset.tab);
    }));

    taxSwitch('brands');
}

async function taxSwitch(tab) {
    const c = document.getElementById('tax-content');
    if (tab === 'brands') await renderBrandsTab(c);
    if (tab === 'models') await renderModelsTab(c);
    if (tab === 'import') renderImportTab(c);
}

async function renderBrandsTab(c) {
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>Znamke vozil</h3>
          <div style="display:flex;gap:.5rem">
            <select id="brand-cat-filter" class="adm-select">
              <option value="">Vse kategorije</option>
              <option value="avto">Avto</option>
              <option value="moto">Moto</option>
              <option value="gospodarska">Gospodarska</option>
            </select>
            <button class="adm-btn adm-btn-primary" id="brand-add-btn">+ Dodaj znamko</button>
          </div>
        </div>
        <div class="adm-table-wrap" id="brands-table"></div>
      </div>`;

    document.getElementById('brand-cat-filter').addEventListener('change', async e => {
        loadBrandsTable(e.target.value);
    });
    document.getElementById('brand-add-btn').addEventListener('click', () => openBrandModal(null));

    loadBrandsTable('');
}

async function loadBrandsTable(catFilter) {
    const wrap = document.getElementById('brands-table');
    if (!wrap) return;
    wrap.innerHTML = '<div class="adm-loading"><div class="adm-spinner"></div></div>';
    try {
        const brands = await getBrands(catFilter || null);
        if (!brands.length) { wrap.innerHTML = '<div class="adm-empty">Ni znamk.</div>'; return; }
        wrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Znamka</th><th>Slug</th><th>Kategorija</th><th>Akcije</th></tr></thead>
            <tbody>
              ${brands.map(b => `
                <tr>
                  <td><strong>${escHtml(b.name)}</strong></td>
                  <td class="adm-sub">${escHtml(b.slug || '')}</td>
                  <td>${escHtml(b.category || '')}</td>
                  <td class="adm-actions">
                    <button class="adm-btn adm-btn-xs" onclick="window.__brandEdit('${b.id}')">✏️ Uredi</button>
                    <button class="adm-btn adm-btn-xs adm-btn-red" onclick="window.__brandDel('${b.id}')">🗑</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`;

        window.__brandEdit = id => openBrandModal(brands.find(b => b.id === id));
        window.__brandDel  = id => confirmAction('Izbrisati znamko?', async () => {
            await deleteBrand(id);
            await addAuditLog(_adminUser.uid, _adminUser.displayName, 'BRAND_DELETE', id);
            showToast('Znamka izbrisana.', 'success');
            loadBrandsTable(catFilter);
        });
    } catch (e) { wrap.innerHTML = errBox(e); }
}

async function renderModelsTab(c) {
    const brands = await getBrands();
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>Modeli vozil</h3>
          <div style="display:flex;gap:.5rem">
            <select id="model-brand-filter" class="adm-select">
              <option value="">Vse znamke</option>
              ${brands.map(b => `<option value="${b.id}">${escHtml(b.name)}</option>`).join('')}
            </select>
            <button class="adm-btn adm-btn-primary" id="model-add-btn">+ Dodaj model</button>
          </div>
        </div>
        <div class="adm-table-wrap" id="models-table"></div>
      </div>`;

    document.getElementById('model-brand-filter').addEventListener('change', async e => {
        loadModelsTable(e.target.value, brands);
    });
    document.getElementById('model-add-btn').addEventListener('click', () => openModelModal(null, brands));

    loadModelsTable('', brands);
}

async function loadModelsTable(brandId, brands) {
    const wrap = document.getElementById('models-table');
    if (!wrap) return;
    wrap.innerHTML = '<div class="adm-loading"><div class="adm-spinner"></div></div>';
    try {
        const models = await getModels(brandId || null);
        if (!models.length) { wrap.innerHTML = '<div class="adm-empty">Ni modelov.</div>'; return; }
        wrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Model</th><th>Znamka</th><th>Kategorija</th><th>Akcije</th></tr></thead>
            <tbody>
              ${models.map(m => `
                <tr>
                  <td><strong>${escHtml(m.name)}</strong></td>
                  <td>${escHtml(m.brandName || '')}</td>
                  <td>${escHtml(m.category || '')}</td>
                  <td class="adm-actions">
                    <button class="adm-btn adm-btn-xs" onclick="window.__modelEdit('${m.id}')">✏️</button>
                    <button class="adm-btn adm-btn-xs adm-btn-red" onclick="window.__modelDel('${m.id}')">🗑</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`;

        window.__modelEdit = id => openModelModal(models.find(m => m.id === id), brands);
        window.__modelDel  = id => confirmAction('Izbrisati model?', async () => {
            await deleteModel(id);
            showToast('Model izbrisan.', 'success');
            loadModelsTable(brandId, brands);
        });
    } catch (e) { wrap.innerHTML = errBox(e); }
}

function renderImportTab(c) {
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header"><h3>Excel uvoz taksonomije</h3></div>
        <div style="padding:1.5rem">
          <p style="color:#6b7280;margin-bottom:1rem">Podprta formata: <strong>.xlsx</strong> ali <strong>.csv</strong>. Stolpci: <code>category | brand | model</code></p>

          <div class="adm-dropzone" id="excel-dropzone">
            <div style="font-size:2.5rem;margin-bottom:.5rem">📂</div>
            <div>Povlecite datoteko sem ali <label for="excel-file-input" style="color:#2563eb;cursor:pointer;font-weight:600">izberite datoteko</label></div>
            <input type="file" id="excel-file-input" accept=".xlsx,.xls,.csv" style="display:none">
          </div>

          <div id="excel-preview" style="display:none">
            <h4 style="margin:1.5rem 0 .5rem">Predogled (prvih 10 vrstic):</h4>
            <div class="adm-table-wrap" id="excel-preview-table"></div>
            <div id="excel-validation" style="margin-top:1rem"></div>
            <div style="display:flex;gap:.75rem;margin-top:1.25rem">
              <button class="adm-btn adm-btn-primary" id="excel-import-btn">📥 Uvozi vse</button>
              <button class="adm-btn" id="excel-reset-btn">✕ Ponastavi</button>
            </div>
          </div>
          <div id="excel-result" style="margin-top:1rem"></div>
        </div>
      </div>

      <div class="adm-card" style="margin-top:1rem">
        <div class="adm-card-header"><h3>Excel predloga za prenos</h3></div>
        <div style="padding:1.5rem">
          <p style="color:#6b7280;margin-bottom:1rem">Prenesite pripravljeno predlogo z ustreznimi stolpci.</p>
          <button class="adm-btn adm-btn-primary" id="excel-template-btn">⬇️ Prenesi predlogo</button>
        </div>
      </div>`;

    setupExcelImport();
}

function setupExcelImport() {
    let parsedRows = [];

    const fileInput = document.getElementById('excel-file-input');
    const dropzone  = document.getElementById('excel-dropzone');

    fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('adm-dropzone--hover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('adm-dropzone--hover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('adm-dropzone--hover');
        handleFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', () => fileInput.click());

    document.getElementById('excel-template-btn').addEventListener('click', downloadExcelTemplate);
    document.getElementById('excel-reset-btn')?.addEventListener('click', () => {
        parsedRows = [];
        document.getElementById('excel-preview').style.display = 'none';
        document.getElementById('excel-result').innerHTML = '';
    });
    document.getElementById('excel-import-btn')?.addEventListener('click', async () => {
        if (!parsedRows.length) return;
        const btn = document.getElementById('excel-import-btn');
        btn.disabled = true; btn.textContent = '⏳ Uvažam…';
        try {
            const result = await importTaxonomyRows(parsedRows, _adminUser.uid, _adminUser.displayName);
            document.getElementById('excel-result').innerHTML = `
              <div class="adm-alert adm-alert-success">
                ✅ Uvoz končan: <strong>${result.imported}</strong> uvoženih,
                <strong>${result.skipped}</strong> preskočenih (duplikati).
                ${result.errors.length ? `<br>⚠️ ${result.errors.length} napak.` : ''}
              </div>`;
            showToast('Uvoz uspešen!', 'success');
        } catch (e) {
            document.getElementById('excel-result').innerHTML = `<div class="adm-alert adm-alert-error">Napaka: ${e.message}</div>`;
        }
        btn.disabled = false; btn.textContent = '📥 Uvozi vse';
    });

    async function handleFile(file) {
        if (!file) return;
        if (typeof XLSX === 'undefined') { showToast('SheetJS ni naložen. Preverite CDN.', 'error'); return; }

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

                // Normalize headers (case insensitive)
                parsedRows = raw.map(r => {
                    const row = {};
                    Object.entries(r).forEach(([k, v]) => { row[k.toLowerCase().trim()] = String(v).trim(); });
                    return { category: row['category'] || row['kategorija'] || 'avto',
                             brand: row['brand'] || row['znamka'] || '',
                             model: row['model'] || '' };
                }).filter(r => r.brand);

                renderPreview(parsedRows);
            } catch (ex) {
                showToast('Napaka pri branju datoteke: ' + ex.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function renderPreview(rows) {
        const preview = document.getElementById('excel-preview');
        const tableWrap = document.getElementById('excel-preview-table');
        const validation = document.getElementById('excel-validation');
        preview.style.display = 'block';

        const show = rows.slice(0, 10);
        const empty = rows.filter(r => !r.brand);

        tableWrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Kategorija</th><th>Znamka</th><th>Model</th></tr></thead>
            <tbody>
              ${show.map(r => `<tr><td>${escHtml(r.category)}</td><td>${escHtml(r.brand)}</td><td>${escHtml(r.model)}</td></tr>`).join('')}
              ${rows.length > 10 ? `<tr><td colspan="3" style="color:#6b7280;text-align:center">… in še ${rows.length - 10} vrstic</td></tr>` : ''}
            </tbody>
          </table>`;

        validation.innerHTML = empty.length
            ? `<div class="adm-alert adm-alert-warn">⚠️ ${empty.length} vrstic brez znamke bo preskočenih.</div>`
            : `<div class="adm-alert adm-alert-success">✅ ${rows.length} veljavnih vrstic pripravljenih za uvoz.</div>`;
    }
}

function downloadExcelTemplate() {
    if (typeof XLSX === 'undefined') { showToast('SheetJS ni naložen.', 'error'); return; }
    const ws = XLSX.utils.aoa_to_sheet([
        ['category', 'brand', 'model'],
        ['avto', 'BMW', 'X5'],
        ['avto', 'BMW', '3 Series'],
        ['moto', 'Honda', 'CB500F'],
        ['gospodarska', 'Mercedes-Benz', 'Sprinter'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Taksonomija');
    XLSX.writeFile(wb, 'mojavto-taxonomy-template.xlsx');
}

// ── 5. FEATURED / SPONSORED ───────────────────────────────────────────────────
async function renderFeatured() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>Sponzorirani in izpostavljeni oglasi</h3>
        </div>
        <div class="adm-table-wrap" id="featured-table">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    try {
        const { docs } = await getAllListings({}, 100);
        const featured = docs.filter(l => l.promotion?.tier && l.promotion.tier !== 'free');
        const wrap = document.getElementById('featured-table');
        if (!featured.length) { wrap.innerHTML = '<div class="adm-empty">Ni sponzoriranih oglasov.</div>'; return; }
        wrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Oglas</th><th>Tip</th><th>Aktiviran</th><th>Poteče</th><th>Akcije</th></tr></thead>
            <tbody>
              ${featured.map(l => `
                <tr>
                  <td><strong>${escHtml(l.make || '')} ${escHtml(l.model || '')}</strong></td>
                  <td>${tierBadge(l.promotion?.tier)}</td>
                  <td class="adm-sub">${fmtDate(l.promotion?.activatedAt)}</td>
                  <td class="adm-sub">${l.promotion?.expiresAt ? fmtDate(l.promotion.expiresAt) : '∞'}</td>
                  <td>
                    <button class="adm-btn adm-btn-xs adm-btn-red" onclick="window.__featRemove('${l.id}')">Odstrani</button>
                    <button class="adm-btn adm-btn-xs" onclick="window.__featEdit('${l.id}')">Uredi</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`;

        window.__featRemove = id => confirmAction('Odstraniti sponzoring?', async () => {
            await adminSetFeatured(id, 'free', 0);
            showToast('Sponzoring odstranjen.', 'success');
            renderFeatured();
        });
        window.__featEdit = id => openFeaturedModal(id);
    } catch (e) {
        document.getElementById('featured-table').innerHTML = errBox(e);
    }
}

// ── 6. REPORTS ────────────────────────────────────────────────────────────────
async function renderReports() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>Prijavljeni oglasi</h3>
          <select id="report-filter" class="adm-select">
            <option value="">Vsa poročila</option>
            <option value="open">Odprta</option>
            <option value="resolved">Rešena</option>
            <option value="dismissed">Zavrnjena</option>
          </select>
        </div>
        <div class="adm-table-wrap" id="reports-table">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    document.getElementById('report-filter').addEventListener('change', e => loadReportsTable(e.target.value));
    loadReportsTable('');
}

async function loadReportsTable(status) {
    const wrap = document.getElementById('reports-table');
    if (!wrap) return;
    wrap.innerHTML = '<div class="adm-loading"><div class="adm-spinner"></div></div>';
    try {
        const reports = await getReports(status || null);
        if (!reports.length) { wrap.innerHTML = '<div class="adm-empty">Ni poročil.</div>'; return; }
        wrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Oglas ID</th><th>Razlog</th><th>Prijavil</th><th>Datum</th><th>Status</th><th>Akcije</th></tr></thead>
            <tbody>
              ${reports.map(r => `
                <tr>
                  <td class="adm-sub">${escHtml(r.listingId || '—')}</td>
                  <td>${reasonBadge(r.reason)}</td>
                  <td class="adm-sub">${escHtml(r.reporterName || r.reporterId?.slice(0,8) || '—')}</td>
                  <td class="adm-sub">${fmtDate(r.createdAt)}</td>
                  <td>${reportStatusBadge(r.status)}</td>
                  <td class="adm-actions">
                    ${r.status === 'open' ? `
                      <button class="adm-btn adm-btn-xs adm-btn-red" onclick="window.__repResolve('${r.id}','remove')">Odstrani oglas</button>
                      <button class="adm-btn adm-btn-xs" onclick="window.__repResolve('${r.id}','dismiss')">Zavrni</button>
                    ` : '<span class="adm-sub">Zaključeno</span>'}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`;

        window.__repResolve = async (id, action) => {
            await resolveReport(id, action);
            showToast(action === 'dismiss' ? 'Poročilo zavrnjeno.' : 'Oglas odstranjen.', 'success');
            loadReportsTable(status);
        };
    } catch (e) { wrap.innerHTML = errBox(e); }
}

// ── 7. ANALYTICS ──────────────────────────────────────────────────────────────
async function renderAnalytics() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-kpi-grid" id="ana-kpis">
        <div class="adm-loading" style="grid-column:1/-1"><div class="adm-spinner"></div></div>
      </div>
      <div class="adm-grid-2">
        <div class="adm-card">
          <div class="adm-card-header"><h3>Oglasi po dnevih (30 dni)</h3></div>
          <canvas id="ana-chart-listings" height="180"></canvas>
        </div>
        <div class="adm-card">
          <div class="adm-card-header"><h3>Top znamke</h3></div>
          <canvas id="ana-chart-brands" height="180"></canvas>
        </div>
      </div>
      <div class="adm-card">
        <div class="adm-card-header"><h3>Iskalna analitika (zadnje poizvedbe)</h3></div>
        <div class="adm-table-wrap" id="ana-search-table">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    try {
        const [stats, chartData30, topBrands, searchLogs] = await Promise.all([
            getDashboardStats(), getListingsByDay(30),
            getTopBrands(8), getSearchAnalytics(20),
        ]);

        document.getElementById('ana-kpis').innerHTML = `
          ${kpi('Skupaj oglasov', stats.totalListings, '📋', 'blue')}
          ${kpi('Aktivni', stats.activeCount, '✅', 'green')}
          ${kpi('Novih danes', stats.newToday, '🆕', 'orange')}
          ${kpi('Skupaj uporabnikov', stats.totalUsers, '👥', 'purple')}`;

        // Listings chart
        if (typeof Chart !== 'undefined') {
            if (_chart) { _chart.destroy(); _chart = null; }
            const ctx1 = document.getElementById('ana-chart-listings');
            if (ctx1) {
                _chart = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: chartData30.map(d => d.date.slice(5)),
                        datasets: [{ label: 'Oglasi', data: chartData30.map(d => d.count),
                            borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)',
                            tension: 0.3, fill: true, pointRadius: 3 }],
                    },
                    options: { responsive: true, plugins: { legend: { display: false } },
                               scales: { y: { beginAtZero: true } } },
                });
            }
            const ctx2 = document.getElementById('ana-chart-brands');
            if (ctx2 && topBrands.length) {
                new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: topBrands.map(b => b.name),
                        datasets: [{ data: topBrands.map(b => b.count),
                            backgroundColor: ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#ca8a04','#9333ea'] }],
                    },
                    options: { responsive: true, plugins: { legend: { position: 'right' } } },
                });
            }
        }

        // Search analytics table
        const searchWrap = document.getElementById('ana-search-table');
        if (!searchLogs.length) {
            searchWrap.innerHTML = '<div class="adm-empty">Ni podatkov o iskanjih.</div>';
        } else {
            searchWrap.innerHTML = `
              <table class="adm-table">
                <thead><tr><th>Poizvedba</th><th>Kategorija</th><th>Število iskanj</th><th>Brez rezultatov</th></tr></thead>
                <tbody>
                  ${searchLogs.map(s => `
                    <tr>
                      <td><strong>${escHtml(s.query || s.id)}</strong></td>
                      <td>${escHtml(s.category || '—')}</td>
                      <td><strong>${s.count || 0}</strong></td>
                      <td>${s.noResults ? '<span class="adm-badge adm-badge-red">Da</span>' : '<span class="adm-badge adm-badge-green">Ne</span>'}</td>
                    </tr>`).join('')}
                </tbody>
              </table>`;
        }
    } catch (e) {
        document.getElementById('ana-kpis').innerHTML = errBox(e);
    }
}

// ── 8. SEO ────────────────────────────────────────────────────────────────────
async function renderSeo() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header">
          <h3>SEO strani</h3>
          <button class="adm-btn adm-btn-primary" id="seo-add-btn">+ Dodaj stran</button>
        </div>
        <div class="adm-table-wrap" id="seo-table">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    document.getElementById('seo-add-btn').addEventListener('click', () => openSeoModal(null));
    loadSeoTable();
}

async function loadSeoTable() {
    const wrap = document.getElementById('seo-table');
    if (!wrap) return;
    try {
        const pages = await getSeoPages();
        if (!pages.length) { wrap.innerHTML = '<div class="adm-empty">Ni SEO strani. Dodajte prvo.</div>'; return; }
        wrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Slug / URL</th><th>Meta naslov</th><th>Meta opis</th><th>Akcije</th></tr></thead>
            <tbody>
              ${pages.map(p => `
                <tr>
                  <td><code>${escHtml(p.slug || '')}</code></td>
                  <td>${escHtml(p.metaTitle || '—')}</td>
                  <td class="adm-sub" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.metaDescription || '—')}</td>
                  <td>
                    <button class="adm-btn adm-btn-xs" onclick="window.__seoEdit('${p.id}')">✏️ Uredi</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`;

        window.__seoEdit = id => openSeoModal(pages.find(p => p.id === id));
    } catch (e) { wrap.innerHTML = errBox(e); }
}

// ── 9. PAYMENTS ───────────────────────────────────────────────────────────────
async function renderPayments() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-kpi-grid">
        ${kpi('Skupaj transakcij', '—', '💳', 'blue')}
        ${kpi('Uspešnih', '—', '✅', 'green')}
        ${kpi('Neuspešnih', '—', '❌', 'red')}
        ${kpi('Skupni prihodek', '—', '💰', 'purple')}
      </div>
      <div class="adm-card">
        <div class="adm-card-header"><h3>Transakcije</h3></div>
        <div style="padding:2rem;text-align:center;color:#6b7280">
          <div style="font-size:3rem;margin-bottom:1rem">💳</div>
          <h4>Stripe / PayPal integracija</h4>
          <p>Za produkcijsko okolje povežite Stripe webhooks z <code>/api/stripe/webhook</code> endpointom.<br>
          Transakcije se shranjujejo v kolekcijo <code>payments</code> v Firestore.</p>
          <div class="adm-alert adm-alert-warn" style="text-align:left;margin-top:1.5rem">
            ⚠️ Stripe API ključi morajo biti nastavljeni v Firebase Cloud Functions (environment variables), ne v frontend kodi.
          </div>
        </div>
      </div>
      <div class="adm-card" style="margin-top:1rem">
        <div class="adm-card-header"><h3>Paketi</h3></div>
        <div id="pay-packages-wrap">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    try {
        const settings = await getSiteSettings();
        const pkgs = settings.packages || {};
        document.getElementById('pay-packages-wrap').innerHTML = `
          <div class="adm-pkg-grid">
            ${Object.entries(pkgs).map(([key, pkg]) => `
              <div class="adm-pkg-card">
                <div class="adm-pkg-name">${escHtml(pkg.name || key)}</div>
                <div class="adm-pkg-price">${pkg.price === 0 ? 'Brezplačno' : pkg.price + ' € / oglas'}</div>
                <ul class="adm-pkg-features">
                  <li>Do ${pkg.maxListings === 999 ? '∞' : pkg.maxListings} oglasov</li>
                  <li>${pkg.durationDays} dni veljavnosti</li>
                </ul>
              </div>`).join('')}
          </div>
          <div style="padding:1.5rem;border-top:1px solid #e5e7eb">
            <button class="adm-btn adm-btn-primary" onclick="window.__adminNav('settings')">⚙️ Uredi pakete v Nastavitvah</button>
          </div>`;
    } catch (e) {
        document.getElementById('pay-packages-wrap').innerHTML = errBox(e);
    }
}

// ── 10. MEDIA ─────────────────────────────────────────────────────────────────
async function renderMedia() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header"><h3>Upravljanje medijev</h3></div>
        <div style="padding:2rem;text-align:center;color:#6b7280">
          <div style="font-size:3rem;margin-bottom:1rem">🖼️</div>
          <p>Slike oglasov se hranijo v Firebase Storage pod <code>/listings/{userId}/</code></p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1.5rem;text-align:left">
            <div class="adm-info-card">
              <div class="adm-info-card-title">Struktura</div>
              <code style="font-size:.8rem">/listings/{uid}/{timestamp}_{rand}_{filename}</code>
            </div>
            <div class="adm-info-card">
              <div class="adm-info-card-title">Optimizacija</div>
              <p style="font-size:.85rem">Priporočena implementacija: Firebase Extensions → Resize Images (sharp)</p>
            </div>
            <div class="adm-info-card">
              <div class="adm-info-card-title">Max velikost</div>
              <p style="font-size:.85rem">Nastavljiva v Nastavitvah sistema (<code>maxImagesPerListing</code>)</p>
            </div>
          </div>
        </div>
      </div>`;
}

// ── 11. AUDIT LOG ─────────────────────────────────────────────────────────────
async function renderAudit() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header"><h3>Audit log (zadnjih 100 akcij)</h3></div>
        <div class="adm-table-wrap" id="audit-table">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    try {
        const logs = await getAuditLogs(100);
        const wrap = document.getElementById('audit-table');
        if (!logs.length) { wrap.innerHTML = '<div class="adm-empty">Ni logov.</div>'; return; }
        wrap.innerHTML = `
          <table class="adm-table">
            <thead><tr><th>Čas</th><th>Admin</th><th>Akcija</th><th>Target</th><th>Podrobnosti</th></tr></thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td class="adm-sub">${fmtDate(l.createdAt)}</td>
                  <td class="adm-sub">${escHtml(l.adminName || l.adminUid?.slice(0,8) || '—')}</td>
                  <td><code style="font-size:.8rem">${escHtml(l.action || '')}</code></td>
                  <td class="adm-sub">${escHtml(l.target || '')}</td>
                  <td class="adm-sub" style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${escHtml(JSON.stringify(l.details || {}))}</td>
                </tr>`).join('')}
            </tbody>
          </table>`;
    } catch (e) {
        document.getElementById('audit-table').innerHTML = errBox(e);
    }
}

// ── 12. SETTINGS ──────────────────────────────────────────────────────────────
async function renderSettings() {
    const c = document.getElementById('adm-content');
    c.innerHTML = `
      <div class="adm-card">
        <div class="adm-card-header"><h3>Nastavitve sistema</h3></div>
        <div id="settings-form-wrap">
          <div class="adm-loading"><div class="adm-spinner"></div></div>
        </div>
      </div>`;

    try {
        const s = await getSiteSettings();
        document.getElementById('settings-form-wrap').innerHTML = `
          <form id="settings-form" style="padding:1.5rem">
            <div class="adm-form-grid">

              <div class="adm-form-section">
                <h4>Paketi</h4>
                <div class="adm-form-row">
                  <label>Premium cena (€)</label>
                  <input class="adm-input" name="premiumPrice" type="number" step="0.01" value="${s.packages?.premium?.price || 9.99}">
                </div>
                <div class="adm-form-row">
                  <label>Dealer mesečnina (€)</label>
                  <input class="adm-input" name="dealerPrice" type="number" step="0.01" value="${s.packages?.dealer?.price || 49.99}">
                </div>
                <div class="adm-form-row">
                  <label>Featured cena / dan (€)</label>
                  <input class="adm-input" name="featuredPricePerDay" type="number" step="0.01" value="${s.featuredPricePerDay || 2.99}">
                </div>
              </div>

              <div class="adm-form-section">
                <h4>Oglasi</h4>
                <div class="adm-form-row">
                  <label>Max slik / oglas</label>
                  <input class="adm-input" name="maxImagesPerListing" type="number" value="${s.maxImagesPerListing || 20}">
                </div>
                <div class="adm-form-row">
                  <label>Samodejni potek (dni)</label>
                  <input class="adm-input" name="listingAutoExpireDays" type="number" value="${s.listingAutoExpireDays || 90}">
                </div>
                <div class="adm-form-row adm-form-row--check">
                  <label>Oglasi gostov (brez prijave)</label>
                  <input type="checkbox" name="allowGuestListings" ${s.allowGuestListings ? 'checked' : ''}>
                </div>
              </div>

              <div class="adm-form-section">
                <h4>Sistem</h4>
                <div class="adm-form-row adm-form-row--check">
                  <label>Vzdrževalni način</label>
                  <input type="checkbox" name="maintenanceMode" ${s.maintenanceMode ? 'checked' : ''}>
                </div>
              </div>

            </div>
            <div style="padding-top:1.5rem;border-top:1px solid #e5e7eb;display:flex;gap:.75rem">
              <button type="submit" class="adm-btn adm-btn-primary">💾 Shrani nastavitve</button>
            </div>
          </form>`;

        document.getElementById('settings-form').addEventListener('submit', async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const updates = {
                'packages.premium.price': parseFloat(fd.get('premiumPrice')),
                'packages.dealer.price':  parseFloat(fd.get('dealerPrice')),
                featuredPricePerDay:      parseFloat(fd.get('featuredPricePerDay')),
                maxImagesPerListing:      parseInt(fd.get('maxImagesPerListing')),
                listingAutoExpireDays:    parseInt(fd.get('listingAutoExpireDays')),
                allowGuestListings:       fd.get('allowGuestListings') === 'on',
                maintenanceMode:          fd.get('maintenanceMode') === 'on',
            };
            try {
                await updateSiteSettings(updates);
                await addAuditLog(_adminUser.uid, _adminUser.displayName, 'SETTINGS_UPDATE', 'siteConfig', updates);
                showToast('Nastavitve shranjene.', 'success');
            } catch (err) { showToast('Napaka: ' + err.message, 'error'); }
        });
    } catch (e) {
        document.getElementById('settings-form-wrap').innerHTML = errBox(e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════════════════════

function openModal(title, bodyHtml, onConfirm = null) {
    document.getElementById('adm-modal-overlay')?.remove();
    const el = document.createElement('div');
    el.id = 'adm-modal-overlay';
    el.className = 'adm-modal-overlay';
    el.innerHTML = `
      <div class="adm-modal">
        <div class="adm-modal-header">
          <h3>${escHtml(title)}</h3>
          <button class="adm-modal-close" id="adm-modal-close">✕</button>
        </div>
        <div class="adm-modal-body">${bodyHtml}</div>
        ${onConfirm ? `<div class="adm-modal-footer">
          <button class="adm-btn" id="adm-modal-cancel">Prekliči</button>
          <button class="adm-btn adm-btn-primary" id="adm-modal-confirm">Potrdi</button>
        </div>` : ''}
      </div>`;
    document.body.appendChild(el);

    const close = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el) close(); });
    document.getElementById('adm-modal-close').addEventListener('click', close);
    document.getElementById('adm-modal-cancel')?.addEventListener('click', close);
    if (onConfirm) {
        document.getElementById('adm-modal-confirm').addEventListener('click', () => {
            onConfirm(el);
        });
    }
    return el;
}

function openRejectModal(listingId) {
    const el = openModal('Zavrni oglas', `
      <div class="adm-form-row">
        <label>Razlog zavrnitve</label>
        <textarea id="reject-reason" class="adm-input" rows="3" placeholder="Npr. Napačni podatki, spam, previsoka cena…"></textarea>
      </div>`, async (modalEl) => {
        const reason = document.getElementById('reject-reason').value;
        await adminUpdateListingStatus(listingId, 'rejected', reason);
        await addAuditLog(_adminUser.uid, _adminUser.displayName, 'LISTING_REJECTED', listingId, { reason });
        showToast('Oglas zavrnjen.', 'success');
        modalEl.remove();
        if (_activeSection === 'listings') loadListingsTable();
        if (_activeSection === 'dashboard') renderDashboard();
    });
}

function openFeaturedModal(listingId) {
    openModal('Nastavi sponzoring', `
      <div class="adm-form-row">
        <label>Tip sponzoringa</label>
        <select id="feat-tier" class="adm-select">
          <option value="homepage">Homepage (premium)</option>
          <option value="sponsored">Sponsored (top)</option>
          <option value="free">Odstrani sponzoring</option>
        </select>
      </div>
      <div class="adm-form-row">
        <label>Trajanje (dni)</label>
        <input id="feat-days" type="number" class="adm-input" value="7" min="1" max="365">
      </div>`, async (el) => {
        const tier = document.getElementById('feat-tier').value;
        const days = parseInt(document.getElementById('feat-days').value) || 7;
        await adminSetFeatured(listingId, tier, days);
        await addAuditLog(_adminUser.uid, _adminUser.displayName, 'LISTING_FEATURED', listingId, { tier, days });
        showToast('Sponzoring nastavljen.', 'success');
        el.remove();
    });
}

function openBrandModal(brand) {
    openModal(brand ? 'Uredi znamko' : 'Dodaj znamko', `
      <div class="adm-form-row"><label>Ime znamke</label>
        <input id="brand-name" class="adm-input" value="${escHtml(brand?.name || '')}" placeholder="npr. BMW">
      </div>
      <div class="adm-form-row"><label>Kategorija</label>
        <select id="brand-cat" class="adm-select">
          <option value="avto" ${brand?.category === 'avto' ? 'selected' : ''}>Avto</option>
          <option value="moto" ${brand?.category === 'moto' ? 'selected' : ''}>Moto</option>
          <option value="gospodarska" ${brand?.category === 'gospodarska' ? 'selected' : ''}>Gospodarska</option>
        </select>
      </div>`, async (el) => {
        const name = document.getElementById('brand-name').value.trim();
        const cat  = document.getElementById('brand-cat').value;
        if (!name) { showToast('Ime je obvezno.', 'error'); return; }
        try {
            if (brand) {
                await updateBrand(brand.id, { name, category: cat });
                await addAuditLog(_adminUser.uid, _adminUser.displayName, 'BRAND_UPDATE', brand.id, { name, cat });
            } else {
                const id = await createBrand({ name, category: cat });
                await addAuditLog(_adminUser.uid, _adminUser.displayName, 'BRAND_CREATE', id, { name, cat });
            }
            showToast(brand ? 'Znamka posodobljena.' : 'Znamka dodana.', 'success');
            el.remove();
            loadBrandsTable('');
        } catch (err) { showToast('Napaka: ' + err.message, 'error'); }
    });
}

function openModelModal(model, brands) {
    openModal(model ? 'Uredi model' : 'Dodaj model', `
      <div class="adm-form-row"><label>Znamka</label>
        <select id="model-brand" class="adm-select">
          ${brands.map(b => `<option value="${b.id}" data-name="${escHtml(b.name)}" ${model?.brandId === b.id ? 'selected' : ''}>${escHtml(b.name)}</option>`).join('')}
        </select>
      </div>
      <div class="adm-form-row"><label>Ime modela</label>
        <input id="model-name" class="adm-input" value="${escHtml(model?.name || '')}" placeholder="npr. X5">
      </div>`, async (el) => {
        const brandSel = document.getElementById('model-brand');
        const brandId   = brandSel.value;
        const brandName = brandSel.selectedOptions[0]?.dataset.name || '';
        const name = document.getElementById('model-name').value.trim();
        if (!name || !brandId) { showToast('Vsa polja so obvezna.', 'error'); return; }
        try {
            if (model) {
                await updateModel(model.id, { name, brandId, brandName });
            } else {
                await createModel({ name, brandId, brandName, category: brands.find(b => b.id === brandId)?.category || 'avto' });
            }
            showToast(model ? 'Model posodobljen.' : 'Model dodan.', 'success');
            el.remove();
            const filter = document.getElementById('model-brand-filter')?.value || '';
            loadModelsTable(filter, brands);
        } catch (err) { showToast('Napaka: ' + err.message, 'error'); }
    });
}

function openRoleModal(uid, users) {
    const u = users.find(x => x.id === uid);
    openModal('Nastavi vlogo', `
      <div class="adm-form-row"><label>Vloga za ${escHtml(u?.displayName || u?.email || uid)}</label>
        <select id="role-select" class="adm-select">
          <option value="user"      ${u?.role === 'user'      ? 'selected' : ''}>Uporabnik</option>
          <option value="dealer"    ${u?.role === 'dealer'    ? 'selected' : ''}>Dealer</option>
          <option value="editor"    ${u?.role === 'editor'    ? 'selected' : ''}>Urednik</option>
          <option value="moderator" ${u?.role === 'moderator' ? 'selected' : ''}>Moderator</option>
          <option value="admin"     ${u?.role === 'admin'     ? 'selected' : ''}>Administrator</option>
        </select>
      </div>`, async (el) => {
        const role = document.getElementById('role-select').value;
        try {
            await adminUpdateUserRole(uid, role);
            await addAuditLog(_adminUser.uid, _adminUser.displayName, 'USER_ROLE_CHANGE', uid, { role });
            showToast('Vloga posodobljena.', 'success');
            el.remove();
            renderUsers();
        } catch (err) { showToast('Napaka: ' + err.message, 'error'); }
    });
}

function openSeoModal(page) {
    openModal(page ? 'Uredi SEO stran' : 'Dodaj SEO stran', `
      <div class="adm-form-row"><label>Slug (URL pot)</label>
        <input id="seo-slug" class="adm-input" value="${escHtml(page?.slug || '')}" placeholder="npr. /bmw/x5">
      </div>
      <div class="adm-form-row"><label>Meta naslov</label>
        <input id="seo-title" class="adm-input" value="${escHtml(page?.metaTitle || '')}" placeholder="BMW X5 rabljeni — MojAvto.si">
      </div>
      <div class="adm-form-row"><label>Meta opis</label>
        <textarea id="seo-desc" class="adm-input" rows="3" placeholder="Opisi, ki se prikazujejo v Googlu…">${escHtml(page?.metaDescription || '')}</textarea>
      </div>`, async (el) => {
        const slug  = document.getElementById('seo-slug').value.trim();
        const title = document.getElementById('seo-title').value.trim();
        const desc  = document.getElementById('seo-desc').value.trim();
        if (!slug) { showToast('Slug je obvezen.', 'error'); return; }
        try {
            await upsertSeoPage(slug, { metaTitle: title, metaDescription: desc });
            showToast('SEO stran shranjena.', 'success');
            el.remove();
            loadSeoTable();
        } catch (err) { showToast('Napaka: ' + err.message, 'error'); }
    });
}

function confirmAction(msg, onConfirm) {
    openModal('Potrdite akcijo', `<p style="margin:0">${escHtml(msg)}</p>`, async (el) => {
        el.remove();
        await onConfirm();
    });
}

// ── Global search ──────────────────────────────────────────────────────────────
async function onGlobalSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q || q.length < 2) return;

    try {
        const { docs } = await getAllListings({}, 20);
        const results = docs.filter(l =>
            (l.make || '').toLowerCase().includes(q) ||
            (l.model || '').toLowerCase().includes(q) ||
            (l.authorName || '').toLowerCase().includes(q) ||
            (l.id || '').toLowerCase().includes(q)
        );

        if (!results.length) return;

        openModal('Rezultati iskanja: ' + q, `
          <table class="adm-table">
            <thead><tr><th>Oglas</th><th>Status</th><th>Avtor</th><th>Akcija</th></tr></thead>
            <tbody>
              ${results.map(l => `
                <tr>
                  <td><strong>${escHtml(l.make || '')} ${escHtml(l.model || '')}</strong></td>
                  <td>${statusBadge(l.status)}</td>
                  <td class="adm-sub">${escHtml(l.authorName || '—')}</td>
                  <td>
                    <button class="adm-btn adm-btn-xs adm-btn-green" onclick="document.getElementById('adm-modal-overlay').remove();window.__lstApprove?.('${l.id}')">✓</button>
                    <button class="adm-btn adm-btn-xs adm-btn-red" onclick="document.getElementById('adm-modal-overlay').remove();window.__lstDelete?.('${l.id}')">🗑</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`);
    } catch { /* ignore */ }
}

// ══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function kpi(label, value, icon, color) {
    return `
      <div class="adm-kpi adm-kpi--${color}">
        <div class="adm-kpi-icon">${icon}</div>
        <div class="adm-kpi-value">${value}</div>
        <div class="adm-kpi-label">${label}</div>
      </div>`;
}

function statusBadge(status) {
    const map = {
        active:   ['Aktiven',   'green'],
        pending:  ['V pregledu','yellow'],
        rejected: ['Zavrnjen',  'red'],
        expired:  ['Potekel',   'gray'],
    };
    const [label, color] = map[status] || [status || '—', 'gray'];
    return `<span class="adm-badge adm-badge-${color}">${label}</span>`;
}

function roleBadge(role) {
    const map = {
        admin:     ['Administrator','purple'],
        moderator: ['Moderator',    'blue'],
        editor:    ['Urednik',      'teal'],
        dealer:    ['Dealer',       'orange'],
        user:      ['Uporabnik',    'gray'],
    };
    const [label, color] = map[role] || [role || 'Uporabnik', 'gray'];
    return `<span class="adm-badge adm-badge-${color}">${label}</span>`;
}

function tierBadge(tier) {
    const map = {
        sponsored: ['⭐ Sponsored', 'purple'],
        homepage:  ['🔝 Homepage',  'orange'],
        free:      ['Brezplačni',   'gray'],
    };
    const [label, color] = map[tier] || [tier || '—', 'gray'];
    return `<span class="adm-badge adm-badge-${color}">${label}</span>`;
}

function reasonBadge(reason) {
    const map = {
        scam:     ['🚨 Prevara',         'red'],
        spam:     ['📧 Spam',            'yellow'],
        wrong:    ['❌ Napačni podatki',  'orange'],
        other:    ['❓ Drugo',            'gray'],
    };
    const [label, color] = map[reason] || [escHtml(reason || '—'), 'gray'];
    return `<span class="adm-badge adm-badge-${color}">${label}</span>`;
}

function reportStatusBadge(status) {
    const map = { open: ['Odprto','red'], resolved: ['Rešeno','green'], dismissed: ['Zavrnjeno','gray'] };
    const [label, color] = map[status] || [status || '—', 'gray'];
    return `<span class="adm-badge adm-badge-${color}">${label}</span>`;
}

function fmtPrice(eur) {
    if (!eur && eur !== 0) return '—';
    return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(eur);
}

function fmtMileage(km) {
    if (!km && km !== 0) return '—';
    return new Intl.NumberFormat('sl-SI').format(km) + ' km';
}

function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('sl-SI', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function errBox(e) {
    return `<div class="adm-alert adm-alert-error">Napaka: ${escHtml(e?.message || String(e))}</div>`;
}

function showToast(msg, type = 'success') {
    document.querySelector('.adm-toast')?.remove();
    const el = document.createElement('div');
    el.className = `adm-toast adm-toast--${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('adm-toast--show'), 10);
    setTimeout(() => { el.classList.remove('adm-toast--show'); setTimeout(() => el.remove(), 300); }, 3000);
}

function debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
