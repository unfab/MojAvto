// ═══════════════════════════════════════════════════════════════════════════════
// Parts & Equipment Page — MojAvto.si
// Dual entry: vehicle-first (compatibility) OR category browse
// ═══════════════════════════════════════════════════════════════════════════════

import {
    PARTS_CATEGORIES,
    TOP_BRANDS_ALL,
    CROSS_SELL_MAP,
    HOT_PARTS_BY_MAKE,
    getPartsTopCategories,
    resolvePartsCategory,
    resolvePartsSubcategory,
    getPartsFilters,
    getPartsBrands,
    buildPartsUrl,
} from '../data/partsCategories.js';
import { getListings } from '../services/listingService.js';

// ── Brand/model data (lazy loaded, same source as home search) ────────────────
let brandModelData = null;

async function loadBrandModelData() {
    if (brandModelData) return brandModelData;
    try {
        const res = await fetch('/data/brand-models.json');
        brandModelData = res.ok ? await res.json() : {};
    } catch {
        brandModelData = {};
    }
    return brandModelData;
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
    // Vehicle filter
    vehicle: { make: '', model: '', year: '', engine: '' },
    vehicleActive: false,

    // Category navigation
    activeCatSlug: '',
    activeSubSlug: '',
    activeChildSlug: '',

    // Filters
    brand: '',
    condition: '',   // 'novo' | 'rabljeno' | 'obnovljeno'
    partType: '',    // 'oem' | 'aftermarket' | 'tuning'
    priceFrom: '',
    priceTo: '',
    searchText: '',
    dynamicFilters: {},  // { filterId: value }
    sort: 'newest',

    // Pagination
    page: 1,
    perPage: 20,

    // All loaded listings (parts)
    allListings: [],
    filteredListings: [],
};

// ── Parse URL params ──────────────────────────────────────────────────────────
function parseParams() {
    const hash = window.location.hash.slice(1) || '/';
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return new URLSearchParams();
    return new URLSearchParams(hash.slice(qIdx + 1));
}

// ── Main init ─────────────────────────────────────────────────────────────────
export async function initPartsPage() {
    console.log('[PartsPage] init');

    // Read initial state from URL
    const params = parseParams();
    state.activeCatSlug = params.get('cat') || '';
    state.activeSubSlug = params.get('sub') || '';
    state.activeChildSlug = params.get('child') || '';
    state.vehicle.make = params.get('make') || '';
    state.vehicle.model = params.get('model') || '';
    state.vehicle.year = params.get('year') || '';
    state.vehicle.engine = params.get('engine') || '';
    state.vehicleActive = !!(state.vehicle.make);
    state.brand = params.get('brand') || '';

    // Build UI
    renderSidebar();
    await setupVehiclePanel();
    setupEntryTabs();
    setupSearchSort();
    updateVehicleBadge();

    // If vehicle is pre-set, show results right away
    if (state.vehicleActive || state.activeCatSlug) {
        await loadAndRender();
    } else {
        renderBrowseGrid();
    }

    if (window.lucide) window.lucide.createIcons();
}

