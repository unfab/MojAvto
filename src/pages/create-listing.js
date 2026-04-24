// ═══════════════════════════════════════════════════════════════════════════════
// Create Listing — Multi-step Controller — MojAvto.si
// ═══════════════════════════════════════════════════════════════════════════════

import { validateVinFormat, decodeVin } from '../services/vinService.js';
import { createListing } from '../services/listingService.js';
import { EQUIPMENT_GROUPS, getEquipmentForCategory } from '../data/equipment.js';
import { auth } from '../firebase.js';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initCustomSelects, createCustomSelect } from '../utils/customSelect.js';
import { fetchRawListingData } from '../utils/scraper.js';
import { parseListingWithGemini } from '../services/geminiService.js';
import { getCurrentUserDoc } from '../auth/auth.js';

// ── Draft persistence ─────────────────────────────────────────────────────────
const DRAFT_KEY = 'cl_draft';

function saveDraft(state) {
    try {
        const toSave = { ...state };
        delete toSave._exteriorFiles; // Files can't be serialized
        delete toSave._exteriorUrls;
        delete toSave._interiorFiles;
        delete toSave._interiorUrls;
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
    } catch { /* quota exceeded — ignore */ }
}

function loadDraft() {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY);
}

// ── Formatting helpers ───────────────────────────────────────────────────────
function formatNumberWithCommas(n) {
    if (n === null || n === undefined || n === '') return '';
    const num = n.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseNumberFromCommas(s) {
    return Number(s.replace(/,/g, '').replace(/\D/g, '')) || 0;
}

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
    { id: 'entry',       title: null },       // 0: entry mode
    { id: 'vin',         title: null,         condition: s => s.entryType === 'vin' },
    { id: 'category',    title: 'Kategorija', number: true },
    { id: 'basic',       title: 'Osnovni podatki', number: true },
    { id: 'technical',   title: 'Tehnični podatki', number: true },
    { id: 'equipment',   title: 'Oprema', number: true },
    { id: 'media',       title: 'Fotografije', number: true },
    { id: 'description', title: 'Opis', number: true },
    { id: 'price',       title: 'Cena', number: true },
    { id: 'location',    title: 'Lokacija in kontakt', number: true },
    { id: 'promotion',   title: 'Vidnost oglasa', number: true },
    { id: 'review',      title: 'Pregled oglasa', number: true },
    { id: 'auth',        title: 'Prijava', condition: () => !auth.currentUser },
];

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
    currentStep: 0,
    entryType: null,
    vin: null,
    vinVerified: false,
    vinData: null,
    vinOverrides: {},
    category: 'avto',
    subcategory: '',
    make: '', model: '', variant: '', year: '', mileageKm: '',
    color: '', colorType: 'solid', doorsCount: '', seatsCount: '',
    condition: 'Rabljeno', firstRegistration: '', previousOwnersCount: '',
    fuel: '', hybridType: null, transmission: '', driveType: '',
    engineCc: '', powerKw: '', co2: '', emissionClass: '',
    fuelL100kmCombined: '', fuelL100kmCity: '', fuelL100kmHighway: '',
    batteryKwh: '', rangeKm: '', towingKg: '',
    equipment: [],
    _exteriorFiles: [],
    _exteriorUrls: [],
    _interiorFiles: [],
    _interiorUrls: [],
    coverIndex: 0,
    description: '',
    priceEur: '', priceNegotiable: false, priceInclVat: false, leaseAvailable: false, callForPrice: false, priceIsFinal: false,
    sellerType: 'private',
    sellerNote: '',
    businessHours: {},
    leasingConditions: '',
    location: { city: '', postalCode: '', region: '' },
    contact: { name: '', phone: '', showPhone: false, email: '' },
    promotionTier: 'free',
};

let brandModelData = null;

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initCreateListingPage() {
    console.log('[CreateListing] init');

    // Load brands JSON in background
    fetch('/json/brands_models_global.json')
        .then(r => r.json())
        .then(d => { brandModelData = d; })
        .catch(() => {});

    // Restore draft if available
    const saved = loadDraft();
    if (saved) {
        const restore = confirm('Najden je nedokončan oglas. Ali ga želite nadaljevati?');
        if (restore) {
            Object.assign(state, saved);
            state._exteriorFiles = [];
            state._exteriorUrls = [];
            state._interiorFiles = [];
            state._interiorUrls = [];
        } else {
            clearDraft();
        }
    }
    
    // Check if user is logged in to pre-set seller type
    if (auth.currentUser) {
        try {
            const userDoc = await getCurrentUserDoc();
            if (userDoc && userDoc.sellerType) {
                state.sellerType = userDoc.sellerType;
            }
        } catch (e) {
            console.error('[CreateListing] Fetch user profile failed:', e);
        }
    }

    renderCurrentStep();
}

// ── Active steps (filter by conditions) ──────────────────────────────────────
function getActiveSteps() {
    return STEPS.filter(s => !s.condition || s.condition(state));
}

function getNumberedSteps() {
    return getActiveSteps().filter(s => s.number);
}

function currentStepDef() {
    return getActiveSteps()[state.currentStep] || STEPS[0];
}

// ── Progress bar update ───────────────────────────────────────────────────────
function updateProgress() {
    const progress = document.getElementById('clProgress');
    const fill = document.getElementById('clProgressFill');
    const label = document.getElementById('clProgressLabel');
    if (!progress) return;

    const active = getActiveSteps();
    const numbered = active.filter(s => s.number);
    const def = currentStepDef();

    if (!def.number) {
        progress.style.display = 'none';
        return;
    }

    const idx = numbered.indexOf(def);
    const pct = numbered.length > 1 ? Math.round((idx / (numbered.length - 1)) * 100) : 100;

    progress.style.display = 'flex';
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = `Korak ${idx + 1} / ${numbered.length}`;
}

// ── Main render dispatcher ────────────────────────────────────────────────────
function renderCurrentStep() {
    const def = currentStepDef();
    updateProgress();

    const renderers = {
        entry:       renderEntryStep,
        vin:         renderVinStep,
        category:    renderCategoryStep,
        basic:       renderBasicStep,
        technical:   renderTechnicalStep,
        equipment:   renderEquipmentStep,
        media:       renderMediaStep,
        description: renderDescriptionStep,
        price:       renderPriceStep,
        location:    renderLocationStep,
        promotion:   renderPromotionStep,
        review:      renderReviewStep,
        auth:        renderAuthStep,
    };

    const fn = renderers[def.id];
    if (fn) fn();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
}

function goNext() {
    saveDraft(state);
    const active = getActiveSteps();
    if (state.currentStep < active.length - 1) {
        state.currentStep++;
        renderCurrentStep();
    }
}

function goPrev() {
    saveDraft(state);
    if (state.currentStep > 0) {
        state.currentStep--;
        renderCurrentStep();
    }
}

function jumpToStep(id) {
    const active = getActiveSteps();
    const idx = active.findIndex(s => s.id === id);
    if (idx >= 0) {
        state.currentStep = idx;
        renderCurrentStep();
    }
}

// ── Step 0: Entry mode ────────────────────────────────────────────────────────
function renderEntryStep() {
    setHtml(`
        <div class="cl-card">
            <h1 class="cl-step-title">Objava vozila</h1>
            <p class="cl-step-sub">Izberite tip prodajalca in način vnosa podatkov.</p>

            <div class="cl-field" style="margin-bottom:1.5rem;">
                <label class="cl-label">Tip prodajalca</label>
                ${auth.currentUser 
                    ? `<div style="padding:0.75rem 1rem;background:rgba(255,255,255,0.4);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,0.5);border-radius:12px;display:flex;align-items:center;gap:0.75rem;font-weight:600;">
                         ${state.sellerType === 'business' ? '🏢 Pravna oseba / Salon' : '👤 Fizična oseba'}
                         <span style="font-size:0.75rem;color:#64748b;font-weight:400;margin-left:auto;">Prijavljen kot: ${auth.currentUser.displayName || auth.currentUser.email}</span>
                       </div>`
                    : `<div class="cl-seller-toggle">
                        <button class="cl-seller-btn ${state.sellerType === 'private' ? 'active' : ''}" data-type="private">
                            👤 Fizična oseba
                        </button>
                        <button class="cl-seller-btn ${state.sellerType === 'business' ? 'active' : ''}" data-type="business">
                            🏢 Pravna oseba / Salon
                        </button>
                    </div>`
                }
            </div>

            <!-- Smart Import -->
            <div class="cl-smart-import" id="smartImportBox">
                <div class="cl-smart-import-header">
                    <i data-lucide="wand-2"></i>
                    <span>Uvozi podatke z obstoječega oglasa</span>
                    <span class="cl-smart-import-badge">AI</span>
                </div>
                <p class="cl-smart-import-hint">Prilepite povezavo do oglasa (mobile.de, avto.net, njuskalo.hr…) — AI bo samodejno izpolnil obrazec.</p>
                <div class="cl-smart-import-row">
                    <input id="importUrlInput" type="url" class="cl-input" placeholder="https://www.mobile.de/...">
                    <button id="btnSmartImport" class="cl-btn cl-btn--primary">Uvozi</button>
                </div>
                <div id="importLoader" style="display:none;" class="cl-smart-import-loader">
                    <i data-lucide="loader-2" class="cl-spin"></i>
                    <span id="importLoaderText">Umetna inteligenca analizira oglas...</span>
                </div>
                <div id="importWarning" style="display:none;" class="cl-smart-import-warning">
                    ✅ Podatki so bili izpolnjeni avtomatsko. Preverite točnost pred objavo!
                </div>
                <div id="importError" style="display:none;" class="cl-smart-import-error"></div>
            </div>

            <div class="cl-entry-cards">
                <div class="cl-entry-card" id="entryClassic">
                    <span class="cl-entry-card-icon">📋</span>
                    <p class="cl-entry-card-title">Klasičen vnos</p>
                    <p class="cl-entry-card-desc">Sami izpolnite vse podatke o vozilu.</p>
                    <ul class="cl-entry-card-features">
                        <li>Primerno za stara vozila</li>
                        <li>Primerno za tuja vozila</li>
                        <li>Vedno brezplačno</li>
                    </ul>
                </div>
                <div class="cl-entry-card recommended" id="entryVin">
                    <span class="cl-entry-card-badge">Priporočeno</span>
                    <span class="cl-entry-card-icon">🛡</span>
                    <p class="cl-entry-card-title">Verificiran vnos (VIN)</p>
                    <p class="cl-entry-card-desc">Vnesite šasijsko številko — sistem samodejno izpolni podatke.</p>
                    <ul class="cl-entry-card-features">
                        <li>Večja zaupnost kupcev</li>
                        <li>Samodejni zapolni podatke</li>
                        <li>Zgodovina vozila (nesreče, lastniki)</li>
                    </ul>
                </div>
            </div>
        </div>
    `);

    document.querySelectorAll('.cl-seller-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cl-seller-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.sellerType = btn.dataset.type;
        });
    });

    document.getElementById('entryClassic').addEventListener('click', () => {
        state.entryType = 'classic';
        state.vinVerified = false;
        goNext();
    });

    document.getElementById('entryVin').addEventListener('click', () => {
        state.entryType = 'vin';
        goNext();
    });

    document.getElementById('btnSmartImport')?.addEventListener('click', runSmartImport);
}

