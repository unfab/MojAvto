// map.js — Business Discovery Map Page — MojAvto.si
// Leaflet integration, filter sidebar, list/map sync

import { store } from '../store/store.js';
import {
    getAllBusinesses,
    filterBusinesses,
    sortBusinesses,
    getDistance,
    getBusinessTypeInfo,
    getTypeLabels
} from '../services/businessService.js';
import { allBrands, serviceLabels } from '../data/businesses.js';

// ── State ────────────────────────────────────────────────────
let leafletMap = null;
let markers = {}; // { bizId: L.Marker }
let userMarker = null;
let filterDebounce = null;
let selectedBrands = [];

// ── Helpers ──────────────────────────────────────────────────
function getStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function getTypeBadgesHtml(business) {
    const typeMap = { dealer: 'Avto hiša', service: 'Servis', vulcanizer: 'Vulkanizer' };
    if (business.businessTypes.length > 1) {
        return `<span class="biz-type-badge multi">⭐ Večnamenski</span>`;
    }
    const t = business.businessTypes[0];
    return `<span class="biz-type-badge ${t}">${typeMap[t] || t}</span>`;
}

// ── Render business list ─────────────────────────────────────
function renderBusinessList(businesses) {
    const container = document.getElementById('mapBusinessList');
    const countEl = document.getElementById('mapListCount');
    if (!container) return;

    if (countEl) countEl.textContent = `${businesses.length} podjetij`;

    if (businesses.length === 0) {
        container.innerHTML = `
            <div class="map-no-results">
                <i data-lucide="search-x" class="mx-auto mb-2"></i>
                <div style="font-weight:700; margin-bottom:0.25rem;">Ni rezultatov</div>
                <div>Poskusite spremeniti filtre ali povečajte radij iskanja.</div>
            </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    container.innerHTML = businesses.map(biz => {
        const typeInfo = getBusinessTypeInfo(biz);
        const dist = biz._distance != null ? `<div class="biz-card-distance"><i data-lucide="navigation"></i>${biz._distance} km</div>` : '';
        const verifiedBadge = biz.verified ? `<div class="biz-badge-icon verified" title="Verificirano"><i data-lucide="badge-check"></i></div>` : '';
        const leasingBadge = biz.offersLeasing ? `<div class="biz-badge-icon leasing" title="Leasing"><i data-lucide="landmark"></i></div>` : '';
        const tyreBadge = biz.offersTyreStorage ? `<div class="biz-badge-icon tyre" title="Hramba gum"><i data-lucide="circle"></i></div>` : '';

        return `
        <div class="biz-card" data-biz-id="${biz.id}" onclick="window._openBizProfile('${biz.id}')">
            <img class="biz-card-logo" src="${biz.logo}" alt="${biz.name}" />
            <div class="biz-card-body">
                <div class="biz-card-name">${biz.name}</div>
                <div class="biz-card-meta">
                    ${getTypeBadgesHtml(biz)}
                    <div class="biz-card-rating">
                        ★ ${biz.rating.toFixed(1)} <span class="count">(${biz.reviewCount})</span>
                    </div>
                </div>
                <div class="biz-card-desc">${biz.description}</div>
                <div class="biz-card-footer">
                    ${dist}
                    <div class="biz-card-badges">
                        ${verifiedBadge}${leasingBadge}${tyreBadge}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Hover sync: list → map
    container.querySelectorAll('.biz-card').forEach(card => {
        const id = card.getAttribute('data-biz-id');
        card.addEventListener('mouseenter', () => highlightMarker(id, true));
        card.addEventListener('mouseleave', () => highlightMarker(id, false));
    });
}

// ── Highlight marker and card ─────────────────────────────────
function highlightMarker(bizId, on) {
    const marker = markers[bizId];
    if (!marker) return;
    const el = marker.getElement();
    if (!el) return;
    el.classList.toggle('highlighted', on);

    const card = document.querySelector(`.biz-card[data-biz-id="${bizId}"]`);
    if (card) card.classList.toggle('highlighted', on);
}

// ── Build marker icon ─────────────────────────────────────────
function createMarkerIcon(business) {
    const typeInfo = getBusinessTypeInfo(business);
    const iconMap = { marker_dealer: '🏢', marker_service: '🔧', marker_vulcanizer: '🛞', marker_multi: '⭐' };
    const icon = business.businessTypes.length > 1 ? '⭐' :
        business.businessTypes[0] === 'dealer' ? '🏢' :
        business.businessTypes[0] === 'service' ? '🔧' : '🛞';

    return window.L.divIcon({
        className: '',
        html: `<div class="custom-marker ${typeInfo.markerClass}">
                   <div class="custom-marker-inner">${icon}</div>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38]
    });
}

// ── Build popup HTML ──────────────────────────────────────────
function buildPopupHtml(biz) {
    const typeInfo = getBusinessTypeInfo(biz);
    const typeLabels = getTypeLabels(biz);
    const typeBadges = typeLabels.map(l => {
        const cls = biz.businessTypes.length > 1 ? 'multi' : biz.businessTypes[0];
        return `<span class="biz-type-badge ${cls}">${l}</span>`;
    }).join('');
    const stars = '★'.repeat(Math.round(biz.rating));

    return `
    <div class="map-popup">
        <div class="map-popup-header">
            <img class="map-popup-logo" src="${biz.logo}" alt="${biz.name}" />
            <div>
                <div class="map-popup-name">${biz.name}</div>
                <div class="map-popup-city">${biz.location.city}</div>
            </div>
        </div>
        <div class="map-popup-types">${typeBadges}</div>
        <div class="map-popup-rating">
            <span class="stars">${stars}</span>
            <span class="num">${biz.rating.toFixed(1)}</span>
            <span class="cnt">(${biz.reviewCount} ocen)</span>
        </div>
        <button class="map-popup-btn" onclick="window._openBizProfile('${biz.id}')">
            Poglej profil →
        </button>
    </div>`;
}

// ── Render map markers ────────────────────────────────────────
function renderMarkers(businesses) {
    if (!leafletMap) return;

    // Remove old markers not in new list
    const newIds = new Set(businesses.map(b => b.id));
    Object.keys(markers).forEach(id => {
        if (!newIds.has(id)) {
            leafletMap.removeLayer(markers[id]);
            delete markers[id];
        }
    });

    // Add/update markers
    businesses.forEach(biz => {
        if (markers[biz.id]) return; // already on map

        const marker = window.L.marker([biz.location.lat, biz.location.lng], {
            icon: createMarkerIcon(biz)
        });

        marker.bindPopup(buildPopupHtml(biz), {
            maxWidth: 260,
            className: 'biz-map-popup'
        });

        // Hover: highlight list card
        marker.on('mouseover', () => {
            const card = document.querySelector(`.biz-card[data-biz-id="${biz.id}"]`);
            if (card) {
                card.classList.add('highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        marker.on('mouseout', () => {
            const card = document.querySelector(`.biz-card[data-biz-id="${biz.id}"]`);
            if (card) card.classList.remove('highlighted');
        });

        marker.addTo(leafletMap);
        markers[biz.id] = marker;
    });
}

// ── Apply filters and re-render ───────────────────────────────
function applyFilters() {
    const businesses = getAllBusinesses();
    const filtered = filterBusinesses(businesses, store.filters, store.userLocation);
    const sortBy = document.getElementById('mapListSort')?.value || 'distance';
    const sorted = sortBusinesses(filtered, sortBy);

    store.setFilteredBusinesses(sorted);
    renderBusinessList(sorted);
    renderMarkers(sorted);
    updateActiveFiltersCount();
}

function scheduleFilterUpdate() {
    clearTimeout(filterDebounce);
    filterDebounce = setTimeout(applyFilters, 180);
}

// ── Active filter count badge ─────────────────────────────────
function updateActiveFiltersCount() {
    const f = store.filters;
    let count = 0;
    if (f.types.length) count++;
    if (f.brands.length) count++;
    if (f.authorized) count++;
    if (f.leasing) count++;
    if (f.tyreStorage) count++;
    if (f.minRating > 0) count++;
    if (f.radius !== 20) count++;

    const badge = document.getElementById('activeFiltersCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
    }
}

// ── Setup filter sidebar interactions ────────────────────────
function setupFilters() {
    // Type pills
    document.querySelectorAll('.type-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const t = pill.getAttribute('data-type');
            pill.classList.toggle('active');
            const active = [...document.querySelectorAll('.type-pill.active')].map(p => p.getAttribute('data-type'));
            store.updateFilters({ types: active });
            scheduleFilterUpdate();
        });
    });

    // Brand dropdown — populate and init customSelect
    const brandSelect = document.getElementById('brandSelect');
    const brandPillsEl = document.getElementById('brandSelectedPills');
    function renderBrandPills() {
        if (!brandPillsEl) return;
        brandPillsEl.innerHTML = selectedBrands.map((b, i) =>
            `<span class="brand-selected-pill">${b}<button type="button" class="brand-pill-remove" data-idx="${i}">&times;</button></span>`
        ).join('');
        brandPillsEl.querySelectorAll('.brand-pill-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedBrands.splice(+btn.dataset.idx, 1);
                renderBrandPills();
                store.updateFilters({ brands: [...selectedBrands] });
                scheduleFilterUpdate();
            });
        });
    }

    if (brandSelect) {
        selectedBrands = [];
        allBrands.forEach(b => {
            const o = document.createElement('option');
            o.value = b; o.textContent = b;
            brandSelect.appendChild(o);
        });

        import('../utils/customSelect.js').then(m => {
            m.createCustomSelect(brandSelect);
        });

        brandSelect.addEventListener('change', () => {
            const val = brandSelect.value;
            if (!val || selectedBrands.includes(val)) { brandSelect.value = ''; return; }
            selectedBrands.push(val);
            brandSelect.value = '';
            // Reset trigger display text
            const trigger = brandSelect.parentElement?.querySelector('.custom-select-value');
            if (trigger) trigger.textContent = 'Izberi znamko...';
            renderBrandPills();
            store.updateFilters({ brands: [...selectedBrands] });
            scheduleFilterUpdate();
        });
    }

    // Authorized toggle
    document.getElementById('filterAuthorized')?.addEventListener('change', function () {
        store.updateFilters({ authorized: this.checked });
        scheduleFilterUpdate();
    });

    // Leasing toggle
    document.getElementById('filterLeasing')?.addEventListener('change', function () {
        store.updateFilters({ leasing: this.checked });
        scheduleFilterUpdate();
    });

    // Tyre toggle
    document.getElementById('filterTyre')?.addEventListener('change', function () {
        store.updateFilters({ tyreStorage: this.checked });
        scheduleFilterUpdate();
    });

    // Rating slider
    const ratingSlider = document.getElementById('ratingSlider');
    const ratingVal = document.getElementById('ratingSliderVal');
    if (ratingSlider) {
        ratingSlider.addEventListener('input', function () {
            if (ratingVal) ratingVal.textContent = this.value;
            store.updateFilters({ minRating: parseFloat(this.value) });
            scheduleFilterUpdate();
        });
    }

    // Distance radios
    document.querySelectorAll('.dist-radio').forEach(radio => {
        radio.addEventListener('change', function () {
            store.updateFilters({ radius: parseInt(this.value) });
            scheduleFilterUpdate();
        });
    });

    // Sort
    document.getElementById('mapListSort')?.addEventListener('change', applyFilters);

    // Reset
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetFilters);

    // Collapse toggle
    document.getElementById('mapFiltersToggle')?.addEventListener('click', function () {
        const el = document.getElementById('mapFilters');
        el?.classList.toggle('collapsed');
    });
}

// ── Reset all filters ─────────────────────────────────────────
function resetFilters() {
    store.updateFilters({ types: ['dealer', 'service', 'vulcanizer'], brands: [], authorized: false, leasing: false, tyreStorage: false, minRating: 0, radius: 20 });

    document.querySelectorAll('.type-pill').forEach(p => p.classList.add('active'));
    // Reset brand dropdown pills
    const brandPillsReset = document.getElementById('brandSelectedPills');
    if (brandPillsReset) brandPillsReset.innerHTML = '';
    const filterAuthorized = document.getElementById('filterAuthorized');
    const filterLeasing = document.getElementById('filterLeasing');
    const filterTyre = document.getElementById('filterTyre');
    if (filterAuthorized) filterAuthorized.checked = false;
    if (filterLeasing) filterLeasing.checked = false;
    if (filterTyre) filterTyre.checked = false;

    const ratingSlider = document.getElementById('ratingSlider');
    const ratingVal = document.getElementById('ratingSliderVal');
    if (ratingSlider) ratingSlider.value = 0;
    if (ratingVal) ratingVal.textContent = '0';

    const dist20 = document.getElementById('dist20');
    if (dist20) dist20.checked = true;

    applyFilters();
}

// ── Geolocate user ────────────────────────────────────────────
function locateUser() {
    const labelEl = document.getElementById('mapLocationLabel');
    if (!navigator.geolocation) {
        if (labelEl) labelEl.textContent = 'Geolokacija ni podprta';
        return;
    }

    if (labelEl) labelEl.textContent = 'Določam lokacijo...';

    navigator.geolocation.getCurrentPosition(
        pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            store.setUserLocation(loc);
            if (labelEl) labelEl.textContent = `Moja lokacija (${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)})`;

            // Add/update user marker
            if (userMarker) leafletMap.removeLayer(userMarker);
            userMarker = window.L.marker([loc.lat, loc.lng], {
                icon: window.L.divIcon({
                    className: '',
                    html: `<div class="user-location-pulse"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(leafletMap).bindPopup('📍 Vaša lokacija');

            leafletMap.flyTo([loc.lat, loc.lng], 12, { animate: true, duration: 1.2 });
            applyFilters();
        },
        err => {
            console.warn('[MapPage] Geolocation error:', err.message);
            if (labelEl) labelEl.textContent = 'Ljubljana (privzeto)';
            // Fallback: Ljubljana center
            store.setUserLocation({ lat: 46.0511, lng: 14.5051 });
            applyFilters();
        },
        { timeout: 8000 }
    );
}