// ── Vehicle panel setup ───────────────────────────────────────────────────────
async function setupVehiclePanel() {
    const data = await loadBrandModelData();
    const makeSelect = document.getElementById('parts-make');
    const modelSelect = document.getElementById('parts-model');
    const yearSelect = document.getElementById('parts-year');
    const engineSelect = document.getElementById('parts-engine');

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        if (String(y) === state.vehicle.year) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    // Populate makes
    const makes = Object.keys(data).sort();
    makes.forEach(make => {
        const opt = document.createElement('option');
        opt.value = make; opt.textContent = make;
        if (make === state.vehicle.make) opt.selected = true;
        makeSelect.appendChild(opt);
    });

    if (state.vehicle.make && data[state.vehicle.make]) {
        populateModels(data[state.vehicle.make], modelSelect, state.vehicle.model);
        modelSelect.disabled = false;
    }

    makeSelect.addEventListener('change', () => {
        const make = makeSelect.value;
        modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        engineSelect.innerHTML = '<option value="">Najprej izberi model</option>';
        engineSelect.disabled = true;
        if (make && data[make]) {
            populateModels(data[make], modelSelect, '');
            modelSelect.disabled = false;
        } else {
            modelSelect.disabled = true;
        }
    });

    modelSelect.addEventListener('change', () => {
        engineSelect.innerHTML = '<option value="">Vsi motorji</option>';
        // In a real system, engine variants come from a separate source.
        // For now: just enable the select as a free-text hint
        engineSelect.disabled = false;
    });

    document.getElementById('parts-vehicle-search-btn').addEventListener('click', async () => {
        state.vehicle.make = makeSelect.value;
        state.vehicle.model = modelSelect.value;
        state.vehicle.year = yearSelect.value;
        state.vehicle.engine = engineSelect.value;
        state.vehicleActive = !!state.vehicle.make;
        state.page = 1;

        updateVehicleBadge();
        updateUrl();
        await loadAndRender();
    });

    document.getElementById('parts-vehicle-clear-btn').addEventListener('click', async () => {
        state.vehicle = { make: '', model: '', year: '', engine: '' };
        state.vehicleActive = false;
        makeSelect.value = '';
        modelSelect.innerHTML = '<option value="">Najprej izberi znamko</option>';
        modelSelect.disabled = true;
        engineSelect.innerHTML = '<option value="">Najprej izberi model</option>';
        engineSelect.disabled = true;
        yearSelect.value = '';

        updateVehicleBadge();
        updateUrl();
        if (state.activeCatSlug) {
            await loadAndRender();
        } else {
            renderBrowseGrid();
            hideResults();
        }
    });
}

function populateModels(models, select, selectedModel) {
    select.innerHTML = '<option value="">Vsi modeli</option>';
    (Array.isArray(models) ? models : Object.keys(models)).forEach(model => {
        const opt = document.createElement('option');
        opt.value = model; opt.textContent = model;
        if (model === selectedModel) opt.selected = true;
        select.appendChild(opt);
    });
}

function updateVehicleBadge() {
    const badge = document.getElementById('parts-vehicle-badge');
    const text = document.getElementById('parts-vehicle-badge-text');
    if (state.vehicleActive) {
        const parts = [state.vehicle.make, state.vehicle.model, state.vehicle.year, state.vehicle.engine].filter(Boolean);
        text.textContent = parts.join(' · ');
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

// ── Entry tabs ────────────────────────────────────────────────────────────────
function setupEntryTabs() {
    const tabs = document.querySelectorAll('.parts-entry-tab');
    const vPanel = document.getElementById('parts-vehicle-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'vehicle') {
                vPanel.style.display = '';
            } else {
                vPanel.style.display = 'none';
            }
        });
    });
}

