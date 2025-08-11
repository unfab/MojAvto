import { getListings } from './dataService.js';
import { displayPage, filterListings, toggleFavorite, toggleCompare } from './utils/listingManager.js';
import { translate } from './i18n.js';

export async function initSearchResultsPage() {
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    const activeFiltersContainer = document.getElementById('active-filters-container');

    if (!listingsGrid || !sortOrderSelect || !activeFiltersContainer) {
        console.error("Manjka ključen element na strani z rezultati iskanja.");
        return;
    }

    const allListings = await getListings();
    const searchCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria')) || {};
    
    // Uporabimo funkcijo iz centralnega modula
    const filteredListings = filterListings(allListings, searchCriteria);

    // Ta funkcija je specifična za to stran, zato ostane tukaj
    function displayActiveFilters(criteria) {
        activeFiltersContainer.innerHTML = '<strong>Iskalni filtri: </strong>';
        let hasFilters = false;
        Object.entries(criteria).forEach(([key, value]) => {
            if (!value || typeof value === 'object' && !Array.isArray(value) || (Array.isArray(value) && value.length === 0)) {
                return;
            }
            hasFilters = true;
            const filterTag = document.createElement('span');
            filterTag.className = 'filter-tag';
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            filterTag.innerHTML = `<span>${translate(key) || key}:</span> ${displayValue}`;
            activeFiltersContainer.appendChild(filterTag);
        });
        if (!hasFilters) {
            activeFiltersContainer.textContent = 'Prikazujem vse oglase.';
        }
    }

    displayActiveFilters(searchCriteria);
    
    const displayOptions = {
        listings: filteredListings,
        page: 1,
        gridContainer: listingsGrid,
        messageContainer: noListingsMessage,
        paginationContainer,
        sortSelect: sortOrderSelect
    };
    displayPage(displayOptions);
    
    // --- POSLUŠALCI DOGODKOV ---
    sortOrderSelect.addEventListener('change', () => {
        displayOptions.page = 1;
        displayPage(displayOptions);
    });

    listingsGrid.addEventListener('click', (e) => {
        const target = e.target.closest('.card-action-btn');
        if (!target) return;
        const card = target.closest('.listing-card');
        const listingId = card.dataset.id;
        
        if (target.classList.contains('favorite-btn')) {
            toggleFavorite(listingId, target);
        }
        if (target.classList.contains('compare-btn')) {
            toggleCompare(listingId, target);
        }
    });
}