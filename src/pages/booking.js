// booking.js — Booking Wizard Controller — MojAvto.si
// Multi-step wizard: Vehicle → Type → Services → Products → DateTime → Confirm

import { getBusinessById } from '../services/businessService.js';
import {
    getServicesForBusiness,
    getProductsForServices,
    calculateTotal,
    saveBooking,
    getVehiclesForUser,
    saveVehicle,
    formatBookingDate,
} from '../services/bookingService.js';
import {
    carBrands,
    carModels,
    timeSlots,
    unavailableSlots,
} from '../data/bookingData.js';
import { store } from '../store/store.js';
import QRCode from 'qrcode';
import { buildGoogleCalendarUrl } from '../services/googleCalendarService.js';
import { getTireOrder, markTireOrderOrdered } from '../services/b2bService.js';

// ── Wizard state (reset on every initBookingPage call) ────────
let state = {};

function resetState() {
    state = {
        businessId: null,
        business: null,

        currentStep: 1,
        totalSteps: 6,      // 5 for non-vulcanizers (step 2 skipped)

        // Step 1
        selectedVehicleId: null,
        vehicles: [],

        // Step 2 (only for vulcanizers)
        bookingType: 'bring_own',

        // Step 3
        selectedServiceIds: [],

        // Step 4
        selectedProducts: [],   // [{ productId, qty }]

        // Step 5
        selectedDate: null,
        selectedTime: null,
        notes: '',

        // Calendar navigation
        calendarYear: new Date().getFullYear(),
        calendarMonth: new Date().getMonth(),

        // Confirmation toggles & service number
        sendConfirmEmail: false,
        sendConfirmSms: false,
        serviceNumber: null,

        // Computed
        priceBreakdown: null,

        // Tire order (from URL param tireOrderId)
        tireOrder: null,
        tireOrderId: null,
        skipProductsForTireOrder: false,
    };
}

// ── Helpers ───────────────────────────────────────────────────
function isVulcanizer(biz) {
    return biz && biz.businessTypes.includes('vulcanizer');
}

function getEffectiveSteps(biz) {
    // Non-vulcanizers skip step 2 (booking type)
    if (!isVulcanizer(biz)) {
        return [1, 3, 4, 5, 6]; // logical steps, mapped to display 1–5
    }
    return [1, 2, 3, 4, 5, 6];
}

function getStepLabels() {
    if (!isVulcanizer(state.business)) {
        return ['Vozilo', 'Storitve', 'Izdelki', 'Termin', 'Potrditev'];
    }
    return ['Vozilo', 'Tip', 'Storitve', 'Izdelki', 'Termin', 'Potrditev'];
}

// Converts display step index (1-based) to logical step number
function logicalStep(displayStep) {
    return getEffectiveSteps(state.business)[displayStep - 1] || displayStep;
}

// Converts logical step to display step
function displayStep(logical) {
    return getEffectiveSteps(state.business).indexOf(logical) + 1;
}

function getUserId() {
    return window.__currentUser?.uid || 'mock-user';
}

// Returns true if there are no products for selected services (step 4 should be skipped)
function shouldSkipProductsStep() {
    if (state.skipProductsForTireOrder) return true;
    return getProductsForServices(state.selectedServiceIds).length === 0;
}