// ── Smart Import ──────────────────────────────────────────────────────────────
async function runSmartImport() {
    const urlInput  = document.getElementById('importUrlInput');
    const loader    = document.getElementById('importLoader');
    const loaderTxt = document.getElementById('importLoaderText');
    const warning   = document.getElementById('importWarning');
    const errorEl   = document.getElementById('importError');
    const btn       = document.getElementById('btnSmartImport');

    const url = urlInput?.value?.trim();
    if (!url || !url.startsWith('http')) {
        showImportError(errorEl, 'Vnesite veljavno spletno povezavo (mora se začeti s http).');
        return;
    }

    // UI: loading state
    btn.disabled = true;
    if (loader)  loader.style.display  = 'flex';
    if (warning) warning.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    try {
        // Step 1: fetch raw text via CORS proxy
        if (loaderTxt) loaderTxt.textContent = 'Pridobivam vsebino oglasa...';
        const rawText = await fetchRawListingData(url);

        // Step 2: collect allowed values from local data
        const allowedBrands = brandModelData ? Object.keys(brandModelData) : [];
        const allowedSlugs  = EQUIPMENT_GROUPS.flatMap(g => g.items.map(i => i.value));

        // Step 3: send to Gemini
        if (loaderTxt) loaderTxt.textContent = 'Umetna inteligenca analizira oglas...';
        const parsed = await parseListingWithGemini(rawText, allowedBrands, allowedSlugs);

        // Step 4: apply to state
        applyImportedData(parsed);

        // UI: success
        if (loader)  loader.style.display  = 'none';
        if (warning) warning.style.display = 'block';

    } catch (err) {
        console.error('[SmartImport]', err);
        if (loader) loader.style.display = 'none';
        showImportError(errorEl, 'Uvoz ni uspel — prosimo vnesite podatke ročno. (' + err.message + ')');
    } finally {
        btn.disabled = false;
    }
}

function showImportError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function applyImportedData(d) {
    if (!d || typeof d !== 'object') return;

    // Basic fields → state (steps will read from state when rendered)
    if (d.brand)        state.make         = d.brand;
    if (d.model)        state.model        = d.model;
    if (d.year)         state.year         = Number(d.year);
    if (d.mileage)      state.mileageKm    = Number(d.mileage);
    if (d.fuel)         state.fuel         = d.fuel;
    if (d.transmission) state.transmission = d.transmission;
    if (d.powerKw)      state.powerKw      = Number(d.powerKw);
    if (d.price)        state.priceEur     = Number(d.price);

    // Equipment — merge with existing selection
    if (Array.isArray(d.equipment) && d.equipment.length) {
        const existing = new Set(state.equipment);
        d.equipment.forEach(s => existing.add(s));
        state.equipment = [...existing];
    }

    // Mark state as imported so steps can highlight fields
    state._imported = d;

    saveDraft(state);
}

