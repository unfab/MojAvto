// Advanced Search page — MojAvto.si
import { getListings } from '../services/listingService.js';

export function initAdvancedSearchPage() {
    console.log('[AdvancedSearchPage] init');
    bindSearchLogic();
}

function bindSearchLogic() {
    const searchForm = document.getElementById("advancedSearchForm");
    const brandSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    const searchBtn = document.getElementById("searchBtn");
    const resultsWrapper = document.getElementById("results-wrapper");
    const resultsContainer = document.getElementById("search-results-container");
    const resultsCount = document.getElementById("results-count");

    if (!searchForm || !brandSelect) return;

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const option1 = document.createElement("option"); option1.value = y; option1.textContent = y;
        const option2 = document.createElement("option"); option2.value = y; option2.textContent = y;
        yearFromSelect.appendChild(option1);
        yearToSelect.appendChild(option2);
    }

    // Load brands and models
    fetch("/json/brands_models_global.json")
        .then(res => res.json())
        .then(brandModelData => {
            Object.keys(brandModelData).sort().forEach(brand => {
                const option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });

            brandSelect.addEventListener("change", function () {
                const selectedMake = brandSelect.value;
                modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
                modelSelect.disabled = true;

                if (selectedMake && brandModelData[selectedMake]) {
                    const models = brandModelData[selectedMake];
                    const modelKeys = Array.isArray(models) ? models : Object.keys(models);
                    modelKeys.forEach(model => {
                        const option = document.createElement("option");
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.disabled = false;
                }
            });
        }).catch(err => console.warn("Could not load brands_models_global.json.", err));

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        searchBtn.disabled = true;
        searchBtn.textContent = 'Iščem...';

        try {
            const formData = new FormData(searchForm);
            const filters = {
                make: formData.get('make'),
                model: formData.get('model'),
                priceFrom: Number(formData.get('priceFrom')) || 0,
                priceTo: Number(formData.get('priceTo')) || Infinity,
                yearFrom: Number(formData.get('yearFrom')) || 0,
                yearTo: Number(formData.get('yearTo')) || Infinity,
                mileageTo: Number(formData.get('mileageTo')) || Infinity,
                fuel: formData.get('fuel'),
                transmission: formData.get('transmission')
            };

            // In V1, we fetch all active listings and filter in memory for simplicity
            let allListings = await getListings();

            const filteredListings = allListings.filter(l => {
                if (filters.make && l.make !== filters.make) return false;
                if (filters.model && l.model !== filters.model) return false;
                if (l.price < filters.priceFrom || l.price > filters.priceTo) return false;
                if (l.year < filters.yearFrom || l.year > filters.yearTo) return false;
                if (l.mileage > filters.mileageTo) return false;
                if (filters.fuel && l.fuel !== filters.fuel) return false;
                if (filters.transmission && l.transmission !== filters.transmission) return false;
                return true;
            });

            renderResults(filteredListings);
        } catch (error) {
            console.error("Napaka pri iskanju:", error);
            resultsWrapper.style.display = 'block';
            resultsContainer.innerHTML = '<p style="color:red;">Prišlo je do napake pri iskanju. Poskusite znova kasneje.</p>';
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Prikaži rezultate';
        }
    });

    function renderResults(listings) {
        resultsWrapper.style.display = 'block';
        resultsCount.textContent = listings.length;

        if (listings.length === 0) {
            resultsContainer.innerHTML = '<p style="color:#6b7280; grid-column:1/-1; text-align:center; padding:2rem;">Ni oglasov, ki bi ustrezali iskalnim kriterijem.</p>';
            return;
        }

        let html = '';
        listings.forEach(listing => {
            const imgUrl = listing.images?.exterior?.[0] || 'https://via.placeholder.com/300x200?text=Ni+slike';
            const price = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price);

            html += `
                <a href="#/oglas?id=${listing.id}" class="listing-card" style="text-decoration:none; color:inherit; display:block; border:1px solid #e5e7eb; border-radius:12px; transition:box-shadow 0.2s;">
                    <div style="position:relative; padding-top:66%; overflow:hidden; border-radius:12px 12px 0 0;">
                        <img src="${imgUrl}" alt="${listing.title}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">
                        ${listing.isPremium ? '<span style="position:absolute; top:10px; left:10px; background:#f97316; color:white; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:bold;">Izpostavljeno</span>' : ''}
                    </div>
                    <div style="padding:15px;">
                        <h3 style="margin:0 0 10px 0; font-size:16px;">${listing.make} ${listing.model} ${listing.type || ''}</h3>
                        <div style="font-size:20px; font-weight:bold; color:#f97316; margin-bottom:15px;">${price}</div>
                        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#6b7280;">
                            <li><i class="fas fa-calendar-alt"></i> ${listing.year}</li>
                            <li><i class="fas fa-road"></i> ${listing.mileage} km</li>
                            <li><i class="fas fa-gas-pump"></i> ${listing.fuel}</li>
                            <li><i class="fas fa-cogs"></i> ${listing.transmission}</li>
                        </ul>
                        <div style="margin-top:10px; font-size:12px; color:#9ca3af; text-align:right;">
                            <i class="fas fa-map-marker-alt"></i> ${listing.region || 'Slovenija'}
                        </div>
                    </div>
                </a>
            `;
        });

        resultsContainer.innerHTML = html;
        resultsWrapper.scrollIntoView({ behavior: 'smooth' });
    }
}
