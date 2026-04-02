// Advanced Search page — MojAvto.si
import { getListings } from '../services/listingService.js';

export function initAdvancedSearchPage() {
    console.log('[AdvancedSearchPage] init');
    bindAccordions();
    bindSearchLogic();
    if (window.lucide) window.lucide.createIcons();
}

function bindAccordions() {
    const triggers = document.querySelectorAll('.adv-acc-trigger');
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const body = trigger.closest('.adv-accordion').querySelector('.adv-acc-body');
            const isOpen = trigger.getAttribute('aria-expanded') === 'true';
            if (!isOpen) {
                triggers.forEach(o => {
                    if (o !== trigger) { o.setAttribute('aria-expanded','false'); const b = o.closest('.adv-accordion').querySelector('.adv-acc-body'); if(b) b.style.display='none'; }
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

function bindSearchLogic() {
    const searchForm = document.getElementById("advancedSearchForm");
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const variantSelect = document.getElementById("variant");
    const addVehicleBtn = document.getElementById("addVehicleBtn");
    const vehicleCardsEl = document.getElementById("vehicleCards");
    const selectorRow = document.getElementById("vehicleSelectorRow");
    const brandLimitNote = document.getElementById("brandLimitNote");
    const excludeSelect = document.getElementById("excludeMake");
    const excludeChipsEl = document.getElementById("excludeChips");

    const tabBtns = document.querySelectorAll('.glass-tabs .tab-btn');
    const grids = { 'Avtomobili': document.getElementById('grid-cars'), 'Motorji': document.getElementById('grid-motorbikes'), 'Gospodarska vozila': document.getElementById('grid-commercial') };
    const bodyTypeHidden = document.getElementById('bodyTypeHidden');
    const allBodyTypeCards = document.querySelectorAll('.body-type-card');
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");

    if (!searchForm || !makeSelect) return;

    // --- Tabs ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            tabBtns.forEach(b => { b.classList.remove('active'); b.style.background='transparent'; b.style.color='#6b7280'; });
            const c = e.currentTarget; c.classList.add('active'); c.style.background='white'; c.style.color='inherit';
            Object.values(grids).forEach(g => { if(g) g.style.display='none'; });
            allBodyTypeCards.forEach(c => c.classList.remove('active')); bodyTypeHidden.value='';
            const cat = c.textContent.trim();
            if (cat==='Avtomobili' && grids['Avtomobili']) grids['Avtomobili'].style.display='grid';
            else if (cat==='Motorji' && grids['Motorji']) grids['Motorji'].style.display='grid';
            else if (grids['Gospodarska vozila']) grids['Gospodarska vozila'].style.display='grid';
        });
    });

    // --- Body Type ---
    allBodyTypeCards.forEach(card => {
        card.addEventListener('click', e => {
            e.currentTarget.closest('.body-type-grid').querySelectorAll('.body-type-card').forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            bodyTypeHidden.value = e.currentTarget.getAttribute('data-value');
        });
    });

    // --- Years ---
    const curYear = new Date().getFullYear();
    for (let y = curYear; y >= 1980; y--) {
        const o1 = document.createElement("option"); o1.value=y; o1.textContent=y; yearFromSelect.appendChild(o1);
        const o2 = document.createElement("option"); o2.value=y; o2.textContent=y; yearToSelect.appendChild(o2);
    }

    // ═══════════════════════════════════════════════════
    // VEHICLE ENTRIES (up to 3, each = make + model + variant)
    // ═══════════════════════════════════════════════════
    const MAX_VEHICLES = 3;
    let vehicles = [];       // [{make, model, variant}, ...]
    let excludedBrands = [];

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
                renderVehicleCards(); updateLiveCount();
            });
        });
        // Show/hide selector row
        const atLimit = vehicles.length >= MAX_VEHICLES;
        selectorRow.style.display = atLimit ? 'none' : '';
        addVehicleBtn.style.display = atLimit ? 'none' : '';
        brandLimitNote.textContent = atLimit ? 'Dosežena omejitev 3 vozil.' : vehicles.length > 0 ? `Dodano: ${vehicles.length}/${MAX_VEHICLES}` : '';
    }

    function renderExcludeChips() {
        excludeChipsEl.innerHTML = excludedBrands.map((b,i) =>
            `<span class="brand-chip" style="background:linear-gradient(135deg,#ef4444,#dc2626);">${b}<button type="button" class="chip-remove" data-idx="${i}">&times;</button></span>`
        ).join('');
        excludeChipsEl.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', () => { excludedBrands.splice(+btn.dataset.idx,1); renderExcludeChips(); updateLiveCount(); });
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
        // Reset selectors
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
                const o1 = document.createElement("option"); o1.value=brand; o1.textContent=brand; makeSelect.appendChild(o1);
                if (excludeSelect) { const o2 = document.createElement("option"); o2.value=brand; o2.textContent=brand; excludeSelect.appendChild(o2); }
            });

            import('../utils/customSelect.js').then(m => {
                m.createCustomSelect(makeSelect);
                m.createCustomSelect(modelSelect);
                if (variantSelect) m.createCustomSelect(variantSelect);
                m.createCustomSelect(yearFromSelect);
                m.createCustomSelect(yearToSelect);
                if (excludeSelect) m.createCustomSelect(excludeSelect);
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
                    keys.forEach(m => { const o = document.createElement("option"); o.value=m; o.textContent=m; modelSelect.appendChild(o); });
                    if (keys.length) modelSelect.disabled = false;
                }
            });

            // Model → populate variants
            modelSelect.addEventListener("change", () => {
                const mk = makeSelect.value, md = modelSelect.value;
                variantSelect.innerHTML = '<option value="">Različica</option>';
                variantSelect.disabled = true;
                if (mk && md && data[mk] && data[mk][md] && Array.isArray(data[mk][md])) {
                    data[mk][md].forEach(v => { const o = document.createElement("option"); o.value=v; o.textContent=v; variantSelect.appendChild(o); });
                    if (data[mk][md].length) variantSelect.disabled = false;
                }
            });

            // Exclude
            if (excludeSelect) {
                excludeSelect.addEventListener("change", () => {
                    const v = excludeSelect.value;
                    if (!v || excludedBrands.includes(v)) return;
                    excludedBrands.push(v); excludeSelect.value = '';
                    renderExcludeChips(); updateLiveCount();
                });
            }
        }).catch(err => console.warn("Could not load brands_models_global.json.", err));

    // --- Live Count ---
    async function updateLiveCount() {
        try {
            const fd = new FormData(searchForm);
            const filters = {
                vehicles,
                excludes: excludedBrands,
                bodyType: bodyTypeHidden.value,
                priceFrom: Number(fd.get('priceFrom')) || 0,
                priceTo: Number(fd.get('priceTo')) || Infinity,
                yearFrom: Number(fd.get('yearFrom')) || 0,
                yearTo: Number(fd.get('yearTo')) || Infinity,
                mileageTo: Number(fd.get('mileageTo')) || Infinity,
            };
            let all = await getListings();
            const count = all.filter(l => {
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
                if (filters.excludes.length && filters.excludes.includes(l.make)) return false;
                if (filters.bodyType && l.bodyType !== filters.bodyType) return false;
                if (l.price < filters.priceFrom || (filters.priceTo !== Infinity && l.price > filters.priceTo)) return false;
                if (l.year < filters.yearFrom || (filters.yearTo !== Infinity && l.year > filters.yearTo)) return false;
                if (filters.mileageTo !== Infinity && l.mileage > filters.mileageTo) return false;
                return true;
            }).length;
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
            vehicles = []; excludedBrands = [];
            renderVehicleCards(); renderExcludeChips();
            makeSelect.value = '';
            modelSelect.innerHTML = '<option value="">Model</option>'; modelSelect.disabled = true;
            variantSelect.innerHTML = '<option value="">Različica</option>'; variantSelect.disabled = true;
            allBodyTypeCards.forEach(c => c.classList.remove('active'));
            bodyTypeHidden.value = '';
            if (hybridSub) { hybridSub.classList.remove('visible'); hybridSub.querySelectorAll('input').forEach(c => c.checked = false); }
            updateLiveCount();
        }, 0);
    });

    searchForm.addEventListener("submit", e => { e.preventDefault(); window.location.hash = '/oglasi'; });
}
