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

    // --- DOM ELEMENTI ---
    const searchForm = document.getElementById("advancedSearchForm");
    const saveSearchBtn = document.getElementById("saveSearchBtn");
    const brandSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    // ... ostali elementi, kot prej ...

    // ... koda za inicializacijo drsnika in polnjenje obrazca ostane enaka ...

    // --- LOGIKA GUMBOV ---
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchCriteria = getCriteriaFromForm();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(searchCriteria));
        window.location.href = "index.html";
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
        
        const priceSlider = document.getElementById('price-slider');
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
    
    // Kopirana funkcija za takojšnje štetje rezultatov
    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return [];
        // ... logika filtriranja, enaka kot v main.js ...
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        // ... dodajte preostale filtre ...
        return filtered;
    }
});