// ── Search + Sort bar ─────────────────────────────────────────────────────────
function setupSearchSort() {
    const input = document.getElementById('parts-search-input');
    const sort = document.getElementById('parts-sort');
    let debounce;

    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(async () => {
            state.searchText = input.value.trim().toLowerCase();
            state.page = 1;
            await applyFiltersAndRender();
        }, 300);
    });

    sort.addEventListener('change', async () => {
        state.sort = sort.value;
        await applyFiltersAndRender();
    });
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function renderSidebar() {
    const sidebar = document.getElementById('parts-sidebar');
    const cats = getPartsTopCategories();

    sidebar.innerHTML = cats.map(cat => `
        <div class="parts-cat-section" data-cat="${cat.slug}">
            <div class="parts-cat-header ${cat.slug === state.activeCatSlug ? 'active open' : ''}"
                 data-cat-slug="${cat.slug}">
                <span class="cat-dot" style="background:${cat.color};"></span>
                <i data-lucide="${cat.icon}" style="width:15px;height:15px;flex-shrink:0;"></i>
                <span>${cat.label}</span>
                <i data-lucide="chevron-down" class="cat-chevron" style="width:14px;height:14px;"></i>
            </div>
            <div class="parts-sub-list ${cat.slug === state.activeCatSlug ? 'open' : ''}">
                ${Object.values(cat.subcategories).map(sub => `
                    <div class="parts-sub-item ${sub.slug === state.activeSubSlug ? 'active' : ''}"
                         data-cat-slug="${cat.slug}" data-sub-slug="${sub.slug}">
                        <i data-lucide="${sub.icon || 'circle'}" style="width:13px;height:13px;flex-shrink:0;"></i>
                        ${sub.label}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Bind events
    sidebar.querySelectorAll('.parts-cat-header').forEach(header => {
        header.addEventListener('click', () => toggleCat(header.dataset.catSlug));
    });
    sidebar.querySelectorAll('.parts-sub-item').forEach(item => {
        item.addEventListener('click', () => selectSub(item.dataset.catSlug, item.dataset.subSlug));
    });

    if (window.lucide) window.lucide.createIcons();
}

function toggleCat(catSlug) {
    const header = document.querySelector(`.parts-cat-header[data-cat-slug="${catSlug}"]`);
    const subList = header?.nextElementSibling;
    const isOpen = subList?.classList.contains('open');

    // Close all
    document.querySelectorAll('.parts-cat-header').forEach(h => h.classList.remove('open'));
    document.querySelectorAll('.parts-sub-list').forEach(l => l.classList.remove('open'));

    if (!isOpen) {
        header?.classList.add('open');
        subList?.classList.add('open');
        selectCat(catSlug);
    } else {
        // Clicking open cat again = deselect
        state.activeCatSlug = '';
        state.activeSubSlug = '';
        updateCatActiveState();
        renderBrowseGrid();
        hideResults();
    }
}

async function selectCat(catSlug) {
    state.activeCatSlug = catSlug;
    state.activeSubSlug = '';
    state.activeChildSlug = '';
    state.brand = '';
    state.dynamicFilters = {};
    state.page = 1;

    updateCatActiveState();
    renderSubcatPills(catSlug);
    hideFilterBar();
    hideBrandRow();
    updateUrl();
    await loadAndRender();
}

async function selectSub(catSlug, subSlug) {
    state.activeCatSlug = catSlug;
    state.activeSubSlug = subSlug;
    state.activeChildSlug = '';
    state.brand = '';
    state.dynamicFilters = {};
    state.page = 1;

    updateCatActiveState();
    renderSubcatPills(catSlug);
    renderFilterBar(catSlug, subSlug);
    renderBrandRow(catSlug, subSlug);
    updateUrl();
    await loadAndRender();
}

function updateCatActiveState() {
    document.querySelectorAll('.parts-cat-header').forEach(h => {
        h.classList.toggle('active', h.dataset.catSlug === state.activeCatSlug && !state.activeSubSlug);
    });
    document.querySelectorAll('.parts-sub-item').forEach(i => {
        i.classList.toggle('active', i.dataset.subSlug === state.activeSubSlug);
    });
}

// ── Subcategory pills ─────────────────────────────────────────────────────────
function renderSubcatPills(catSlug) {
    const container = document.getElementById('parts-subcat-pills');
    const cat = resolvePartsCategory(catSlug);
    if (!cat || !cat.subcategories) { container.style.display = 'none'; return; }

    const subs = Object.values(cat.subcategories);
    container.innerHTML = subs.map(sub => `
        <button class="parts-subcat-pill ${sub.slug === state.activeSubSlug ? 'active' : ''}"
                data-sub-slug="${sub.slug}">
            <i data-lucide="${sub.icon || 'circle'}" style="width:13px;height:13px;"></i>
            ${sub.label}
        </button>
    `).join('');
    container.style.display = 'flex';

    container.querySelectorAll('.parts-subcat-pill').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.dataset.subSlug === state.activeSubSlug) {
                // Deselect sub
                state.activeSubSlug = '';
                state.dynamicFilters = {};
                state.brand = '';
                container.querySelectorAll('.parts-subcat-pill').forEach(b => b.classList.remove('active'));
                hideFilterBar();
                hideBrandRow();
                updateUrl();
                await loadAndRender();
            } else {
                await selectSub(state.activeCatSlug, btn.dataset.subSlug);
            }
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

// ── Dynamic filter bar ────────────────────────────────────────────────────────
function renderFilterBar(catSlug, subSlug) {
    const bar = document.getElementById('parts-filter-bar');
    const filters = getPartsFilters(catSlug, subSlug);

    if (!filters.length) { hideFilterBar(); return; }

    const conditionChips = [
        { value: '', label: 'Vse' },
        { value: 'novo', label: 'Novo' },
        { value: 'rabljeno', label: 'Rabljeno' },
        { value: 'obnovljeno', label: 'Obnovljeno' },
    ];
    const typeChips = [
        { value: '', label: 'Vse' },
        { value: 'oem', label: 'OEM / Orig.' },
        { value: 'aftermarket', label: 'Aftermarket' },
        { value: 'tuning', label: 'Tuning' },
    ];

    bar.innerHTML = `
        <div class="parts-filter-bar-top">
            <span class="parts-filter-label">Stanje</span>
            <div class="parts-chip-row" id="parts-condition-chips">
                ${conditionChips.map(c => `
                    <button class="parts-chip ${c.value === state.condition ? 'active' : ''}"
                            data-val="${c.value}" data-group="condition">${c.label}</button>
                `).join('')}
            </div>
        </div>
        <div class="parts-filter-bar-top">
            <span class="parts-filter-label">Tip dela</span>
            <div class="parts-chip-row" id="parts-type-chips">
                ${typeChips.map(c => `
                    <button class="parts-chip ${c.value === state.partType ? 'active' : ''}"
                            data-val="${c.value}" data-group="partType">${c.label}</button>
                `).join('')}
            </div>
        </div>
        <div class="parts-filter-row" id="parts-dynamic-filters">
            ${filters.map(f => renderDynamicFilter(f)).join('')}
            <div class="parts-filter-group">
                <label>Cena od (€)</label>
                <input type="number" id="pf-price-from" placeholder="0" min="0" value="${state.priceFrom}">
            </div>
            <div class="parts-filter-group">
                <label>Cena do (€)</label>
                <input type="number" id="pf-price-to" placeholder="9999" min="0" value="${state.priceTo}">
            </div>
        </div>
    `;

    bar.style.display = 'block';

    // Bind chip toggles
    bar.querySelectorAll('.parts-chip').forEach(chip => {
        chip.addEventListener('click', async () => {
            const group = chip.dataset.group;
            const val = chip.dataset.val;
            bar.querySelectorAll(`.parts-chip[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            if (group === 'condition') state.condition = val;
            if (group === 'partType') state.partType = val;
            state.page = 1;
            await applyFiltersAndRender();
        });
    });

    // Bind dynamic filter selects
    bar.querySelectorAll('[data-filter-id]').forEach(el => {
        el.addEventListener('change', async () => {
            state.dynamicFilters[el.dataset.filterId] = el.value;
            state.page = 1;
            await applyFiltersAndRender();
        });
    });

    // Price range
    let priceDebounce;
    bar.querySelectorAll('#pf-price-from, #pf-price-to').forEach(el => {
        el.addEventListener('input', () => {
            clearTimeout(priceDebounce);
            priceDebounce = setTimeout(async () => {
                state.priceFrom = document.getElementById('pf-price-from').value;
                state.priceTo = document.getElementById('pf-price-to').value;
                state.page = 1;
                await applyFiltersAndRender();
            }, 400);
        });
    });
}

function renderDynamicFilter(filter) {
    const val = state.dynamicFilters[filter.id] || '';
    if (filter.type === 'select') {
        return `
            <div class="parts-filter-group">
                <label>${filter.label}</label>
                <select data-filter-id="${filter.id}">
                    <option value="">Vse</option>
                    ${filter.options.map(o => `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
            </div>
        `;
    }
    if (filter.type === 'checkbox') {
        return `
            <div class="parts-filter-group" style="justify-content:flex-end;">
                <label>&nbsp;</label>
                <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
                    <input type="checkbox" data-filter-id="${filter.id}" ${val ? 'checked' : ''}
                           style="width:auto;"> ${filter.label}
                </label>
            </div>
        `;
    }
    return '';
}

function hideFilterBar() {
    document.getElementById('parts-filter-bar').style.display = 'none';
}

// ── Brand row ─────────────────────────────────────────────────────────────────
function renderBrandRow(catSlug, subSlug) {
    const row = document.getElementById('parts-brand-row');
    const brands = getPartsBrands(catSlug, subSlug);
    if (!brands.length) { hideBrandRow(); return; }

    row.innerHTML = brands.map(b => `
        <button class="parts-brand-pill ${b === state.brand ? 'active' : ''}" data-brand="${b}">${b}</button>
    `).join('');
    row.style.display = 'flex';

    row.querySelectorAll('.parts-brand-pill').forEach(pill => {
        pill.addEventListener('click', async () => {
            if (pill.dataset.brand === state.brand) {
                state.brand = '';
                row.querySelectorAll('.parts-brand-pill').forEach(p => p.classList.remove('active'));
            } else {
                state.brand = pill.dataset.brand;
                row.querySelectorAll('.parts-brand-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            }
            state.page = 1;
            await applyFiltersAndRender();
        });
    });
}

function hideBrandRow() {
    document.getElementById('parts-brand-row').style.display = 'none';
}

// ── Browse grid (default state, no category selected) ────────────────────────
function renderBrowseGrid() {
    const grid = document.getElementById('parts-browse-grid');
    const cats = getPartsTopCategories();

    grid.innerHTML = cats.map(cat => `
        <div class="parts-browse-card glass-card" data-cat-slug="${cat.slug}">
            <div class="pbc-icon" style="background:${cat.color}22;">
                <i data-lucide="${cat.icon}" style="width:24px;height:24px;color:${cat.color};"></i>
            </div>
            <div class="pbc-label">${cat.label}</div>
            <div class="pbc-count">${Object.keys(cat.subcategories).length} podkategorij</div>
        </div>
    `).join('');

    grid.style.display = 'grid';
    document.getElementById('parts-results-grid').style.display = 'none';
    document.getElementById('parts-empty').style.display = 'none';
    document.getElementById('parts-crosssell').style.display = 'none';
    document.getElementById('parts-pagination').innerHTML = '';
    document.getElementById('parts-results-count').textContent = '';

    grid.querySelectorAll('.parts-browse-card').forEach(card => {
        card.addEventListener('click', () => selectCat(card.dataset.catSlug));
    });

    if (window.lucide) window.lucide.createIcons();
}

function hideResults() {
    document.getElementById('parts-results-grid').style.display = 'none';
    document.getElementById('parts-empty').style.display = 'none';
    document.getElementById('parts-pagination').innerHTML = '';
    document.getElementById('parts-results-count').textContent = '';
}

// ── Load listings from Firebase (parts collection) ────────────────────────────
async function loadAndRender() {
    showLoading();

    try {
        // Fetch parts listings — in the real system these come from a 'parts' Firestore collection.
        // For now we re-use the same listing service and filter by listingType === 'part'.
        // When the parts collection exists, swap getListings() for getPartsListings().
        const all = await getListings();
        // Keep only part-type listings; if none yet, generate mocks for demo
        state.allListings = all.filter(l => l.listingType === 'part');
        if (state.allListings.length === 0) {
            state.allListings = generateMockParts();
        }
    } catch (err) {
        console.error('[PartsPage] fetch error', err);
        state.allListings = generateMockParts();
    }

    await applyFiltersAndRender();
}

// ── Filter + render ───────────────────────────────────────────────────────────
async function applyFiltersAndRender() {
    let results = [...state.allListings];

    // Vehicle compatibility
    if (state.vehicleActive && state.vehicle.make) {
        results = results.filter(l => {
            if (!l.compatibility) return false;
            const compat = l.compatibility;
            if (state.vehicle.make && compat.make !== state.vehicle.make) return false;
            if (state.vehicle.model && compat.model && compat.model !== state.vehicle.model) return false;
            if (state.vehicle.year) {
                const y = parseInt(state.vehicle.year);
                if (compat.yearFrom && y < compat.yearFrom) return false;
                if (compat.yearTo && y > compat.yearTo) return false;
            }
            return true;
        });
    }

    // Category
    if (state.activeCatSlug) {
        results = results.filter(l => l.partCatSlug === state.activeCatSlug);
    }
    if (state.activeSubSlug) {
        results = results.filter(l => l.partSubSlug === state.activeSubSlug);
    }

    // Brand
    if (state.brand) {
        results = results.filter(l => (l.brand || '').toLowerCase() === state.brand.toLowerCase());
    }

    // Condition
    if (state.condition) {
        results = results.filter(l => (l.condition || '').toLowerCase() === state.condition);
    }

    // Part type
    if (state.partType) {
        results = results.filter(l => (l.partType || '').toLowerCase() === state.partType);
    }

    // Price
    if (state.priceFrom) results = results.filter(l => (l.priceEur || 0) >= Number(state.priceFrom));
    if (state.priceTo) results = results.filter(l => (l.priceEur || 0) <= Number(state.priceTo));

    // Text search
    if (state.searchText) {
        const q = state.searchText;
        results = results.filter(l =>
            (l.title || '').toLowerCase().includes(q) ||
            (l.brand || '').toLowerCase().includes(q) ||
            (l.oemNumber || '').toLowerCase().includes(q) ||
            (l.description || '').toLowerCase().includes(q)
        );
    }

    // Sort
    if (state.sort === 'price_asc') results.sort((a, b) => (a.priceEur || 0) - (b.priceEur || 0));
    if (state.sort === 'price_desc') results.sort((a, b) => (b.priceEur || 0) - (a.priceEur || 0));
    if (state.sort === 'compat') {
        // Compatible items first
        results.sort((a, b) => {
            const ac = isCompatible(a) ? 0 : 1;
            const bc = isCompatible(b) ? 0 : 1;
            return ac - bc;
        });
    }

    state.filteredListings = results;
    renderResults();
    renderCrossSell();
    hideLoading();
}

function isCompatible(listing) {
    if (!state.vehicleActive || !listing.compatibility) return false;
    const c = listing.compatibility;
    if (c.make !== state.vehicle.make) return false;
    if (state.vehicle.model && c.model && c.model !== state.vehicle.model) return false;
    return true;
}

// ── Results rendering ─────────────────────────────────────────────────────────
function renderResults() {
    const grid = document.getElementById('parts-results-grid');
    const empty = document.getElementById('parts-empty');
    const count = document.getElementById('parts-results-count');
    const bgrid = document.getElementById('parts-browse-grid');

    bgrid.style.display = 'none';

    const { page, perPage, filteredListings } = state;
    const total = filteredListings.length;
    const start = (page - 1) * perPage;
    const paged = filteredListings.slice(start, start + perPage);

    count.textContent = total === 0 ? '' : `${total} ${total === 1 ? 'oglas' : total < 5 ? 'oglasi' : 'oglasov'}`;

    if (paged.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        renderPagination(total);
        return;
    }

    empty.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = paged.map(l => renderPartCard(l)).join('');
    renderPagination(total);

    grid.querySelectorAll('.parts-card').forEach(card => {
        card.addEventListener('click', () => {
            window.location.hash = `#/del?id=${card.dataset.id}`;
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

function renderPartCard(listing) {
    const compat = isCompatible(listing);
    const condClass = listing.condition === 'Novo' ? 'condition-new'
        : listing.condition === 'Obnovljeno' ? 'condition-refurb'
            : 'condition-used';
    const imgUrl = listing.images?.[0] || '';
    const price = listing.priceEur ? `${listing.priceEur.toLocaleString('sl-SI')} €` : 'Na povpraševanje';

    return `
        <div class="parts-card" data-id="${listing.id}">
            ${imgUrl
            ? `<img class="parts-card-img" src="${imgUrl}" alt="${listing.title}" loading="lazy">`
            : `<div class="parts-card-img-placeholder"><i data-lucide="package" style="width:40px;height:40px;"></i></div>`
        }
            <div class="parts-card-body">
                ${listing.brand ? `<div class="parts-card-brand">${listing.brand}</div>` : ''}
                <div class="parts-card-title">${listing.title || 'Del / oprema'}</div>
                <div class="parts-card-tags">
                    ${compat ? `<span class="parts-card-tag compat"><i data-lucide="check-circle" style="width:10px;height:10px;display:inline;"></i> Paše na tvoje vozilo</span>` : ''}
                    ${listing.condition ? `<span class="parts-card-tag ${condClass}">${listing.condition}</span>` : ''}
                    ${listing.partType ? `<span class="parts-card-tag">${listing.partType}</span>` : ''}
                </div>
                <div class="parts-card-price">${price}${listing.priceNegotiable ? '<span>pogajanje</span>' : ''}</div>
                <div class="parts-card-meta">
                    <span class="parts-card-location">
                        <i data-lucide="map-pin" style="width:11px;height:11px;"></i>
                        ${listing.location?.city || ''}
                    </span>
                    ${listing.oemNumber ? `<span class="parts-card-location">OEM: ${listing.oemNumber}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPagination(total) {
    const pages = Math.ceil(total / state.perPage);
    const pag = document.getElementById('parts-pagination');
    if (pages <= 1) { pag.innerHTML = ''; return; }

    const current = state.page;
    let html = '';

    if (current > 1) html += `<button class="parts-page-btn" data-page="${current - 1}"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i></button>`;

    const window2 = 2;
    for (let p = 1; p <= pages; p++) {
        if (p === 1 || p === pages || Math.abs(p - current) <= window2) {
            html += `<button class="parts-page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
        } else if (Math.abs(p - current) === window2 + 1) {
            html += `<button class="parts-page-btn" disabled>…</button>`;
        }
    }

    if (current < pages) html += `<button class="parts-page-btn" data-page="${current + 1}"><i data-lucide="chevron-right" style="width:14px;height:14px;"></i></button>`;

    pag.innerHTML = html;

    pag.querySelectorAll('.parts-page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', async () => {
            state.page = Number(btn.dataset.page);
            renderResults();
            document.getElementById('parts-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

// ── Cross-sell ────────────────────────────────────────────────────────────────
function renderCrossSell() {
    const section = document.getElementById('parts-crosssell');
    const pills = document.getElementById('parts-crosssell-pills');

    const related = state.activeSubSlug ? (CROSS_SELL_MAP[state.activeSubSlug] || []) : [];
    if (!related.length) { section.style.display = 'none'; return; }

    // Find labels for slugs
    const labels = [];
    related.forEach(slug => {
        for (const cat of Object.values(PARTS_CATEGORIES)) {
            for (const sub of Object.values(cat.subcategories)) {
                if (sub.slug === slug) labels.push({ label: sub.label, catSlug: cat.slug, subSlug: slug });
            }
        }
    });

    if (!labels.length) { section.style.display = 'none'; return; }

    pills.innerHTML = labels.map(({ label, catSlug, subSlug }) => `
        <a class="parts-crosssell-pill" href="${buildPartsUrl(catSlug, subSlug)}">
            <i data-lucide="arrow-right" style="width:12px;height:12px;"></i> ${label}
        </a>
    `).join('');
    section.style.display = 'block';

    if (window.lucide) window.lucide.createIcons();
}

// ── URL sync ──────────────────────────────────────────────────────────────────
function updateUrl() {
    const params = new URLSearchParams();
    if (state.activeCatSlug) params.set('cat', state.activeCatSlug);
    if (state.activeSubSlug) params.set('sub', state.activeSubSlug);
    if (state.activeChildSlug) params.set('child', state.activeChildSlug);
    if (state.vehicle.make) params.set('make', state.vehicle.make);
    if (state.vehicle.model) params.set('model', state.vehicle.model);
    if (state.vehicle.year) params.set('year', state.vehicle.year);
    if (state.vehicle.engine) params.set('engine', state.vehicle.engine);
    if (state.brand) params.set('brand', state.brand);

    const newHash = `/deli?${params.toString()}`;
    // Replace hash without triggering router re-init
    history.replaceState(null, '', `#${newHash}`);
}

// ── Loading helpers ───────────────────────────────────────────────────────────
function showLoading() {
    document.getElementById('parts-loading').style.display = 'flex';
    document.getElementById('parts-results-grid').style.display = 'none';
    document.getElementById('parts-empty').style.display = 'none';
    document.getElementById('parts-browse-grid').style.display = 'none';
}
function hideLoading() {
    document.getElementById('parts-loading').style.display = 'none';
}

// ── Mock data (until parts Firestore collection is populated) ─────────────────
function generateMockParts() {
    const mocks = [
        {
            id: 'mock-1', listingType: 'part', title: 'Akrapovič slip-on Line (Titan) — BMW M3 F80',
            brand: 'Akrapovič', partCatSlug: 'motor-pogon', partSubSlug: 'izpusni-sistem',
            condition: 'Rabljeno', partType: 'Tuning', priceEur: 1490, priceNegotiable: true,
            oemNumber: 'S-BM/T/9H', location: { city: 'Ljubljana' },
            compatibility: { make: 'BMW', model: 'M3', yearFrom: 2014, yearTo: 2018 },
            images: [],
        },
        {
            id: 'mock-2', listingType: 'part', title: 'Brembo GT Big Brake Kit — 380mm 6-bat',
            brand: 'Brembo', partCatSlug: 'podvozje-zavore', partSubSlug: 'zavore',
            condition: 'Novo', partType: 'Aftermarket', priceEur: 2890,
            location: { city: 'Maribor' },
            compatibility: { make: 'BMW', model: 'M3' },
            images: [],
        },
        {
            id: 'mock-3', listingType: 'part', title: 'KW Coilover V3 — BMW 3-series E90',
            brand: 'KW', partCatSlug: 'podvozje-zavore', partSubSlug: 'vzmetenje',
            condition: 'Rabljeno', partType: 'Aftermarket', priceEur: 980,
            location: { city: 'Kranj' },
            compatibility: { make: 'BMW', model: '3 Series', yearFrom: 2005, yearTo: 2012 },
            images: [],
        },
        {
            id: 'mock-4', listingType: 'part', title: 'Remus Exhaust Audi S3 8V — Sport sound',
            brand: 'Remus', partCatSlug: 'motor-pogon', partSubSlug: 'izpusni-sistem',
            condition: 'Novo', partType: 'Tuning', priceEur: 870,
            location: { city: 'Celje' },
            compatibility: { make: 'Audi', model: 'S3', yearFrom: 2013, yearTo: 2020 },
            images: [],
        },
        {
            id: 'mock-5', listingType: 'part', title: 'K&N Cold Air Intake VW Golf GTI Mk7',
            brand: 'K&N', partCatSlug: 'motor-pogon', partSubSlug: 'sesalni-sistem',
            condition: 'Novo', partType: 'Tuning', priceEur: 280,
            location: { city: 'Koper' },
            compatibility: { make: 'Volkswagen', model: 'Golf', yearFrom: 2012, yearTo: 2020 },
            images: [],
        },
        {
            id: 'mock-6', listingType: 'part', title: 'Recaro Sportster CS Alcantara — sedež',
            brand: 'Recaro', partCatSlug: 'notranjost', partSubSlug: 'sedeji',
            condition: 'Rabljeno', partType: 'Aftermarket', priceEur: 650, priceNegotiable: true,
            location: { city: 'Ljubljana' },
            compatibility: null,
            images: [],
        },
        {
            id: 'mock-7', listingType: 'part', title: 'BBS CH-R 18" 5x112 — komplet 4 platišč',
            brand: 'BBS', partCatSlug: 'platisca-pnevmatike', partSubSlug: 'platisca',
            condition: 'Rabljeno', partType: 'Aftermarket', priceEur: 1200,
            location: { city: 'Novo Mesto' },
            compatibility: null,
            images: [],
        },
        {
            id: 'mock-8', listingType: 'part', title: 'Öhlins Road & Track Coilover — Porsche 911 991',
            brand: 'Öhlins', partCatSlug: 'podvozje-zavore', partSubSlug: 'vzmetenje',
            condition: 'Rabljeno', partType: 'Aftermarket', priceEur: 2200,
            location: { city: 'Ljubljana' },
            compatibility: { make: 'Porsche', model: '911' },
            images: [],
        },
        {
            id: 'mock-9', listingType: 'part', title: 'Bosch Originalni senzorji Lambda VW 2.0 TDI',
            brand: 'Bosch', partCatSlug: 'elektronika', partSubSlug: 'senzorji',
            condition: 'Novo', partType: 'OEM', priceEur: 85,
            location: { city: 'Maribor' },
            compatibility: { make: 'Volkswagen' },
            images: [],
        },
        {
            id: 'mock-10', listingType: 'part', title: 'EBC Yellowstuff ploščice — BMW M2 F87 spredaj',
            brand: 'EBC Brakes', partCatSlug: 'podvozje-zavore', partSubSlug: 'zavore',
            condition: 'Novo', partType: 'Aftermarket', priceEur: 210,
            location: { city: 'Ljubljana' },
            compatibility: { make: 'BMW', model: 'M2' },
            images: [],
        },
        {
            id: 'mock-11', listingType: 'part', title: 'Michelin Pilot Sport 4S 245/35 R19 — komplet 4',
            brand: 'Michelin', partCatSlug: 'platisca-pnevmatike', partSubSlug: 'pnevmatike',
            condition: 'Rabljeno', partType: 'OEM', priceEur: 560,
            location: { city: 'Kranj' },
            compatibility: null,
            images: [],
        },
        {
            id: 'mock-12', listingType: 'part', title: 'Thule WingBar Edge strešni nosilci — VW Passat B8',
            brand: 'Thule', partCatSlug: 'oprema-dodatki', partSubSlug: 'stresni-sistemi',
            condition: 'Rabljeno', partType: 'Aftermarket', priceEur: 190,
            location: { city: 'Velenje' },
            compatibility: { make: 'Volkswagen', model: 'Passat' },
            images: [],
        },
    ];
    return mocks;
}