function getMinBookingDate() {
    if (state.tireOrder?.estimatedDeliveryDate) {
        const d = new Date(state.tireOrder.estimatedDeliveryDate);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    if (state.tireHandoff?.estimatedDeliveryDate) {
        const d = new Date(state.tireHandoff.estimatedDeliveryDate);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Generates a human-readable service number
function generateServiceNumber() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `MA-${ymd}-${rand}`;
}

// Async: renders a QR code canvas
async function renderQRCanvas(canvasId, data) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    try {
        await QRCode.toCanvas(el, data, {
            width: 160,
            margin: 2,
            color: { dark: '#1e293b', light: '#ffffff' },
        });
    } catch (e) {
        console.warn('[Booking] QR render failed', e);
    }
}

// ── Step validation ───────────────────────────────────────────
function validateStep(logical) {
    switch (logical) {
        case 1:
            if (!state.selectedVehicleId) return 'Prosim izberite vozilo.';
            return null;
        case 2:
            if (!state.bookingType) return 'Prosim izberite tip rezervacije.';
            return null;
        case 3:
            if (state.selectedServiceIds.length === 0) return 'Prosim izberite vsaj eno storitev.';
            return null;
        case 4:
            return null; // Izdelki so neobvezni
        case 5:
            if (!state.selectedDate) return 'Prosim izberite datum.';
            if (!state.selectedTime) return 'Prosim izberite uro termina.';
            return null;
        case 6:
            return null;
        default:
            return null;
    }
}

// ── Price summary update ──────────────────────────────────────
function updateSummaryPanel() {
    const linesEl = document.getElementById('bookingSummaryLines');
    const totalEl = document.getElementById('bookingSummaryTotal');
    const dividerEl = document.getElementById('bookingSummaryDivider');
    const quoteEl = document.getElementById('bookingSummaryQuote');
    const emptyEl = document.getElementById('bookingSummaryEmpty');
    if (!linesEl) return;

    if (state.selectedServiceIds.length === 0 && state.selectedProducts.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        linesEl.innerHTML = '';
        if (totalEl) totalEl.style.display = 'none';
        if (dividerEl) dividerEl.style.display = 'none';
        if (quoteEl) quoteEl.style.display = 'none';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    const { lineItems, total, hasQuoteItems } = calculateTotal(
        state.selectedServiceIds,
        state.selectedProducts
    );

    state.priceBreakdown = { lineItems, total, hasQuoteItems };

    linesEl.innerHTML = lineItems.map(item => `
        <div class="summary-line">
            <span class="summary-line-label">${item.label}</span>
            <span class="summary-line-price ${item.isQuote ? 'quote' : ''}">
                ${item.isQuote ? 'Po ogledu' : `${item.price} €`}
            </span>
        </div>
    `).join('');

    if (totalEl) {
        if (total > 0) {
            totalEl.style.display = 'flex';
            if (dividerEl) dividerEl.style.display = 'block';
            totalEl.innerHTML = `
                <span class="summary-total-label">Skupaj od</span>
                <span class="summary-total-price">${total} €</span>
            `;
        } else {
            totalEl.style.display = 'none';
            if (dividerEl) dividerEl.style.display = 'none';
        }
    }

    if (quoteEl) quoteEl.style.display = hasQuoteItems ? 'flex' : 'none';

    if (window.lucide) window.lucide.createIcons();
}

// ── Progress bar ──────────────────────────────────────────────
function renderProgress() {
    const track = document.getElementById('bookingProgressTrack');
    if (!track) return;

    const labels = getStepLabels();
    const total = labels.length;
    const currentDisplay = state.currentStep;

    let html = '';
    for (let i = 1; i <= total; i++) {
        const isDone = i < currentDisplay;
        const isActive = i === currentDisplay;
        const cls = isDone ? 'done' : isActive ? 'active' : '';

        html += `<div class="booking-step-pill">
            <div class="booking-step-pill-btn ${cls}">
                ${isDone ? '<i data-lucide="check" style="width:14px;height:14px;"></i>' : i}
            </div>
            <span class="booking-step-pill-label ${cls}">${labels[i - 1]}</span>
        </div>`;

        if (i < total) {
            html += `<div class="booking-step-connector ${isDone ? 'done' : ''}"></div>`;
        }
    }

    track.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

// ── Nav buttons state ────────────────────────────────────────
function updateNavButtons() {
    const backBtn = document.getElementById('wizardBack');
    const nextBtn = document.getElementById('wizardNext');
    if (!backBtn || !nextBtn) return;

    backBtn.style.display = state.currentStep > 1 ? 'inline-flex' : 'none';

    const isLast = state.currentStep === state.totalSteps;
    nextBtn.innerHTML = isLast
        ? '<i data-lucide="check-circle"></i> Potrdi rezervacijo'
        : 'Naprej <i data-lucide="chevron-right"></i>';
    if (window.lucide) window.lucide.createIcons();
}

// ── Step renderer ─────────────────────────────────────────────
function renderStep(stepNum) {
    const wizard = document.getElementById('bookingWizard');
    if (!wizard) return;

    // Exit animation
    wizard.classList.add('step-exit');

    setTimeout(() => {
        wizard.classList.remove('step-exit');
        wizard.classList.add('step-enter');

        const logical = logicalStep(stepNum);
        switch (logical) {
            case 1: wizard.innerHTML = buildStep1(); bindStep1(); break;
            case 2: wizard.innerHTML = buildStep2(); bindStep2(); break;
            case 3: wizard.innerHTML = buildStep3(); bindStep3(); break;
            case 4: wizard.innerHTML = buildStep4(); bindStep4(); break;
            case 5: wizard.innerHTML = buildStep5(); bindStep5(); break;
            case 6: wizard.innerHTML = buildStep6(); bindStep6(); break;
            default: wizard.innerHTML = '';
        }

        requestAnimationFrame(() => wizard.classList.remove('step-enter'));
        updateSummaryPanel();
        if (window.lucide) window.lucide.createIcons();
    }, 150);
}

// ── STEP 1: Vehicle ───────────────────────────────────────────
function buildStep1() {
    const vehicleCards = state.vehicles.map(v => {
        const sel = v.id === state.selectedVehicleId ? 'selected' : '';
        return `
        <div class="vehicle-card glass-card ${sel}" data-vid="${v.id}">
            <div class="vehicle-radio"><div class="vehicle-radio-dot"></div></div>
            <div class="vehicle-icon"><i data-lucide="car"></i></div>
            <div class="vehicle-info">
                <div class="vehicle-name">${v.brand} ${v.model} ${v.year}</div>
                <div class="vehicle-plate">${v.licensePlate || 'Ni registrske številke'}</div>
            </div>
        </div>`;
    }).join('');

    const yearOptions = Array.from({ length: 26 }, (_, i) => 2025 - i)
        .map(y => `<option value="${y}">${y}</option>`).join('');

    const brandOptions = carBrands.map(b =>
        `<option value="${b}">${b}</option>`
    ).join('');

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="car"></i> Izberite vozilo</h2>
        <div class="vehicle-list">${vehicleCards || '<div class="step-empty"><i data-lucide="car"></i>Nimate shranjenega vozila.</div>'}</div>
        <button class="add-vehicle-toggle" id="addVehicleToggle">
            <i data-lucide="plus"></i> Dodaj novo vozilo
        </button>
        <div class="add-vehicle-form glass-card" id="addVehicleForm" style="display:none;">
            <div class="form-row">
                <label>Znamka</label>
                <select id="vBrand" class="glass-select">
                    <option value="">Izberite znamko...</option>
                    ${brandOptions}
                </select>
            </div>
            <div class="form-row">
                <label>Model</label>
                <select id="vModel" class="glass-select" disabled>
                    <option value="">Najprej izberite znamko</option>
                </select>
            </div>
            <div class="form-row">
                <label>Letnik</label>
                <select id="vYear" class="glass-select">
                    <option value="">Letnik...</option>
                    ${yearOptions}
                </select>
            </div>
            <div class="form-row">
                <label>Registrska številka</label>
                <input id="vPlate" class="glass-input" placeholder="npr. LJ A1-234" />
            </div>
            <button class="btn-save-vehicle" id="saveVehicleBtn">
                <i data-lucide="save"></i> Shrani in izberi vozilo
            </button>
        </div>
    </div>`;
}

function bindStep1() {
    // Vehicle card selection
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.addEventListener('click', () => {
            state.selectedVehicleId = card.getAttribute('data-vid');
            document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    // Toggle add form
    document.getElementById('addVehicleToggle')?.addEventListener('click', () => {
        const form = document.getElementById('addVehicleForm');
        if (form) form.style.display = form.style.display === 'none' ? 'grid' : 'none';
    });

    // Cascading brand → model
    document.getElementById('vBrand')?.addEventListener('change', function () {
        const modelSel = document.getElementById('vModel');
        if (!modelSel) return;
        const models = carModels[this.value] || [];
        modelSel.innerHTML = models.length
            ? models.map(m => `<option value="${m}">${m}</option>`).join('')
            : '<option value="">Ni modelov</option>';
        modelSel.disabled = models.length === 0;
    });

    // Save vehicle
    document.getElementById('saveVehicleBtn')?.addEventListener('click', () => {
        const brand = document.getElementById('vBrand')?.value;
        const model = document.getElementById('vModel')?.value;
        const year = parseInt(document.getElementById('vYear')?.value);
        const plate = document.getElementById('vPlate')?.value.trim();

        if (!brand || !model || !year) {
            alert('Prosim izpolnite znamko, model in letnik.');
            return;
        }

        const userId = getUserId();
        const newVehicle = saveVehicle(userId, { brand, model, year, licensePlate: plate, userId });
        state.vehicles = [...state.vehicles, newVehicle];
        state.selectedVehicleId = newVehicle.id;
        store.addVehicle(newVehicle);

        // Re-render step to show new vehicle
        const wizard = document.getElementById('bookingWizard');
        wizard.innerHTML = buildStep1();
        bindStep1();
        if (window.lucide) window.lucide.createIcons();
    });
}

// ── STEP 2: Booking type (vulcanizers only) ───────────────────
function buildStep2() {
    const types = [
        {
            id: 'bring_own',
            icon: 'car-front',
            label: 'Prinesem lastne gume',
            desc: 'Imate že kupljene gume in jih želite samo namestiti pri nas.'
        },
        {
            id: 'use_stored',
            icon: 'archive',
            label: 'Sezonska menjava (hramba)',
            desc: 'Zamenjamo gume, ki so shranjene pri nas iz prejšnje sezone.'
        },
        {
            id: 'buy_new',
            icon: 'shopping-cart',
            label: 'Kupim nove gume',
            desc: 'Izberite med našimi gumami — namestimo na mestu ob prihodu.'
        },
    ];

    const cards = types.map(t => `
        <div class="type-card ${state.bookingType === t.id ? 'selected' : ''}" data-type="${t.id}">
            <div class="type-card-icon"><i data-lucide="${t.icon}"></i></div>
            <div class="type-card-label">${t.label}</div>
            <div class="type-card-desc">${t.desc}</div>
        </div>
    `).join('');

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="layers"></i> Tip rezervacije</h2>
        <div class="booking-type-cards">${cards}</div>
    </div>`;
}

function bindStep2() {
    document.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('click', () => {
            state.bookingType = card.getAttribute('data-type');
            document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
}

// ── STEP 3: Services ──────────────────────────────────────────
function buildStep3() {
    const services = getServicesForBusiness(state.business);

    if (services.length === 0) {
        return `<div class="wizard-step"><h2 class="step-title"><i data-lucide="wrench"></i> Storitve</h2>
            <div class="step-empty"><i data-lucide="alert-circle"></i>To podjetje nima navedenih storitev.</div></div>`;
    }

    const cards = services.map(s => {
        const sel = state.selectedServiceIds.includes(s.id) ? 'selected' : '';
        return `
        <div class="service-check-card ${sel}" data-sid="${s.id}" role="checkbox" aria-checked="${!!sel}" tabindex="0">
            <div class="service-check-icon"><i data-lucide="${s.icon}"></i></div>
            <div class="service-check-info">
                <div class="service-check-name">${s.label}</div>
                <div class="service-check-price">${s.priceLabel}</div>
            </div>
            <div class="service-check-mark"><i data-lucide="check"></i></div>
        </div>`;
    }).join('');

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="wrench"></i> Izberite storitve</h2>
        <div class="services-grid">${cards}</div>
    </div>`;
}

function bindStep3() {
    document.querySelectorAll('.service-check-card').forEach(card => {
        card.addEventListener('click', () => {
            const sid = card.getAttribute('data-sid');
            card.classList.toggle('selected');
            const checked = card.classList.contains('selected');
            const cb = card.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = checked;

            if (checked) {
                if (!state.selectedServiceIds.includes(sid)) state.selectedServiceIds.push(sid);
            } else {
                state.selectedServiceIds = state.selectedServiceIds.filter(id => id !== sid);
                // Remove associated products if service deselected
                state.selectedProducts = state.selectedProducts.filter(p => {
                    const product = getProductsForServices([sid]).find(pr => pr.id === p.productId);
                    return !product;
                });
            }
            updateSummaryPanel();
        });
    });
}

// ── STEP 4: Products ──────────────────────────────────────────
function buildStep4() {
    const products = getProductsForServices(state.selectedServiceIds);

    if (products.length === 0) {
        return `
        <div class="wizard-step">
            <h2 class="step-title"><i data-lucide="package"></i> Izdelki</h2>
            <div class="step-empty">
                <i data-lucide="package"></i>
                Za izbrane storitve ni dodatnih izdelkov.<br>
                <small style="color:#94a3b8;">Kliknite Naprej za nadaljevanje.</small>
            </div>
        </div>`;
    }

    const cards = products.map(p => {
        const saved = state.selectedProducts.find(sp => sp.productId === p.id);
        const qty = saved ? saved.qty : p.defaultQty;
        const sel = saved ? 'selected' : '';

        return `
        <div class="product-card ${sel}" data-pid="${p.id}">
            <div class="product-selected-badge"><i data-lucide="check"></i></div>
            <div class="product-img-placeholder"><i data-lucide="package"></i></div>
            <div class="product-body">
                <span class="product-tag">${p.tag}</span>
                <div class="product-name">${p.name}</div>
                <div class="product-brand">${p.brand}</div>
                <div class="product-price">${p.price} € / ${p.unit}</div>
            </div>
            <div class="product-footer">
                <div class="product-qty-row">
                    <span class="qty-label">Kol.:</span>
                    <div class="qty-controls">
                        <button class="qty-btn qty-minus" data-pid="${p.id}">−</button>
                        <span class="qty-val" id="qty-${p.id}">${qty}</span>
                        <button class="qty-btn qty-plus" data-pid="${p.id}">+</button>
                    </div>
                </div>
                <button class="${sel ? 'btn-product-remove' : 'btn-product-add'}" data-pid="${p.id}" id="pbtn-${p.id}">
                    ${sel ? '✓ Dodano' : '+ Dodaj'}
                </button>
            </div>
        </div>`;
    }).join('');

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="package"></i> Izberite izdelke <small style="font-size:0.75rem;font-weight:500;color:#94a3b8;">(neobvezno)</small></h2>
        <p class="step-subtitle">Naročite vnaprej — namestimo ob prihodu. Cene so prikazane brez montaže.</p>
        <div class="products-grid">${cards}</div>
    </div>`;
}

function bindStep4() {
    const products = getProductsForServices(state.selectedServiceIds);

    // Qty buttons
    document.querySelectorAll('.qty-minus, .qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pid = btn.getAttribute('data-pid');
            const qtyEl = document.getElementById(`qty-${pid}`);
            if (!qtyEl) return;
            const product = products.find(p => p.id === pid);
            if (!product) return;

            let current = parseInt(qtyEl.textContent) || product.defaultQty;
            const isPlus = btn.classList.contains('qty-plus');
            current = isPlus ? Math.min(current + 1, 8) : Math.max(current - 1, 1);
            qtyEl.textContent = current;

            // Update state
            const idx = state.selectedProducts.findIndex(sp => sp.productId === pid);
            if (idx >= 0) {
                state.selectedProducts[idx].qty = current;
                updateSummaryPanel();
            }
        });
    });

    // Add / Remove product buttons
    document.querySelectorAll('[id^="pbtn-"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pid = btn.getAttribute('data-pid');
            const card = document.querySelector(`.product-card[data-pid="${pid}"]`);
            const qtyEl = document.getElementById(`qty-${pid}`);
            const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;

            const isSelected = card?.classList.contains('selected');

            if (isSelected) {
                state.selectedProducts = state.selectedProducts.filter(sp => sp.productId !== pid);
                card?.classList.remove('selected');
                btn.textContent = '+ Dodaj';
                btn.className = 'btn-product-add';
            } else {
                state.selectedProducts.push({ productId: pid, qty });
                card?.classList.add('selected');
                btn.textContent = '✓ Dodano';
                btn.className = 'btn-product-remove';
            }

            btn.setAttribute('data-pid', pid);
            updateSummaryPanel();
        });
    });
}

