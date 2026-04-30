// Advanced Search page — MojAvto.si
// Category-aware: reads ?cat=, ?sub=, ?searchType=, ?vtype=, ?najem= from URL
import { getListings } from '../services/listingService.js';
import { resolveCategory, SEARCH_TYPE_OPTIONS } from '../data/categories.js';

export function initAdvancedSearchPage() {
    console.log('[AdvancedSearchPage] init');

    // Parse category params from current hash
    const params = parseHashParams();
    const catContext = {
        cat: params.get('cat') || '',
        sub: params.get('sub') || '',
        searchType: params.get('searchType') || '',
        vtype: params.get('vtype') || '',
        najem: params.get('najem') || '',
    };

    applyCategoryContext(catContext);
    bindAccordions();
    bindSearchLogic(catContext);
    if (window.lucide) window.lucide.createIcons();
}

// ═══════════════════════════════════════════════════════════════════════════════
// Parse query params from hash URL
// ═══════════════════════════════════════════════════════════════════════════════
function parseHashParams() {
    const hash = window.location.hash.slice(1) || '/';
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return new URLSearchParams();
    return new URLSearchParams(hash.slice(qIndex + 1));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Apply category context to the page UI
// ═══════════════════════════════════════════════════════════════════════════════
function applyCategoryContext(ctx) {
    const tabs = document.getElementById('vehicleTypeTabs');
    const searchTypePills = document.getElementById('searchTypePills');

    // Set hidden fields
    document.getElementById('hiddenCat').value = ctx.cat;
    document.getElementById('hiddenSub').value = ctx.sub;
    document.getElementById('hiddenSearchType').value = ctx.searchType;
    document.getElementById('hiddenVType').value = ctx.vtype;
    document.getElementById('hiddenNajem').value = ctx.najem;

    const resolved = ctx.cat ? resolveCategory(ctx.cat, ctx.sub) : null;

    // Title is now removed in Phase 3 cleanup


    // ── Tab selection ──
    // Map category slugs to tab data-tab values
    const tabMap = { 'avto': 'avto', 'moto': 'moto', 'gospodarska': 'gospodarska', 'prosti-cas': 'prosti-cas' };
    const tabBtns = tabs.querySelectorAll('.tab-btn');

    if (ctx.cat && tabMap[ctx.cat]) {
        // Auto-select the right tab
        tabBtns.forEach(btn => {
            const isTarget = btn.dataset.tab === tabMap[ctx.cat];
            btn.classList.toggle('active', isTarget);
        });
        // Show correct grid
        showGridForTab(tabMap[ctx.cat]);
    }

    // ── Search type pills (for gospodarska or explicit searchType) ──
    if (ctx.searchType && (ctx.cat === 'gospodarska' || ctx.searchType === 'deli' || ctx.searchType === 'pnevmatike')) {
        searchTypePills.style.display = 'flex';
        searchTypePills.innerHTML = SEARCH_TYPE_OPTIONS.map(opt => {
            const isActive = ctx.searchType === opt.value;
            const url = `#/iskanje?cat=${ctx.cat || ''}&sub=${ctx.sub || ''}&searchType=${opt.value}`;
            return `<a href="${url}" class="search-type-pill ${isActive ? 'active' : ''}">
                <i data-lucide="${opt.icon}" style="width:16px;height:16px;"></i> ${opt.label}
            </a>`;
        }).join('');
    }

    // ── Pre-select vehicle type if specified ──
    if (ctx.vtype) {
        setTimeout(() => {
            const card = document.querySelector(`.body-type-card[data-value="${ctx.vtype}"]`);
            if (card) {
                card.classList.add('active');
                const bodyTypeHidden = document.getElementById('bodyTypeHidden');
                if (bodyTypeHidden) bodyTypeHidden.value = ctx.vtype;
            }
        }, 50);
    }

    // ── Restore remembered search state ──
    const rememberToggle = document.getElementById('rememberSearchToggle');
    const storageKey = `search_remember_${ctx.cat || 'all'}_${ctx.sub || 'all'}`;
    if (rememberToggle) {
        const wasRemembered = localStorage.getItem(storageKey) === 'true';
        rememberToggle.checked = wasRemembered;
        rememberToggle.addEventListener('change', () => {
            localStorage.setItem(storageKey, rememberToggle.checked);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Show the correct body-type grid for a tab
// ═══════════════════════════════════════════════════════════════════════════════
function showGridForTab(tabKey) {
    const gridMap = {
        'avto': 'grid-cars',
        'moto': 'grid-motorbikes',
        'gospodarska': 'grid-commercial',
        'prosti-cas': 'grid-leisure',
    };
    Object.values(gridMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const targetId = gridMap[tabKey];
    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.style.display = 'grid';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Accordions
// ═══════════════════════════════════════════════════════════════════════════════
function bindAccordions() {
    const triggers = document.querySelectorAll('.adv-acc-trigger');
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const body = trigger.closest('.adv-accordion').querySelector('.adv-acc-body');
            const isOpen = trigger.getAttribute('aria-expanded') === 'true';
            if (!isOpen) {
                triggers.forEach(o => {
                    const acc = o.closest('.adv-accordion');
                    if (o !== trigger && !acc.classList.contains('persistent-open')) {
                        o.setAttribute('aria-expanded', 'false');
                        const b = acc.querySelector('.adv-acc-body');
                        if (b) b.style.display = 'none';
                    }
                });
            }
            const ns = !isOpen;
            trigger.setAttribute('aria-expanded', String(ns));
            if (body) body.style.display = ns ? 'flex' : 'none';
        });
    });
    document.querySelectorAll('.remember-check').forEach(chk => {
        const cat = chk.getAttribute('data-category');
        if (localStorage.getItem(`remember_${cat}`) === 'true') chk.checked = true;
        chk.addEventListener('change', () => localStorage.setItem(`remember_${cat}`, chk.checked));
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main search logic
// ═══════════════════════════════════════════════════════════════════════════════
function bindSearchLogic(catContext) {
    const searchForm = document.getElementById("advancedSearchForm");
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const variantSelect = document.getElementById("variant");
    const addVehicleBtn = document.getElementById("addVehicleBtn");
    const vehicleCardsEl = document.getElementById("vehicleCards");
    const excludeSelect = document.getElementById("excludeMake");
    const excludeModelSelect = document.getElementById("excludeModel");
    const excludeVariantSelect = document.getElementById("excludeVariant");
    const addExcludeBtn = document.getElementById("addExcludeBtn");
    const toggleExcludeBtn = document.getElementById("toggleExcludeBtn");
    const excludeSection = document.getElementById("excludeSection");
    const excludeChipsEl = document.getElementById("excludeChips");

    const tabBtns = document.querySelectorAll('.glass-tabs .tab-btn');
    const bodyTypeHidden = document.getElementById('bodyTypeHidden');
    const allBodyTypeCards = document.querySelectorAll('.body-type-card');
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");

    if (!searchForm || !makeSelect) return;

    // Track which tab/category is currently active
    let activeTab = catContext.cat || 'avto';

    // --- Tabs ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Clear body type selections
            allBodyTypeCards.forEach(c => c.classList.remove('active'));
            bodyTypeHidden.value = '';

            activeTab = btn.dataset.tab;
            showGridForTab(activeTab);
            toggleVehicleSpecificFields(activeTab);
            updateLiveCount();
        });
    });

    // --- Dynamic Field Visibility ---
    function toggleVehicleSpecificFields(tab) {
        const carFields = document.querySelectorAll('.car-only-field');
        const motoFields = document.querySelectorAll('.moto-only-field');
        const accInterior = document.getElementById('acc-interior');

        if (tab === 'moto') {
            carFields.forEach(el => el.style.display = 'none');
            motoFields.forEach(el => {
                // If it was a grid, restore grid. Else block/flex.
                if (el.id === 'moto-equipment') el.style.display = 'block';
                else if (el.classList.contains('adv-grid-2')) el.style.display = 'grid';
                else el.style.display = 'block';
            });
            if (accInterior) accInterior.style.display = 'none';
        } else {
            carFields.forEach(el => {
                if (el.classList.contains('adv-accordion')) el.style.display = 'block';
                else if (el.classList.contains('adv-grid-2')) el.style.display = 'grid';
                else el.style.display = 'block';
            });
            motoFields.forEach(el => el.style.display = 'none');
            if (accInterior) accInterior.style.display = 'block';
        }
    }
    // Call once on init for current tab
    toggleVehicleSpecificFields(activeTab);

    // --- 6-axis IMU Special Logic ---
    const imuTrigger = document.getElementById('imu-trigger-checkbox');
    const imuSubs = document.querySelectorAll('.imu-sub');
    if (imuTrigger) {
        imuTrigger.addEventListener('change', () => {
            if (imuTrigger.checked) {
                imuSubs.forEach(sub => sub.checked = true);
                updateLiveCount();
            }
        });
    }

    // --- Cylinder Layout Logic ---
    const cylindersSelect = document.getElementById('moto-cylinders');
    const layoutGroup = document.getElementById('cylinder-layout-group');
    const layoutSelect = document.getElementById('moto-cylinder-layout');

    if (cylindersSelect) {
        cylindersSelect.addEventListener('change', () => {
            const val = cylindersSelect.value;
            if (val === '2') {
                layoutGroup.style.display = 'block';
                layoutSelect.innerHTML = `
                    <option value="">Vsi (I2, V2, Boxer...)</option>
                    <option value="I2">I2 (vrstni)</option>
                    <option value="V2">V2 (V-postavitev)</option>
                    <option value="Boxer">Boxer</option>
                `;
            } else if (val === '4') {
                layoutGroup.style.display = 'block';
                layoutSelect.innerHTML = `
                    <option value="">Vsi (I4, V4...)</option>
                    <option value="I4">I4 (vrstni)</option>
                    <option value="V4">V4 (V-postavitev)</option>
                `;
            } else {
                layoutGroup.style.display = 'none';
                layoutSelect.innerHTML = '';
            }
            updateLiveCount();
        });
    }
    window.showIMUTip = () => {
        alert("6 axis IMU (Inertial Measurement Unit) upravlja napredne varnostne sisteme: \n- Cornering ABS (zavijanje v ovinkih)\n- Traction Control (nadzor oprijema)\n- Anti-Wheelie (nadzor dviga prednjega kolesa)\n\nZ izbiro te možnosti boste avtomatsko vključili vse naštete sisteme.");
    };

    // --- Body Type ---
    allBodyTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('active');
            const activeValues = Array.from(allBodyTypeCards)
                .filter(btn => btn.classList.contains('active'))
                .map(btn => btn.getAttribute('data-value'));
            bodyTypeHidden.value = activeValues.join(',');
            updateLiveCount();
        });
    });

    // --- Years ---
    const curYear = new Date().getFullYear();
    for (let y = curYear; y >= 1980; y--) {
        const o1 = document.createElement("option"); o1.value = y; o1.textContent = y; yearFromSelect.appendChild(o1);
        const o2 = document.createElement("option"); o2.value = y; o2.textContent = y; yearToSelect.appendChild(o2);
    }

    // ═══════════════════════════════════════════════════════════════════
    // VEHICLE ENTRIES (up to 3)
    // ═══════════════════════════════════════════════════════════════════
    const MAX_VEHICLES = 3;
    let vehicles = [];
    let excludedVehicles = [];

    function renderVehicleCards() {
        vehicleCardsEl.innerHTML = vehicles.map((v, i) => {
            const parts = [v.make];
            if (v.model) parts.push(v.model);
            if (v.variant) parts.push(v.variant);
            return `<div class="vehicle-entry-card">
                <div class="vec-info">${parts.map(p => `<span>${p}</span>`).join('<span class="vec-sep">›</span>')}</div>
                <button type="button" class="vec-remove" data-idx="${i}">&times;</button>
            </div>`;
        }).join('');
        vehicleCardsEl.querySelectorAll('.vec-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                vehicles.splice(+btn.dataset.idx, 1);
                renderVehicleCards();
                updateLiveCount();
            });
        });
        const atLimit = vehicles.length >= MAX_VEHICLES;
        selectorRow.style.display = atLimit ? 'none' : '';
        addVehicleBtn.style.display = atLimit ? 'none' : '';
        brandLimitNote.textContent = atLimit ? 'Dosežena omejitev 3 vozil.' : vehicles.length > 0 ? `Dodano: ${vehicles.length}/${MAX_VEHICLES}` : '';
    }

    function renderExcludeChips() {
        excludeChipsEl.innerHTML = excludedVehicles.map((v, i) => {
            const parts = [v.make];
            if (v.model) parts.push(v.model);
            if (v.variant) parts.push(v.variant);
            return `<div class="vehicle-entry-card" style="background:linear-gradient(135deg, #ef4444, #dc2626) !important; box-shadow:0 6px 15px rgba(239, 68, 68, 0.25);">
                <div class="vec-info">${parts.map(p => `<span>${p}</span>`).join('<span class="vec-sep">›</span>')}</div>
                <button type="button" class="vec-remove" data-idx="${i}">&times;</button>
            </div>`;
        }).join('');
        excludeChipsEl.querySelectorAll('.vec-remove').forEach(btn => {
            btn.addEventListener('click', () => { excludedVehicles.splice(+btn.dataset.idx, 1); renderExcludeChips(); updateLiveCount(); });
        });
    }

    // --- Hybrid toggle ---
    const hybridCheck = document.getElementById('fuelHybridCheck');
    const hybridSub = document.getElementById('hybridSubOptions');
    if (hybridCheck && hybridSub) {
        hybridCheck.addEventListener('change', () => {
            hybridSub.classList.toggle('visible', hybridCheck.checked);
            if (!hybridCheck.checked) hybridSub.querySelectorAll('input').forEach(c => c.checked = false);
        });
    }

    // --- Add Vehicle Button ---
    addVehicleBtn.addEventListener('click', () => {
        const make = makeSelect.value;
        if (!make) return;
        if (vehicles.length >= MAX_VEHICLES) return;
        const model = modelSelect.value || '';
        const variant = variantSelect.value || '';
        vehicles.push({ make, model, variant });
        makeSelect.value = '';
        modelSelect.innerHTML = '<option value="">Model</option>'; modelSelect.disabled = true;
        variantSelect.innerHTML = '<option value="">Različica</option>'; variantSelect.disabled = true;
        renderVehicleCards();
        updateLiveCount();
    });

    // --- Load Brand Data ---
    fetch("/json/brands_models_global.json")
        .then(r => r.json())
        .then(data => {
            window._brandModelData = data;
            const sorted = Object.keys(data).sort();
            sorted.forEach(brand => {
                const o1 = document.createElement("option"); o1.value = brand; o1.textContent = brand; makeSelect.appendChild(o1);
                if (excludeSelect) { const o2 = document.createElement("option"); o2.value = brand; o2.textContent = brand; excludeSelect.appendChild(o2); }
            });

            import('../utils/customSelect.js').then(m => {
                m.createCustomSelect(makeSelect);
                m.createCustomSelect(modelSelect);
                if (variantSelect) m.createCustomSelect(variantSelect);
                m.createCustomSelect(yearFromSelect);
                m.createCustomSelect(yearToSelect);
                if (excludeSelect) m.createCustomSelect(excludeSelect);
                if (excludeModelSelect) m.createCustomSelect(excludeModelSelect);
                if (excludeVariantSelect) m.createCustomSelect(excludeVariantSelect);
            });

            // Make → populate models
            makeSelect.addEventListener("change", () => {
                const val = makeSelect.value;
                modelSelect.innerHTML = '<option value="">Model</option>';
                variantSelect.innerHTML = '<option value="">Različica</option>';
                modelSelect.disabled = true; variantSelect.disabled = true;
                if (val && data[val]) {
                    const models = data[val];
                    const keys = typeof models === 'object' && !Array.isArray(models) ? Object.keys(models).sort() : (Array.isArray(models) ? models.sort() : []);
                    keys.forEach(m => { const o = document.createElement("option"); o.value = m; o.textContent = m; modelSelect.appendChild(o); });
                    if (keys.length) modelSelect.disabled = false;
                }
            });

            // Model → populate variants
            modelSelect.addEventListener("change", () => {
                const mk = makeSelect.value, md = modelSelect.value;
                variantSelect.innerHTML = '<option value="">Različica</option>';
                variantSelect.disabled = true;
                if (mk && md && data[mk] && data[mk][md] && Array.isArray(data[mk][md])) {
                    data[mk][md].forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; variantSelect.appendChild(o); });
                    if (data[mk][md].length) variantSelect.disabled = false;
                }
            });

            // Exclude flow
            if (excludeSelect) {
                excludeSelect.addEventListener("change", () => {
                    const mk = excludeSelect.value;
                    excludeModelSelect.innerHTML = '<option value="">Model</option>';
                    excludeVariantSelect.innerHTML = '<option value="">Različica</option>';
                    excludeModelSelect.disabled = true; excludeVariantSelect.disabled = true;
                    if (mk && data[mk]) {
                        const models = data[mk];
                        const keys = typeof models === 'object' && !Array.isArray(models) ? Object.keys(models).sort() : (Array.isArray(models) ? models.sort() : []);
                        keys.forEach(m => { const o = document.createElement("option"); o.value = m; o.textContent = m; excludeModelSelect.appendChild(o); });
                        if (keys.length) excludeModelSelect.disabled = false;
                    }
                });
                excludeModelSelect.addEventListener("change", () => {
                    const mk = excludeSelect.value, md = excludeModelSelect.value;
                    excludeVariantSelect.innerHTML = '<option value="">Različica</option>';
                    excludeVariantSelect.disabled = true;
                    if (mk && md && data[mk] && data[mk][md] && Array.isArray(data[mk][md])) {
                        data[mk][md].forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; excludeVariantSelect.appendChild(o); });
                        if (data[mk][md].length) excludeVariantSelect.disabled = false;
                    }
                });

                addExcludeBtn.addEventListener('click', () => {
                    const make = excludeSelect.value;
                    if (!make) return;
                    const model = excludeModelSelect.value || '';
                    const variant = excludeVariantSelect.value || '';
                    excludedVehicles.push({ make, model, variant });
                    excludeSelect.value = '';
                    excludeModelSelect.innerHTML = '<option value="">Model</option>'; excludeModelSelect.disabled = true;
                    excludeVariantSelect.innerHTML = '<option value="">Različica</option>'; excludeVariantSelect.disabled = true;
                    renderExcludeChips();
                    updateLiveCount();
                });
            }

            // Toggle exclude section
            if (toggleExcludeBtn && excludeSection) {
                toggleExcludeBtn.addEventListener('click', () => {
                    const isHidden = excludeSection.style.display === 'none';
                    excludeSection.style.display = isHidden ? 'flex' : 'none';
                    toggleExcludeBtn.style.display = isHidden ? 'none' : 'flex';
                    if (isHidden && window.lucide) window.lucide.createIcons({ scope: excludeSection });
                });
            }
        }).catch(err => console.warn("Could not load brands_models_global.json.", err));

    // ═══════════════════════════════════════════════════════════════════
    // Live Count
    // ═══════════════════════════════════════════════════════════════════
    async function updateLiveCount() {
        try {
            const fd = new FormData(searchForm);
            const selectedBodyTypes = bodyTypeHidden.value ? bodyTypeHidden.value.split(',') : [];
            const conditions = fd.getAll('condition');
            const damaged = fd.get('damaged');
            const fuels = fd.getAll('fuel');
            const gears = fd.getAll('transmission');
            const drivetrain = fd.getAll('drivetrain');
            const stroke = fd.get('stroke');
            const cylinders = fd.get('cylinders');
            const cylinderLayout = fd.get('cylinderLayout');
            const features = fd.getAll('features');

            const filters = {
                vehicles,
                excludes: excludedVehicles,
                bodyTypes: selectedBodyTypes,
                conditions,
                damaged,
                fuels,
                gears,
                drivetrain,
                stroke,
                cylinders,
                cylinderLayout,
                features,
                priceFrom: Number(fd.get('priceFrom')) || 0,
                priceTo: Number(fd.get('priceTo')) || Infinity,
                includeCallForPrice: fd.get('includeCallForPrice') === '1',
                yearFrom: Number(fd.get('yearFrom')) || 0,
                yearTo: Number(fd.get('yearTo')) || Infinity,
                mileageTo: Number(fd.get('mileageTo')) || Infinity,
                // Category context
                cat: catContext.cat,
                sub: catContext.sub,
                searchType: catContext.searchType,
                vtype: catContext.vtype,
                najem: catContext.najem,
                activeTab,
            };

            let all = await getListings();
            const count = all.filter(l => matchesFilters(l, filters)).length;

            const btn = document.getElementById("searchBtnText");
            if (btn) btn.textContent = `Prikaži (${count}) oglasov`;
        } catch (e) { console.warn("Live count error:", e); }
    }

    searchForm.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', updateLiveCount);
        el.addEventListener('input', updateLiveCount);
    });
    setTimeout(updateLiveCount, 100);

    searchForm.addEventListener('reset', () => {
        setTimeout(() => {
            vehicles = []; excludedVehicles = [];
            renderVehicleCards(); renderExcludeChips();
            makeSelect.value = '';
            modelSelect.innerHTML = '<option value="">Model</option>'; modelSelect.disabled = true;
            variantSelect.innerHTML = '<option value="">Različica</option>'; variantSelect.disabled = true;
            excludeSelect.value = '';
            excludeModelSelect.innerHTML = '<option value="">Model</option>'; excludeModelSelect.disabled = true;
            excludeVariantSelect.innerHTML = '<option value="">Različica</option>'; excludeVariantSelect.disabled = true;
            if (excludeSection) excludeSection.style.display = 'none';
            if (toggleExcludeBtn) toggleExcludeBtn.style.display = 'flex';
            allBodyTypeCards.forEach(c => c.classList.remove('active'));
            bodyTypeHidden.value = '';
            if (hybridSub) { hybridSub.classList.remove('visible'); hybridSub.querySelectorAll('input').forEach(c => c.checked = false); }
            updateLiveCount();
        }, 0);
    });

    searchForm.addEventListener("submit", e => {
        e.preventDefault();
        // Preserve category context in URL when navigating to results
        const params = new URLSearchParams();
        if (catContext.cat) params.set('cat', catContext.cat);
        if (catContext.sub) params.set('sub', catContext.sub);
        if (catContext.searchType) params.set('searchType', catContext.searchType);
        if (catContext.vtype) params.set('vtype', catContext.vtype);
        if (catContext.najem) params.set('najem', catContext.najem);
        params.set('tab', activeTab);

        // Collect selected body types
        const selectedBT = bodyTypeHidden.value;
        if (selectedBT) params.set('bodyTypes', selectedBT);

        const paramStr = params.toString();
        window.location.hash = `/oglasi${paramStr ? '?' + paramStr : ''}`;
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Filter matching logic — determines if a listing matches all active filters
// This is the core filtering engine used by both live count and results page.
// When category-specific brand/model data is added later, the vehicleType
// filter here will automatically only show matching vehicles.
// ═══════════════════════════════════════════════════════════════════════════════
function matchesFilters(l, filters) {
    // Category-level filtering
    if (filters.activeTab) {
        // Map tab to listing category if the listing has a category field
        // This allows filtering by main category once listings carry that metadata
        if (l.category && l.category !== filters.activeTab) return false;
    }

    // Vehicle multi-match (OR between entries)
    if (filters.vehicles.length > 0) {
        const match = filters.vehicles.some(v => {
            if (v.make && l.make !== v.make) return false;
            if (v.model && l.model !== v.model) return false;
            if (v.variant && l.title && !l.title.includes(v.variant)) return false;
            return true;
        });
        if (!match) return false;
    }

    // Excludes (Vehicles)
    if (filters.excludes && filters.excludes.length > 0) {
        const isExcluded = filters.excludes.some(v => {
            if (l.make !== v.make) return false;
            // If model is specified, it must match. If NO model specified, match entire make.
            if (v.model && l.model !== v.model) return false;
            // If variant is specified, it must be contained in the title.
            if (v.variant && l.title && !l.title.includes(v.variant)) return false;
            return true;
        });
        if (isExcluded) return false;
    }

    // Body Types (OR between tiles)
    if (filters.bodyTypes.length > 0) {
        const typeMatch = filters.bodyTypes.some(type => {
            if (type === 'Damaged') return l.isDamaged || l.condition === 'Poškodovano' || l.damaged === 'only';
            if (type === 'Oldtimer') return l.condition === 'Starodobnik' || (l.year && l.year < 1995);
            if (type === 'EVozila') return ['EMoto', 'ESkiro', 'EKolo'].includes(l.bodyType) || ['EMoto', 'ESkiro', 'EKolo'].includes(l.vehicleType);
            return l.bodyType === type || l.vehicleType === type;
        });
        if (!typeMatch) return false;
    }

    // Motorcycle Specifics
    if (filters.activeTab === 'moto') {
        const stroke = filters.stroke;
        const cylinders = filters.cylinders;
        const layout = filters.cylinderLayout;
        if (stroke && l.stroke !== stroke) return false;
        if (cylinders) {
            // Count match
            if (l.cylinders !== cylinders && String(l.cylinders) !== cylinders && !String(l.cylinders).startsWith(cylinders)) return false;
            // Layout match (if selected)
            if (layout && l.cylinderLayout !== layout && !String(l.cylinders).includes(layout)) return false;
        }
    }

    // Condition chips
    if (filters.conditions.length > 0 && !filters.conditions.includes(l.condition)) return false;

    // Damaged radio
    if (filters.damaged === 'only' && !l.isDamaged && l.damaged !== 'only') return false;
    if (filters.damaged === 'exclude' && (l.isDamaged || l.damaged === 'only')) return false;

    // Price, Year, Mileage
    const isCallForPrice = l.callForPrice || (!l.priceEur && !l.price);
    if (isCallForPrice) {
        if (!filters.includeCallForPrice) return false;
    } else {
        const price = l.priceEur || l.price || 0;
        if (price < filters.priceFrom || (filters.priceTo !== Infinity && price > filters.priceTo)) return false;
    }
    if (l.year < filters.yearFrom || (filters.yearTo !== Infinity && l.year > filters.yearTo)) return false;
    if (filters.mileageTo !== Infinity && l.mileage > filters.mileageTo) return false;

    // Fuel, Transmission, Drivetrain
    if (filters.fuels.length > 0 && !filters.fuels.includes(l.fuel)) return false;
    if (filters.gears.length > 0 && !filters.gears.includes(l.transmission)) return false;
    if (filters.drivetrain.length > 0 && !filters.drivetrain.includes(l.drivetrain)) return false;

    // Features (Equipment)
    if (filters.features && filters.features.length > 0) {
        if (!l.features || !Array.isArray(l.features)) return false;
        // Listing must have ALL selected features
        const hasAll = filters.features.every(f => l.features.includes(f));
        if (!hasAll) return false;
    }

    // Rental filter
    if (filters.najem === '1' && !l.isRental) return false;

    return true;
}

// Export for use by oglasi.js if needed
export { matchesFilters, parseHashParams };