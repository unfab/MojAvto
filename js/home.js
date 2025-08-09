import { translate } from './i18n.js';
import { createListingCard } from './components/ListingCard.js';

export function initHomePage() {
    // === DOM ELEMENTI ===
    const searchForm = document.getElementById('homeSearchForm');
    const makeSelect = document.getElementById('make');
    const modelSelect = document.getElementById('model');
    const regFromSelect = document.getElementById('reg-from');
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const loadingSpinner = document.getElementById('loading-spinner');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Varnostna preverba
    if (!searchForm || !listingsGrid || !loadingSpinner || !sortOrderSelect) {
        console.error("Manjka eden od ključnih elementov na domači strani.");
        return;
    }

    // === STANJE APLIKACIJE ===
    let allListings = [];
    let brandModelData = {};
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    // === POSODOBLJENO: Preberemo kriterije iz naprednega iskanja ===
    const advancedSearchCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria')) || null;

    // --- INICIALIZACIJA STRANI ---

    // 1. Naloži podatke za znamke in modele ter napolni iskalnik
    fetch('./json/brands_models_global.json')
        .then(res => res.json())
        .then(data => {
            brandModelData = data;
            const sortedBrands = Object.keys(brandModelData).sort();
            sortedBrands.forEach(brand => makeSelect.add(new Option(brand, brand)));
        });

    // 2. Naloži vse oglase in jih prikaži
    loadingSpinner.style.display = 'block';
    listingsGrid.innerHTML = '';
    fetch('./json/listings.json')
        .then(res => res.json())
        .then(data => {
            allListings = data;
            // === POSODOBLJENO: Po nalaganju takoj filtriramo glede na kriterije ===
            // Če obstajajo kriteriji iz naprednega iskanja, jih uporabimo. Sicer prikažemo vse.
            const listingsToDisplay = filterListings(allListings, advancedSearchCriteria);
            displayPage(listingsToDisplay, 1);
            
            // Počistimo kriterije, da se ne uporabijo ponovno ob osvežitvi strani
            if (advancedSearchCriteria) {
                sessionStorage.removeItem('advancedSearchCriteria');
            }
        })
        .catch(error => {
            console.error("Napaka pri nalaganju oglasov:", error);
            listingsGrid.innerHTML = `<p>Napaka pri nalaganju oglasov.</p>`;
        })
        .finally(() => {
            loadingSpinner.style.display = 'none';
        });

    // --- FUNKCIJE ---

    function displayPage(listings, page) {
        currentPage = page;
        listingsGrid.innerHTML = '';
        noListingsMessage.style.display = 'none';

        if (listings.length === 0) {
            noListingsMessage.style.display = 'block';
            renderPagination(0, page);
            return;
        }
        
        const sorted = sortListings(listings, sortOrderSelect.value);
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedItems = sorted.slice(start, end);

        paginatedItems.forEach(listing => {
            const card = createListingCard(listing);
            listingsGrid.appendChild(card);
        });

        renderPagination(listings.length, page);
    }

    function sortListings(listings, order) {
        return [...listings].sort((a, b) => {
            switch (order) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'year_desc': return b.year - a.year;
                case 'newest': default: return new Date(b.date_added) - new Date(a.date_added);
            }
        });
    }

    function renderPagination(totalItems, currentPage) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = 'page-btn';
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => {
                const currentCriteria = getCurrentCriteria();
                const filtered = filterListings(allListings, currentCriteria);
                displayPage(filtered, i);
            });
            paginationContainer.appendChild(pageBtn);
        }
    }

    // === POSODOBLJENO: Zmogljivejša funkcija za filtriranje ===
    // Ta funkcija zna obravnavati tako preproste kriterije (iz domače forme)
    // kot kompleksne (iz naprednega iskanja).
    function filterListings(listings, criteria) {
        if (!criteria) {
            return listings; // Če ni kriterijev, vrni vse
        }

        return listings.filter(listing => {
            // Logika za preprosto iskanje (iz domače forme)
            if (criteria.make && listing.make !== criteria.make) return false;
            if (criteria.model && listing.model !== criteria.model) return false;
            if (criteria.yearFrom && listing.year < parseInt(criteria.yearFrom)) return false;
            if (criteria.priceTo && listing.price > parseInt(criteria.priceTo)) return false;
            if (criteria.fuel && listing.fuel !== criteria.fuel) return false;
            if (criteria.mileageTo && listing.mileage > parseInt(criteria.mileageTo)) return false;
            if (criteria.region && listing.region !== criteria.region) return false;
            
            // Logika za napredno iskanje
            if (criteria.priceFrom && listing.price < parseInt(criteria.priceFrom)) return false;
            if (criteria.yearTo && listing.year > parseInt(criteria.yearTo)) return false;
            if (criteria.mileageFrom && listing.mileage < parseInt(criteria.mileageFrom)) return false;
            if (criteria.gearbox && listing.transmission !== criteria.gearbox) return false;
            if (criteria.body_type && !criteria.body_type.includes(listing.body_type)) return false;

            // Logika za vključitev (inclusionCriteria)
            if (criteria.inclusionCriteria) {
                const matchesInclusion = criteria.inclusionCriteria.some(inc => 
                    (inc.make === listing.make) &&
                    (!inc.model || inc.model === listing.model) &&
                    (!inc.type || inc.type === listing.type)
                );
                if (!matchesInclusion) return false;
            }

            // Logika za izključitev (exclusionRules)
            if (criteria.exclusionRules) {
                const matchesExclusion = criteria.exclusionRules.some(exc => 
                    (exc.make === listing.make) &&
                    (!exc.model || exc.model === listing.model) &&
                    (!exc.type || exc.type === listing.type)
                );
                if (matchesExclusion) return false;
            }

            return true;
        });
    }
    
    // Pomožna funkcija za pridobivanje kriterijev iz domače forme
    function getCurrentCriteria() {
        const formData = new FormData(searchForm);
        return Object.fromEntries(formData.entries());
    }
    
    // --- POSLUŠALCI DOGODKOV ---

    makeSelect.addEventListener('change', function() {
        modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        modelSelect.disabled = true;
        if (this.value && brandModelData[this.value]) {
            Object.keys(brandModelData[this.value]).forEach(model => {
                modelSelect.add(new Option(model, model));
            });
            modelSelect.disabled = false;
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const criteria = getCurrentCriteria();
        const filtered = filterListings(allListings, criteria);
        displayPage(filtered, 1);
    });

    sortOrderSelect.addEventListener('change', () => {
        const criteria = getCurrentCriteria();
        const filtered = filterListings(allListings, criteria);
        displayPage(filtered, currentPage);
    });

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        regFromSelect.add(new Option(y, y));
    }
}