// ── Step 1: VIN input (conditional) ──────────────────────────────────────────
function renderVinStep() {
    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">🛡 Verificiran vnos</h2>
            <p class="cl-step-sub">Vnesite šasijsko številko (VIN) vašega vozila.</p>

            <div class="cl-field">
                <label class="cl-label">Šasijska številka (VIN) <span class="req">*</span></label>
                <div class="cl-vin-wrap">
                    <input class="cl-input" id="vinInput" type="text" maxlength="17"
                        placeholder="npr. WVWZZZ1KZ9W012345"
                        value="${state.vin || ''}" autocomplete="off" spellcheck="false" />
                    <button class="cl-btn cl-btn--primary" id="btnVerifyVin" disabled>
                        <i data-lucide="search"></i> Preveri
                    </button>
                </div>
                <span id="vinError" style="color:#dc2626;font-size:0.8rem;display:none;"></span>
            </div>

            <div class="cl-vin-hint">
                <strong>Kje najdem VIN?</strong><br>
                • Spodnji rob vetrobranskega stekla (vidno od zunaj)<br>
                • Prometno dovoljenje — rubrika <strong>E</strong><br>
                • Nalepka v okviru vozniških vrat
            </div>

            <div id="vinResultArea"></div>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnVinBack">Nazaj</button>
            </div>
        </div>
    `);

    const input = document.getElementById('vinInput');
    const btn = document.getElementById('btnVerifyVin');
    const errEl = document.getElementById('vinError');

    input.addEventListener('input', () => {
        const val = input.value.trim().toUpperCase();
        input.value = val;
        const { valid, message } = validateVinFormat(val);
        btn.disabled = !valid;
        errEl.textContent = val.length > 0 && !valid ? message : '';
        errEl.style.display = (val.length > 0 && !valid) ? 'block' : 'none';
    });

    btn.addEventListener('click', () => runVinDecode(input.value.trim().toUpperCase()));
    document.getElementById('btnVinBack').addEventListener('click', goPrev);

    // If VIN already verified, show result immediately
    if (state.vinVerified && state.vinData) {
        renderVinResult(state.vin, state.vinData);
    }
}

async function runVinDecode(vin) {
    const area = document.getElementById('vinResultArea');
    const btn = document.getElementById('btnVerifyVin');
    btn.disabled = true;

    area.innerHTML = `
        <div class="cl-vin-loading" style="margin-top:1.5rem;">
            <div class="cl-vin-spinner"></div>
            <p class="cl-vin-loading-label">Preverjam šasijsko številko...</p>
        </div>`;

    if (window.lucide) window.lucide.createIcons();

    const result = await decodeVin(vin);

    if (!result.success) {
        area.innerHTML = `
            <div class="cl-vin-error" style="margin-top:1.25rem;">
                <p>VIN ni bil najden</p>
                <small>${result.message}</small>
            </div>
            <div class="cl-nav" style="margin-top:1rem;">
                <button class="cl-btn cl-btn--ghost" id="btnRetryVin">Poskusi znova</button>
                <button class="cl-btn cl-btn--secondary" id="btnFallbackClassic">Nadaljuj brez VIN</button>
            </div>`;
        document.getElementById('btnRetryVin')?.addEventListener('click', () => {
            area.innerHTML = '';
            btn.disabled = false;
        });
        document.getElementById('btnFallbackClassic')?.addEventListener('click', () => {
            state.entryType = 'classic';
            state.vinVerified = false;
            goNext();
        });
        btn.disabled = false;
        return;
    }

    state.vin = result.vin;
    state.vinData = result.data;
    state.vinVerified = true;

    // Pre-fill basic data from VIN
    if (result.data.make) state.make = result.data.make;
    if (result.data.model) state.model = result.data.model;
    if (result.data.year) state.year = result.data.year;
    if (result.data.engineType) state.fuel = mapVinFuel(result.data.engineType);
    if (result.data.powerKw) state.powerKw = result.data.powerKw;
    if (result.data.engineCc) state.engineCc = result.data.engineCc;

    renderVinResult(result.vin, result.data);
    btn.disabled = false;
    if (window.lucide) window.lucide.createIcons();
}

function renderVinResult(vin, data) {
    const area = document.getElementById('vinResultArea');
    if (!area) return;

    const accidentText = () => {
        if (data.accidentCount === null) return { text: 'Ni podatka', cls: '' };
        if (data.accidentCount === 0) return { text: 'Ni zabeleženih ✓', cls: 'clean' };
        return { text: `${data.accidentCount} zabeležen${data.accidentCount > 1 ? 'ih' : 'a'}`, cls: data.accidentSeverity === 'major' ? 'danger' : 'warn' };
    };

    const recall = data.hasOpenRecalls ? { text: 'Da — odprti odpoklici!', cls: 'danger' } : { text: 'Ni odprtih ✓', cls: 'clean' };
    const owners = data.previousOwners !== null ? data.previousOwners : '—';
    const acc = accidentText();
    const partialNote = data.partial ? `
        <div class="cl-vin-partial-note">
            ⚠ Nekateri podatki niso bili najdeni. Izpolnite jih ročno v naslednjih korakih.
        </div>` : '';

    area.innerHTML = `
        <div class="cl-vin-result" style="margin-top:1.25rem;">
            <div class="cl-vin-result-header">
                <span class="cl-vin-badge"><i data-lucide="shield-check"></i> VIN preverjeno</span>
                <span class="cl-vin-code">${vin}</span>
            </div>
            <div class="cl-vin-rows">
                <div class="cl-vin-row"><span class="cl-vin-row-icon">🏭</span><span class="cl-vin-row-label">Znamka</span><span class="cl-vin-row-value">${data.make || '—'}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">🚗</span><span class="cl-vin-row-label">Model</span><span class="cl-vin-row-value">${data.model || '—'}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">📅</span><span class="cl-vin-row-label">Leto izdelave</span><span class="cl-vin-row-value">${data.year || '—'}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">⚙️</span><span class="cl-vin-row-label">Motor</span><span class="cl-vin-row-value">${data.engineType || '—'}${data.powerKw ? ' / ' + data.powerKw + ' kW' : ''}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">🌍</span><span class="cl-vin-row-label">Država izvora</span><span class="cl-vin-row-value">${data.countryOfOrigin || '—'}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">👤</span><span class="cl-vin-row-label">Prejšnji lastniki</span><span class="cl-vin-row-value">${owners}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">💥</span><span class="cl-vin-row-label">Nesreče</span><span class="cl-vin-row-value ${acc.cls}">${acc.text}</span></div>
                <div class="cl-vin-row"><span class="cl-vin-row-icon">🔔</span><span class="cl-vin-row-label">Odpoklici</span><span class="cl-vin-row-value ${recall.cls}">${recall.text}</span></div>
            </div>
        </div>
        ${partialNote}
        <div class="cl-nav" style="margin-top:1.25rem;">
            <span></span>
            <button class="cl-btn cl-btn--primary" id="btnVinAccept">
                Sprejmi in nadaljuj
            </button>
        </div>`;

    document.getElementById('btnVinAccept')?.addEventListener('click', () => {
        goNext();
    });

    if (window.lucide) window.lucide.createIcons();
}

function mapVinFuel(engineType) {
    const map = { 'Dizel': 'Dizel', 'Bencin': 'Bencin', 'Diesel': 'Dizel', 'Petrol': 'Bencin', 'Electric': 'Elektrika', 'Hybrid': 'Hibrid' };
    return map[engineType] || engineType;
}

// ── Step 2: Category ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { 
        id: 'avto',        
        label: 'Avto',           
        icon: 'car',       
        subs: [
            { name: 'Limuzina', icon: 'car' },
            { name: 'SUV / Terensko', icon: 'mountain' },
            { name: 'Karavan', icon: 'layout-template' },
            { name: 'Kombilimuzina', icon: 'car' },
            { name: 'Kabriolet', icon: 'sun' },
            { name: 'Coupe', icon: 'zap' },
            { name: 'Enoprostorec', icon: 'users' },
            { name: 'Pick-up', icon: 'truck' },
            { name: 'Oldtimer', icon: 'history' }
        ] 
    },
    { 
        id: 'moto',        
        label: 'Moto',            
        icon: 'bike',      
        subs: [
            { name: 'Motocikel', icon: 'bike' },
            { name: 'Skuter', icon: 'car' },
            { name: 'Enduro', icon: 'mountain' },
            { name: 'Chopper', icon: 'wind' },
            { name: 'Tourer', icon: 'map' },
            { name: 'ATV / UTV', icon: 'maximize' },
            { name: 'E-Moto', icon: 'zap' }
        ] 
    },
    { 
        id: 'gospodarska', 
        label: 'Gospodarska',     
        icon: 'truck',     
        subs: [
            { name: 'Dostavna vozila', icon: 'package' },
            { name: 'Tovorna vozila', icon: 'truck' },
            { name: 'Avtobus', icon: 'users' },
            { name: 'Tovorne prikolice', icon: 'link' }
        ] 
    },
    { 
        id: 'mehanizacija',
        label: 'Mehanizacija',   
        icon: 'tractor',   
        subs: [
            { name: 'Gradbena mehanizacija', icon: 'hammer' },
            { name: 'Kmetijska mehanizacija', icon: 'tractor' },
            { name: 'Viličarji', icon: 'chevrons-up' },
            { name: 'Komunalna', icon: 'trash-2' }
        ] 
    },
    { 
        id: 'prosti-cas',  
        label: 'Prosti čas',     
        icon: 'palmtree',  
        subs: [
            { name: 'Avtodom', icon: 'home' },
            { name: 'Počitniška prikolica', icon: 'box' },
            { name: 'Mobilna hišica', icon: 'home' },
            { name: 'Šotorska prikolica', icon: 'tent' }
        ] 
    },
    { id: 'deli',        label: 'Deli in oprema', icon: 'wrench',    subs: [] },
];

function renderCategoryStep() {
    const catCards = CATEGORIES.map(c => `
        <div class="cl-category-card ${state.category === c.id ? 'selected' : ''}" data-cat="${c.id}">
            <i data-lucide="${c.icon}"></i>
            <span>${c.label}</span>
        </div>`).join('');

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Kategorija vozila</h2>
            <p class="cl-step-sub">Izberite vrsto vozila, ki ga prodajate.</p>

            <div class="cl-category-grid">${catCards}</div>

            <div id="subRow" class="cl-subcategory-row" style="margin-bottom:1.25rem;"></div>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnCatBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnCatNext">Nadaljuj</button>
            </div>
        </div>
    `);

    if (window.lucide) window.lucide.createIcons();
    renderSubcategories();

    document.querySelectorAll('.cl-category-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.cl-category-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.category = card.dataset.cat;
            state.subcategory = '';
            renderSubcategories();
        });
    });

    document.getElementById('btnCatBack').addEventListener('click', goPrev);
    document.getElementById('btnCatNext').addEventListener('click', () => {
        if (!state.category) return alert('Izberite kategorijo.');
        goNext();
    });
}

function renderSubcategories() {
    const row = document.getElementById('subRow');
    if (!row) return;
    const cat = CATEGORIES.find(c => c.id === state.category);
    if (!cat || cat.subs.length === 0) { row.innerHTML = ''; return; }

    row.innerHTML = cat.subs.map(s => `
        <button class="cl-subcategory-pill ${state.subcategory === s.name ? 'selected' : ''}" data-sub="${s.name}">
            <i data-lucide="${s.icon}" class="cl-sub-icon"></i>
            ${s.name}
        </button>`).join('');

    if (window.lucide) window.lucide.createIcons({ scope: row });

    row.querySelectorAll('.cl-subcategory-pill').forEach(p => {
        p.addEventListener('click', () => {
            row.querySelectorAll('.cl-subcategory-pill').forEach(pp => pp.classList.remove('selected'));
            p.classList.add('selected');
            state.subcategory = p.dataset.sub;
        });
    });
}