// ── Navigate to business profile ──────────────────────────────
window._openBizProfile = function (id) {
    window.location.hash = `#/poslovni-profil?id=${id}`;
};

// ── Mobile filter drawer ──────────────────────────────────────
function setupMobileDrawer() {
    const mapPage = document.querySelector('.map-page');
    const leftPanel = document.querySelector('.map-left-panel');
    if (!mapPage || !leftPanel) return;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'mapMobileOverlay';
    overlay.className = 'map-mobile-overlay';
    overlay.addEventListener('click', closeMobileDrawer);
    mapPage.appendChild(overlay);

    // FAB button (inside the map right panel so it's above the map)
    const mapRight = document.querySelector('.map-right-panel');
    if (mapRight) {
        const fab = document.createElement('button');
        fab.className = 'map-mobile-fab';
        fab.id = 'mapMobileFab';
        fab.setAttribute('aria-label', 'Odpri filtre');
        fab.innerHTML = '<i data-lucide="sliders-horizontal"></i><span>Filtri</span>';
        fab.addEventListener('click', () => {
            leftPanel.classList.contains('mobile-open') ? closeMobileDrawer() : openMobileDrawer();
        });
        mapRight.appendChild(fab);
    }
}

function openMobileDrawer() {
    document.querySelector('.map-left-panel')?.classList.add('mobile-open');
    document.getElementById('mapMobileOverlay')?.classList.add('visible');
    document.getElementById('mapMobileFab')?.classList.add('active');
}

