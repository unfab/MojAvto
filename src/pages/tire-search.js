// ═══════════════════════════════════════════════════════════════════════════════
// Tire Search Page — MojAvto.si
// Specialized search for tires by dimensions with price comparison
// ═══════════════════════════════════════════════════════════════════════════════

import {
    TIRE_WIDTHS, TIRE_HEIGHTS, TIRE_DIAMETERS, SPEED_RATINGS, TIRE_BRANDS,
    POPULAR_DIMENSIONS, parseDimensionString,
} from '../data/tireDimensions.js';
import { MOCK_TIRES, searchTires } from '../data/tireMockData.js';

const PAGE_SIZE = 12;
let currentPage = 1;
let currentResults = [];
let activeSeason = 'vse';
let activeFilters = {};

export async function initTireSearchPage() {
    console.log('[TireSearch] init');

    // Parse URL for pre-fill
    const hash = window.location.hash;
    const pathDim = hash.split('?')[0].match(/\/nakup\/pnevmatike\/(.+)$/);
    const params = new URLSearchParams(hash.split('?')[1] || '');

    let preW = params.get('w') || '';
    let preH = params.get('h') || '';
    let preD = params.get('d') || '';
    let preSeason = params.get('season') || 'vse';

    if (pathDim) {
        const parsed = parseDimensionString(pathDim[1]);
        if (parsed) { preW = parsed.width; preH = parsed.height; preD = parsed.diameter; }
    }

    activeSeason = preSeason;

    // Populate selects
    populateDimSelects();
    populateFilterBrands();
    populateFilterSpeeds();
    populateEuFilters();

    // Set pre-fill values
    if (preW) document.getElementById('selWidth').value = preW;
    if (preH) document.getElementById('selHeight').value = preH;
    if (preD) document.getElementById('selDiameter').value = `R${preD.replace('R','')}`;

    // Quick dimension pills
    renderQuickDims();

    // Set active season tab
    setSeasonTab(activeSeason);

    // Bind events
    bindEvents();

    // Auto-search if dimension pre-filled
    if (preW && preH && preD) {
        runSearch();
    }

    // Init icons
    if (window.lucide) window.lucide.createIcons();

    // Mobile: show filter button
    checkMobile();
}

// ─────────────────────────────────────────────────────────────────────────────
// Populate selects
// ─────────────────────────────────────────────────────────────────────────────
function populateDimSelects() {
    const inpW = document.getElementById('selWidth');
    const inpH = document.getElementById('selHeight');
    const inpD = document.getElementById('selDiameter');
    if (!inpW || !inpH || !inpD) return;

    const listW = inpW.closest('.pill-dropdown')?.querySelector('.pill-options-scroll');
    const listH = inpH.closest('.pill-dropdown')?.querySelector('.pill-options-scroll');
    const listD = inpD.closest('.pill-dropdown')?.querySelector('.pill-options-scroll');

    if (listW) {
        listW.innerHTML = TIRE_WIDTHS.map(w => `<div class="pill-option" data-value="${w}">${w}</div>`).join('');
    }
    if (listH) {
        listH.innerHTML = TIRE_HEIGHTS.map(h => `<div class="pill-option" data-value="${h}">${h}</div>`).join('');
    }
    if (listD) {
        listD.innerHTML = TIRE_DIAMETERS.map(d => `<div class="pill-option" data-value="${d}">R${d}</div>`).join('');
    }

    // Bind selection for all dim pills
    document.querySelectorAll('.dim-pill .pill-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            const label = opt.textContent;
            const pill = opt.closest('.pill-dropdown');
            const input = pill?.querySelector('.pill-value-input');
            
            pill.querySelectorAll('.pill-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            if (input) {
                input.value = label;
                input.readOnly = true;
            }
            
            e.stopPropagation();
            pill.classList.remove('open');
        });
    });
}

function populateFilterBrands() {
    const container = document.getElementById('brandList');
    if (!container) return;

    // Get unique brands from mock data
    const brands = [...new Set(MOCK_TIRES.map(t => t.brand))].sort();
    container.innerHTML = brands.map(b => `
        <label class="filter-check-item">
            <input type="checkbox" class="brand-cb" value="${b}" /> ${b}
        </label>
    `).join('');
}