// ── Step 3: Basic data ────────────────────────────────────────────────────────
function renderBasicStep() {
    const years = [];
    for (let y = new Date().getFullYear() + 1; y >= 1960; y--) years.push(y);

    const isVin = state.vinVerified;

    function field(id, label, value, locked) {
        const lockBadge = locked
            ? `<span class="cl-field-badge cl-field-badge--locked"><i data-lucide="lock"></i> Preverjeno (VIN)</span>`
            : '';
        return `
            <div class="cl-field ${locked ? 'cl-field--locked' : ''}">
                <label class="cl-label">${label} <span class="req">*</span></label>
                <input class="cl-input" id="${id}" type="text" value="${escHtml(String(value || ''))}" ${locked ? 'readonly' : ''} />
                ${lockBadge}
            </div>`;
    }

    const COLORS = ['Bela', 'Črna', 'Siva', 'Srebrna', 'Modra', 'Rdeča', 'Zelena', 'Rumena', 'Rjava', 'Oranžna', 'Vijolična', 'Zlata', 'Bronasta', 'Druga'];

    const makeLocked = isVin && !state.vinOverrides?.make;
    const modelLocked = isVin && !state.vinOverrides?.model;
    const yearLocked = isVin && !state.vinOverrides?.year;

    const yearOpts = years.map(y => `<option value="${y}" ${Number(state.year) === y ? 'selected' : ''}>${y}</option>`).join('');

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Osnovni podatki</h2>
            ${isVin ? '<p class="cl-step-sub">🛡 Podatki iz VIN so samodejno izpolnjeni. Zaklenjene vrednosti izhajajo iz uradnih registrov.</p>' : '<p class="cl-step-sub">Izpolnite osnovne podatke o vozilu.</p>'}

            <div class="cl-row">
                <div class="cl-field ${makeLocked ? 'cl-field--locked' : ''}">
                    <label class="cl-label">Znamka <span class="req">*</span></label>
                    <select class="cl-select" id="fMake" ${makeLocked ? 'disabled' : ''}>
                        <option value="">Izberi znamko</option>
                    </select>
                    ${makeLocked ? '<span class="cl-field-badge cl-field-badge--locked"><i data-lucide="lock"></i> Preverjeno (VIN)</span>' : ''}
                </div>
                <div class="cl-field ${modelLocked ? 'cl-field--locked' : ''}">
                    <label class="cl-label">Model <span class="req">*</span></label>
                    <select class="cl-select" id="fModel" ${modelLocked ? 'disabled' : ''}>
                        <option value="">Najprej izberi znamko</option>
                    </select>
                    ${modelLocked ? '<span class="cl-field-badge cl-field-badge--locked"><i data-lucide="lock"></i> Preverjeno (VIN)</span>' : ''}
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field ${yearLocked ? 'cl-field--locked' : ''}">
                    <label class="cl-label">Letnik <span class="req">*</span></label>
                    <select class="cl-select" id="fYear" ${yearLocked ? 'disabled' : ''}>
                        <option value="">Izberi letnik</option>${yearOpts}
                    </select>
                    ${yearLocked ? '<span class="cl-field-badge cl-field-badge--locked"><i data-lucide="lock"></i> Preverjeno (VIN)</span>' : ''}
                </div>
                <div class="cl-field">
                    <label class="cl-label">Različica / Trim</label>
                    <select class="cl-select" id="fVariant">
                        <option value="">Najprej izberi model</option>
                    </select>
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Prevoženih km <span class="req">*</span></label>
                    <div class="cl-mileage-wrap">
                        <input class="cl-input" id="fMileage" type="text" 
                            value="${formatNumberWithCommas(state.mileageKm)}" 
                            placeholder="vpišite kilometre" autocomplete="off" />
                        <span class="cl-mileage-unit">km</span>
                    </div>
                </div>

                <div class="cl-field">
                    <label class="cl-label">Barva</label>
                    <select class="cl-select" id="fColor">
                        <option value="">Izberi barvo</option>
                        ${COLORS.map(c => `<option value="${c}" ${state.color === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Stanje <span class="req">*</span></label>
                    <select class="cl-select" id="fCondition">
                        ${['Rabljeno','Novo','Razstavno vozilo','Starodobnik','Za dele'].map(c =>
                            `<option value="${c}" ${state.condition === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="cl-field">
                    <label class="cl-label">Barva tipa</label>
                    <select class="cl-select" id="fColorType">
                        ${[['solid','Enobarvna'],['metallic','Kovinska'],['matte','Mat'],['pearl','Biserna']].map(([v,l]) =>
                            `<option value="${v}" ${state.colorType === v ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Število vrat</label>
                    <select class="cl-select" id="fDoors">
                        <option value="">—</option>
                        ${[2,3,4,5,6].map(n => `<option value="${n}" ${Number(state.doorsCount)===n ? 'selected':''}>${n}</option>`).join('')}
                    </select>
                </div>
                <div class="cl-field">
                    <label class="cl-label">Število sedežev</label>
                    <select class="cl-select" id="fSeats">
                        <option value="">—</option>
                        ${[2,3,4,5,6,7,8,9].map(n => `<option value="${n}" ${Number(state.seatsCount)===n ? 'selected':''}>${n}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Prva registracija <span class="req">*</span></label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <select class="cl-select" id="fFirstRegMonth">
                            <option value="">Mesec</option>
                            ${[...Array(12)].map((_, i) => {
                                const m = (i + 1).toString().padStart(2, '0');
                                const currentM = state.firstRegistration ? state.firstRegistration.split('-')[1] : '';
                                return `<option value="${m}" ${currentM === m ? 'selected' : ''}>${m}.</option>`;
                            }).join('')}
                        </select>
                        <select class="cl-select" id="fFirstRegYear">
                            <option value="">Leto</option>
                            ${yearOpts}
                        </select>
                    </div>
                </div>
                <div class="cl-field">
                    <label class="cl-label">Število preteklih lastnikov</label>
                    <select class="cl-select" id="fPrevOwners">
                        <option value="">—</option>
                        ${['1. lastnik','2. lastnik','3. lastnik','4. lastnik','5 ali več'].map(l =>
                            `<option value="${l}" ${state.previousOwnersCount === l ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnBasicBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnBasicNext">Nadaljuj</button>
            </div>
        </div>
    `);

    if (window.lucide) window.lucide.createIcons();

    const makeSel = document.getElementById('fMake');
    const modelSel = document.getElementById('fModel');
    const variantSel = document.getElementById('fVariant');

    // Highlight imported fields
    if (state._imported) {
        const imp = state._imported;
        if (imp.brand)    makeSel?.classList.add('imported-field');
        if (imp.model)    modelSel?.classList.add('imported-field');
        if (imp.year)     document.getElementById('fYear')?.classList.add('imported-field');
        if (imp.mileage)  document.getElementById('fMileage')?.classList.add('imported-field');
    }

    // Populate Brands
    if (brandModelData) {
        Object.keys(brandModelData).sort().forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            if (state.make === b) opt.selected = true;
            makeSel.appendChild(opt);
        });
    }

    function updateModels() {
        const make = makeSel.value;
        const currentModel = state.model;
        modelSel.innerHTML = '<option value="">Izberi model</option>';
        variantSel.innerHTML = '<option value="">Najprej izberi model</option>';
        
        if (make && brandModelData && brandModelData[make]) {
            const models = brandModelData[make];
            const modelKeys = Array.isArray(models) ? models : Object.keys(models);
            modelKeys.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                if (currentModel === m) opt.selected = true;
                modelSel.appendChild(opt);
            });
            modelSel.disabled = false || modelLocked;
        } else {
            modelSel.disabled = true;
        }
        updateVariants();
    }

    function updateVariants() {
        const make = makeSel.value;
        const model = modelSel.value;
        const currentVariant = state.variant;
        variantSel.innerHTML = '<option value="">Izberi različico</option>';
        
        if (make && model && brandModelData && brandModelData[make]) {
            const models = brandModelData[make];
            if (!Array.isArray(models) && models[model]) {
                models[model].forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v;
                    opt.textContent = v;
                    if (currentVariant === v) opt.selected = true;
                    variantSel.appendChild(opt);
                });
                variantSel.disabled = false;
            } else {
                // If no specific variants, allow manual or show generic
                variantSel.innerHTML = '<option value="">Standardna oprema / Brez podrazličic</option>';
                variantSel.disabled = false;
            }
        } else {
            variantSel.disabled = true;
        }
    }

    makeSel.addEventListener('change', () => {
        state.make = makeSel.value;
        state.model = '';
        state.variant = '';
        updateModels();
    });

    modelSel.addEventListener('change', () => {
        state.model = modelSel.value;
        state.variant = '';
        updateVariants();
    });

    variantSel.addEventListener('change', () => {
        state.variant = variantSel.value;
    });

    updateModels(); // Initialize visibility

    // Unlock logic for VIN fields
    [makeSel, modelSel].forEach(el => {
        const field = el?.closest('.cl-field--locked');
        if (!field) return;
        el.addEventListener('focus', (e) => {
            // Since it's a select, we might need a custom way to handle "focus to unlock"
            // or just a button. For now, let's allow unlocking on click if it's disabled.
        }, true);
    });

    // Custom select initialization
    initCustomSelects();

    const mileageInput = document.getElementById('fMileage');
    if (mileageInput) {
        mileageInput.addEventListener('input', (e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (raw === '') {
                e.target.value = '';
                return;
            }
            const formatted = formatNumberWithCommas(raw);
            e.target.value = formatted;
            
            // Update unit label visibility (optional effect)
            const unit = document.querySelector('.cl-mileage-unit');
            if (unit) unit.style.opacity = e.target.value ? '1' : '0.4';
        });
    }

    document.getElementById('btnBasicBack').addEventListener('click', goPrev);
    document.getElementById('btnBasicNext').addEventListener('click', () => {
        const make = makeSel.value;
        const mileageRaw = document.getElementById('fMileage').value;
        const mileage = parseNumberFromCommas(mileageRaw);
        const year = document.getElementById('fYear').value;
        const firstRegMonth = document.getElementById('fFirstRegMonth').value;
        const firstRegYear = document.getElementById('fFirstRegYear').value;

        if (!make) return alert('Izberite znamko vozila.');
        if (mileageRaw === '') return alert('Vnesite prevožene kilometre.');
        if (!year) return alert('Izberite letnik.');
        if (!firstRegMonth || !firstRegYear) return alert('Vnesite datum prve registracije.');

        state.make = make;
        state.model = modelSel.value;
        state.variant = variantSel.value;
        state.year = Number(year);
        state.mileageKm = mileage;
        state.color = document.getElementById('fColor').value;
        state.colorType = document.getElementById('fColorType').value;
        state.condition = document.getElementById('fCondition').value;
        state.doorsCount = document.getElementById('fDoors').value;
        state.seatsCount = document.getElementById('fSeats').value;
        state.firstRegistration = `${firstRegYear}-${firstRegMonth}`;
        state.previousOwnersCount = document.getElementById('fPrevOwners').value;
        goNext();
    });
}

