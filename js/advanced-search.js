document.addEventListener("DOMContentLoaded", () => {
    // --- NALAGANJE GLAVE IN MENIJA ---
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("header").innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });

    fetch("footer.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("footer").innerHTML = data;
      });

    // --- DOM ELEMENTI ---
    const searchForm = document.getElementById("advancedSearchForm");
    const saveSearchBtn = document.getElementById("saveSearchBtn");
    const resetBtn = searchForm.querySelector('button[type="reset"]');
    const brandSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    const fuelSelect = document.getElementById("fuel");
    const hybridOptions = document.getElementById("hybrid-options");
    const priceSlider = document.getElementById("price-slider");

    // --- INICIALIZACIJA DRSNIKA ZA CENO ---
    if (priceSlider && typeof noUiSlider !== 'undefined') {
        noUiSlider.create(priceSlider, {
            start: [0, 100000],
            connect: true,
            range: {
                'min': 0,
                'max': 100000
            },
            step: 500,
            format: {
                to: value => Math.round(value),
                from: value => Number(value)
            }
        });

        priceSlider.noUiSlider.on('update', (values) => {
            document.getElementById('price-lower').textContent = `${parseInt(values[0]).toLocaleString()} €`;
            document.getElementById('price-upper').textContent = `${parseInt(values[1]).toLocaleString()} €`;
        });
    }

    // --- POLNJENJE LETNIKOV ---
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const optionFrom = document.createElement('option');
        optionFrom.value = y;
        optionFrom.textContent = y;
        yearFromSelect.appendChild(optionFrom);

        const optionTo = document.createElement('option');
        optionTo.value = y;
        optionTo.textContent = y;
        yearToSelect.appendChild(optionTo);
    }

    // --- POLNJENJE ZNAMK IN MODELOV ---
    let brandModelData = {};
    fetch("json/brands_models_global.json")
      .then(res => res.json())
      .then(data => {
        brandModelData = data;
        Object.keys(brandModelData).sort().forEach(brand => {
            const option = document.createElement("option");
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });
      });

    brandSelect.addEventListener("change", function () {
        const selectedMake = brandSelect.value;
        modelSelect.innerHTML = `<option value="" data-i18n-key="all_models">Vsi modeli</option>`;
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

    // --- LOGIKA ZA PRIKAZ/SKRIVANJE HIBRID OPCIJ ---
    fuelSelect.addEventListener('change', () => {
        if (fuelSelect.value === 'Hibrid') {
            hybridOptions.style.display = 'block';
        } else {
            hybridOptions.style.display = 'none';
            // Počisti checkboxe ko se skrije
            document.getElementById('phfv').checked = false;
            document.getElementById('mild-hybrid').checked = false;
        }
    });

    // --- LOGIKA GUMBOV ---
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchCriteria = getCriteriaFromForm();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(searchCriteria));
        window.location.href = "index.html";
    });

    // --- RESET FUNKCIONALNOST ---
    resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Resetiraj form
        searchForm.reset();
        
        // Resetiraj price slider
        if (priceSlider && priceSlider.noUiSlider) {
            priceSlider.noUiSlider.set([0, 100000]);
        }
        
        // Resetiraj model select (onemogoči)
        modelSelect.innerHTML = `<option value="" data-i18n-key="all_models">Vsi modeli</option>`;
        modelSelect.disabled = true;
        
        // Skrij hibrid opcije
        hybridOptions.style.display = 'none';
        
        // Scrollaj na vrh
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    saveSearchBtn.addEventListener('click', () => {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) {
            alert("Za shranjevanje iskanj se morate prijaviti.");
            return;
        }

        const searchName = prompt("Vnesite ime za to iskanje (npr. 'Družinski karavan do 15k'):");
        if (!searchName || searchName.trim() === "") {
            alert("Ime iskanja ne sme biti prazno.");
            return;
        }

        const searchCriteria = getCriteriaFromForm();
        
        // Pridobimo število trenutnih rezultatov za "obvestila"
        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        const resultsCount = applyAdvancedFilters(allListings, searchCriteria).length;

        const newSavedSearch = {
            id: Date.now(),
            name: searchName,
            criteria: searchCriteria,
            savedAt: new Date().toISOString(),
            lastResultCount: resultsCount
        };

        const allSavedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};
        if (!allSavedSearches[loggedUser.username]) {
            allSavedSearches[loggedUser.username] = [];
        }

        allSavedSearches[loggedUser.username].push(newSavedSearch);
        localStorage.setItem('mojavto_savedSearches', JSON.stringify(allSavedSearches));

        alert(`Iskanje "${searchName}" je bilo uspešno shranjeno!`);
    });

    // --- POMOŽNA FUNKCIJA ZA ZBIRANJE KRITERIJEV ---
    function getCriteriaFromForm() {
        const formData = new FormData(searchForm);
        const criteria = {};
        
        // Cena iz sliderja
        if (priceSlider && priceSlider.noUiSlider) {
            const priceValues = priceSlider.noUiSlider.get(true);
            criteria['priceFrom'] = priceValues[0];
            criteria['priceTo'] = priceValues[1];
        }

        // Ostali podatki iz forma
        for (const [key, value] of formData.entries()) {
            if (value) {
                // Za checkboxe (hybridType) - zberi vse označene
                if (key === 'hybridType') {
                    if (!criteria.hybridTypes) {
                        criteria.hybridTypes = [];
                    }
                    criteria.hybridTypes.push(value);
                } else {
                    criteria[key] = value;
                }
            }
        }
        return criteria;
    }
    
    // Kopirana funkcija za takojšnje štetje rezultatov
    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return [];
        
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        if (criteria.yearFrom) filtered = filtered.filter(l => l.year >= Number(criteria.yearFrom));
        if (criteria.yearTo) filtered = filtered.filter(l => l.year <= Number(criteria.yearTo));
        if (criteria.mileageTo) filtered = filtered.filter(l => l.mileage <= Number(criteria.mileageTo));
        if (criteria.fuel) filtered = filtered.filter(l => l.fuel === criteria.fuel);
        if (criteria.gearbox) filtered = filtered.filter(l => l.transmission === criteria.gearbox);
        if (criteria.region) filtered = filtered.filter(l => l.region === criteria.region);
        if (criteria.seatMaterial) filtered = filtered.filter(l => l.seatMaterial === criteria.seatMaterial);
        
        // Filter za hibrid tipe
        if (criteria.hybridTypes && criteria.hybridTypes.length > 0) {
            filtered = filtered.filter(l => {
                return l.hybridType && criteria.hybridTypes.includes(l.hybridType);
            });
        }
        
        return filtered;
    }
});