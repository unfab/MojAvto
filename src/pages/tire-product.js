// ═══════════════════════════════════════════════════════════════════════════════
// Tire Product Page — MojAvto.si
// Full product detail: specs, EU labels, price comparison, savings calculator
// ═══════════════════════════════════════════════════════════════════════════════

import { getTireById, MOCK_PRICE_HISTORY } from '../data/tireMockData.js';
import { SPEED_RATINGS, LOAD_INDICES } from '../data/tireDimensions.js';

export async function initTireProductPage() {
    console.log('[TireProduct] init');

    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const id = params.get('id');

    const container = document.getElementById('tireProductInner');
    if (!container) return;

    if (!id) {
        container.innerHTML = renderNotFound();
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const tire = getTireById(id);
    if (!tire) {
        container.innerHTML = renderNotFound();
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Build the page
    container.innerHTML = renderProductPage(tire);

    // Bind interactive elements
    bindSavingsCalc(tire);
    bindPackageSelect();
    renderPriceHistoryChart(id);

    if (window.lucide) window.lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// Page rendering
// ─────────────────────────────────────────────────────────────────────────────
function renderProductPage(tire) {
    const seasonLabel = { letna: 'Letna', zimska: 'Zimska', celoletna: 'Celoletna' }[tire.season] || tire.season;
    const seasonIcon  = { letna: 'sun', zimska: 'snowflake', celoletna: 'cloud-sun' }[tire.season] || 'circle';
    const sr = SPEED_RATINGS.find(r => r.code === tire.speedRating);
    const li = LOAD_INDICES.find(l => l.index === tire.loadIndex);
    const priceFormatted = tire.lowestPrice.toFixed(2).replace('.', ',');

    // Sort offers by total price (cheapest first)
    const sortedOffers = [...tire.offers].sort((a, b) => a.totalPrice - b.totalPrice);
    const cheapestOffer = sortedOffers[0];

    // Savings estimate (A=best, E=worst: A saves ~15% vs E)
    const fuelGradePenalty = { A: 0, B: 3, C: 6, D: 9, E: 12 };

    return `
    <!-- Back link -->
    <a class="tp-back" href="#/nakup/pnevmatike" id="backLink">
        <i data-lucide="arrow-left"></i> Nazaj na iskanje
    </a>

    <!-- ── Hero ── -->
    <div class="tp-hero">
        <div class="tp-img-wrap">
            <img class="tp-img" src="${tire.imageUrl}" alt="${tire.fullName}" />
            <div class="tp-season-badge ${tire.season}">
                <i data-lucide="${seasonIcon}" style="width:13px;height:13px;"></i>
                ${seasonLabel}
            </div>
        </div>

        <div class="tp-info">
            <div>
                <div class="tp-brand">${tire.brand}</div>
                <h1 class="tp-title">${tire.model}</h1>
                <div class="tp-dim-line">
                    <span>${tire.width}/${tire.height} R${tire.diameter} ${tire.loadIndex}${tire.speedRating}</span>
                    ${tire.reinforced ? '<span class="tp-xl-badge">XL</span>' : ''}
                    ${tire.runFlat ? '<span class="tp-xl-badge" style="background:#475569;">RF</span>' : ''}
                </div>
            </div>

            <!-- Quick spec chips -->
            <div class="tp-specs-quick">
                <div class="tp-spec-chip">
                    <i data-lucide="gauge"></i>
                    do ${sr ? sr.maxSpeed : '?'} km/h
                </div>
                <div class="tp-spec-chip">
                    <i data-lucide="weight"></i>
                    do ${li ? li.maxKg : '?'} kg
                </div>
                <div class="tp-spec-chip">
                    <i data-lucide="${seasonIcon}"></i>
                    ${seasonLabel}
                </div>
                ${tire.reinforced ? `<div class="tp-spec-chip"><i data-lucide="shield"></i> Ojačana (XL)</div>` : ''}
                ${tire.runFlat ? `<div class="tp-spec-chip"><i data-lucide="zap-off"></i> Run Flat</div>` : ''}
            </div>

            <!-- Best price banner -->
            <div class="tp-price-banner">
                <div class="tp-price-banner-left">
                    <div class="tp-price-label">Najnižja cena</div>
                    <div>
                        <span class="tp-price-value">${priceFormatted} €</span>
                        <span class="tp-price-per">/ kos</span>
                    </div>
                    <div class="tp-price-stores">
                        pri ${cheapestOffer.storeName} &bull; ${tire.offerCount} ${tire.offerCount === 1 ? 'ponudba' : 'ponudb'} skupaj
                    </div>
                </div>
                <div class="tp-price-banner-right">
                    <button class="tp-set-price-btn" id="btnPriceAlert">
                        <i data-lucide="bell"></i> Cenovni alarm
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ── Full Specifications ── -->
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="list-checks"></i>
            Specifikacije
        </div>
        <div class="specs-grid">
            <div>
                ${renderSpecRow('Znamka', tire.brand)}
                ${renderSpecRow('Model', tire.model)}
                ${renderSpecRow('Širina', `${tire.width} mm`)}
                ${renderSpecRow('Višina profila', `${tire.height} %`)}
                ${renderSpecRow('Premer', `R${tire.diameter} col`)}
                ${renderSpecRow('Dimenzija', `${tire.width}/${tire.height} R${tire.diameter}`)}
            </div>
            <div>
                ${renderSpecRow('Hitrostni razred', `${tire.speedRating}${sr ? ` – do ${sr.maxSpeed} km/h` : ''}`)}
                ${renderSpecRow('Indeks obremenitve', `${tire.loadIndex}${li ? ` – do ${li.maxKg} kg` : ''}`)}
                ${renderSpecRow('Sezona', seasonLabel)}
                ${renderSpecRow('Ojačana (XL)', tire.reinforced ? '✓ Da' : 'Ne')}
                ${renderSpecRow('Run Flat', tire.runFlat ? '✓ Da' : 'Ne')}
                ${renderSpecRow('EAN', tire.ean)}
            </div>
        </div>
    </div>

    <!-- ── EU Labels ── -->
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="tag"></i>
            EU oznake (Reg. 2020/740)
        </div>
        <div class="eu-labels-grid">
            <div class="eu-label-item">
                <div class="eu-label-name">Poraba goriva</div>
                <div class="eu-scale">
                    ${['A','B','C','D','E'].map(r => `<div class="eu-scale-cell eu-${r} ${r === tire.euLabel.fuelEfficiency ? 'active-rating' : ''}">${r}</div>`).join('')}
                </div>
            </div>
            <div class="eu-label-item">
                <div class="eu-label-name">Oprijem na mokri cesti</div>
                <div class="eu-scale">
                    ${['A','B','C','D','E'].map(r => `<div class="eu-scale-cell eu-${r} ${r === tire.euLabel.wetGrip ? 'active-rating' : ''}">${r}</div>`).join('')}
                </div>
            </div>
            <div class="eu-label-item">
                <div class="eu-label-name">Hrup (zunanja glasnost)</div>
                <div class="noise-bar-wrap">
                    <div class="noise-bar">
                        <div class="noise-bar-fill" style="width:${Math.min(100, ((tire.euLabel.noiseLevel - 60) / 20) * 100)}%"></div>
                    </div>
                    <div class="noise-val">${tire.euLabel.noiseLevel} dB (${tire.euLabel.noiseClass})</div>
                </div>
            </div>
        </div>
    </div>

    <!-- ── Price Comparison Table ── -->
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="store"></i>
            Primerjava cen — ${tire.offerCount} ponudb
        </div>
        <div style="overflow-x:auto;">
            <table class="price-table">
                <thead>
                    <tr>
                        <th>Trgovina</th>
                        <th>Cena / kos</th>
                        <th class="shipping-col">Dostava</th>
                        <th class="total-col">Skupaj</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedOffers.map((offer, i) => renderPriceRow(offer, i === 0)).join('')}
                </tbody>
            </table>
        </div>
        <p style="font-size:0.72rem;color:#94a3b8;margin-top:0.75rem;">
            ⭐ Priporočamo = partnerske trgovine s preverjeno kakovostjo storitve.
            Cene se posodabljajo periodično — preverite ceno pri nakupu.
        </p>
    </div>

    <!-- ── Price History ── -->
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="trending-down"></i>
            Zgodovina cen
        </div>
        <div class="price-history-chart">
            <svg class="price-history-svg" id="priceHistoryChart" viewBox="0 0 600 120" preserveAspectRatio="none"></svg>
        </div>
        <p class="price-history-note">Prikazana je najnižja cena na trgu v zadnjih 6 mesecih.</p>
    </div>

    <!-- ── Savings Calculator ── -->
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="fuel"></i>
            Kalkulator prihrankov goriva
        </div>
        <p style="font-size:0.82rem;color:#64748b;margin:0 0 1rem;">
            Pnevmatike z oznako <strong>A</strong> za porabo goriva prihranijo do 15% goriva v primerjavi z oznako E.
        </p>
        <div class="savings-calc" id="savingsCalc">
            <div class="savings-input-group">
                <label class="savings-label">Letni prevoženi kilometri</label>
                <input type="number" class="savings-input" id="calcKm" value="15000" min="1000" max="100000" step="1000" />
            </div>
            <div class="savings-input-group">
                <label class="savings-label">Cena goriva (€/l)</label>
                <input type="number" class="savings-input" id="calcFuelPrice" value="1.65" min="0.5" max="5" step="0.05" />
            </div>
            <div class="savings-input-group">
                <label class="savings-label">Povprečna poraba vozila (l/100km)</label>
                <input type="number" class="savings-input" id="calcConsumption" value="7.0" min="3" max="20" step="0.5" />
            </div>
            <div class="savings-result" id="savingsResult">
                <div class="savings-result-label">Letni prihranek z ${tire.euLabel.fuelEfficiency} pnevmatikami</div>
                <div class="savings-result-value" id="savingsValue">Izračunavam...</div>
            </div>
        </div>
    </div>

    <!-- ── Package Comparison ── -->
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="package-2"></i>
            Paketna primerjava (4 pnevmatike + montaža)
        </div>
        <p style="font-size:0.82rem;color:#64748b;margin:0 0 1rem;">
            Primerjajte skupno ceno seta 4 pnevmatik z montažo pri lokalnih vulkanizerjih.
        </p>
        <div class="package-options" id="packageOptions">
            ${renderPackageOptions(tire, sortedOffers)}
        </div>
        <div style="margin-top:1rem;padding:0.875rem;background:rgba(37,99,235,0.05);border:1px solid rgba(37,99,235,0.12);border-radius:0.75rem;">
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:0.25rem;">Izbrani paket — skupna cena</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-primary-start);" id="packageTotal">
                Izberite paket
            </div>
        </div>
        <p style="font-size:0.72rem;color:#94a3b8;margin-top:0.5rem;">
            Cena montaže je okvirna. Rezervirajte termin pri vulkanizerju za točno ceno.
        </p>
    </div>

    <!-- ── Description ── -->
    ${tire.description ? `
    <div class="tp-section">
        <div class="tp-section-title">
            <i data-lucide="file-text"></i>
            Opis pnevmatike
        </div>
        <p style="font-size:0.875rem;line-height:1.7;color:#475569;margin:0;">${tire.description}</p>
    </div>` : ''}
    `;
}

function renderSpecRow(key, val) {
    return `<div class="spec-row"><span class="spec-key">${key}</span><span class="spec-val">${val}</span></div>`;
}

function renderPriceRow(offer, isCheapest) {
    const rowClass = offer.isAffiliate ? 'affiliate' : (isCheapest ? 'cheapest' : '');
    const priceFormatted = offer.price.toFixed(2).replace('.', ',');
    const totalFormatted = offer.totalPrice.toFixed(2).replace('.', ',');
    const shippingLabel = offer.shippingCost === 0 ? 'Brezplačna' : `${offer.shippingCost.toFixed(2).replace('.', ',')} €`;

    let actionBtn;
    if (!offer.inStock) {
        actionBtn = `<span class="btn-goto btn-goto-disabled"><i data-lucide="x-circle"></i> Ni na zalogi</span>`;
    } else if (offer.isAffiliate) {
        actionBtn = `<a class="btn-goto btn-goto-affiliate" href="${offer.affiliateUrl || '#'}" target="_blank" rel="noopener nofollow">
            <i data-lucide="star"></i> Priporočamo →
        </a>`;
    } else {
        actionBtn = `<a class="btn-goto btn-goto-regular" href="${offer.url}" target="_blank" rel="noopener">
            <i data-lucide="external-link"></i> Pojdi v trgovino
        </a>`;
    }

    return `
    <tr class="price-row ${rowClass}">
        <td>
            <div class="store-cell">
                <img class="store-logo" src="https://ui-avatars.com/api/?name=${encodeURIComponent(offer.storeName.substring(0,2))}&background=${isCheapest ? '16a34a' : offer.isAffiliate ? 'f59e0b' : '64748b'}&color=fff&size=40&bold=true" alt="${offer.storeName}" />
                <div>
                    <div class="store-name">${offer.storeName}</div>
                    <div class="store-badges">
                        ${isCheapest ? '<span class="badge-cheapest">✓ Najcenejše</span>' : ''}
                        ${offer.isAffiliate ? '<span class="badge-affiliate">⭐ Priporočamo</span>' : ''}
                        ${!offer.inStock ? '<span class="badge-out">Ni na zalogi</span>' : ''}
                    </div>
                </div>
            </div>
        </td>
        <td class="price-col">${priceFormatted} €</td>
        <td class="shipping-col">${shippingLabel}</td>
        <td class="total-col">${totalFormatted} €</td>
        <td class="action-col">${actionBtn}</td>
    </tr>`;
}

function renderPackageOptions(tire, sortedOffers) {
    const mountingFees = [
        { label: 'Brez montaže', mounting: 0 },
        { label: 'Budget montaža (~12€/kos)', mounting: 12 },
        { label: 'Premium montaža (~18€/kos)', mounting: 18 },
    ];

    const cheapestOffer = sortedOffers.find(o => o.inStock) || sortedOffers[0];
    const basePrice4 = cheapestOffer.price * 4;

    return mountingFees.map((opt, i) => {
        const total = basePrice4 + opt.mounting * 4;
        return `
        <div class="package-card ${i === 0 ? 'selected' : ''}" data-mounting="${opt.mounting}" data-total="${total.toFixed(2)}">
            <div class="package-name">${opt.label}</div>
            <div class="package-detail">${cheapestOffer.storeName} + ${opt.mounting === 0 ? 'brez montaže' : `vulkanizer (~${opt.mounting}€/kos)`}</div>
            <div class="package-price">${total.toFixed(2).replace('.', ',')} € za 4 kose</div>
        </div>`;
    }).join('');
}

function renderNotFound() {
    return `
    <a class="tp-back" href="#/nakup/pnevmatike">
        <i data-lucide="arrow-left"></i> Nazaj na iskanje
    </a>
    <div style="text-align:center;padding:3rem;color:#94a3b8;">
        <i data-lucide="circle-off" style="width:48px;height:48px;display:block;margin:0 auto 1rem;opacity:0.3;"></i>
        <h2 style="color:#475569;">Pnevmatika ni bila najdena</h2>
        <p>Pnevmatika ne obstaja ali je bila odstranjena.</p>
        <a href="#/nakup/pnevmatike" class="dim-search-btn" style="display:inline-flex;margin-top:1rem;text-decoration:none;background:linear-gradient(135deg,var(--color-primary-start),var(--color-primary-end));color:#fff;">
            Iskanje pnevmatik
        </a>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Savings Calculator
// ─────────────────────────────────────────────────────────────────────────────
function bindSavingsCalc(tire) {
    const fuelGradePenalty = { A: 0, B: 3, C: 6, D: 9, E: 12 };
    const grade = tire.euLabel.fuelEfficiency;
    const gradeOffset = fuelGradePenalty[grade] || 0;

    function recalc() {
        const km = parseFloat(document.getElementById('calcKm')?.value) || 15000;
        const fuelPrice = parseFloat(document.getElementById('calcFuelPrice')?.value) || 1.65;
        const consumption = parseFloat(document.getElementById('calcConsumption')?.value) || 7.0;

        const litresPerYear = km * consumption / 100;
        const costPerYear = litresPerYear * fuelPrice;

        // Each grade difference from E saves ~3%
        const savingPercent = gradeOffset;
        const worseSaving = (costPerYear * savingPercent) / 100;

        const resultEl = document.getElementById('savingsValue');
        if (resultEl) {
            if (gradeOffset === 0) {
                resultEl.textContent = `Razred E — brez prihranka`;
                resultEl.style.color = '#dc2626';
            } else {
                resultEl.textContent = `~${worseSaving.toFixed(0)} € / leto`;
                resultEl.style.color = '#16a34a';
            }
        }
    }

    ['calcKm', 'calcFuelPrice', 'calcConsumption'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', recalc);
    });

    recalc();
}

// ─────────────────────────────────────────────────────────────────────────────
// Package selector
// ─────────────────────────────────────────────────────────────────────────────
function bindPackageSelect() {
    const container = document.getElementById('packageOptions');
    const totalEl = document.getElementById('packageTotal');
    if (!container) return;

    // Show initial total
    const firstCard = container.querySelector('.package-card');
    if (firstCard && totalEl) {
        totalEl.textContent = `${parseFloat(firstCard.dataset.total).toFixed(2).replace('.', ',')} €`;
    }

    container.addEventListener('click', e => {
        const card = e.target.closest('.package-card');
        if (!card) return;

        container.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        if (totalEl) {
            const total = parseFloat(card.dataset.total);
            totalEl.textContent = `${total.toFixed(2).replace('.', ',')} €`;
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Price history SVG sparkline
// ─────────────────────────────────────────────────────────────────────────────
function renderPriceHistoryChart(tireId) {
    const svg = document.getElementById('priceHistoryChart');
    if (!svg) return;

    const history = MOCK_PRICE_HISTORY[tireId];
    if (!history || history.length < 2) {
        svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-size="12">Ni dovolj podatkov</text>`;
        return;
    }

    const W = 600, H = 120, PAD = 20;
    const prices = history.map(h => h.price);
    const minP = Math.min(...prices) * 0.95;
    const maxP = Math.max(...prices) * 1.05;

    const points = history.map((h, i) => {
        const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
        const y = H - PAD - ((h.price - minP) / (maxP - minP)) * (H - PAD * 2);
        return { x, y, price: h.price, date: h.date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaD = pathD + ` L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

    // Color: gradient from blue to green
    const svgContent = `
        <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2563eb" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#2563eb" stop-opacity="0.02"/>
            </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#chartGrad)" />
        <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        ${points.map((p, i) => `
            <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
            ${i === 0 || i === points.length - 1 ? `
                <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="#2563eb">
                    ${p.price.toFixed(2).replace('.', ',')} €
                </text>` : ''}
        `).join('')}
        ${points.map((p, i) => i % Math.max(1, Math.floor(history.length / 4)) === 0 ? `
            <text x="${p.x.toFixed(1)}" y="${H}" text-anchor="middle" font-size="10" fill="#94a3b8">
                ${p.date.substring(5)}
            </text>` : '').join('')}
    `;

    svg.innerHTML = svgContent;
}