// ── Step 4: Technical ─────────────────────────────────────────────────────────
function renderTechnicalStep() {
    const fuels = ['Bencin','Dizel','Hibrid','Elektrika','LPG','CNG','Vodik'];
    const transmissions = ['Ročni','Avtomatski','Polavtomatski'];
    const drives = ['FWD (sprednji)','RWD (zadnji)','AWD / 4x4'];
    const euros = ['Euro 4','Euro 5','Euro 6','Euro 6d','Euro 6d-temp'];

    const isVin = state.vinVerified;
    const fuelLocked = isVin && !state.vinOverrides?.fuel;

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Tehnični podatki</h2>
            <p class="cl-step-sub">Podrobnosti o motorju, pogonu in emisijah.</p>

            <div class="cl-row">
                <div class="cl-field ${fuelLocked ? 'cl-field--locked' : ''}">
                    <label class="cl-label">Vrsta goriva <span class="req">*</span></label>
                    <select class="cl-select" id="fFuel" ${fuelLocked ? 'disabled' : ''}>
                        <option value="">Izberi</option>
                        ${fuels.map(f => `<option value="${f}" ${state.fuel===f?'selected':''}>${f}</option>`).join('')}
                    </select>
                    ${fuelLocked ? '<span class="cl-field-badge cl-field-badge--locked"><i data-lucide="lock"></i> Preverjeno (VIN)</span>' : ''}
                </div>
                <div class="cl-field">
                    <label class="cl-label">Menjalnik <span class="req">*</span></label>
                    <select class="cl-select" id="fTransmission">
                        <option value="">Izberi</option>
                        ${transmissions.map(t => `<option value="${t}" ${state.transmission===t?'selected':''}>${t}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Pogon</label>
                    <select class="cl-select" id="fDrive">
                        <option value="">Izberi</option>
                        ${drives.map(d => `<option value="${d}" ${state.driveType===d?'selected':''}>${d}</option>`).join('')}
                    </select>
                </div>
                <div class="cl-field">
                    <label class="cl-label">Prostornina motorja (cc) <span class="req">*</span></label>
                    <input class="cl-input" id="fEngineCC" type="number" min="0" value="${state.engineCc||''}" placeholder="npr. 1968" />
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <div class="cl-label-with-toggle">
                        <label class="cl-label">Moč <span class="req">*</span></label>
                        <div class="cl-unit-toggle" id="powerUnitToggle">
                            <button type="button" class="cl-unit-btn active" data-unit="hp">KM</button>
                            <button type="button" class="cl-unit-btn" data-unit="kw">kW</button>
                        </div>
                    </div>
                    <div class="cl-input-wrap">
                        <input class="cl-input" id="fPower" type="number" min="0" value="${state.powerKw ? Math.round(state.powerKw * 1.35962) : ''}" placeholder="npr. 150" />
                        <span class="cl-input-unit" id="powerUnitLabel">KM</span>
                    </div>
                </div>
                <div class="cl-field">
                    <label class="cl-label">CO₂ (g/km)</label>
                    <input class="cl-input" id="fCo2" type="number" min="0" value="${state.co2||''}" placeholder="npr. 142" />
                </div>
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Emisijski razred</label>
                    <select class="cl-select" id="fEuro">
                        <option value="">—</option>
                        ${euros.map(e => `<option value="${e}" ${state.emissionClass===e?'selected':''}>${e}</option>`).join('')}
                    </select>
                </div>
                <div class="cl-field">
                    <label class="cl-label">Vlečna masa (kg)</label>
                    <input class="cl-input" id="fTow" type="number" min="0" value="${state.towingKg||''}" placeholder="npr. 1500" />
                </div>
            </div>

            <!-- Consumption fields (only for non-electric) -->
            <div class="cl-conditional" id="consumptionFields">
                <hr style="border:none;border-top:1px solid rgba(0,0,0,0.07);margin:1rem 0;" />
                <p class="cl-label" style="font-weight:600;margin-bottom:0.75rem;">Poraba goriva (L/100km)</p>
                <div class="cl-row">
                    <div class="cl-field">
                        <label class="cl-label">Kombinirana</label>
                        <input class="cl-input" id="fConsCombined" type="number" step="0.1" min="0" value="${state.fuelL100kmCombined||''}" placeholder="npr. 6.5" />
                    </div>
                    <div class="cl-field">
                        <label class="cl-label">Mestna</label>
                        <input class="cl-input" id="fConsCity" type="number" step="0.1" min="0" value="${state.fuelL100kmCity||''}" placeholder="npr. 8.2" />
                    </div>
                    <div class="cl-field">
                        <label class="cl-label">Izvenmestna</label>
                        <input class="cl-input" id="fConsHighway" type="number" step="0.1" min="0" value="${state.fuelL100kmHighway||''}" placeholder="npr. 5.1" />
                    </div>
                </div>
            </div>

            <!-- Electric fields -->
            <div class="cl-conditional" id="elFields">
                <div class="cl-row">
                    <div class="cl-field">
                        <label class="cl-label">Kapaciteta baterije (kWh)</label>
                        <input class="cl-input" id="fBattery" type="number" min="0" value="${state.batteryKwh||''}" placeholder="npr. 77" />
                    </div>
                    <div class="cl-field">
                        <label class="cl-label">Domet WLTP (km)</label>
                        <input class="cl-input" id="fRange" type="number" min="0" value="${state.rangeKm||''}" placeholder="npr. 550" />
                    </div>
                </div>
            </div>

            <!-- Hybrid sub -->
            <div class="cl-conditional" id="hybridFields">
                <div class="cl-field">
                    <label class="cl-label">Tip hibrida</label>
                    <select class="cl-select" id="fHybridType">
                        <option value="">Izberi</option>
                        ${[['BencinHibrid','Bencin hibrid'],['DizelHibrid','Dizel hibrid'],['PlugIn','Plug-in hibrid'],['MildHibrid','Mild hibrid']].map(([v,l]) =>
                            `<option value="${v}" ${state.hybridType===v?'selected':''}>${l}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnTechBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnTechNext">Nadaljuj</button>
            </div>
        </div>
    `);

    if (window.lucide) window.lucide.createIcons();

    // Highlight imported fields in technical step
    if (state._imported) {
        const imp = state._imported;
        if (imp.fuel)         document.getElementById('fFuel')?.classList.add('imported-field');
        if (imp.transmission) document.getElementById('fTransmission')?.classList.add('imported-field');
        if (imp.powerKw)      document.getElementById('fPower')?.classList.add('imported-field');
    }

    const fuelSel = document.getElementById('fFuel');
    const updateConditionals = () => {
        const val = fuelSel.value;
        document.getElementById('elFields')?.classList.toggle('visible', val === 'Elektrika');
        document.getElementById('hybridFields')?.classList.toggle('visible', val === 'Hibrid');
        document.getElementById('consumptionFields')?.classList.toggle('visible', val !== '' && val !== 'Elektrika');
    };
    fuelSel.addEventListener('change', updateConditionals);
    updateConditionals();

    initCustomSelects();

    // Power Toggle Logic
    let currentPowerUnit = 'hp';
    const powerInput = document.getElementById('fPower');
    const unitBtns = document.querySelectorAll('#powerUnitToggle .cl-unit-btn');
    const unitLabel = document.getElementById('powerUnitLabel');

    unitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newUnit = btn.dataset.unit;
            if (newUnit === currentPowerUnit) return;

            const val = parseFloat(powerInput.value);
            if (!isNaN(val)) {
                if (newUnit === 'kw') {
                    powerInput.value = Math.round(val / 1.35962);
                } else {
                    powerInput.value = Math.round(val * 1.35962);
                }
            }

            unitBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPowerUnit = newUnit;
            unitLabel.textContent = newUnit === 'hp' ? 'KM' : 'kW';
        });
    });

    document.getElementById('btnTechBack').addEventListener('click', goPrev);
    document.getElementById('btnTechNext').addEventListener('click', () => {
        const engineCc = document.getElementById('fEngineCC').value;
        const powerVal = parseFloat(powerInput.value);

        if (!fuelSel.value) return alert('Izberite vrsto goriva.');
        if (!document.getElementById('fTransmission').value) return alert('Izberite menjalnik.');
        if (!engineCc) return alert('Vnesite prostornino motorja.');
        if (isNaN(powerVal)) return alert('Vnesite moč vozila.');

        state.fuel = fuelSel.value;
        state.transmission = document.getElementById('fTransmission').value;
        state.driveType = document.getElementById('fDrive').value;
        state.engineCc = engineCc;
        state.powerKw = currentPowerUnit === 'kw' ? powerVal : Math.round(powerVal / 1.35962);
        state.co2 = document.getElementById('fCo2').value;
        state.emissionClass = document.getElementById('fEuro').value;
        state.towingKg = document.getElementById('fTow').value;
        state.fuelL100kmCombined = document.getElementById('fConsCombined')?.value || '';
        state.fuelL100kmCity = document.getElementById('fConsCity')?.value || '';
        state.fuelL100kmHighway = document.getElementById('fConsHighway')?.value || '';
        state.batteryKwh = document.getElementById('fBattery')?.value || '';
        state.rangeKm = document.getElementById('fRange')?.value || '';
        state.hybridType = document.getElementById('fHybridType')?.value || null;
        goNext();
    });
}

// ── Step 5: Equipment ─────────────────────────────────────────────────────────
function renderEquipmentStep() {
    const groups = getEquipmentForCategory(state.category);

    const groupHtml = groups.map(g => `
        <div class="cl-equipment-group">
            <p class="cl-equipment-group-title"><i data-lucide="${g.icon}"></i> ${g.label}</p>
            <div class="cl-chips">
                ${g.items.map(item => `
                    <button type="button" class="cl-chip ${state.equipment.includes(item.value) ? 'active' : ''}"
                        data-val="${item.value}">${item.label}</button>`).join('')}
            </div>
        </div>`).join('');

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Oprema vozila</h2>
            <p class="cl-step-sub">Izberite vso opremo, ki jo vozilo ima. Preskočite, če ni relevantno.</p>
            ${groupHtml}
            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnEqBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnEqNext">Nadaljuj</button>
            </div>
        </div>
    `);

    if (window.lucide) window.lucide.createIcons();

    document.querySelectorAll('.cl-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const val = chip.dataset.val;
            if (state.equipment.includes(val)) {
                state.equipment = state.equipment.filter(v => v !== val);
                chip.classList.remove('active');
            } else {
                state.equipment = [...state.equipment, val];
                chip.classList.add('active');
            }
        });
    });

    document.getElementById('btnEqBack').addEventListener('click', goPrev);
    document.getElementById('btnEqNext').addEventListener('click', goNext);
}

// ── Step 6: Media ─────────────────────────────────────────────────────────────
let _mediaTab = 'exterior'; // 'exterior' | 'interior'

