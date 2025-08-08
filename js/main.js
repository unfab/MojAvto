import { translate } from './i18n.js';

export function initHomePage() {
    // === DOM Elementi ===
    const listingsContainer = document.getElementById("listingsContainer");
    const noListingsMessage = document.getElementById("noListingsMessage");
    const paginationContainer = document.getElementById("pagination-container");
    const homeSearchForm = document.getElementById("homeSearchForm");
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("reg-from");
    const fuelSelect = document.getElementById("fuel-type"); // Pravilen ID iz HTML-ja
    const regionSelect = document.getElementById("region");   // Pravilen ID iz HTML-ja
    
    // === Podatki ===
    let brandModelData = {};
    let allListings = [];
    let currentFilteredListings = [];
    const listingsPerPage = 9;
    let currentPage = 1;

    // === LOGIKA ZA ZAVIHKI V ISKALNIKU ===
    const vehicleTabs = document.querySelectorAll('.tab-btn');
    if (vehicleTabs) {
        vehicleTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                vehicleTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    // --- LOGIKA ZA PRIMERJAVO ---
    function getCompareItems() {
        return JSON.parse(localStorage.getItem("mojavto_compareItems")) || [];
    }

    function toggleCompareItem(listingId) {
        let compareItems = getCompareItems();
        const itemIndex = compareItems.indexOf(listingId);
        if (itemIndex > -1) {
            compareItems.splice(itemIndex, 1);
        } else {
            if (compareItems.length >= 4) {
                alert(translate('compare_limit_4') || 'Dosegli ste limito 4 vozil za primerjavo.');
                return;
            }
            compareItems.push(listingId);
        }
        localStorage.setItem("mojavto_compareItems", JSON.stringify(compareItems));
        updateCompareUI();
    }

    function updateCompareUI() {
        const compareItems = getCompareItems();
        document.querySelectorAll('.compare-btn').forEach(btn => {
            const cardId = parseInt(btn.dataset.id, 10);
            btn.classList.toggle('selected', compareItems.includes(cardId));
        });
        const compareLink = document.getElementById("compareLink");
        const compareCount = document.getElementById("compareCount");
        if (compareLink && compareCount) {
            if (compareItems.length > 0) {
                compareLink.style.display = 'flex';
                compareCount.textContent = compareItems.length;
            } else {
                compareLink.style.display = 'none';
            }
        }
    }

    // --- LOGIKA ZA PRILJUBLJENE ---
    function getFavorites() {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) return [];
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        return allFavorites[loggedUser.username] || [];
    }

    function toggleFavorite(listingId) {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) {
            alert(translate('must_be_logged_in_to_favorite'));
            return;
        }
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        let userFavorites = allFavorites[loggedUser.username] || [];
        const itemIndex = userFavorites.indexOf(listingId);
        if (itemIndex > -1) {
            userFavorites.splice(itemIndex, 1);
        } else {
            userFavorites.push(listingId);
        }
        allFavorites[loggedUser.username] = userFavorites;
        localStorage.setItem("mojavto_favorites", JSON.stringify(allFavorites));
        updateFavoritesUI();
    }

    function updateFavoritesUI() {
        const favorites = getFavorites();
        document.querySelectorAll('.fav-btn').forEach(btn => {
            const cardId = parseInt(btn.dataset.id, 10);
            const isFavorited = favorites.includes(cardId);
            btn.classList.toggle('favorited', isFavorited);
            const icon = btn.querySelector('i');
            icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        });
    }

    // --- PRIKAZ OGLASOV ---
    function renderListings(listings) {
        if (!listingsContainer) return;
        listingsContainer.innerHTML = "";
        noListingsMessage.style.display = listings.length === 0 ? "block" : "none";
        
        const paginatedListings = listings.slice((currentPage - 1) * listingsPerPage, currentPage * listingsPerPage);

        paginatedListings.forEach(listing => {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
                    <button class="fav-btn" data-id="${listing.id}" title="${translate('add_to_favorites')}"><i class="far fa-heart"></i></button>
                    <button class="compare-btn" data-id="${listing.id}" title="${translate('nav_compare')}"><i class="fas fa-balance-scale"></i></button>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-details">${translate('spec_year')}: ${listing.year} | ${listing.mileage.toLocaleString()} km</p>
                    <p class="card-price">${listing.price.toLocaleString()} €</p>
                </div>`;
            card.addEventListener("click", (e) => {
                if (e.target.closest('.compare-btn') || e.target.closest('.fav-btn')) return;
                window.location.hash = `#/listing/${listing.id}`;
            });
            card.querySelector('.compare-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleCompareItem(listing.id); });
            card.querySelector('.fav-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(listing.id); });
            listingsContainer.appendChild(card);
        });

        updateCompareUI();
        updateFavoritesUI();
    }

    // --- FILTRIRANJE ---
    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return filtered;
        
        if (criteria.exclusionRules && criteria.exclusionRules.length > 0) {
            filtered = filtered.filter(listing => {
                const shouldBeExcluded = criteria.exclusionRules.some(rule => {
                    const makeMatch = rule.make === listing.make;
                    if (!rule.model) return makeMatch;
                    const modelMatch = rule.model === listing.model;
                    if (!rule.type) return makeMatch && modelMatch;
                    const typeMatch = rule.type === listing.type;
                    return makeMatch && modelMatch && typeMatch;
                });
                return !shouldBeExcluded;
            });
        }
        
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        if (criteria.yearFrom) filtered = filtered.filter(l => l.year >= Number(criteria.yearFrom));
        if (criteria.yearTo) filtered = filtered.filter(l => l.year <= Number(criteria.yearTo));
        if (criteria.type) filtered = filtered.filter(l => l.type === criteria.type);
        if (criteria.fuel) filtered = filtered.filter(l => l.fuel === criteria.fuel);
        if (criteria.range) filtered = filtered.filter(l => l.range && l.range >= Number(criteria.range));
        if (criteria.mileageFrom) filtered = filtered.filter(l => l.mileage >= Number(criteria.mileageFrom));
        if (criteria.mileageTo) filtered = filtered.filter(l => l.mileage <= Number(criteria.mileageTo));
        if (criteria.battery) filtered = filtered.filter(l => l.battery && l.battery >= Number(criteria.battery));
        if (criteria.gearbox) filtered = filtered.filter(l => l.transmission === criteria.gearbox);
        if (criteria.hybrid_type) {
            const selectedTypes = Array.isArray(criteria.hybrid_type) ? criteria.hybrid_type : [criteria.hybrid_type];
            filtered = filtered.filter(l => l.hybridType && selectedTypes.includes(l.hybridType));
        }
        
        return filtered;
    }

    function displayPage(listingsToShow) {
        renderListings(listingsToShow);
        // Tukaj pride vaša koda za paginacijo...
    }
    
    // --- FUNKCIJE ZA POLNJENJE FILTROV ---
    function populateFuelOptions() {
        if (!fuelSelect) return;
        const fuelTypes = ['Bencin', 'Dizel', 'Elektrika', 'Hibrid', 'Plin'];
        fuelTypes.forEach(fuel => {
            fuelSelect.add(new Option(fuel, fuel));
        });
    }

    function populateRegionOptions() {
        if (!regionSelect) return;
        const regions = [
            'Osrednjeslovenska', 'Podravska', 'Savinjska', 'Gorenjska', 'Goriška', 
            'Primorsko-notranjska', 'Obalno-kraška', 'Jugovzhodna Slovenija', 
            'Koroška', 'Pomurska', 'Posavska', 'Zasavska'
        ];
        regions.forEach(region => {
            regionSelect.add(new Option(region, region));
        });
    }

    // --- ZAČETNI ZAGON STRANI ---
    async function initializePage() {
        try {
            const response = await fetch('./json/listings.json');
            allListings = await response.json();
        } catch (error) {
            console.error("Napaka pri nalaganju oglasov:", error);
            allListings = [];
        }
        
        try {
            const brandsResponse = await fetch('./json/brands_models_global.json');
            brandModelData = await brandsResponse.json();
            Object.keys(brandModelData).sort().forEach(make => makeSelect.add(new Option(make, make)));
            
            makeSelect.addEventListener("change", function () {
                const selectedMake = this.value;
                modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
                modelSelect.disabled = true;
                if (selectedMake && brandModelData[selectedMake]) {
                    Object.keys(brandModelData[selectedMake]).forEach(model => modelSelect.add(new Option(model, model)));
                    modelSelect.disabled = false;
                }
            });
        } catch (error) {
            console.error("Napaka pri nalaganju znamk:", error);
        }

        if (yearFromSelect) {
            const currentYear = new Date().getFullYear();
            yearFromSelect.innerHTML = '<option value="">Letnik od</option>';
            for (let y = currentYear; y >= 1900; y--) yearFromSelect.add(new Option(y, y));
        }
        
        // Napolnimo goriva in regije
        populateFuelOptions();
        populateRegionOptions();

        const advancedCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria'));
        if (advancedCriteria) {
            currentFilteredListings = applyAdvancedFilters(allListings, advancedCriteria);
            sessionStorage.removeItem('advancedSearchCriteria');
        } else {
            currentFilteredListings = allListings;
        }
        
        homeSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(homeSearchForm);
            const criteria = Object.fromEntries(formData.entries());
            currentFilteredListings = applyAdvancedFilters(allListings, criteria);
            currentPage = 1;
            displayPage(currentFilteredListings);
        });
        
        displayPage(currentFilteredListings);
    }
    
    initializePage();
}