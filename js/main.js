import { translate } from './i18n.js';

export function initHomePage() {
    // === DOM Elementi ===
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("reg-from"); // Pravilen ID iz novega home.html
    const priceToInput = document.getElementById("priceTo");
    const listingsContainer = document.getElementById("listingsContainer");
    const noListingsMessage = document.getElementById("noListingsMessage");
    const paginationContainer = document.getElementById("pagination-container");
    
    // === Podatki ===
    let brandModelData = {};
    let allListings = [];
    let currentFilteredListings = [];
    const listingsPerPage = 9;
    let currentPage = 1;

    // --- LOGIKA ZA PRIMERJAVO ---
    // ... vaša obstoječa koda za primerjavo, je v redu ...
    function getCompareItems() { return JSON.parse(localStorage.getItem("mojavto_compareItems")) || []; }
    function toggleCompareItem(listingId) { /* ... */ }
    function updateCompareUI() { /* ... */ }

    // --- LOGIKA ZA PRILJUBLJENE ---
    // ... vaša obstoječa koda za priljubljene, je v redu ...
    function getFavorites() { /* ... */ }
    function toggleFavorite(listingId) { /* ... */ }
    function updateFavoritesUI() { /* ... */ }

    // --- PRIKAZ OGLASOV IN STRANI ---
    function renderListings(listings) {
        // ... vaša obstoječa koda za renderListings, je v redu ...
    }

    // === DODANA/POPRAVLJENA LOGIKA ZA FILTRE ===
    function handleFilterChange() {
        currentPage = 1; // Ob vsaki spremembi filtra se vrnemo na prvo stran
        const simpleFilters = {
            make: makeSelect.value,
            model: modelSelect.value,
            yearFrom: parseInt(yearFromSelect.value, 10),
            priceTo: parseFloat(priceToInput.value)
        };
        currentFilteredListings = applySimpleFilters(allListings, simpleFilters);
        displayPage(currentFilteredListings);
    }

    function applySimpleFilters(listings, criteria) {
        let filtered = listings;
        if (criteria.make) filtered = filtered.filter(item => item.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(item => item.model === criteria.model);
        if (!isNaN(criteria.yearFrom)) filtered = filtered.filter(item => item.year >= criteria.yearFrom);
        if (!isNaN(criteria.priceTo)) filtered = filtered.filter(item => item.price <= criteria.priceTo);
        return filtered;
    }
    
    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return filtered;
        if (criteria.excludedMakes && criteria.excludedMakes.length > 0) {
            filtered = filtered.filter(listing => !criteria.excludedMakes.includes(listing.make));
        }
        // ... ostali filtri ...
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        if (criteria.yearFrom) filtered = filtered.filter(l => l.year >= Number(criteria.yearFrom));
        if (criteria.yearTo) filtered = filtered.filter(l => l.year <= Number(criteria.yearTo));
        return filtered;
    }

    function populateMakeOptions() {
        if (!makeSelect) return;
        makeSelect.innerHTML = `<option value="">${translate('all_brands') || 'Vse znamke'}</option>`;
        Object.keys(brandModelData).sort().forEach(make => {
            const option = document.createElement("option");
            option.value = make;
            option.textContent = make;
            makeSelect.appendChild(option);
        });
    }

    function displayPage(listingsToShow) {
        renderListings(listingsToShow);
        // ... vaša koda za paginacijo ...
    }

    // --- ZAČETNI ZAGON STRANI ---
    async function initializePage() {
        const initialListings = [ /* ... vaši testni podatki ... */ ];
        allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || initialListings;
        if (!localStorage.getItem("mojavto_listings")) {
            localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
        }

        // DODANO: Naložimo podatke o znamkah in modelih
        try {
            const response = await fetch('./json/brands_models_global.json');
            brandModelData = await response.json();
            populateMakeOptions();
        } catch (error) {
            console.error("Napaka pri nalaganju znamk in modelov:", error);
        }

        // DODANO: Napolnimo leta
        if (yearFromSelect) {
            const currentYear = new Date().getFullYear();
            yearFromSelect.innerHTML = '<option value="">Letnik od</option>';
            for (let y = currentYear; y >= 1980; y--) {
                const option = document.createElement('option');
                option.value = y;
                option.textContent = y;
                yearFromSelect.appendChild(option);
            }
        }
        
        // DODANO: Dodamo poslušalce dogodkov za filtre
        if(makeSelect) makeSelect.addEventListener("change", () => {
             const selectedMake = makeSelect.value;
             modelSelect.innerHTML = `<option value="">${translate('all_models') || 'Vsi modeli'}</option>`;
             modelSelect.disabled = true;
             if (selectedMake && brandModelData[selectedMake]) {
                 const models = Object.keys(brandModelData[selectedMake]);
                 models.forEach(model => {
                     const option = document.createElement("option");
                     option.value = model;
                     option.textContent = model;
                     modelSelect.appendChild(option);
                 });
                 modelSelect.disabled = false;
             }
             handleFilterChange();
        });
        if(modelSelect) modelSelect.addEventListener("change", handleFilterChange);
        if(yearFromSelect) yearFromSelect.addEventListener("input", handleFilterChange);
        if(priceToInput) priceToInput.addEventListener("input", handleFilterChange);

        // Preverjanje za napredno iskanje
        const advancedCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria'));
        if (advancedCriteria) {
            currentFilteredListings = applyAdvancedFilters(allListings, advancedCriteria);
            sessionStorage.removeItem('advancedSearchCriteria');
        } else {
            currentFilteredListings = allListings;
        }
        
        displayPage(currentFilteredListings);
    }
    
    initializePage();
}

// --- Tukaj prilepite kopije funkcij, ki so bile prej znotraj initHomePage, da bodo dostopne vsem ---
// To prepreči podvajanje in omogoča boljšo organizacijo.
// V prihodnosti bi te funkcije lahko bile v svoji datoteki, npr. 'utils.js'.
function getCompareItems() { return JSON.parse(localStorage.getItem("mojavto_compareItems")) || []; }
// ... in tako naprej za ostale funkcije, če jih kličete izven main.js ...
// Zaenkrat pustimo znotraj, ker jih kliče samo initHomePage.