// ── STEP 5: Date & Time — Modern Calendar ─────────────────────
const SL_MONTHS = ['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December'];
const SL_DOW    = ['Pon','Tor','Sre','Čet','Pet','Sob','Ned'];

function buildCalendarGrid(year, month) {
    const today = new Date(); today.setHours(0,0,0,0);
    // First day of month (0=Sun…6=Sat), convert to Mon-based
    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0…Sun=6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    let cells = '';
    // Leading cells from previous month
    for (let i = startDow - 1; i >= 0; i--) {
        cells += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
    }
    // Days of current month
    const minDate = getMinBookingDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const date   = new Date(year, month, d);
        const iso    = date.toISOString().slice(0, 10);
        const isSun  = date.getDay() === 0;
        const isPast = date < minDate;
        const isTod  = date.getTime() === today.getTime();
        const isSel  = state.selectedDate === iso;

        let cls = 'cal-day';
        if (isPast || isSun) cls += ' disabled';
        else if (isSel)      cls += ' selected';
        if (isTod)           cls += ' today';

        const dataAttr = (!isPast && !isSun) ? `data-date="${iso}"` : '';
        cells += `<div class="${cls}" ${dataAttr}>${d}${isTod ? '<span class="cal-today-dot"></span>' : ''}</div>`;
    }
    // Trailing cells
    const total = startDow + daysInMonth;
    const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= trailing; i++) {
        cells += `<div class="cal-day other-month">${i}</div>`;
    }
    return cells;
}