function renderMediaStep() {
    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Fotografije</h2>
            <p class="cl-step-sub">Dodajte fotografije vozila ločeno po zunanjosti in notranjosti.</p>

            <div class="cl-media-tabs">
                <button class="cl-media-tab ${_mediaTab === 'exterior' ? 'active' : ''}" data-tab="exterior">
                    🚗 Zunanjost
                    <span class="cl-media-tab-count" id="extCount">${state._exteriorFiles.length}</span>
                </button>
                <button class="cl-media-tab ${_mediaTab === 'interior' ? 'active' : ''}" data-tab="interior">
                    🪑 Notranjost
                    <span class="cl-media-tab-count" id="intCount">${state._interiorFiles.length}</span>
                </button>
            </div>

            <div class="cl-dropzone" id="dropzone">
                <div class="cl-dropzone-icon">📷</div>
                <p id="dropzoneLabel">${_mediaTab === 'exterior' ? 'Fotografije zunanjosti vozila' : 'Fotografije notranjosti vozila'}</p>
                <small>JPG, PNG, WEBP — max 10 MB/slika — priporočeno vsaj 4 slike</small>
                <input type="file" id="fileInput" multiple accept="image/*" style="display:none;" />
            </div>

            <div class="cl-thumb-grid" id="thumbGrid"></div>
            <p class="cl-thumb-hint" id="thumbHint" style="display:none;">
                ${_mediaTab === 'exterior' ? '⭐ = Naslovna slika &nbsp;·&nbsp; Kliknite sliko za nastavi kot naslovna &nbsp;·&nbsp;' : ''} × za odstranitev
            </p>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnMediaBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnMediaNext">Nadaljuj</button>
            </div>
        </div>
    `);

    bindMediaDropzone();
    renderThumbs();

    document.querySelectorAll('.cl-media-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            _mediaTab = btn.dataset.tab;
            renderMediaStep();
        });
    });

    document.getElementById('btnMediaBack').addEventListener('click', goPrev);
    document.getElementById('btnMediaNext').addEventListener('click', () => {
        if (state._exteriorFiles.length === 0) return alert('Dodajte vsaj eno fotografijo zunanjosti vozila.');
        goNext();
    });
}

function bindMediaDropzone() {
    const dz = document.getElementById('dropzone');
    const fi = document.getElementById('fileInput');

    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); addFiles(e.dataTransfer.files); });
    fi.addEventListener('change', () => addFiles(fi.files));
}

function addFiles(fileList) {
    const isExterior = _mediaTab === 'exterior';
    const files = isExterior ? state._exteriorFiles : state._interiorFiles;
    const urls = isExterior ? state._exteriorUrls : state._interiorUrls;

    Array.from(fileList).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 10 * 1024 * 1024) return alert(`${file.name} je prevelika (max 10 MB).`);
        files.push(file);
        urls.push(URL.createObjectURL(file));
    });
    renderThumbs();
    // Update tab counts
    const extCount = document.getElementById('extCount');
    const intCount = document.getElementById('intCount');
    if (extCount) extCount.textContent = state._exteriorFiles.length;
    if (intCount) intCount.textContent = state._interiorFiles.length;
}

function renderThumbs() {
    const grid = document.getElementById('thumbGrid');
    const hint = document.getElementById('thumbHint');
    if (!grid) return;

    const isExterior = _mediaTab === 'exterior';
    const files = isExterior ? state._exteriorFiles : state._interiorFiles;
    const urls = isExterior ? state._exteriorUrls : state._interiorUrls;

    if (files.length === 0) {
        grid.innerHTML = '';
        if (hint) hint.style.display = 'none';
        return;
    }

    if (hint) hint.style.display = 'block';

    grid.innerHTML = urls.map((url, i) => `
        <div class="cl-thumb ${isExterior && i === state.coverIndex ? 'is-cover' : ''}" data-idx="${i}">
            <img src="${url}" alt="Slika ${i+1}" />
            ${isExterior && i === state.coverIndex ? '<span class="cl-thumb-cover-badge">⭐ Naslovna</span>' : ''}
            <button class="cl-thumb-remove" data-remove="${i}" title="Odstrani">×</button>
        </div>`).join('');

    grid.querySelectorAll('.cl-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            if (e.target.closest('[data-remove]')) return;
            if (isExterior) {
                state.coverIndex = Number(thumb.dataset.idx);
                renderThumbs();
            }
        });
    });

    grid.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.remove);
            URL.revokeObjectURL(urls[idx]);
            files.splice(idx, 1);
            urls.splice(idx, 1);
            if (isExterior && state.coverIndex >= files.length) state.coverIndex = 0;
            renderThumbs();
            const extCount = document.getElementById('extCount');
            const intCount = document.getElementById('intCount');
            if (extCount) extCount.textContent = state._exteriorFiles.length;
            if (intCount) intCount.textContent = state._interiorFiles.length;
        });
    });
}

// ── Step 7: Description ───────────────────────────────────────────────────────
function renderDescriptionStep() {
    const isBusiness = state.sellerType === 'business';
    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Opis vozila</h2>
            <p class="cl-step-sub">Opišite vozilo, vzdrževanje, razlog prodaje. (neobvezno)</p>

            <div class="cl-field">
                <label class="cl-label">Opis</label>
                <textarea class="cl-textarea" id="fDesc" maxlength="3000" placeholder="Opišite vozilo — servisna knjiga, vzdrževanje, posebnosti, razlog prodaje...">${escHtml(state.description || '')}</textarea>
                <span id="descCount" style="font-size:0.75rem;color:#94a3b8;text-align:right;">${(state.description||'').length} / 3000</span>
            </div>

            ${isBusiness ? `
            <p style="font-size:0.82rem;color:#92400e;padding:0.75rem 1rem;background:#fef3c7;border-radius:0.6rem;border:1px solid #fde68a;margin-bottom:0.75rem;">
                ⚠️ V opis prosimo ne vpisujte pogojev za leasing ali hitre kredite — za to je namenjen poseben razdelek v naslednjem koraku.
            </p>` : ''}

            <p style="font-size:0.82rem;color:#64748b;padding:0.75rem 1rem;background:rgba(37,99,235,0.04);border-radius:0.6rem;border:1px solid rgba(37,99,235,0.1);">
                💡 Oglasi z opisom prejmejo v povprečju 3× več kontaktov.
            </p>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnDescBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnDescNext">Nadaljuj</button>
            </div>
        </div>
    `);

    const ta = document.getElementById('fDesc');
    const cnt = document.getElementById('descCount');
    ta.addEventListener('input', () => { cnt.textContent = `${ta.value.length} / 3000`; });

    document.getElementById('btnDescBack').addEventListener('click', goPrev);
    document.getElementById('btnDescNext').addEventListener('click', () => {
        state.description = ta.value.trim();
        goNext();
    });
}

