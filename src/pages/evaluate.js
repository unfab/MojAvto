import { getListings } from '../services/listingService.js';
import { getVehicleRating } from '../utils/valuationScore.js';

export function initEvaluatePage() {
    console.log('[EvaluatePage] init');
    bindEvaluationLogic();
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function bindEvaluationLogic() {
    const form = document.getElementById("evaluationForm");
    const brandSelect = document.getElementById("eval-make");
    const modelSelect = document.getElementById("eval-model");
    const yearSelect = document.getElementById("eval-year");
    const mileageInput = document.getElementById("eval-mileage");
    const evalBtn = document.getElementById("evalBtn");

    const resultsContainer = document.getElementById("evaluation-results");
    const estPriceContainer = document.getElementById("est-price-container");
    const estCountSpan = document.getElementById("est-count");
    const compResultsContainer = document.getElementById("comp-results-container");

    if (!form || !brandSelect) return;

    // --- Populate Years ---
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1990; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // --- Populate Makes and Models ---
    fetch("/json/brands_models_global.json")
        .then(res => res.json())
        .then(brandModelData => {
            Object.keys(brandModelData).sort().forEach(brand => {
                const option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });

            import('../utils/customSelect.js').then(m => {
                m.createCustomSelect(brandSelect);
                m.createCustomSelect(modelSelect);
                m.createCustomSelect(yearSelect);
            });

            brandSelect.addEventListener("change", function () {
                const selectedMake = brandSelect.value;
                modelSelect.innerHTML = '<option value="">Izberite model</option>';
                modelSelect.disabled = true;

                if (selectedMake && brandModelData[selectedMake]) {
                    const models = brandModelData[selectedMake];
                    Object.keys(models).sort().forEach(model => {
                        const option = document.createElement("option");
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.disabled = false;
                }
            });
        }).catch(err => console.warn("Could not load brands_models_global.json.", err));

    // --- Form Submission ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const make = brandSelect.value;
        const model = modelSelect.value;
        const year = parseInt(yearSelect.value, 10);

        if (!make || !model || !year) {
            alert('Prosimo izpolnite vse obvezne podatke.');
            return;
        }

        evalBtn.disabled = true;
        evalBtn.querySelector('span').textContent = 'Ocenjujem...';
        resultsContainer.style.display = 'none';

        try {
            const allListings = await getListings();

            // Build a synthetic target for rating lookup
            const targetListing = { make, model, year, equipment: [] };
            const rating = getVehicleRating(targetListing, allListings);

            // Comparables for the sidebar cards (same logic as getComparables)
            const comps = allListings.filter(l =>
                l.make === make &&
                l.model === model &&
                l.year >= year - 2 &&
                l.year <= year + 2
            );

            // Fallback estimated price
            let estimatedValue = 0;
            if (comps.length > 0) {
                estimatedValue = comps.reduce((sum, l) => sum + (l.priceEur || l.price || 0), 0) / comps.length;
            } else {
                const age = currentYear - year;
                estimatedValue = Math.max(1000, 15000 * Math.pow(0.9, age));
            }

            renderResults(estimatedValue, comps, rating);

        } catch (error) {
            console.error("Napaka pri oceni:", error);
            alert("Prišlo je do napake pri oceni vrednosti vozila.");
        } finally {
            evalBtn.disabled = false;
            evalBtn.querySelector('span').textContent = 'Izračunaj vrednost';
        }
    });

    function renderResults(estimatedPrice, comparables, rating) {
        const formattedPrice = new Intl.NumberFormat('sl-SI', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(estimatedPrice);

        estPriceContainer.textContent = formattedPrice;
        estCountSpan.textContent = comparables.length;

        // ── Rating block ──────────────────────────────────────────────────────
        let ratingHtml = '';
        if (rating) {
            const confidenceLabel = rating.confidence === 'high'
                ? `Visoka zanesljivost (${rating.comparablesCount} oglasov)`
                : rating.confidence === 'medium'
                    ? `Srednja zanesljivost (${rating.comparablesCount} oglasov)`
                    : `Nizka zanesljivost (${rating.comparablesCount} oglas${rating.comparablesCount > 1 ? 'i' : ''})`;

            const confidenceColor = rating.confidence === 'high' ? '#22c55e' : rating.confidence === 'medium' ? '#f59e0b' : '#94a3b8';

            ratingHtml = `
                <div style="margin:1.5rem 0; padding:1.25rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:1rem;">
                    <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                        <div>${renderStarsSvg(rating.stars, 'md')}</div>
                        <div>
                            <div style="font-size:1.1rem; font-weight:700; color:var(--color-primary-start);">${escHtml(rating.label)}</div>
                            <div style="font-size:0.85rem; color:#94a3b8; margin-top:2px;">${escHtml(rating.priceSignal)}</div>
                            ${rating.equipmentSignal ? `<div style="font-size:0.82rem; color:#64748b; margin-top:2px;">Redka oprema pri tem modelu: ${escHtml(rating.equipmentSignal)}</div>` : ''}
                        </div>
                        <div style="margin-left:auto;">
                            <span style="font-size:0.75rem; font-weight:600; padding:0.25rem 0.6rem; border-radius:999px; background:rgba(255,255,255,0.06); color:${confidenceColor};">${escHtml(confidenceLabel)}</span>
                        </div>
                    </div>
                    ${rating.warning ? `
                    <div style="margin-top:1rem; padding:0.75rem 1rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:0.5rem; display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:#fca5a5;">
                        <span>⚠️</span> ${escHtml(rating.warning)}
                    </div>` : ''}
                </div>`;
        }

        // Insert rating block after est-price-container
        let ratingEl = document.getElementById('eval-rating-block');
        if (!ratingEl) {
            ratingEl = document.createElement('div');
            ratingEl.id = 'eval-rating-block';
            estPriceContainer.parentNode.insertBefore(ratingEl, estPriceContainer.nextSibling);
        }
        ratingEl.innerHTML = ratingHtml;

        // ── Comparable cards ──────────────────────────────────────────────────
        compResultsContainer.innerHTML = '';
        if (comparables.length > 0) {
            const topComps = comparables.slice(0, 4);
            let html = '';
            topComps.forEach(l => {
                const imgUrl = l.images && l.images.exterior ? l.images.exterior[0] : 'https://via.placeholder.com/300x200?text=Ni+slike';
                const lPrice = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(l.priceEur || l.price || 0);
                const km = l.mileageKm || l.mileage;
                html += `
                    <a href="#/oglas?id=${l.id}" target="_blank" class="listing-card glass-card" style="text-decoration:none; color:inherit; display:block; padding:0; overflow:hidden; border-radius:1rem;">
                        <div style="position:relative; padding-top:60%; overflow:hidden;">
                            <img src="${imgUrl}" alt="${escHtml(l.title || l.make + ' ' + l.model)}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(l.make)} ${escHtml(l.model)}</div>
                            <div style="font-size:16px; font-weight:bold; color:var(--color-primary-start); margin:4px 0;">${lPrice}</div>
                            <div style="font-size:12px; color:#6b7280;">L. ${l.year} • ${km ? new Intl.NumberFormat('sl-SI').format(km) + ' km' : '—'}</div>
                        </div>
                    </a>
                `;
            });
            compResultsContainer.innerHTML = html;
        } else {
            compResultsContainer.innerHTML = '<p style="color:#6b7280; font-size:0.9rem; grid-column:1/-1;">Na portalu trenutno ni točno takšnih vozil. Ocena je narejena na podlagi splošnega algoritma padca vrednosti.</p>';
        }

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ── SVG star renderer ─────────────────────────────────────────────────────────
function renderStarsSvg(stars, size = 'md') {
    const dim = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
    const gap = size === 'sm' ? 1 : 2;
    let html = `<div style="display:inline-flex;gap:${gap}px;align-items:center;">`;

    for (let i = 1; i <= 5; i++) {
        const fill = stars >= i ? 'full' : stars >= i - 0.5 ? 'half' : 'empty';
        const color = fill === 'empty' ? '#374151' : 'var(--color-primary-start, #f59e0b)';

        if (fill === 'half') {
            html += `<svg width="${dim}" height="${dim}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="half-${i}">
                        <stop offset="50%" stop-color="var(--color-primary-start, #f59e0b)"/>
                        <stop offset="50%" stop-color="#374151"/>
                    </linearGradient>
                </defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="url(#half-${i})" stroke="none"/>
            </svg>`;
        } else {
            html += `<svg width="${dim}" height="${dim}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="${color}" stroke="none"/>
            </svg>`;
        }
    }

    html += '</div>';
    return html;
}

function escHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