function buildStep5() {
    const timePills = timeSlots.map(t => {
        const disabled = unavailableSlots.includes(t) ? 'disabled' : '';
        const sel = state.selectedTime === t && !disabled ? 'selected' : '';
        return `<button class="time-pill ${sel}" data-time="${t}" ${disabled}>${t}</button>`;
    }).join('');

    const { calendarYear: yr, calendarMonth: mo } = state;
    const prevOk = !(yr === new Date().getFullYear() && mo <= new Date().getMonth());

    const deliveryNote = state.tireOrder?.estimatedDeliveryDate
        ? `<div style="display:flex;align-items:center;gap:0.5rem;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);border-radius:0.625rem;padding:0.5rem 0.875rem;font-size:0.8rem;color:#1e40af;margin-bottom:1rem;">
               <i data-lucide="truck" style="width:14px;height:14px;flex-shrink:0;"></i>
               Gume pričakovane <strong style="margin-left:0.25rem;">${state.tireOrder.estimatedDeliveryDate}</strong> — termini pred tem datumom so onemogočeni.
           </div>`
        : '';

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="calendar"></i> Izberite termin</h2>
        ${deliveryNote}
        <div class="datetime-layout">

            <div class="cal-section">
                <div class="cal-widget glass-card">
                    <div class="cal-header">
                        <button class="cal-nav-btn" id="calPrev" ${prevOk ? '' : 'disabled'}>
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <span class="cal-month-label">${SL_MONTHS[mo]} ${yr}</span>
                        <button class="cal-nav-btn" id="calNext">
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                    <div class="cal-dow-row">
                        ${SL_DOW.map(d => `<span>${d}</span>`).join('')}
                    </div>
                    <div class="cal-grid" id="calGrid">
                        ${buildCalendarGrid(yr, mo)}
                    </div>
                    ${state.selectedDate ? `<div class="cal-selected-label">
                        <i data-lucide="check-circle" style="width:13px;height:13px;color:#16a34a;"></i>
                        ${formatBookingDate(state.selectedDate)}
                    </div>` : ''}
                </div>
            </div>

            <div>
                <div class="dt-section-label">Ura</div>
                <div class="time-grid">${timePills}</div>
            </div>

            <div class="notes-section">
                <div class="dt-section-label">Opomba (neobvezno)</div>
                <textarea id="bookingNotes" class="glass-input" rows="3"
                    placeholder="Npr. Prosim pokličite dan prej...">${state.notes}</textarea>
            </div>
        </div>
    </div>`;
}

function bindStep5() {
    // Calendar navigation — prev month
    document.getElementById('calPrev')?.addEventListener('click', () => {
        if (state.calendarMonth === 0) { state.calendarMonth = 11; state.calendarYear--; }
        else state.calendarMonth--;
        rerenderCalendar();
    });

    // Calendar navigation — next month (max 6 months ahead)
    document.getElementById('calNext')?.addEventListener('click', () => {
        const now = new Date();
        const maxY = now.getFullYear() + (now.getMonth() + 6 > 11 ? 1 : 0);
        const maxM = (now.getMonth() + 6) % 12;
        if (state.calendarYear < maxY || (state.calendarYear === maxY && state.calendarMonth < maxM)) {
            if (state.calendarMonth === 11) { state.calendarMonth = 0; state.calendarYear++; }
            else state.calendarMonth++;
            rerenderCalendar();
        }
    });

    // Day selection — delegated on calGrid
    document.getElementById('calGrid')?.addEventListener('click', (e) => {
        const cell = e.target.closest('.cal-day[data-date]');
        if (!cell) return;
        state.selectedDate = cell.getAttribute('data-date');
        rerenderCalendar();
    });

    // Time pills
    document.querySelectorAll('.time-pill:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedTime = btn.getAttribute('data-time');
            document.querySelectorAll('.time-pill').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    document.getElementById('bookingNotes')?.addEventListener('input', function () {
        state.notes = this.value;
    });
}

function rerenderCalendar() {
    const grid  = document.getElementById('calGrid');
    const label = document.querySelector('.cal-month-label');
    const selLabel = document.querySelector('.cal-selected-label');
    const prevBtn  = document.getElementById('calPrev');
    const { calendarYear: yr, calendarMonth: mo } = state;

    if (grid)  grid.innerHTML  = buildCalendarGrid(yr, mo);
    if (label) label.textContent = `${SL_MONTHS[mo]} ${yr}`;
    if (prevBtn) {
        const prevOk = !(yr === new Date().getFullYear() && mo <= new Date().getMonth());
        prevBtn.disabled = !prevOk;
    }
    // Re-bind day clicks after innerHTML update
    document.getElementById('calGrid')?.addEventListener('click', (e) => {
        const cell = e.target.closest('.cal-day[data-date]');
        if (!cell) return;
        state.selectedDate = cell.getAttribute('data-date');
        rerenderCalendar();
    });

    // Update selected label
    const widget = document.querySelector('.cal-widget');
    if (widget) {
        let sl = widget.querySelector('.cal-selected-label');
        if (state.selectedDate) {
            if (!sl) {
                sl = document.createElement('div');
                sl.className = 'cal-selected-label';
                widget.appendChild(sl);
            }
            sl.innerHTML = `<i data-lucide="check-circle" style="width:13px;height:13px;color:#16a34a;"></i> ${formatBookingDate(state.selectedDate)}`;
        } else if (sl) {
            sl.remove();
        }
    }
    if (window.lucide) window.lucide.createIcons();
}

// ── STEP 6: Summary & Confirm ─────────────────────────────────
function buildStep6() {
    const biz = state.business;
    const vehicle = state.vehicles.find(v => v.id === state.selectedVehicleId);
    const { lineItems, total, hasQuoteItems } = calculateTotal(state.selectedServiceIds, state.selectedProducts);

    // Generate service number preview (final saved on confirm)
    if (!state.serviceNumber) state.serviceNumber = generateServiceNumber();

    const serviceLines = lineItems.map(item => `
        <div class="confirm-line-item">
            <span class="confirm-line-label">${item.label}</span>
            <strong class="confirm-line-price">${item.isQuote ? 'Po ogledu' : item.price + ' €'}</strong>
        </div>
    `).join('');

    const bookingTypeLabel = {
        bring_own: 'Prinesem lastne gume',
        use_stored: 'Sezonska menjava (hramba)',
        buy_new: 'Kupim nove gume',
    }[state.bookingType] || '';

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="clipboard-check"></i> Potrdite rezervacijo</h2>
        <div class="confirm-layout">

            <!-- Service number badge -->
            <div class="confirm-service-number-card glass-card">
                <div class="csn-icon"><i data-lucide="hash"></i></div>
                <div>
                    <div class="csn-label">Številka storitve</div>
                    <div class="csn-value">${state.serviceNumber}</div>
                </div>
                <div class="confirm-qr-mini">
                    <canvas id="confirmQRMini"></canvas>
                </div>
            </div>

            <div class="confirm-section glass-card">
                <div class="confirm-section-label">Podjetje</div>
                <div class="confirm-section-value">${biz.name} · ${biz.location.city}</div>
            </div>

            <div class="confirm-section glass-card">
                <div class="confirm-section-label">Vozilo</div>
                <div class="confirm-section-value">
                    ${vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.licensePlate ? ' · ' + vehicle.licensePlate : ''}` : '—'}
                </div>
            </div>

            ${isVulcanizer(biz) ? `
            <div class="confirm-section glass-card">
                <div class="confirm-section-label">Tip rezervacije</div>
                <div class="confirm-section-value">${bookingTypeLabel}</div>
            </div>` : ''}

            <div class="confirm-section glass-card">
                <div class="confirm-section-label">Storitve in cene</div>
                <div class="confirm-section-value">${serviceLines}</div>
            </div>

            <div class="confirm-section glass-card">
                <div class="confirm-section-label">Termin</div>
                <div class="confirm-section-value">
                    ${formatBookingDate(state.selectedDate)} ob ${state.selectedTime}
                    ${state.notes ? `<br><small style="color:#94a3b8;">${state.notes}</small>` : ''}
                </div>
            </div>

            <div class="confirm-total-card">
                <span class="confirm-total-label">Skupaj od</span>
                <span class="confirm-total-price">${total > 0 ? total + ' €' : 'Po ogledu'}</span>
            </div>

            ${hasQuoteItems ? `<p class="confirm-quote-note">
                * Nekatere storitve so po ogledu in niso vključene v skupno ceno.
            </p>` : ''}

            <!-- Notification toggles -->
            <div class="confirm-notify-card glass-card">
                <div class="notify-card-title"><i data-lucide="bell"></i> Obvesti me</div>
                <label class="toggle-row">
                    <div class="toggle-row-text">
                        <span class="toggle-row-label">Pošlji potrditev s QR kodo na email</span>
                        <span class="toggle-row-sub">Kupec prejme potrditv in QR kodo po e-pošti</span>
                    </div>
                    <div class="toggle-switch-wrap">
                        <input type="checkbox" id="toggleEmail" class="toggle-input" ${state.sendConfirmEmail ? 'checked' : ''} />
                        <span class="toggle-switch"></span>
                    </div>
                </label>
                <label class="toggle-row">
                    <div class="toggle-row-text">
                        <span class="toggle-row-label">Pošlji link potrditve na SMS</span>
                        <span class="toggle-row-sub">Kupec prejme SMS s kratkim linkom na potrditev</span>
                    </div>
                    <div class="toggle-switch-wrap">
                        <input type="checkbox" id="toggleSms" class="toggle-input" ${state.sendConfirmSms ? 'checked' : ''} />
                        <span class="toggle-switch"></span>
                    </div>
                </label>
            </div>

            <button class="btn-confirm-booking" id="confirmBookingBtn">
                <i data-lucide="check-circle"></i> Potrdi rezervacijo
            </button>
        </div>
    </div>`;
}

function bindStep6() {
    document.getElementById('confirmBookingBtn')?.addEventListener('click', confirmBooking);

    document.getElementById('toggleEmail')?.addEventListener('change', function () {
        state.sendConfirmEmail = this.checked;
    });
    document.getElementById('toggleSms')?.addEventListener('change', function () {
        state.sendConfirmSms = this.checked;
    });

    // Render QR preview
    renderQRCanvas('confirmQRMini', state.serviceNumber);
}

// ── Confirm and save booking ──────────────────────────────────
function confirmBooking() {
    const userId = getUserId();
    const vehicle = state.vehicles.find(v => v.id === state.selectedVehicleId);
    const { total } = calculateTotal(state.selectedServiceIds, state.selectedProducts);
    const serviceNumber = state.serviceNumber || generateServiceNumber();

    const bookingData = {
        userId,
        businessId: state.businessId,
        businessName: state.business.name,
        vehicleId: state.selectedVehicleId,
        vehicleLabel: vehicle
            ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.licensePlate ? ' · ' + vehicle.licensePlate : ''}`
            : '',
        services: state.selectedServiceIds,
        products: state.selectedProducts,
        bookingType: isVulcanizer(state.business) ? state.bookingType : null,
        totalPrice: total,
        date: state.selectedDate,
        time: state.selectedTime,
        notes: state.notes,
        serviceNumber,
        sendConfirmEmail: state.sendConfirmEmail,
        sendConfirmSms: state.sendConfirmSms,
        ...(state.tireHandoff ? { tireHandoff: state.tireHandoff } : {}),
    };

    const saved = saveBooking(bookingData);
    store.addBooking(saved);

    // Mark tire order as ordered if applicable
    if (state.tireOrderId) {
        markTireOrderOrdered(state.tireOrderId).catch(err =>
            console.warn('[Booking] Failed to mark tire order as ordered', err)
        );
    }

    // Mock notifications
    if (state.sendConfirmEmail) console.info('[Booking] Email s QR kodo poslan na:', userId);
    if (state.sendConfirmSms)   console.info('[Booking] SMS z linkom poslan na:', userId);

    // Build Google Calendar URL
    const gCalUrl = buildGoogleCalendarUrl(saved, state.business);

    // Hide nav buttons
    const nav = document.getElementById('bookingNav');
    if (nav) nav.style.display = 'none';

    // Show success state
    const wizard = document.getElementById('bookingWizard');
    wizard.classList.remove('step-exit', 'step-enter');
    wizard.innerHTML = `
    <div class="booking-success">
        <div class="success-icon"><i data-lucide="check-circle"></i></div>
        <h2 class="success-title">Rezervacija uspešna!</h2>
        <p class="success-subtitle">
            Potrditev je bila posredovana.
            Vse rezervacije si oglejte v <a href="#/dashboard">svojem profilu</a>.
        </p>

        <!-- Service number + QR -->
        <div class="success-sn-block">
            <div class="success-sn-left">
                <div class="success-sn-label">Številka storitve</div>
                <div class="success-sn-value">${serviceNumber}</div>
                <div class="success-sn-hint">
                    <i data-lucide="info" style="width:11px;height:11px;"></i>
                    Pokažite QR kodo serviserju ob prihodu
                </div>
            </div>
            <div class="success-qr-wrap">
                <canvas id="successQRCanvas"></canvas>
            </div>
        </div>

        <!-- Notification status badges -->
        ${state.sendConfirmEmail ? `<div class="success-notify-badge email">
            <i data-lucide="mail"></i> Potrditev s QR kodo poslana na e-pošto
        </div>` : ''}
        ${state.sendConfirmSms ? `<div class="success-notify-badge sms">
            <i data-lucide="smartphone"></i> SMS z linkom poslan
        </div>` : ''}

        <div class="success-details">
            <div class="success-detail-row">
                <span class="success-detail-key">Podjetje</span>
                <span class="success-detail-val">${state.business.name}</span>
            </div>
            <div class="success-detail-row">
                <span class="success-detail-key">Datum</span>
                <span class="success-detail-val">${formatBookingDate(state.selectedDate)} ob ${state.selectedTime}</span>
            </div>
            <div class="success-detail-row">
                <span class="success-detail-key">Skupaj od</span>
                <span class="success-detail-val">${total > 0 ? total + ' €' : 'Po ogledu'}</span>
            </div>
            <div class="success-detail-row">
                <span class="success-detail-key">Status</span>
                <span class="success-detail-val" style="color:#d97706;">Čaka potrditve</span>
            </div>
        </div>

        <div class="success-actions">
            <a href="${gCalUrl}" target="_blank" rel="noopener" class="btn-gcal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="#4285f4" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                Shrani v Google Koledar
            </a>
            <a href="#/dashboard" class="booking-btn-primary" style="text-decoration:none;">
                <i data-lucide="layout-dashboard"></i> Pojdi na profil
            </a>
        </div>
    </div>`;

    // Render QR code on the canvas
    renderQRCanvas('successQRCanvas', serviceNumber);

    // Hide summary on mobile
    const summary = document.getElementById('bookingSummary');
    if (summary) summary.style.display = 'none';

    if (window.lucide) window.lucide.createIcons();
}

