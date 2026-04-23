// B2B Import Profitability Evaluator — MojAvto.si
import { EQUIPMENT_GROUPS } from '../data/equipment.js';
import { mapEquipmentWithGemini } from '../services/geminiService.js';

// ── Cost constants (editable via UI) ─────────────────────────────────────────
const DEFAULTS = {
  transport:   600,   // EUR — Nemčija → Slovenija
  homologation: 350,  // EUR — povprečni stroški homologacije
  registration: 180,  // EUR — registracija
  margin:       0.12, // 12 % prodajna marža
};

// Fuel labels for mapping German → Slovenian
const FUEL_MAP = {
  petrol:   'Bencin', gasoline: 'Bencin', benzin: 'Bencin',
  diesel:   'Dizel',
  electric: 'Elektrika', elektro: 'Elektrika',
  hybrid:   'Hibrid (plug-in)', 'plug-in hybrid': 'Hibrid (plug-in)',
  lpg:      'LPG',
};

export async function initB2bEvaluatePage() {
  const page = document.getElementById('b2b-evaluate-page');
  if (!page) return;

  // ── 1. Parse import data from URL ─────────────────────────────────────────
  const hash = window.location.hash; // e.g. #/b2b/oceni?importData=...
  const qStart = hash.indexOf('?');
  const params = new URLSearchParams(qStart !== -1 ? hash.slice(qStart + 1) : '');
  const importRaw = params.get('importData');
  let imported = null;
  if (importRaw) {
    try { imported = JSON.parse(decodeURIComponent(importRaw)); } catch { /* ignore */ }
  }

  // ── 2. Render shell ────────────────────────────────────────────────────────
  page.innerHTML = buildPageHtml(imported);
  if (window.lucide) window.lucide.createIcons();

  // ── 3. Pre-fill form if import data exists ────────────────────────────────
  if (imported) prefillForm(imported);

  // ── 4. AI equipment mapping ───────────────────────────────────────────────
  if (imported?.rawEquipment) {
    await runEquipmentAI(imported.rawEquipment);
  }

  // ── 5. Bind calculate button ──────────────────────────────────────────────
  document.getElementById('calcBtn')?.addEventListener('click', runCalculation);

  // ── 6. Auto-trigger calculation if data was imported ─────────────────────
  if (imported?.price) {
    runCalculation();
  }
}

// ── Form prefill ──────────────────────────────────────────────────────────────
function prefillForm(d) {
  setVal('bbePrice',    d.price);
  setVal('bbeBrand',    d.brand);
  setVal('bbeModel',    d.model);
  setVal('bbeYear',     d.year);
  setVal('bbeMileage',  d.mileage);
  if (d.fuelType) {
    const mapped = FUEL_MAP[d.fuelType.toLowerCase()] || d.fuelType;
    setVal('bbeFuel', mapped);
  }
  if (d.url) {
    const link = document.getElementById('bbeSourceLink');
    if (link) { link.href = d.url; link.style.display = 'inline'; }
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== null && val !== undefined) el.value = val;
}

// ── AI equipment mapping ───────────────────────────────────────────────────────
async function runEquipmentAI(rawText) {
  const statusEl = document.getElementById('aiStatus');
  if (statusEl) {
    statusEl.style.display = 'flex';
    statusEl.innerHTML = `<span class="ai-spinner"></span> AI analizira opremo (${rawText.length} znakov)...`;
  }

  try {
    const slugs = await mapEquipmentWithGemini(rawText);
    if (statusEl) {
      statusEl.innerHTML = slugs.length
        ? `✅ AI zaznal ${slugs.length} kosov opreme`
        : '⚠ Oprema ni bila zaznana';
    }
    slugs.forEach(slug => {
      const cb = document.querySelector(`input[type="checkbox"][value="${slug}"]`);
      if (cb) cb.checked = true;
    });
  } catch (err) {
    console.error('[B2B] Gemini napaka:', err);
    if (statusEl) statusEl.innerHTML = '⚠ AI mapiranje ni uspelo: ' + err.message;
  }
}