function populateFilterSpeeds() {
    const container = document.getElementById('speedList');
    if (!container) return;

    const codes = [...new Set(MOCK_TIRES.map(t => t.speedRating))].sort();
    container.innerHTML = codes.map(c => {
        const sr = SPEED_RATINGS.find(r => r.code === c);
        return `
            <label class="filter-check-item">
                <input type="checkbox" class="speed-cb" value="${c}" />
                ${c}${sr ? ` (do ${sr.maxSpeed} km/h)` : ''}
            </label>
        `;
    }).join('');
}

function populateEuFilters() {
    const ratings = ['A', 'B', 'C', 'D', 'E'];

    const fuelEl = document.getElementById('euFuelFilter');
    const wetEl = document.getElementById('euWetFilter');

    if (fuelEl) {
        fuelEl.innerHTML = ratings.map(r => `
            <button class="eu-pill-filter eu-${r}" data-eu-fuel="${r}" title="Od ${r} naprej">${r}</button>
        `).join('');
    }

    if (wetEl) {
        wetEl.innerHTML = ratings.map(r => `
            <button class="eu-pill-filter eu-${r}" data-eu-wet="${r}" title="Od ${r} naprej">${r}</button>
        `).join('');
    }
}

function renderQuickDims() {
    const container = document.getElementById('quickDims');
    if (!container) return;

    const pills = POPULAR_DIMENSIONS.map(d => `
        <button class="quick-dim-pill" data-w="${d.width}" data-h="${d.height}" data-d="${d.diameter}">
            ${d.label}
        </button>
    `).join('');
    container.insertAdjacentHTML('beforeend', pills);
}

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────
function bindEvents() {
    // Search button
    document.getElementById('btnSearch')?.addEventListener('click', runSearch);

    // Season tabs
    document.getElementById('seasonBar')?.querySelectorAll('.season-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeSeason = tab.dataset.season;
            setSeasonTab(activeSeason);
            runSearch();
        });
    });

    // Quick dimension pills
    document.getElementById('quickDims')?.addEventListener('click', e => {
        const pill = e.target.closest('.quick-dim-pill');
        if (!pill) return;
        document.getElementById('selWidth').value = pill.dataset.w;
        document.getElementById('selHeight').value = pill.dataset.h;
        document.getElementById('selDiameter').value = pill.dataset.d;
        runSearch();
    });

    // Apply filters
    document.getElementById('btnApplyFilters')?.addEventListener('click', () => {
        runSearch();
        closeDrawer();
    });

    // Clear filters
    document.getElementById('btnClearFilters')?.addEventListener('click', () => {
        document.querySelectorAll('.brand-cb, .speed-cb').forEach(cb => { cb.checked = false; });
        document.getElementById('priceFrom').value = '';
        document.getElementById('priceTo').value = '';
        document.getElementById('filterXL').checked = false;
        document.getElementById('filterRunFlat').checked = false;
        document.querySelectorAll('[data-eu-fuel], [data-eu-wet]').forEach(btn => btn.classList.remove('active'));
        activeFilters = {};
        runSearch();
    });

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', () => {
        renderResults(currentResults);
    });

    // Load more
    document.getElementById('btnLoadMore')?.addEventListener('click', () => {
        currentPage++;
        appendResults(currentResults);
    });

    // EU pill toggles
    document.getElementById('euFuelFilter')?.addEventListener('click', e => {
        const btn = e.target.closest('[data-eu-fuel]');
        if (!btn) return;
        document.querySelectorAll('[data-eu-fuel]').forEach(b => b.classList.remove('active'));
        btn.classList.toggle('active');
    });

    document.getElementById('euWetFilter')?.addEventListener('click', e => {
        const btn = e.target.closest('[data-eu-wet]');
        if (!btn) return;
        document.querySelectorAll('[data-eu-wet]').forEach(b => b.classList.remove('active'));
        btn.classList.toggle('active');
    });

    // Mobile drawer
    document.getElementById('filterDrawerBtn')?.addEventListener('click', openDrawer);
    document.getElementById('filterOverlay')?.addEventListener('click', closeDrawer);
    document.getElementById('drawerHandle')?.addEventListener('click', closeDrawer);

    // Enter key on selects
    ['selWidth', 'selHeight', 'selDiameter'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') runSearch();
        });
    });

    // Accordion toggles for filter sections
    document.querySelectorAll('.filter-section-title[data-toggle]').forEach(title => {
        title.addEventListener('click', () => {
            const listId = title.dataset.toggle;
            const list = document.getElementById(listId);
            const icon = title.querySelector('i');
            if (!list) return;

            const isCollapsed = list.style.display === 'none';
            list.style.display = isCollapsed ? 'flex' : 'none';
            if (icon) {
                icon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
                icon.style.transition = 'transform 0.2s ease';
            }
        });
    });

    // --- Vehicle Pills Logic ---
    const vehicleMain = document.getElementById('vehicleMain');
    const vehicleSub = document.getElementById('vehicleSub');
    const subVehicleMenu = document.getElementById('subVehicleMenu');

    // Toggle dropdowns and handle inline search
    document.querySelectorAll('.pill-dropdown').forEach(pill => {
        const input = pill.querySelector('.pill-value-input');
        
        pill.addEventListener('click', (e) => {
            const isOpen = pill.classList.contains('open');
            // Close all
            document.querySelectorAll('.pill-dropdown').forEach(p => p.classList.remove('open'));
            
            if (!isOpen) {
                pill.classList.add('open');
                if (input) {
                    input.readOnly = false;
                    input.dataset.original = input.value;
                    input.value = ''; // Clear for searching
                    input.focus();
                    pill.querySelectorAll('.pill-option').forEach(opt => opt.style.display = 'block');
                }
            }
            e.stopPropagation();
        });

        if (input) {
            input.addEventListener('input', (e) => {
                const val = input.value.toLowerCase();
                const container = pill.querySelector('.pill-dropdown-menu');
                const options = container.querySelectorAll('.pill-option');
                options.forEach(opt => {
                    const text = opt.textContent.toLowerCase();
                    opt.style.display = text.includes(val) ? 'block' : 'none';
                });
                e.stopPropagation();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const firstVisible = pill.querySelector('.pill-option[style*="block"]');
                    if (firstVisible) firstVisible.click();
                }
            });
        }
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.pill-dropdown').forEach(p => {
            p.classList.remove('open');
            const input = p.querySelector('.pill-value-input');
            if (input) {
                input.readOnly = true;
                if (input.value === '') input.value = input.dataset.original || '';
            }
        });
    });

    // Select main category
    vehicleMain?.querySelectorAll('.pill-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            const val = opt.dataset.value;
            const label = opt.textContent;
            const input = vehicleMain.querySelector('.pill-value-input');
            
            // Update active state
            vehicleMain.querySelector('.pill-option.active')?.classList.remove('active');
            opt.classList.add('active');
            if (input) {
                input.value = label;
                input.readOnly = true;
            }

            if (val === 'gospodarska') {
                vehicleSub.style.display = 'flex';
                populateSubVehiclePills();
            } else {
                vehicleSub.style.display = 'none';
            }
            
            e.stopPropagation();
            vehicleMain.classList.remove('open');
            runSearch();
        });
    });

    function populateSubVehiclePills() {
        if (!subVehicleMenu) return;
        const types = [
            { v: 'vse', l: 'Vse vrste' },
            { v: 'dostavna', l: 'Dostavna vozila' },
            { v: 'tovorna', l: 'Tovorna vozila' },
            { v: 'avtobus', l: 'Avtobus' },
            { v: 'prikolice', l: 'Tovorne prikolice' },
            { v: 'gradbena', l: 'Gradbena mehanizacija' },
            { v: 'kmetijska', l: 'Kmetijska mehanizacija' },
            { v: 'vilicarji', l: 'Viličarji' },
            { v: 'komunalna', l: 'Komunalna mehanizacija' },
            { v: 'gozdarska', l: 'Gozdarska mehanizacija' }
        ];
        
        subVehicleMenu.innerHTML = types.map(t => `
            <div class="pill-option ${t.v === 'vse' ? 'active' : ''}" data-value="${t.v}">${t.l}</div>
        `).join('');

        subVehicleMenu.querySelectorAll('.pill-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const label = opt.textContent;
                const input = vehicleSub.querySelector('.pill-value-input');
                if (input) {
                    input.value = label;
                    input.readOnly = true;
                }
                subVehicleMenu.querySelector('.pill-option.active')?.classList.remove('active');
                opt.classList.add('active');
                e.stopPropagation();
                vehicleSub.classList.remove('open');
                runSearch();
            });
        });
    }
}

