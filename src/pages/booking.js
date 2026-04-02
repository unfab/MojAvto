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

        // Computed
        priceBreakdown: null,
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
        <label class="service-check-card ${sel}" data-sid="${s.id}">
            <input type="checkbox" value="${s.id}" ${sel ? 'checked' : ''} />
            <div class="service-check-icon"><i data-lucide="${s.icon}"></i></div>
            <div class="service-check-info">
                <div class="service-check-name">${s.label}</div>
                <div class="service-check-price">${s.priceLabel}</div>
            </div>
            <div class="service-check-mark"><i data-lucide="check"></i></div>
        </label>`;
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

// ── STEP 5: Date & Time ───────────────────────────────────────
function buildStep5() {
    // Generate next 14 days (skip Sundays)
    const days = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
    const months = ['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
    const dateOptions = [];
    let d = new Date();
    d.setHours(0,0,0,0);
    while (dateOptions.length < 14) {
        if (d.getDay() !== 0) { // skip Sundays
            const iso = d.toISOString().slice(0,10);
            dateOptions.push({
                iso,
                day: days[d.getDay()],
                label: `${d.getDate()}. ${months[d.getMonth()]}`
            });
        }
        d.setDate(d.getDate() + 1);
    }

    const datePills = dateOptions.map(opt => `
        <button class="date-pill ${state.selectedDate === opt.iso ? 'selected' : ''}" data-date="${opt.iso}">
            <span class="date-pill-day">${opt.day}</span>
            <span class="date-pill-num">${opt.label}</span>
        </button>
    `).join('');

    const timePills = timeSlots.map(t => {
        const disabled = unavailableSlots.includes(t) ? 'disabled' : '';
        const sel = state.selectedTime === t && !disabled ? 'selected' : '';
        return `<button class="time-pill ${sel}" data-time="${t}" ${disabled}>${t}</button>`;
    }).join('');

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="calendar"></i> Izberite termin</h2>
        <div class="datetime-layout">
            <div>
                <div class="dt-section-label">Datum</div>
                <div class="date-grid">${datePills}</div>
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
    document.querySelectorAll('.date-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedDate = btn.getAttribute('data-date');
            document.querySelectorAll('.date-pill').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

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

// ── STEP 6: Summary & Confirm ─────────────────────────────────
function buildStep6() {
    const biz = state.business;
    const vehicle = state.vehicles.find(v => v.id === state.selectedVehicleId);
    const { lineItems, total, hasQuoteItems } = calculateTotal(state.selectedServiceIds, state.selectedProducts);

    const serviceLines = lineItems.map(item => `
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:0.2rem 0;">
            <span style="color:#475569;">${item.label}</span>
            <strong>${item.isQuote ? 'Po ogledu' : item.price + ' €'}</strong>
        </div>
    `).join('');

    const bookingTypeLabel = {
        bring_own: 'Prinesem lastne gume',
        use_stored: 'Sezonska menjava (hramba)',
        buy_new: 'Kupim nove gume',
        null: ''
    }[state.bookingType] || '';

    return `
    <div class="wizard-step">
        <h2 class="step-title"><i data-lucide="clipboard-check"></i> Potrdite rezervacijo</h2>
        <div class="confirm-layout">

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

            ${hasQuoteItems ? `<p style="font-size:0.75rem;color:#94a3b8;text-align:center;margin:0;">
                * Nekatere storitve so po ogledu in niso vključene v skupno ceno.
            </p>` : ''}

            <button class="btn-confirm-booking" id="confirmBookingBtn">
                <i data-lucide="check-circle"></i> Potrdi rezervacijo
            </button>
        </div>
    </div>`;
}

function bindStep6() {
    document.getElementById('confirmBookingBtn')?.addEventListener('click', confirmBooking);
}

// ── Confirm and save booking ──────────────────────────────────
function confirmBooking() {
    const userId = getUserId();
    const vehicle = state.vehicles.find(v => v.id === state.selectedVehicleId);
    const { total } = calculateTotal(state.selectedServiceIds, state.selectedProducts);

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
    };

    const saved = saveBooking(bookingData);
    store.addBooking(saved);

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
            Vaša rezervacija je bila posredovana. Potrditev boste prejeli kmalu.
            Vse rezervacije si oglejte v <a href="#/dashboard">svojem profilu</a>.
        </p>
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
        <a href="#/dashboard" class="booking-btn-primary" style="text-decoration:none;margin-top:0.5rem;">
            <i data-lucide="layout-dashboard"></i> Pojdi na profil
        </a>
    </div>`;

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
    renderProgress();
    renderStep(state.currentStep);
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    if (state.currentStep <= 1) return;
    state.currentStep--;
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

// ── Page init ─────────────────────────────────────────────────
export async function initBookingPage() {
    console.log('[BookingPage] init');
    resetState();

    // Parse URL params
    const hash = window.location.hash;
    const bizIdMatch = hash.match(/[?&]businessId=([^&]+)/);
    const serviceParam = (hash.match(/[?&]service=([^&]+)/) || [])[1];

    state.businessId = bizIdMatch ? bizIdMatch[1] : null;

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

    if (!state.business) {
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

    // Update back button
    const backLabel = document.getElementById('bookingBackLabel');
    if (backLabel) backLabel.textContent = 'Nazaj na profil';
    const backLink = document.getElementById('bookingBack');
    if (backLink) backLink.href = `#/poslovni-profil?id=${state.businessId}`;

    // Render business context card
    renderBizContext();

    // Render initial progress
    renderProgress();

    // Render first step
    renderStep(1);

    // Update nav buttons
    updateNavButtons();

    // Wire nav button listeners
    document.getElementById('wizardNext')?.addEventListener('click', goNext);
    document.getElementById('wizardBack')?.addEventListener('click', goBack);

    if (window.lucide) window.lucide.createIcons();
}
