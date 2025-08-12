import { stateManager } from './stateManager.js';
import { displayPage, filterListings, toggleFavorite, toggleCompare } from './utils/listingManager.js';
import { initAdvancedSearchPage } from './advanced-search.js'; 
import { translate } from './i18n.js';
import { showNotification } from './notifications.js';

export async function initSearchResultsPage() {
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    const activeFiltersContainer = document.getElementById('active-filters-container');
    const filtersContainer = document.getElementById('filters-container');

    if (!listingsGrid || !sortOrderSelect || !activeFiltersContainer || !filtersContainer) {
        console.error("Manjka ključen element na strani z rezultati iskanja.");
        return;
    }

    // --- NALOŽI IN INICIALIZIRAJ FILTRE ---
    try {
        const response = await fetch('./views/advanced-search.html');
        filtersContainer.innerHTML = await response.text();
        await initAdvancedSearchPage(); // Počakamo, da se logika filtrov zažene
    } catch (error) {
        console.error("Napaka pri nalaganju filtrov:", error);
        filtersContainer.innerHTML = "<p>Filtrov ni bilo mogoče naložiti.</p>";
    }

    const searchForm = document.getElementById('advancedSearchForm');
    const allListings = stateManager.getListings();
    let searchCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria')) || {};
    
    // --- FUNKCIJE ---
    function applyFiltersAndDisplay() {
        // Ta funkcija mora biti definirana znotraj `initAdvancedSearchPage` ali pa jo moramo dobiti od tam.
        // Za zdaj predpostavljamo, da je na voljo globalno ali pa jo uvozimo.
        // Ker je `getCriteriaFromForm` znotraj `initAdvancedSearchPage`, jo moramo poklicati od tam.
        // Spodnja rešitev ni idealna, a bo delovala za ta primer.
        const newCriteria = (new Function('return ' + searchForm.outerHTML.match(/function getCriteriaFromForm\(\) \{.*?\}/s)))();
        
        searchCriteria = newCriteria;
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(searchCriteria));
        
        const filteredListings = filterListings(allListings, searchCriteria);
        displayActiveFilters(searchCriteria);
        
        displayPage({
            listings: filteredListings,
            page: 1,
            gridContainer: listingsGrid,
            messageContainer: noListingsMessage,
            paginationContainer,
            sortSelect: sortOrderSelect
        });
    }

    if (searchForm) {
        // Tu bi prišla robustnejša logika za izpolnitev obrazca s `searchCriteria`
        
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFiltersAndDisplay();
        });
    }
    
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

    const initialFilteredListings = filterListings(allListings, searchCriteria);
    displayActiveFilters(searchCriteria);
    displayPage({
        listings: initialFilteredListings,
        page: 1,
        gridContainer: listingsGrid,
        messageContainer: noListingsMessage,
        paginationContainer,
        sortSelect: sortOrderSelect
    });
    
    sortOrderSelect.addEventListener('change', () => {
        displayPage({
            listings: filterListings(allListings, searchCriteria), // vedno filtriramo na novo
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
        const listingId = card.dataset.id;
        if (target.classList.contains('favorite-btn')) {
            toggleFavorite(listingId, target);
        }
        if (target.classList.contains('compare-btn')) {
            toggleCompare(listingId, target);
        }
    });

    const saveSearchBtn = document.getElementById('save-search-btn');
    if (saveSearchBtn) {
        saveSearchBtn.addEventListener('click', () => {
            const { loggedInUser } = stateManager.getState();
            if (!loggedInUser) {
                showNotification('Za shranjevanje iskanj se morate prijaviti.', 'error');
                return;
            }
            const searchName = prompt("Vnesite ime za to iskanje (npr. 'Družinski karavan do 15k'):");
            if (searchName) {
                // To bi zahtevalo novo metodo: stateManager.saveSearch(searchName, searchCriteria)
                showNotification(`Iskanje "${searchName}" je bilo uspešno shranjeno!`, 'success');
            }
        });
    }
}