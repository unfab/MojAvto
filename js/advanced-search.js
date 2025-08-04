import { translate } from './i18n.js';
// Izvozimo funkcijo, ki jo bo poklical ruter
export function initAdvancedSearchPage() {
    // DOM ELEMENTI
    const searchForm = document.getElementById("advancedSearchForm");
    const saveSearchBtn = document.getElementById("saveSearchBtn");
    const brandSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    const priceSlider = document.getElementById('price-slider');
    const priceLower = document.getElementById('price-lower');
    const priceUpper = document.getElementById('price-upper');

    // INICIALIZACIJA DRSNIKA ZA CENO
    if (priceSlider) {
        noUiSlider.create(priceSlider, {
            start: [500, 50000],
            connect: true,
            step: 100,
            range: { 'min': 0, 'max': 100000 },
            format: {
                to: (value) => Math.round(value) + ' €',
                from: (value) => Number(value.replace(' €', ''))
            }
        });
        priceSlider.noUiSlider.on('update', (values) => {
            priceLower.innerHTML = values[0];
            priceUpper.innerHTML = values[1];
        });
    }

    // DINAMIČNO POLNJENJE OBRAZCA
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) { /* ... koda za polnjenje letnikov ... */ }

    fetch('./json/brands_models_global.json')
      .then(res => res.json())
      .then(brandModelData => {
        Object.keys(brandModelData).sort().forEach(brand => { /* ... koda za polnjenje znamk ... */ });
        brandSelect.addEventListener("change", function () { /* ... koda za polnjenje modelov ... */ });
      });

    // LOGIKA GUMBOV
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchCriteria = getCriteriaFromForm();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(searchCriteria));
        window.location.hash = '#/'; // Preusmeritev na domačo stran
    });

    saveSearchBtn.addEventListener('click', () => {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) {
            alert(translate('must_be_logged_in_to_save_searches'));
            return;
        }
        const searchName = prompt(translate('prompt_save_search_name'));
        if (!searchName || searchName.trim() === "") {
            alert(translate('error_search_name_empty'));
            return;
        }
        const searchCriteria = getCriteriaFromForm();
        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        const resultsCount = applyAdvancedFilters(allListings, searchCriteria).length;
        const newSavedSearch = {
            id: Date.now(), name: searchName, criteria: searchCriteria,
            savedAt: new Date().toISOString(), lastResultCount: resultsCount
        };
        const allSavedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};
        if (!allSavedSearches[loggedUser.username]) {
            allSavedSearches[loggedUser.username] = [];
        }
        allSavedSearches[loggedUser.username].push(newSavedSearch);
        localStorage.setItem('mojavto_savedSearches', JSON.stringify(allSavedSearches));
        alert(translate('search_saved_successfully', { searchName: searchName }));
    });
    
    searchForm.addEventListener('reset', () => {
        if (priceSlider) {
            priceSlider.noUiSlider.set([500, 50000]);
        }
    });

    // POMOŽNE FUNKCIJE
    function getCriteriaFromForm() {
        const formData = new FormData(searchForm);
        const criteria = {};
        if (priceSlider && priceSlider.noUiSlider) {
            const priceValues = priceSlider.noUiSlider.get(true);
            criteria['priceFrom'] = priceValues[0];
            criteria['priceTo'] = priceValues[1];
        }
        for (const [key, value] of formData.entries()) {
            if (value) {
                criteria[key] = value;
            }
        }
        return criteria;
    }
    
    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return [];
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        // ... dodajte preostale filtre, če jih imate ...
        return filtered;
    }
}