// ── Calculation ───────────────────────────────────────────────────────────────
function runCalculation() {
  const purchasePrice = parseFloat(document.getElementById('bbePrice')?.value) || 0;
  const transport     = parseFloat(document.getElementById('bbeTransport')?.value) || DEFAULTS.transport;
  const homologation  = parseFloat(document.getElementById('bbeHomologation')?.value) || DEFAULTS.homologation;
  const registration  = parseFloat(document.getElementById('bbeRegistration')?.value) || DEFAULTS.registration;
  const marginPct     = (parseFloat(document.getElementById('bbeMargin')?.value) || DEFAULTS.margin * 100) / 100;

  if (!purchasePrice) {
    showResultError('Vnesite nakupno ceno vozila.');
    return;
  }

  const totalCost   = purchasePrice + transport + homologation + registration;
  const salePrice   = totalCost * (1 + marginPct);
  const profit      = salePrice - totalCost;

  const checkedEquip = Array.from(
    document.querySelectorAll('#equipmentGrid input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  renderResult({ purchasePrice, transport, homologation, registration, totalCost, salePrice, profit, marginPct, checkedEquip });
}

function showResultError(msg) {
  const el = document.getElementById('calcResult');
  if (el) el.innerHTML = `<div class="bbe-result-error">${msg}</div>`;
}

function renderResult({ purchasePrice, transport, homologation, registration, totalCost, salePrice, profit, marginPct, checkedEquip }) {
  const el = document.getElementById('calcResult');
  if (!el) return;

  const fmt = n => new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const profitColor = profit >= 0 ? '#16a34a' : '#dc2626';

  el.innerHTML = `
    <div class="bbe-result-card">
      <h3 class="bbe-result-title">📊 Rezultat kalkulacije</h3>
      <div class="bbe-cost-rows">
        <div class="bbe-cost-row"><span>Nakupna cena</span><span>${fmt(purchasePrice)}</span></div>
        <div class="bbe-cost-row"><span>Transport</span><span>${fmt(transport)}</span></div>
        <div class="bbe-cost-row"><span>Homologacija</span><span>${fmt(homologation)}</span></div>
        <div class="bbe-cost-row"><span>Registracija</span><span>${fmt(registration)}</span></div>
        <div class="bbe-cost-row total"><span>Skupni stroški</span><span>${fmt(totalCost)}</span></div>
        <div class="bbe-cost-row sale"><span>Prodajna cena (marža ${Math.round(marginPct * 100)}%)</span><span>${fmt(salePrice)}</span></div>
        <div class="bbe-cost-row profit" style="color:${profitColor}">
          <span>Čisti dobiček</span><span>${fmt(profit)}</span>
        </div>
      </div>
      ${checkedEquip.length ? `
      <div class="bbe-equip-summary">
        <span class="bbe-equip-label">Zaznana oprema (${checkedEquip.length}):</span>
        <div class="bbe-equip-chips">${checkedEquip.map(s => `<span class="bbe-chip">${s}</span>`).join('')}</div>
      </div>` : ''}
    </div>`;
}

// ── Page HTML builder ──────────────────────────────────────────────────────────
function buildPageHtml(imported) {
  const equipHtml = EQUIPMENT_GROUPS
    .filter(g => g.categories.includes('avto') || g.categories.includes('all'))
    .map(g => `
      <div class="bbe-equip-group">
        <div class="bbe-equip-group-label">
          <i data-lucide="${g.icon}"></i>${escHtml(g.label)}
        </div>
        <div class="bbe-equip-items">
          ${g.items.map(i => `
            <label class="bbe-equip-item">
              <input type="checkbox" value="${escHtml(i.value)}" />
              <span>${escHtml(i.label)}</span>
            </label>`).join('')}
        </div>
      </div>`).join('');

  const importedBanner = imported ? `
    <div class="bbe-import-banner">
      <i data-lucide="download"></i>
      Podatki uvoženi iz: <a id="bbeSourceLink" href="#" target="_blank" rel="noopener" style="display:none;color:#2563eb;">Mobile.de oglas</a>
      <span id="bbeSourceLabel">${escHtml(imported.brand || '')} ${escHtml(imported.model || '')}</span>
    </div>` : '';

  return `
    <div class="bbe-container">
      <div class="bbe-header">
        <i data-lucide="calculator"></i>
        <div>
          <h1 class="bbe-title">B2B Uvozni kalkulator</h1>
          <p class="bbe-subtitle">Profitabilnost uvoza vozila iz tujine</p>
        </div>
      </div>

      ${importedBanner}

      <div id="aiStatus" class="bbe-ai-status" style="display:none;"></div>

      <div class="bbe-layout">
        <!-- LEFT: form -->
        <div class="bbe-form-col">
          <div class="bbe-card glass-card">
            <h2 class="bbe-card-title">Podatki o vozilu</h2>
            <div class="bbe-fields">
              <div class="bbe-field-row">
                <div class="bbe-field">
                  <label>Znamka</label>
                  <input id="bbeBrand" type="text" placeholder="npr. BMW" />
                </div>
                <div class="bbe-field">
                  <label>Model</label>
                  <input id="bbeModel" type="text" placeholder="npr. 320d" />
                </div>
              </div>
              <div class="bbe-field-row">
                <div class="bbe-field">
                  <label>Letnik</label>
                  <input id="bbeYear" type="number" placeholder="2020" min="1990" max="2030" />
                </div>
                <div class="bbe-field">
                  <label>Kilometri</label>
                  <input id="bbeMileage" type="number" placeholder="85000" min="0" />
                </div>
              </div>
              <div class="bbe-field">
                <label>Gorivo</label>
                <input id="bbeFuel" type="text" placeholder="Dizel" />
              </div>
            </div>
          </div>

          <div class="bbe-card glass-card">
            <h2 class="bbe-card-title">Stroški uvoza</h2>
            <div class="bbe-fields">
              <div class="bbe-field">
                <label>Nakupna cena (€) <span class="bbe-required">*</span></label>
                <input id="bbePrice" type="number" placeholder="15000" min="0" />
              </div>
              <div class="bbe-field-row">
                <div class="bbe-field">
                  <label>Transport (€)</label>
                  <input id="bbeTransport" type="number" value="${DEFAULTS.transport}" min="0" />
                </div>
                <div class="bbe-field">
                  <label>Homologacija (€)</label>
                  <input id="bbeHomologation" type="number" value="${DEFAULTS.homologation}" min="0" />
                </div>
              </div>
              <div class="bbe-field-row">
                <div class="bbe-field">
                  <label>Registracija (€)</label>
                  <input id="bbeRegistration" type="number" value="${DEFAULTS.registration}" min="0" />
                </div>
                <div class="bbe-field">
                  <label>Marža (%)</label>
                  <input id="bbeMargin" type="number" value="${DEFAULTS.margin * 100}" min="0" max="100" step="0.5" />
                </div>
              </div>
            </div>
            <button id="calcBtn" class="bbe-calc-btn">
              <i data-lucide="calculator"></i>
              Izračunaj profitabilnost
            </button>
          </div>

          <div id="calcResult"></div>
        </div>

        <!-- RIGHT: equipment -->
        <div class="bbe-equip-col">
          <div class="bbe-card glass-card">
            <h2 class="bbe-card-title">Oprema vozila</h2>
            <p class="bbe-equip-hint">AI samodejno označi zaznano opremo iz nemškega besedila.</p>
            <div id="equipmentGrid" class="bbe-equip-grid">
              ${equipHtml}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
