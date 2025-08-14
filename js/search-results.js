import { stateManager } from './stateManager.js';
import { displayPage, filterListings, toggleFavorite, toggleCompare } from './utils/listingManager.js';
import { initAdvancedSearchPage } from './advanced-search.js';
import { translate } from './i18n.js';

export async function initSearchResultsPage() {
    // --- Pridobivanje DOM elementov ---
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

    // --- Priprava podatkov ---
    const allListings = stateManager.getListings();
    let currentCriteria = JSON.parse(sessionStorage.getItem('searchCriteria')) || {};

    // --- Nalaganje in inicializacija filtrov ---
    try {
        const response = await fetch('./views/advanced-search.html');
        filtersContainer.innerHTML = await response.text();
        // Poženemo logiko za napredno iskanje in ji posredujemo kriterije za predizpolnitev
        await initAdvancedSearchPage(currentCriteria);
    } catch (error) {
        console.error("Napaka pri nalaganju naprednih filtrov:", error);
        filtersContainer.innerHTML = "<p>Filtrov ni bilo mogoče naložiti.</p>";
        return;
    }

    // --- Funkcije za prikaz ---
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
        const filteredListings = filterListings(allListings, criteria);
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

    // --- Poslušalci dogodkov ---
    const searchForm = document.getElementById('advancedSearchForm');
    if (searchForm) {
        searchForm.addEventListener('form-submitted', (e) => {
            currentCriteria = e.detail; // Dobimo nove kriterije iz dogodka
            applyFiltersAndDisplay(currentCriteria);
        });
    }
    
    sortOrderSelect.addEventListener('change', () => {
        const filteredListings = filterListings(allListings, currentCriteria);
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
        const target = e.target.closest('.card-action-btn');
        if (!target) return;
        const card = target.closest('.listing-card');
        if (!card) return;
        const listingId = card.dataset.id;
        
        if (target.classList.contains('favorite-btn')) {
            toggleFavorite(listingId, target);
        }
        if (target.classList.contains('compare-btn')) {
            toggleCompare(listingId, target);
        }
    });

    // --- Začetni prikaz ob nalaganju strani ---
    applyFiltersAndDisplay(currentCriteria);
}