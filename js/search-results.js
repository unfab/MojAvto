import { stateManager } from './stateManager.js';
import { displayPage, filterListings, toggleFavorite, toggleCompare } from './utils/listingManager.js';
import { initAdvancedSearchPage } from './advanced-search.js';
import { translate } from './i18n.js';

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
        const response = await fetch('./components/filters.html');
        filtersContainer.innerHTML = await response.text();
        // === SPREMEMBA: Podamo "filtersContainer" kot prvi argument ===
        initAdvancedSearchPage(filtersContainer, currentCriteria, (newCriteria) => {
            currentCriteria = newCriteria;
            applyFiltersAndDisplay(currentCriteria);
        });
    } catch (error) {
        console.error("Napaka pri nalaganju filtrov:", error);
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

    if(sortOrderSelect) {
        sortOrderSelect.addEventListener('change', () => {
            applyFiltersAndDisplay(currentCriteria);
        });
    }

    listingsGrid.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.card-action-btn');
        if (actionBtn) {
            const card = actionBtn.closest('.listing-card');
            if (!card) return;
            const listingId = card.dataset.id;
            
            if (actionBtn.classList.contains('favorite-btn')) {
                toggleFavorite(listingId, actionBtn);
            }
            if (actionBtn.classList.contains('compare-btn')) {
                toggleCompare(listingId, actionBtn);
            }
            return;
        }

        const card = e.target.closest('.listing-card');
        if (card) {
            const listingId = card.dataset.id;
            window.location.hash = `#/listing/${listingId}`;
        }
    });

    applyFiltersAndDisplay(currentCriteria);
}