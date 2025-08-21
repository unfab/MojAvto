import { stateManager } from './stateManager.js';
import { displayPage, filterListings, toggleFavorite, toggleCompare } from './utils/listingManager.js';
import { initAdvancedSearchPage } from './advanced-search.js';
import { translate } from './i18n.js';

// === DODANA NOVA POMOŽNA FUNKCIJA ZA ISKANJE ===
function filterByQuery(listings, query) {
    if (!query) return listings;
    const lowerCaseQuery = query.toLowerCase();
    return listings.filter(listing => 
        listing.title.toLowerCase().includes(lowerCaseQuery)
    );
}

export async function initSearchResultsPage() {
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    const filtersContainer = document.getElementById('filters-container');
    const activeFiltersSummary = document.getElementById('active-filters-summary');

    if (!listingsGrid || !filtersContainer) {
        console.error("Manjka ključen element na strani z rezultati iskanja.");
        return;
    }

    const allListings = stateManager.getListings();
    let currentCriteria = JSON.parse(sessionStorage.getItem('searchCriteria')) || {};

    try {
        const response = await fetch('./views/advanced-search.html');
        filtersContainer.innerHTML = await response.text();
        await initAdvancedSearchPage(currentCriteria);
    } catch (error) {
        console.error("Napaka pri nalaganju naprednih filtrov:", error);
        filtersContainer.innerHTML = "<p>Filtrov ni bilo mogoče naložiti.</p>";
        return;
    }

    function displayActiveFilters(criteria) {
        if (!activeFiltersSummary) return;
        activeFiltersSummary.innerHTML = `<strong>Aktivni filtri: </strong>`;
        let hasFilters = false;
        Object.entries(criteria).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            hasFilters = true;
            const filterTag = document.createElement('span');
            filterTag.className = 'filter-tag';
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            filterTag.innerHTML = `<span>${translate(key) || key}:</span> ${displayValue}`;
            activeFiltersSummary.appendChild(filterTag);
        });
        if (!hasFilters) {
            activeFiltersSummary.textContent = 'Prikazujem vse oglase.';
        }
    }

    function applyFiltersAndDisplay(criteria) {
        let filteredListings = filterListings(allListings, criteria);
        
        // === SPREMEMBA: Uporabimo novo funkcijo za iskanje ===
        if (criteria.query) {
            filteredListings = filterByQuery(filteredListings, criteria.query);
        }
        
        displayActiveFilters(criteria);
        displayPage({
            listings: filteredListings,
            page: 1,
            gridContainer: listingsGrid,
            messageContainer: noListingsMessage,
            paginationContainer,
            sortSelect: sortOrderSelect
        });
    }

    const searchForm = document.getElementById('advancedSearchForm');
    if (searchForm) {
        searchForm.addEventListener('form-submitted', (e) => {
            currentCriteria = e.detail;
            applyFiltersAndDisplay(currentCriteria);
        });
    }
    
    sortOrderSelect.addEventListener('change', () => {
        let filteredListings = filterListings(allListings, currentCriteria);
        if (currentCriteria.query) {
            filteredListings = filterByQuery(filteredListings, currentCriteria.query);
        }
        displayPage({
            listings: filteredListings,
            page: 1,
            gridContainer: listingsGrid,
            messageContainer: noListingsMessage,
            paginationContainer,
            sortSelect: sortOrderSelect
        });
    });

    listingsGrid.addEventListener('click', (e) => {
        // ... obstoječa koda ...
    });

    applyFiltersAndDisplay(currentCriteria);
}