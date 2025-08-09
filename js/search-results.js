import { createListingCard } from './components/ListingCard.js';
import { translate } from './i18n.js';

export function initSearchResultsPage() {
    // === DOM ELEMENTI ===
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const loadingSpinner = document.getElementById('loading-spinner');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    const activeFiltersContainer = document.getElementById('active-filters-container');

    if (!listingsGrid || !loadingSpinner || !sortOrderSelect || !activeFiltersContainer) {
        console.error("Manjka ključen element na strani z rezultati iskanja.");
        return;
    }

    // === STANJE APLIKACIJE ===
    let allListings = [];
    let filteredListings = [];
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    // Preberemo kriterije, ki jih je poslal iskalnik iz sessionStorage
    const searchCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria')) || {};

    // --- FUNKCIJE ---

    // Prikaz aktivnih filtrov na strani
    function displayActiveFilters(criteria) {
        activeFiltersContainer.innerHTML = 'Iskalni filtri: ';
        let hasFilters = false;
        Object.entries(criteria).forEach(([key, value]) => {
            if (value && typeof value !== 'object' && value.length > 0) {
                hasFilters = true;
                const filterTag = document.createElement('span');
                filterTag.className = 'filter-tag';
                filterTag.innerHTML = `<strong>${translate(key) || key}:</strong> ${value}`;
                activeFiltersContainer.appendChild(filterTag);
            }
        });
        if (!hasFilters) {
            activeFiltersContainer.innerHTML = 'Prikazujem vse oglase.';
        }
    }
    
    // Vse ostale funkcije so enake kot v home.js (displayPage, sortListings, renderPagination, filterListings)
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
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.addEventListener('click', () => displayPage(filteredListings, i));
            paginationContainer.appendChild(pageBtn);
        }
    }
    
    function filterListings(listings, criteria) {
        if (!criteria || Object.keys(criteria).length === 0) return listings;
        return listings.filter(listing => {
            if (criteria.make && listing.make !== criteria.make) return false;
            if (criteria.model && listing.model !== criteria.model) return false;
            if (criteria.yearFrom && listing.year < parseInt(criteria.yearFrom)) return false;
            if (criteria.priceTo && listing.price > parseInt(criteria.priceTo)) return false;
            if (criteria.fuel && listing.fuel !== criteria.fuel) return false;
            if (criteria.mileageTo && listing.mileage > parseInt(criteria.mileageTo)) return false;
            if (criteria.region && listing.region !== criteria.region) return false;
            if (criteria.priceFrom && listing.price < parseInt(criteria.priceFrom)) return false;
            if (criteria.yearTo && listing.year > parseInt(criteria.yearTo)) return false;
            if (criteria.mileageFrom && listing.mileage < parseInt(criteria.mileageFrom)) return false;
            if (criteria.gearbox && listing.transmission !== criteria.gearbox) return false;
            if (criteria.body_type && !criteria.body_type.includes(listing.body_type)) return false;
            if (criteria.inclusionCriteria) {
                const matchesInclusion = criteria.inclusionCriteria.some(inc => 
                    (inc.make === listing.make) &&
                    (!inc.model || inc.model === listing.model) &&
                    (!inc.type || inc.type === listing.type)
                );
                if (!matchesInclusion) return false;
            }
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

    // --- INICIALIZACIJA STRANI ---
    displayActiveFilters(searchCriteria);
    loadingSpinner.style.display = 'block';
    
    fetch('./json/listings.json')
        .then(res => res.json())
        .then(data => {
            allListings = data;
            filteredListings = filterListings(allListings, searchCriteria);
            displayPage(filteredListings, 1);
        })
        .catch(error => {
            console.error("Napaka pri nalaganju oglasov:", error);
            listingsGrid.innerHTML = `<p style="text-align:center;">Napaka pri nalaganju oglasov.</p>`;
        })
        .finally(() => {
            loadingSpinner.style.display = 'none';
        });
        
    sortOrderSelect.addEventListener('change', () => {
        displayPage(filteredListings, currentPage);
    });
}