// ── Step 8: Price ─────────────────────────────────────────────────────────────
function renderPriceStep() {
    const callForPrice = !!state.callForPrice;

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Cena</h2>
            <p class="cl-step-sub">Določite ceno vašega vozila.</p>

            <div class="cl-checkboxes" style="margin-bottom:1rem;">
                <label class="cl-checkbox-label">
                    <input type="checkbox" id="fCallForPrice" ${callForPrice ? 'checked' : ''} />
                    Pokliči za ceno
                </label>
            </div>

            <div class="cl-field" id="priceFieldWrap" style="${callForPrice ? 'display:none;' : ''}">
                <label class="cl-label">Cena (€) <span class="req">*</span></label>
                <div class="cl-price-wrap">
                    <input class="cl-input" id="fPrice" type="text"
                        value="${formatNumberWithCommas(state.priceEur)}" placeholder="0" autocomplete="off" />
                    <span class="cl-price-currency">€</span>
                </div>
            </div>


            <div class="cl-checkboxes">
                <label class="cl-checkbox-label">
                    <input type="checkbox" id="fNeg" ${state.priceNegotiable ? 'checked' : ''} />
                    Cena je pogajalska
                </label>
                <label class="cl-checkbox-label">
                    <input type="checkbox" id="fFinalPrice" ${state.priceIsFinal ? 'checked' : ''} />
                    Cena je zadnja
                </label>
                <label class="cl-checkbox-label">
                    <input type="checkbox" id="fVat" ${state.priceInclVat ? 'checked' : ''} />
                    Cena vključuje DDV (za pravne osebe)
                </label>
                ${state.sellerType !== 'business' ? `
                <label class="cl-checkbox-label">
                    <input type="checkbox" id="fLease" ${state.leaseAvailable ? 'checked' : ''} />
                    Možnost leasinga
                </label>` : ''}
            </div>

            ${state.sellerType === 'business' ? `
            <hr style="border:none;border-top:1px solid rgba(0,0,0,0.07);margin:1.25rem 0;" />
            <div class="cl-field">
                <label class="cl-label" style="font-weight:600;">Leasing / hitri kredit</label>
                <p style="font-size:0.82rem;color:#64748b;margin:0 0 0.75rem;">Ali strankam ponujate možnost leasinga ali hitrega kredita?</p>
                <div class="cl-checkboxes" style="margin-bottom:0.75rem;">
                    <label class="cl-checkbox-label">
                        <input type="checkbox" id="fOffersLeasing" ${state.leasingConditions ? 'checked' : ''} />
                        Da, ponujamo leasing / hitri kredit
                    </label>
                </div>
                <div id="leasingConditionsWrap" style="display:${state.leasingConditions ? 'block' : 'none'};">
                    <label class="cl-label">Pogoji in informacije</label>
                    <textarea class="cl-textarea" id="fLeasingConditions" maxlength="1000"
                        placeholder="Opišite pogoje leasinga ali hitrega kredita — partnerske banke, minimalni znesek, ročnost, obrestna mera..."
                        style="min-height:120px;">${escHtml(state.leasingConditions || '')}</textarea>
                    <span style="font-size:0.75rem;color:#94a3b8;text-align:right;display:block;" id="leasingCount">${(state.leasingConditions||'').length} / 1000</span>
                </div>
            </div>` : ''}

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnPriceBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnPriceNext">Nadaljuj</button>
            </div>
        </div>
    `);

    document.getElementById('fCallForPrice').addEventListener('change', e => {
        document.getElementById('priceFieldWrap').style.display = e.target.checked ? 'none' : '';
    });

    const priceInput = document.getElementById('fPrice');
    if (state._imported?.price) priceInput?.classList.add('imported-field');

    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (raw === '') {
                e.target.value = '';
                return;
            }
            e.target.value = formatNumberWithCommas(raw);
        });
    }

    // Toggle leasing conditions textarea visibility for business sellers
    const offersLeasingEl = document.getElementById('fOffersLeasing');
    if (offersLeasingEl) {
        offersLeasingEl.addEventListener('change', e => {
            document.getElementById('leasingConditionsWrap').style.display = e.target.checked ? 'block' : 'none';
        });
        const leasingTextarea = document.getElementById('fLeasingConditions');
        const leasingCount = document.getElementById('leasingCount');
        if (leasingTextarea && leasingCount) {
            leasingTextarea.addEventListener('input', () => {
                leasingCount.textContent = `${leasingTextarea.value.length} / 1000`;
            });
        }
    }

    document.getElementById('btnPriceBack').addEventListener('click', goPrev);
    document.getElementById('btnPriceNext').addEventListener('click', () => {
        const isCallForPrice = document.getElementById('fCallForPrice').checked;
        if (!isCallForPrice) {
            const priceRaw = document.getElementById('fPrice').value;
            const price = parseNumberFromCommas(priceRaw);
            if (!price || price <= 0) return alert('Vnesite veljavno ceno.');
            state.priceEur = price;
        } else {
            state.priceEur = 0;
        }

        state.callForPrice = isCallForPrice;
        state.priceNegotiable = document.getElementById('fNeg').checked;
        state.priceIsFinal = document.getElementById('fFinalPrice').checked;
        state.priceInclVat = document.getElementById('fVat').checked;

        if (state.sellerType === 'business') {
            const offersLeasing = document.getElementById('fOffersLeasing')?.checked;
            state.leaseAvailable = offersLeasing || false;
            state.leasingConditions = offersLeasing
                ? (document.getElementById('fLeasingConditions')?.value.trim() || '')
                : '';
        } else {
            state.leaseAvailable = document.getElementById('fLease')?.checked || false;
            state.leasingConditions = '';
        }

        goNext();
    });
}

// ── Step 9: Location & contact ────────────────────────────────────────────────
function renderLocationStep() {
    const regions = ['Osrednjeslovenska','Gorenjska','Podravska','Savinjska','Dolenjska','Obalno-kraška','Koroška','Pomurska','Zasavska','Posavska','Primorsko-notranjska','Goriška'];
    const isBusiness = state.sellerType === 'business';

    const BH_DAYS = [
        { key: 'mon', label: 'Ponedeljek' },
        { key: 'tue', label: 'Torek' },
        { key: 'wed', label: 'Sreda' },
        { key: 'thu', label: 'Četrtek' },
        { key: 'fri', label: 'Petek' },
        { key: 'sat', label: 'Sobota' },
        { key: 'sun', label: 'Nedelja' },
    ];
    const bh = state.businessHours || {};

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Lokacija in kontakt</h2>
            <p class="cl-step-sub">Kupci bodo videli mesto — ne natančnega naslova.</p>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Mesto <span class="req">*</span></label>
                    <input class="cl-input" id="fCity" type="text" value="${escHtml(state.location?.city||'')}" placeholder="npr. Ljubljana" />
                </div>
                <div class="cl-field">
                    <label class="cl-label">Poštna številka</label>
                    <input class="cl-input" id="fPostal" type="text" value="${escHtml(state.location?.postalCode||'')}" placeholder="npr. 1000" />
                </div>
            </div>

            <div class="cl-field">
                <label class="cl-label">Regija</label>
                <select class="cl-select" id="fRegion">
                    <option value="">Izberi regijo</option>
                    ${regions.map(r => `<option value="${r}" ${state.location?.region===r?'selected':''}>${r}</option>`).join('')}
                </select>
            </div>

            <hr style="border:none;border-top:1px solid rgba(0,0,0,0.07);margin:1.25rem 0;" />

            <div class="cl-field">
                <label class="cl-label">Ime kontaktne osebe <span class="req">*</span></label>
                <input class="cl-input" id="fContactName" type="text" value="${escHtml(state.contact?.name||'')}" />
            </div>

            <div class="cl-row">
                <div class="cl-field">
                    <label class="cl-label">Telefonska številka</label>
                    <input class="cl-input" id="fPhone" type="tel" value="${escHtml(state.contact?.phone||'')}" placeholder="+386 ..." />
                </div>
                <div class="cl-field" style="justify-content:flex-end;">
                    <label class="cl-checkbox-label" style="margin-top:1.6rem;">
                        <input type="checkbox" id="fShowPhone" ${state.contact?.showPhone ? 'checked' : ''} />
                        Prikaži telefonsko kupcem
                    </label>
                </div>
            </div>

            ${!isBusiness ? `
            <hr style="border:none;border-top:1px solid rgba(0,0,0,0.07);margin:1.25rem 0;" />
            <div class="cl-field">
                <label class="cl-label">Opomnik za kupce <span style="font-size:0.78rem;color:#94a3b8;">(neobvezno)</span></label>
                <textarea class="cl-input" id="fSellerNote" rows="3" placeholder="npr. Kliči samo po 17:00 uri, Ogled možen ob vikendih..."
                    style="resize:vertical;">${escHtml(state.sellerNote||'')}</textarea>
                <span class="cl-hint">Prikazano pod vašim profilom na oglasu.</span>
            </div>` : ''}

            ${isBusiness ? `
            <hr style="border:none;border-top:1px solid rgba(0,0,0,0.07);margin:1.25rem 0;" />
            <div class="cl-field">
                <label class="cl-label">Delovni čas salona <span style="font-size:0.78rem;color:#94a3b8;">(neobvezno)</span></label>
                <div class="cl-bh-grid" style="display:grid;gap:0.5rem;margin-top:0.5rem;">
                    ${BH_DAYS.map(d => `
                    <div class="cl-bh-row" style="display:grid;grid-template-columns:7rem 1fr 0.4rem 1fr auto;align-items:center;gap:0.5rem;">
                        <label class="cl-checkbox-label" style="margin:0;">
                            <input type="checkbox" class="bh-check" data-day="${d.key}" ${bh[d.key] ? 'checked' : ''} />
                            ${d.label}
                        </label>
                        <input class="cl-input" type="time" id="bh_${d.key}_from" value="${escHtml(bh[d.key]?.from||'08:00')}"
                            ${bh[d.key] ? '' : 'disabled'} style="padding:0.4rem;" />
                        <span style="text-align:center;color:#94a3b8;">–</span>
                        <input class="cl-input" type="time" id="bh_${d.key}_to" value="${escHtml(bh[d.key]?.to||'17:00')}"
                            ${bh[d.key] ? '' : 'disabled'} style="padding:0.4rem;" />
                        <span class="cl-bh-closed" id="bh_${d.key}_label"
                            style="font-size:0.75rem;color:#94a3b8;width:4rem;">${bh[d.key] ? '' : 'Zaprto'}</span>
                    </div>`).join('')}
                </div>
            </div>` : ''}

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnLocBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnLocNext">Nadaljuj</button>
            </div>
        </div>
    `);

    document.getElementById('btnLocBack').addEventListener('click', goPrev);
    initCustomSelects();
    if (window.lucide) window.lucide.createIcons();

    // Wire business hours checkboxes
    if (isBusiness) {
        document.querySelectorAll('.bh-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const day = cb.dataset.day;
                const enabled = cb.checked;
                document.getElementById(`bh_${day}_from`).disabled = !enabled;
                document.getElementById(`bh_${day}_to`).disabled = !enabled;
                document.getElementById(`bh_${day}_label`).textContent = enabled ? '' : 'Zaprto';
            });
        });
    }

    document.getElementById('btnLocNext').addEventListener('click', () => {
        const city = document.getElementById('fCity').value.trim();
        const name = document.getElementById('fContactName').value.trim();
        if (!city) return alert('Vnesite mesto.');
        if (!name) return alert('Vnesite ime kontaktne osebe.');

        state.location = {
            city,
            postalCode: document.getElementById('fPostal').value.trim(),
            region: document.getElementById('fRegion').value,
        };
        state.contact = {
            name,
            phone: document.getElementById('fPhone').value.trim(),
            showPhone: document.getElementById('fShowPhone').checked,
            email: auth.currentUser?.email || '',
        };

        if (!isBusiness) {
            state.sellerNote = document.getElementById('fSellerNote')?.value.trim() || '';
        } else {
            const hours = {};
            BH_DAYS.forEach(d => {
                const cb = document.querySelector(`.bh-check[data-day="${d.key}"]`);
                if (cb?.checked) {
                    hours[d.key] = {
                        from: document.getElementById(`bh_${d.key}_from`).value || '08:00',
                        to:   document.getElementById(`bh_${d.key}_to`).value   || '17:00',
                    };
                }
            });
            state.businessHours = hours;
        }

        goNext();
    });
}