function setSeasonTab(season) {
    document.querySelectorAll('.season-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.season === season);
    });
}

function openDrawer() {
    const panel = document.getElementById('filterPanel');
    const overlay = document.getElementById('filterOverlay');
    panel?.classList.add('drawer', 'open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    const panel = document.getElementById('filterPanel');
    const overlay = document.getElementById('filterOverlay');
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
}

function checkMobile() {
    const btn = document.getElementById('filterDrawerBtn');
    if (!btn) return;
    const update = () => {
        btn.style.display = window.innerWidth <= 900 ? 'flex' : 'none';
    };
    update();
    window.addEventListener('resize', update);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search logic
// ─────────────────────────────────────────────────────────────────────────────
function collectFilters() {
    let width = document.getElementById('selWidth')?.value;
    let height = document.getElementById('selHeight')?.value;
    let diameter = document.getElementById('selDiameter')?.value;

    // Clean up if it contains 'R' or other text
    if (diameter) diameter = diameter.replace(/[^\d]/g, '');

    const brands = [...document.querySelectorAll('.brand-cb:checked')].map(cb => cb.value);
    const speedRatings = [...document.querySelectorAll('.speed-cb:checked')].map(cb => cb.value);
    const priceFrom = document.getElementById('priceFrom')?.value;
    const priceTo = document.getElementById('priceTo')?.value;
    const reinforced = document.getElementById('filterXL')?.checked || false;
    const runFlat = document.getElementById('filterRunFlat')?.checked || false;

    const activeFuel = document.querySelector('[data-eu-fuel].active')?.dataset.euFuel || null;
    const activeWet = document.querySelector('[data-eu-wet].active')?.dataset.euWet || null;

    return { width, height, diameter, season: activeSeason, brands, speedRatings, priceFrom, priceTo, reinforced, runFlat, fuelFrom: activeFuel, wetGripFrom: activeWet };
}

function runSearch() {
    const filters = collectFilters();
    activeFilters = filters;

    let results = searchTires(filters);

    // Extra client-side filters
    if (filters.reinforced) results = results.filter(t => t.reinforced);
    if (filters.runFlat) results = results.filter(t => t.runFlat);

    currentResults = results;
    currentPage = 1;

    // Update URL
    const params = new URLSearchParams();
    if (filters.width) params.set('w', filters.width);
    if (filters.height) params.set('h', filters.height);
    if (filters.diameter) params.set('d', filters.diameter);
    if (filters.season && filters.season !== 'vse') params.set('season', filters.season);
    const newHash = `#/nakup/pnevmatike${params.toString() ? '?' + params.toString() : ''}`;
    history.replaceState(null, '', newHash);

    renderResults(results);
}

// ─────────────────────────────────────────────────────────────────────────────
// Render results
// ─────────────────────────────────────────────────────────────────────────────
function getSortedResults(results) {
    const sort = document.getElementById('sortSelect')?.value || 'price_asc';
    const sorted = [...results];
    if (sort === 'price_asc') sorted.sort((a, b) => a.lowestPrice - b.lowestPrice);
    else if (sort === 'price_desc') sorted.sort((a, b) => b.lowestPrice - a.lowestPrice);
    else if (sort === 'brand_asc') sorted.sort((a, b) => a.brand.localeCompare(b.brand));
    else if (sort === 'offers_desc') sorted.sort((a, b) => b.offerCount - a.offerCount);
    return sorted;
}

function renderResults(results) {
    const grid = document.getElementById('tireGrid');
    const countEl = document.getElementById('resultsCount');
    const loadMore = document.getElementById('loadMoreWrap');
    if (!grid) return;

    const sorted = getSortedResults(results);
    const page = sorted.slice(0, PAGE_SIZE);

    if (countEl) {
        const f = activeFilters;
        const dimStr = f.width && f.height && f.diameter
            ? ` za <strong>${f.width}/${f.height} R${f.diameter}</strong>`
            : '';
        countEl.innerHTML = results.length > 0
            ? `Najdeno <strong>${results.length}</strong> pnevmatik${dimStr}`
            : `Ni rezultatov${dimStr}`;
    }

    if (results.length === 0) {
        grid.innerHTML = `
            <div class="tire-empty">
                <i data-lucide="search-x" style="display:block;margin:0 auto 1rem;width:48px;height:48px;"></i>
                <h3>Ni rezultatov</h3>
                <p>Poskusite z drugimi dimenzijami ali filtri</p>
            </div>`;
        if (loadMore) loadMore.style.display = 'none';
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    grid.innerHTML = page.map(renderTireCard).join('');

    if (loadMore) {
        loadMore.style.display = sorted.length > PAGE_SIZE ? 'flex' : 'none';
    }

    if (window.lucide) window.lucide.createIcons();
}

function appendResults(results) {
    const grid = document.getElementById('tireGrid');
    const sorted = getSortedResults(results);
    const page = sorted.slice(currentPage * PAGE_SIZE - PAGE_SIZE, currentPage * PAGE_SIZE);

    page.forEach(tire => {
        grid.insertAdjacentHTML('beforeend', renderTireCard(tire));
    });

    const loadMore = document.getElementById('loadMoreWrap');
    if (loadMore) {
        loadMore.style.display = sorted.length > currentPage * PAGE_SIZE ? 'flex' : 'none';
    }

    if (window.lucide) window.lucide.createIcons();
}

function renderTireCard(tire) {
    const seasonLabel = tire.season === 'letna' ? 'Letna' : tire.season === 'zimska' ? 'Zimska' : 'Celoletna';
    const seasonIcon = tire.season === 'letna' ? 'sun' : tire.season === 'zimska' ? 'snowflake' : 'cloud-sun';

    const eu = tire.euLabel;
    const priceFormatted = tire.lowestPrice.toFixed(2).replace('.', ',');

    return `
    <a class="tire-card" href="#/nakup/pnevmatika?id=${tire.id}">
        <div class="tire-card-img-wrap">
            <img class="tire-card-img" src="${tire.imageUrl}" alt="${tire.fullName}" loading="lazy" />
            <div class="tire-card-season-badge ${tire.season}">
                <i data-lucide="${seasonIcon}" style="width:11px;height:11px;"></i>
                ${seasonLabel}
            </div>
            ${tire.reinforced ? '<span class="tire-card-badge-xl">XL</span>' : ''}
        </div>
        <div class="tire-card-body">
            <div class="tire-card-brand">${tire.brand}</div>
            <div class="tire-card-model">${tire.model}</div>
            <div class="tire-card-dim">${tire.width}/${tire.height} R${tire.diameter} ${tire.loadIndex}${tire.speedRating}</div>
            <div class="tire-card-eu">
                <span class="eu-mini">
                    <span class="eu-mini-badge eu-${eu.fuelEfficiency}">${eu.fuelEfficiency}</span>
                    <span class="eu-mini-label">gorivo</span>
                </span>
                <span class="eu-mini">
                    <span class="eu-mini-badge eu-${eu.wetGrip}">${eu.wetGrip}</span>
                    <span class="eu-mini-label">oprijem</span>
                </span>
                <span class="eu-mini" style="color:#64748b;font-size:0.68rem;">
                    <i data-lucide="volume-2" style="width:10px;height:10px;display:inline;margin-right:1px;"></i>
                    ${eu.noiseLevel} dB
                </span>
            </div>
            <div class="tire-card-price-section">
                <div class="tire-card-price-label">Naj cena od:</div>
                <div>
                    <span class="tire-card-price">${priceFormatted} €</span>
                    <span class="tire-card-price-suffix">/ kos</span>
                </div>
                <div class="tire-card-offers">${tire.offerCount} ${tire.offerCount === 1 ? 'ponudba' : 'ponudb'}</div>
            </div>
        </div>
    </a>`;
}