function closeMobileDrawer() {
    document.querySelector('.map-left-panel')?.classList.remove('mobile-open');
    document.getElementById('mapMobileOverlay')?.classList.remove('visible');
    document.getElementById('mapMobileFab')?.classList.remove('active');
}

// ── Map Page Init ─────────────────────────────────────────────
export function initMapPage() {
    console.log('[MapPage] init');

    // Make sure Leaflet is available
    if (!window.L) {
        console.error('[MapPage] Leaflet not loaded!');
        return;
    }

    // Load all businesses into store
    store.setBusinesses(getAllBusinesses());

    // Init Leaflet map
    leafletMap = window.L.map('businessMap', {
        center: [46.1512, 14.9955], // Slovenia center
        zoom: 8,
        zoomControl: true
    });

    // OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(leafletMap);

    // Setup filter sidebar
    setupFilters();

    // Pre-filter from URL query param (e.g. #/zemljevid?type=service from header links)
    const urlHash = window.location.hash;
    const typeParam = (urlHash.match(/[?&]type=([^&]+)/) || [])[1];
    if (typeParam) {
        const pill = document.querySelector(`.type-pill[data-type="${typeParam}"]`);
        if (pill) pill.classList.add('active');
        store.updateFilters({ types: [typeParam] });
    } else {
        // Default: select all types
        document.querySelectorAll('.type-pill').forEach(p => p.classList.add('active'));
        store.updateFilters({ types: ['dealer', 'service', 'vulcanizer'] });
    }

    // Initial render
    applyFilters();

    // Locate button
    document.getElementById('mapLocateBtn')?.addEventListener('click', locateUser);

    // Setup mobile drawer
    setupMobileDrawer();

    // Init Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Auto-detect location
    setTimeout(locateUser, 500);
}