// ── Step 10: Promotion ────────────────────────────────────────────────────────
function renderPromotionStep() {
    const tiers = [
        {
            id: 'free', icon: '📋', name: 'Brezplačno', price: '0 €',
            desc: 'Standardna vidljivost v rezultatih iskanja. Oglas aktiven 60 dni.',
        },
        {
            id: 'homepage', icon: '⭐', name: 'Izpostavljeno', price: '5 € / teden',
            desc: 'Oglas se prikaže v razdelku "Izpostavljeno" na naslovni strani.',
        },
        {
            id: 'sponsored', icon: '🚀', name: 'Sponzorirano', price: '3 € / dan',
            desc: 'Na vrhu rezultatov iskanja. Rumeni rob + oznaka "Sponzoriran oglas".',
        },
    ];

    const cards = tiers.map(t => `
        <div class="cl-promo-card ${state.promotionTier === t.id ? 'selected' : ''}" data-tier="${t.id}">
            <span class="cl-promo-icon">${t.icon}</span>
            <p class="cl-promo-name">${t.name}</p>
            <p class="cl-promo-price">${t.price}</p>
            <p class="cl-promo-desc">${t.desc}</p>
        </div>`).join('');

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Vidnost oglasa</h2>
            <p class="cl-step-sub">Izberite, kako vidno bo vaše vozilo. Vedno lahko spremenite kasneje.</p>

            <div class="cl-promo-grid">${cards}</div>

            <p class="cl-promo-note">
                ℹ Sponzorirani oglasi so jasno označeni z oznako "Sponzoriran oglas".<br>
                Ni skritih stroškov. Brezplačna možnost je vedno na voljo.
            </p>

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnPromoBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnPromoNext">Nadaljuj</button>
            </div>
        </div>
    `);

    document.querySelectorAll('.cl-promo-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.cl-promo-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.promotionTier = card.dataset.tier;
        });
    });

    document.getElementById('btnPromoBack').addEventListener('click', goPrev);
    document.getElementById('btnPromoNext').addEventListener('click', goNext);
}

// ── Step 11: Review ───────────────────────────────────────────────────────────
function renderReviewStep() {
    const fmt = n => new Intl.NumberFormat('sl-SI').format(n);
    const tierLabels = { free: 'Brezplačno', homepage: 'Izpostavljeno', sponsored: 'Sponzorirano' };

    const imgPreview = state._exteriorUrls.length > 0
        ? `<img src="${state._exteriorUrls[state.coverIndex]}" alt="Naslovna" style="width:100%;height:200px;object-fit:cover;border-radius:0.85rem;margin-bottom:1rem;" />`
        : '';

    function section(title, stepId, rows) {
        const items = rows.filter(([,v]) => v).map(([l,v]) => `
            <div class="cl-review-item">
                <span class="cl-review-item-label">${l}</span>
                <span class="cl-review-item-value">${escHtml(String(v))}</span>
            </div>`).join('');
        return `
            <div class="cl-review-section">
                <div class="cl-review-section-header">
                    <span class="cl-review-section-title">${title}</span>
                    <button class="cl-review-edit-btn" data-jump="${stepId}">✎ Uredi</button>
                </div>
                <div class="cl-review-grid">${items}</div>
            </div>`;
    }

    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Pregled oglasa</h2>
            <p class="cl-step-sub">Preverite podatke pred objavo. Kliknite Uredi za popravke.</p>

            ${imgPreview}
            <p style="font-size:0.8rem;color:#94a3b8;margin-bottom:1.5rem;">
                ${state._exteriorFiles.length} zunanjost · ${state._interiorFiles.length} notranjost
            </p>

            ${section('Kategorija', 'category', [
                ['Kategorija', state.category],
                ['Podkategorija', state.subcategory],
            ])}

            ${section('Osnovni podatki', 'basic', [
                ['Znamka', state.make],
                ['Model', state.model],
                ['Letnik', state.year],
                ['Km', state.mileageKm ? fmt(state.mileageKm) + ' km' : ''],
                ['Stanje', state.condition],
                ['Barva', state.color],
            ])}

            ${section('Tehnični podatki', 'technical', [
                ['Gorivo', state.fuel],
                ['Menjalnik', state.transmission],
                ['Moč', state.powerKw ? state.powerKw + ' kW (' + Math.round(state.powerKw * 1.35962) + ' KM)' : ''],
                ['Prostornina', state.engineCc ? state.engineCc + ' cc' : ''],
                ['Poraba (komb.)', state.fuelL100kmCombined ? state.fuelL100kmCombined + ' L/100km' : ''],
                ['Poraba (mesto)', state.fuelL100kmCity ? state.fuelL100kmCity + ' L/100km' : ''],
                ['Poraba (izven)', state.fuelL100kmHighway ? state.fuelL100kmHighway + ' L/100km' : ''],
                ['Domet WLTP', state.rangeKm ? state.rangeKm + ' km' : ''],
                ['Emisije', state.emissionClass],
            ])}

            ${section('Cena', 'price', [
                ['Cena', state.callForPrice ? 'Pokliči za ceno' : (state.priceEur ? fmt(state.priceEur) + ' €' : '')],
                ['Pogajanje', state.priceNegotiable ? 'Da' : 'Ne'],
            ])}

            ${section('Lokacija', 'location', [
                ['Mesto', state.location?.city],
                ['Regija', state.location?.region],
                ['Kontakt', state.contact?.name],
            ])}

            ${section('Vidnost', 'promotion', [
                ['Tier', tierLabels[state.promotionTier] || state.promotionTier],
            ])}

            ${state.vinVerified ? `
            <div class="cl-review-section">
                <div class="cl-review-section-header">
                    <span class="cl-review-section-title">🛡 VIN Verificirano</span>
                </div>
                <p style="font-size:0.82rem;color:#1d4ed8;">${state.vin}</p>
            </div>` : ''}

            <div class="cl-nav">
                <button class="cl-btn cl-btn--ghost" id="btnRevBack">Nazaj</button>
                <button class="cl-btn cl-btn--primary" id="btnRevNext">Objavi oglas</button>
            </div>
        </div>
    `);

    document.querySelectorAll('[data-jump]').forEach(btn => {
        btn.addEventListener('click', () => jumpToStep(btn.dataset.jump));
    });

    document.getElementById('btnRevBack').addEventListener('click', goPrev);
    document.getElementById('btnRevNext').addEventListener('click', () => {
        if (auth.currentUser) {
            submitListing(auth.currentUser);
        } else {
            goNext(); // go to auth step
        }
    });
}

// ── Step 12: Auth ─────────────────────────────────────────────────────────────
function renderAuthStep() {
    setHtml(`
        <div class="cl-card">
            <h2 class="cl-step-title">Prijava za objavo</h2>
            <p class="cl-step-sub">Prijavite se — vsi vaši podatki bodo ohranjeni.</p>

            <div class="cl-auth-wrap">
                <div class="cl-auth-info">
                    🔒 Vaš oglas je pripravljen. Prijavite se za objavo.
                </div>

                <button class="cl-btn cl-btn--google" id="btnGoogle">
                    <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="" />
                    Nadaljuj z Google
                </button>

                <div class="cl-or">ali</div>

                <div class="cl-field">
                    <label class="cl-label">E-pošta</label>
                    <input class="cl-input" id="authEmail" type="email" placeholder="vas@email.com" />
                </div>
                <div class="cl-field">
                    <label class="cl-label">Geslo</label>
                    <input class="cl-input" id="authPassword" type="password" placeholder="••••••••" />
                </div>

                <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
                    <button class="cl-btn cl-btn--primary" id="btnLogin" style="flex:1;">Prijava</button>
                    <button class="cl-btn cl-btn--secondary" id="btnRegister" style="flex:1;">Registracija</button>
                </div>

                <p id="authError" style="color:#dc2626;font-size:0.82rem;margin-top:0.75rem;display:none;"></p>
            </div>

            <div class="cl-nav" style="margin-top:1.25rem;">
                <button class="cl-btn cl-btn--ghost" id="btnAuthBack">Nazaj</button>
            </div>
        </div>
    `);

    document.getElementById('btnAuthBack').addEventListener('click', goPrev);

    const showErr = msg => {
        const el = document.getElementById('authError');
        el.textContent = msg;
        el.style.display = 'block';
    };

    document.getElementById('btnGoogle').addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            await submitListing(result.user);
        } catch (e) { showErr(e.message); }
    });

    document.getElementById('btnLogin').addEventListener('click', async () => {
        try {
            const email = document.getElementById('authEmail').value;
            const pw = document.getElementById('authPassword').value;
            const result = await signInWithEmailAndPassword(auth, email, pw);
            await submitListing(result.user);
        } catch (e) { showErr('Napaka pri prijavi: ' + e.message); }
    });

    document.getElementById('btnRegister').addEventListener('click', async () => {
        try {
            const email = document.getElementById('authEmail').value;
            const pw = document.getElementById('authPassword').value;
            const result = await createUserWithEmailAndPassword(auth, email, pw);
            await submitListing(result.user);
        } catch (e) { showErr('Napaka pri registraciji: ' + e.message); }
    });
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function submitListing(user) {
    const container = document.getElementById('clStepContainer');
    container.innerHTML = `
        <div class="cl-card" style="text-align:center;padding:3rem 2rem;">
            <div class="cl-vin-spinner" style="margin:0 auto 1.5rem;"></div>
            <h2 class="cl-step-title">Objavljam oglas...</h2>
            <p class="cl-step-sub">Nalagam fotografije in shranjujem oglas.</p>
        </div>`;

    if (window.lucide) window.lucide.createIcons();

    try {
        const userDoc = await getCurrentUserDoc();
        if (userDoc && userDoc.sellerType) {
            state.sellerType = userDoc.sellerType;
        }
        const id = await createListing(state, state._exteriorFiles, state._interiorFiles, user);
        clearDraft();
        state._exteriorUrls.forEach(url => URL.revokeObjectURL(url));
        state._interiorUrls.forEach(url => URL.revokeObjectURL(url));

        container.innerHTML = `
            <div class="cl-card" style="text-align:center;padding:3rem 2rem;">
                <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
                <h2 class="cl-step-title">Oglas je objavljen!</h2>
                <p class="cl-step-sub">Vaše vozilo je vidno kupcem.</p>
                <div style="display:flex;gap:0.75rem;justify-content:center;margin-top:1.5rem;">
                    <a href="#/oglas?id=${id}" class="cl-btn cl-btn--primary">Oglej si oglas</a>
                    <a href="#/dashboard" class="cl-btn cl-btn--secondary">Moji oglasi</a>
                </div>
            </div>`;

        document.getElementById('clProgress').style.display = 'none';
    } catch (err) {
        console.error('[CreateListing] submit error:', err);
        container.innerHTML = `
            <div class="cl-card" style="text-align:center;padding:3rem 2rem;">
                <div style="font-size:3rem;margin-bottom:1rem;">❌</div>
                <h2 class="cl-step-title">Napaka pri objavi</h2>
                <p class="cl-step-sub">${escHtml(err.message)}</p>
                <button class="cl-btn cl-btn--primary" onclick="location.reload()">Poskusi znova</button>
            </div>`;
    }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function setHtml(html) {
    const el = document.getElementById('clStepContainer');
    if (el) el.innerHTML = html;
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