// ── Navigation ────────────────────────────────────────────────
function goNext() {
    const logical = logicalStep(state.currentStep);
    const error = validateStep(logical);

    if (error) {
        showStepError(error);
        return;
    }

    clearStepError();

    if (state.currentStep >= state.totalSteps) {
        confirmBooking();
        return;
    }

    state.currentStep++;

    // Auto-skip products step (logical 4) if no products available for selected services
    if (logicalStep(state.currentStep) === 4 && shouldSkipProductsStep()) {
        state.currentStep++;
    }

    renderProgress();
    renderStep(state.currentStep);
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    if (state.currentStep <= 1) return;
    state.currentStep--;

    // Auto-skip products step backwards if no products
    if (logicalStep(state.currentStep) === 4 && shouldSkipProductsStep()) {
        state.currentStep--;
    }

    clearStepError();
    renderProgress();
    renderStep(state.currentStep);
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStepError(msg) {
    let err = document.getElementById('wizardError');
    if (!err) {
        err = document.createElement('div');
        err.id = 'wizardError';
        err.style.cssText = 'background:#fef2f2;border:1px solid #fecaca;border-radius:0.75rem;padding:0.65rem 1rem;font-size:0.82rem;color:#dc2626;font-weight:600;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem;';
        err.innerHTML = '<i data-lucide="alert-circle" style="width:14px;height:14px;flex-shrink:0;"></i><span></span>';
        const wizard = document.getElementById('bookingWizard');
        wizard?.insertAdjacentElement('afterend', err);
    }
    err.querySelector('span').textContent = msg;
    err.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
}

function clearStepError() {
    document.getElementById('wizardError')?.remove();
}

// ── Build biz context card ────────────────────────────────────
function renderBizContext() {
    const biz = state.business;
    if (!biz) return;
    const el = document.getElementById('bookingBizContext');
    if (!el) return;

    const types = biz.businessTypes.map(t => {
        const labels = { dealer: 'Avto hiša', service: 'Servis', vulcanizer: 'Vulkanizer' };
        return `<span class="booking-biz-type-badge ${t}">${labels[t] || t}</span>`;
    }).join('');

    el.innerHTML = `
        <img class="booking-biz-logo" src="${biz.logo}" alt="${biz.name}" />
        <div class="booking-biz-info">
            <div class="booking-biz-name">${biz.name}</div>
            <div class="booking-biz-meta">
                <i data-lucide="map-pin"></i>${biz.location.city}
                &nbsp;${types}
            </div>
        </div>
        <a href="#/poslovni-profil?id=${biz.id}" class="booking-back" style="margin:0;font-size:0.75rem;">
            Profil →
        </a>
    `;
    if (window.lucide) window.lucide.createIcons();
}

// ── Tire handoff banner ───────────────────────────────────────
function renderTireHandoffBanner(handoff) {
    const existing = document.getElementById('tireHandoffBanner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'tireHandoffBanner';
    banner.style.cssText = [
        'background:linear-gradient(135deg,rgba(37,99,235,0.12),rgba(79,70,229,0.10))',
        'border:1px solid rgba(37,99,235,0.25)',
        'border-radius:1rem',
        'padding:0.875rem 1.125rem',
        'margin-bottom:1.25rem',
        'display:flex',
        'align-items:center',
        'gap:0.75rem',
        'font-size:0.82rem',
        'color:#1e40af',
    ].join(';');
    banner.innerHTML = `
        <i data-lucide="package-check" style="width:18px;height:18px;flex-shrink:0;color:#2563eb;"></i>
        <span>
            <strong>Nadaljujemo z rezervacijo montaže za vaše nove pnevmatike.</strong>
            ${handoff.quantity}× ${handoff.tireBrand} ${handoff.tireModel} (${handoff.tireDim}) —
            izberite samo še termin.
        </span>
    `;

    const progress = document.getElementById('bookingProgress');
    progress?.insertAdjacentElement('afterend', banner);
    if (window.lucide) window.lucide.createIcons();
}

// ── Tire order banner (for confirmed Firestore orders) ────────
function renderTireOrderBanner(tireOrder) {
    const existing = document.getElementById('tireHandoffBanner');
    if (existing) return;

    const td = tireOrder.tireData || {};
    const banner = document.createElement('div');
    banner.id = 'tireHandoffBanner';
    banner.style.cssText = [
        'background:linear-gradient(135deg,rgba(37,99,235,0.12),rgba(79,70,229,0.10))',
        'border:1px solid rgba(37,99,235,0.25)',
        'border-radius:1rem',
        'padding:0.875rem 1.125rem',
        'margin-bottom:1.25rem',
        'display:flex',
        'align-items:center',
        'gap:0.75rem',
        'font-size:0.82rem',
        'color:#1e40af',
    ].join(';');
    banner.innerHTML = `
        <i data-lucide="package-check" style="width:18px;height:18px;flex-shrink:0;color:#2563eb;"></i>
        <span>
            <strong>Gume so bile naročene preko MojAvto in bodo dostavljene na vaš naslov.</strong>
            ${td.quantity}× ${td.brand} ${td.model} (${td.dimension}) —
            izberite termin montaže po dostavi.
        </span>
    `;

    const progress = document.getElementById('bookingProgress');
    progress?.insertAdjacentElement('afterend', banner);
    if (window.lucide) window.lucide.createIcons();
}

// ── Page init ─────────────────────────────────────────────────
export async function initBookingPage() {
    console.log('[BookingPage] init');
    resetState();

    // Check for tire purchase handoff
    const tireHandoffRaw = sessionStorage.getItem('mojavto_tire_handoff');
    const tireHandoff = tireHandoffRaw ? (() => {
        try { return JSON.parse(tireHandoffRaw); } catch { return null; }
    })() : null;
    // Clear immediately so it doesn't re-trigger on next visit
    if (tireHandoff) sessionStorage.removeItem('mojavto_tire_handoff');

    // Parse URL params
    const hash = window.location.hash;
    const bizIdMatch = hash.match(/[?&]businessId=([^&]+)/);
    const serviceParam = (hash.match(/[?&]service=([^&]+)/) || [])[1];
    const tireOrderIdParam = (hash.match(/[?&]tireOrderId=([^&]+)/) || [])[1] || null;

    // Handoff overrides businessId from URL if present
    state.businessId = (tireHandoff?.vulcanizerId) || (bizIdMatch ? bizIdMatch[1] : null);

    if (!state.businessId) {
        const wizard = document.getElementById('bookingWizard');
        if (wizard) wizard.innerHTML = `
            <div class="booking-error">
                <h2>Napaka</h2>
                <p>Ni določenega poslovnega profila. Pojdite nazaj na <a href="#/zemljevid">zemljevid</a>.</p>
            </div>`;
        return;
    }

    // Load business
    state.business = getBusinessById(state.businessId);

    // Safety: if vulcanizer from handoff no longer exists, fall back to standard flow without handoff
    if (!state.business) {
        if (tireHandoff) {
            console.warn('[Booking] Handoff vulcanizer not found, falling back to standard flow');
            const wizard = document.getElementById('bookingWizard');
            if (wizard) wizard.innerHTML = `
                <div class="booking-error">
                    <h2>Vulkanizer ni več na voljo</h2>
                    <p>Izbrani vulkanizer ni bil najden. Izberite drugega na <a href="#/zemljevid">zemljevidu</a>.</p>
                </div>`;
            return;
        }
        const wizard = document.getElementById('bookingWizard');
        if (wizard) wizard.innerHTML = `
            <div class="booking-error">
                <h2>Podjetje ni najdeno</h2>
                <p>Poslovnega profila ni mogoče naložiti. <a href="#/zemljevid">Nazaj na zemljevid.</a></p>
            </div>`;
        return;
    }

    // Set step count
    state.totalSteps = getEffectiveSteps(state.business).length;

    // Load vehicles for user
    const userId = getUserId();
    state.vehicles = getVehiclesForUser(userId);
    store.setVehicles(state.vehicles);

    // Pre-select service if specified in URL
    if (serviceParam && state.business.servicesOffered.includes(serviceParam)) {
        state.selectedServiceIds = [serviceParam];
    }

    // Load tire order from Firestore if tireOrderId is in URL
    if (tireOrderIdParam) {
        try {
            const tireOrder = await getTireOrder(tireOrderIdParam);
            if (tireOrder && tireOrder.status === 'confirmed') {
                state.tireOrderId = tireOrderIdParam;
                state.tireOrder = tireOrder;
                state.skipProductsForTireOrder = true;
            } else if (tireOrder) {
                const wizard = document.getElementById('bookingWizard');
                if (wizard) wizard.innerHTML = `
                    <div class="booking-error">
                        <h2>Naročilo gum še ni potrjeno</h2>
                        <p>Vulkanizer še ni potrdil sprejema gum. Termin boste lahko rezervirali po potrditvi.</p>
                    </div>`;
                return;
            }
        } catch (err) {
            console.warn('[Booking] Failed to load tire order', err);
        }
    }

    // Apply tire handoff automation
    if (tireHandoff) {
        state.tireHandoff = tireHandoff;

        // Auto-select booking type: bring own tires (delivered via MojAvto)
        state.bookingType = 'bring_own';

        // Auto-select tyre_change service if offered by this business
        if (state.business.servicesOffered.includes('tyre_change')) {
            if (!state.selectedServiceIds.includes('tyre_change')) {
                state.selectedServiceIds.push('tyre_change');
            }
        }

        // Pre-fill notes with system message
        state.notes = `SISTEMSKO SPOROČILO: Naročene pnevmatike (${tireHandoff.quantity}× ${tireHandoff.tireBrand} ${tireHandoff.tireModel}, dimenzije: ${tireHandoff.tireDim}) bodo dostavljene na vaš naslov. Stranka želi montažo.`;
    }

    // Override notes if we have a confirmed tire order from Firestore
    if (state.tireOrder) {
        const to = state.tireOrder;
        state.bookingType = 'bring_own';
        if (state.business.servicesOffered.includes('tyre_change') &&
            !state.selectedServiceIds.includes('tyre_change')) {
            state.selectedServiceIds.push('tyre_change');
        }
        state.notes = `Montaža dostavljenih gum (naročilo MojAvto #${to.id}). Gume bodo dostavljene na vaš naslov.`;
    }

    // Update back button
    const backLabel = document.getElementById('bookingBackLabel');
    if (backLabel) backLabel.textContent = 'Nazaj na profil';
    const backLink = document.getElementById('bookingBack');
    if (backLink) backLink.href = `#/poslovni-profil?id=${state.businessId}`;

    // Render business context card
    renderBizContext();

    // Render initial progress
    renderProgress();

    // Show handoff banner after progress bar
    if (tireHandoff) renderTireHandoffBanner(tireHandoff);
    if (state.tireOrder) renderTireOrderBanner(state.tireOrder);

    // Render first step
    renderStep(1);

    // Update nav buttons
    updateNavButtons();

    // Wire nav button listeners
    document.getElementById('wizardNext')?.addEventListener('click', goNext);
    document.getElementById('wizardBack')?.addEventListener('click', goBack);

    if (window.lucide) window.lucide.createIcons();
}
