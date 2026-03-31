// Advanced Search page — MojAvto.si
import { getListings } from '../services/listingService.js';

export function initAdvancedSearchPage() {
    console.log('[AdvancedSearchPage] init');
    bindSearchLogic();
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function bindSearchLogic() {
    const searchForm = document.getElementById("advancedSearchForm");
    const brandSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const variantSelect = document.getElementById("variant");
    
    // Category Tabs & Body Types Grid
    const tabBtns = document.querySelectorAll('.glass-tabs .tab-btn');
    const grids = {
        'Avtomobili': document.getElementById('grid-cars'),
        'Motorji': document.getElementById('grid-motorbikes'),
        'Gospodarska vozila': document.getElementById('grid-commercial')
    };
    const bodyTypeHidden = document.getElementById('bodyTypeHidden');
    const allBodyTypeCards = document.querySelectorAll('.body-type-card');

    // Date & Form Elements
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    const searchBtn = document.getElementById("searchBtn");
    const resultsWrapper = document.getElementById("results-wrapper");
    const resultsContainer = document.getElementById("search-results-container");
    const resultsCount = document.getElementById("results-count");

    if (!searchForm || !brandSelect) return;

    // --- Tab Switching Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all tabs
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#6b7280';
            });
            // Set current tab active
            const currentTab = e.currentTarget;
            currentTab.classList.add('active');
            currentTab.style.background = 'white';
            currentTab.style.color = 'inherit';

            const activeCategory = currentTab.textContent.trim();

            // Hide all body type grids
            Object.values(grids).forEach(g => { if(g) g.style.display = 'none'; });

            // Clear selected body types
            allBodyTypeCards.forEach(c => c.classList.remove('active'));
            bodyTypeHidden.value = '';

            // Show relevant grid
            if (activeCategory === 'Avtomobili' && grids['Avtomobili']) grids['Avtomobili'].style.display = 'grid';
            else if (activeCategory === 'Motorji' && grids['Motorji']) grids['Motorji'].style.display = 'grid';
            else if (grids['Gospodarska vozila']) grids['Gospodarska vozila'].style.display = 'grid';
        });
    });

    // --- Body Type Cards Selection ---
    allBodyTypeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const currentGrid = e.currentTarget.closest('.body-type-grid');
            // Remove active class from cards in the CURRENT grid only (radio behavior)
            currentGrid.querySelectorAll('.body-type-card').forEach(c => c.classList.remove('active'));
            
            // Toggle active state
            e.currentTarget.classList.add('active');
            
            // Update hidden value
            bodyTypeHidden.value = e.currentTarget.getAttribute('data-value');
        });
    });

    // --- Populate Years ---
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const option1 = document.createElement("option"); option1.value = y; option1.textContent = y;
        const option2 = document.createElement("option"); option2.value = y; option2.textContent = y;
        yearFromSelect.appendChild(option1);
        yearToSelect.appendChild(option2);
    }

    // --- 3-Step Cascade Navigation: Znamka -> Model -> Različica ---
    fetch("/json/brands_models_global.json")
        .then(res => res.json())
        .then(brandModelData => {
            
            // 1. Populate Makes
            Object.keys(brandModelData).sort().forEach(brand => {
                const option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });

            // 2. Make changed -> Update Models
            brandSelect.addEventListener("change", function () {
                const selectedMake = brandSelect.value;
                modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
                variantSelect.innerHTML = '<option value="">Vse različice</option>';
                
                modelSelect.disabled = true;
                variantSelect.disabled = true;

                if (selectedMake && brandModelData[selectedMake]) {
                    const models = brandModelData[selectedMake];
                    const modelKeys = Object.keys(models).sort();
                    
                    modelKeys.forEach(model => {
                        const option = document.createElement("option");
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.disabled = false;
                }
            });

            // 3. Model changed -> Update Variants
            if (variantSelect) {
                modelSelect.addEventListener("change", function () {
                    const selectedMake = brandSelect.value;
                    const selectedModel = modelSelect.value;
                    
                    variantSelect.innerHTML = '<option value="">Vse različice</option>';
                    variantSelect.disabled = true;

                    if (selectedMake && selectedModel && brandModelData[selectedMake][selectedModel]) {
                        const variants = brandModelData[selectedMake][selectedModel];
                        
                        // Array of strings expected for variants
                        if (Array.isArray(variants) && variants.length > 0) {
                            variants.forEach(variant => {
                                const option = document.createElement("option");
                                option.value = variant;
                                option.textContent = variant;
                                variantSelect.appendChild(option);
                            });
                            variantSelect.disabled = false;
                        }
                    }
                });
            }
        }).catch(err => console.warn("Could not load brands_models_global.json.", err));

    // --- Search Submission ---
    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        searchBtn.disabled = true;
        searchBtn.textContent = 'Iščem...';

        try {
            const formData = new FormData(searchForm);
            const filters = {
                make: formData.get('make'),
                model: formData.get('model'),
                variant: formData.get('variant'),
                bodyType: formData.get('bodyType'),
                priceFrom: Number(formData.get('priceFrom')) || 0,
                priceTo: Number(formData.get('priceTo')) || Infinity,
                yearFrom: Number(formData.get('yearFrom')) || 0,
                yearTo: Number(formData.get('yearTo')) || Infinity,
                mileageTo: Number(formData.get('mileageTo')) || Infinity,
                fuel: formData.get('fuel'),
                transmission: formData.get('transmission')
            };

            // Fetch active listings and apply UI filters
            let allListings = await getListings();

            const filteredListings = allListings.filter(l => {
                if (filters.make && l.make !== filters.make) return false;
                if (filters.model && l.model !== filters.model) return false;
                
                // MOCK search doesn't strict match variants unless field exists, but let's check it for future API readiness
                if (filters.variant && l.title && !l.title.includes(filters.variant) && l.variant !== filters.variant) return false;
                
                if (filters.bodyType && l.bodyType !== filters.bodyType) return false;
                
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
            const imgUrl = listing.images && listing.images.exterior ? listing.images.exterior[0] : 'https://via.placeholder.com/300x200?text=Ni+slike';
            const price = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price);

            html += `
                <a href="#/oglas?id=${listing.id}" class="listing-card glass-card" style="text-decoration:none; color:inherit; display:block; padding:0; overflow:hidden;">
                    <div style="position:relative; padding-top:66%; overflow:hidden;">
                        <img src="${imgUrl}" alt="${listing.title}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${listing.isPremium ? '<span style="position:absolute; top:10px; left:10px; background:#f97316; color:white; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:bold;">Izpostavljeno</span>' : ''}
                    </div>
                    <div style="padding:15px;">
                        <h3 style="margin:0 0 10px 0; font-size:16px;">${listing.make} ${listing.model} ${listing.type || ''}</h3>
                        <div style="font-size:20px; font-weight:bold; color:var(--color-primary-start); margin-bottom:15px;">${price}</div>
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
