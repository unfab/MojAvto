import { getListings } from '../services/listingService.js';

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

            // Init custom selects
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

    // --- Form Submission & Calculation ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const make = brandSelect.value;
        const model = modelSelect.value;
        const year = parseInt(yearSelect.value, 10);
        const userMileage = parseInt(mileageInput.value, 10) || 0;

        if (!make || !model || !year) {
            alert('Prosimo izpolnite vse obvezne podatke.');
            return;
        }

        evalBtn.disabled = true;
        evalBtn.querySelector('span').textContent = 'Ocenjujem...';
        resultsContainer.style.display = 'none';

        try {
            const allListings = await getListings();
            
            // Filter: Same Make, Same Model, Year within +/- 2 years
            const comps = allListings.filter(l => 
                l.make === make &&
                l.model === model &&
                l.year >= year - 2 &&
                l.year <= year + 2
            );

            // Calculate Base Value
            let estimatedValue = 0;
            
            if (comps.length > 0) {
                // Average price of comparables
                const totalPrice = comps.reduce((sum, l) => sum + l.price, 0);
                let avgPrice = totalPrice / comps.length;
                
                // Average mileage of comparables
                const totalMileage = comps.reduce((sum, l) => sum + (l.mileage || 0), 0);
                const avgMileage = totalMileage / comps.length;

                // Simple depreciation model based on mileage difference (assume ~1% value drop per 10k km difference)
                const mileageDiff = userMileage - avgMileage;
                const penaltyFactor = 1 - ((mileageDiff / 10000) * 0.01);
                
                estimatedValue = avgPrice * penaltyFactor;
                // Cap boundaries
                if (estimatedValue < avgPrice * 0.5) estimatedValue = avgPrice * 0.5;
                if (estimatedValue > avgPrice * 1.5) estimatedValue = avgPrice * 1.5;

            } else {
                // Mock calculation if no exact comparables exist on site
                const fallbackBase = 15000; 
                const age = currentYear - year;
                // ~10% depreciation per year roughly
                let depreciated = fallbackBase * Math.pow(0.9, age);
                // ~0.05 EUR loss per km
                let mileagePen = userMileage * 0.05;
                estimatedValue = depreciated - mileagePen;
                
                if (estimatedValue < 1000) estimatedValue = 1000;
            }

            renderResults(estimatedValue, comps);

        } catch (error) {
            console.error("Napaka pri oceni:", error);
            alert("Prišlo je do napake pri oceni vrednosti vozila.");
        } finally {
            evalBtn.disabled = false;
            evalBtn.querySelector('span').textContent = 'Izračunaj vrednost';
        }
    });

    function renderResults(estimatedPrice, comparables) {
        // Format price
        const formattedPrice = new Intl.NumberFormat('sl-SI', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 0 
        }).format(estimatedPrice);

        estPriceContainer.textContent = formattedPrice;
        estCountSpan.textContent = comparables.length;

        // Render top 4 comparables
        compResultsContainer.innerHTML = '';
        if (comparables.length > 0) {
            const topComps = comparables.slice(0, 4);
            let html = '';
            topComps.forEach(l => {
                const imgUrl = l.images && l.images.exterior ? l.images.exterior[0] : 'https://via.placeholder.com/300x200?text=Ni+slike';
                const lPrice = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(l.price);
                html += `
                    <a href="#/oglas?id=${l.id}" target="_blank" class="listing-card glass-card" style="text-decoration:none; color:inherit; display:block; padding:0; overflow:hidden; border-radius:1rem;">
                        <div style="position:relative; padding-top:60%; overflow:hidden;">
                            <img src="${imgUrl}" alt="${l.title}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.make} ${l.model}</div>
                            <div style="font-size:16px; font-weight:bold; color:var(--color-primary-start); margin:4px 0;">${lPrice}</div>
                            <div style="font-size:12px; color:#6b7280;">L. ${l.year} • ${l.mileage} km</div>
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
