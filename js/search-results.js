import { stateManager } from './stateManager.js';
import { displayPage, filterListings, toggleFavorite, toggleCompare } from './utils/listingManager.js';
import { initAdvancedSearchPage } from './advanced-search.js';
import { translate } from './i18n.js';
import { showNotification } from './notifications.js';

export async function initSearchResultsPage() {
    // --- Pridobivanje DOM elementov ---
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    const activeFiltersContainer = document.getElementById('active-filters-container');
    const filtersContainer = document.getElementById('filters-container');

    // Preverimo, ali vsi ključni elementi obstajajo
    if (!listingsGrid || !sortOrderSelect || !activeFiltersContainer || !filtersContainer) {
        console.error("Manjka ključen element na strani z rezultati iskanja.");
        return;
    }

    // --- Priprava spremenljivk ---
    const allListings = stateManager.getListings();
    let currentCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria')) || {};
    let getCriteriaFromForm = () => ({}); // Pripravimo prazno funkcijo

    // --- Dinamično nalaganje HTML vsebine in inicializacija skripte za filtre ---
    try {
        const response = await fetch('./advanced-search.html');
        filtersContainer.innerHTML = await response.text();
        
        // KLJUČNA SPREMEMBA: initAdvancedSearchPage vrne funkcijo za pridobivanje kriterijev
        getCriteriaFromForm = await initAdvancedSearchPage(currentCriteria);

    } catch (error) {
        console.error("Napaka pri nalaganju filtrov:", error);
        filtersContainer.innerHTML = "<p>Filtrov ni bilo mogoče naložiti.</p>";
    }

    const searchForm = document.getElementById('advancedSearchForm');
    const saveSearchBtn = document.getElementById('saveSearchBtn');

    // --- Prikaz aktivnih filtrov ---
    function displayActiveFilters(criteria) {
        activeFiltersContainer.innerHTML = `<strong>${translate('active_filters') || 'Aktivni filtri:'} </strong>`;
        let hasFilters = false;
        
        Object.entries(criteria).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                return;
            }
            hasFilters = true;
            const filterTag = document.createElement('span');
            filterTag.className = 'filter-tag';

            // Posebna obravnava za ceno, da se izpiše kot "od X do Y"
            if (key === 'priceFrom' || key === 'priceTo') {
                 if (criteria.priceFrom && criteria.priceTo) {
                    if (!activeFiltersContainer.querySelector('.price-range-tag')) {
                         const priceTag = document.createElement('span');
                         priceTag.className = 'filter-tag price-range-tag';
                         priceTag.innerHTML = `<span>${translate('form_price') || 'Cena'}:</span> ${criteria.priceFrom} € - ${criteria.priceTo} €`;
                         activeFiltersContainer.appendChild(priceTag);
                    }
                 }
                 return; // Preskočimo posamezen izpis
            }
            
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            filterTag.innerHTML = `<span>${translate(key) || key}:</span> ${displayValue}`;
            activeFiltersContainer.appendChild(filterTag);
        });

        if (!hasFilters) {
            activeFiltersContainer.textContent = translate('showing_all_listings') || 'Prikazujem vse oglase.';
        }
    }
    
    // --- Glavna funkcija za filtriranje in prikaz ---
    function applyFiltersAndDisplay() {
        // Dobimo sveže kriterije neposredno iz forme
        currentCriteria = getCriteriaFromForm();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(currentCriteria));
        
        const filteredListings = filterListings(allListings, currentCriteria);
        
        displayActiveFilters(currentCriteria);
        
        displayPage({
            listings: filteredListings,
            page: 1, // Resetiramo na prvo stran ob vsaki novi poizvedbi
            gridContainer: listingsGrid,
            messageContainer: noListingsMessage,
            paginationContainer,
            sortSelect: sortOrderSelect
        });
    }

    // --- Event Listenerji ---
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFiltersAndDisplay();
        });
    }

    sortOrderSelect.addEventListener('change', () => {
        // Pri sortiranju ne spreminjamo kriterijev, le ponovno prikažemo rezultate
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
        const favoriteButton = e.target.closest('.fav-btn');
        const compareButton = e.target.closest('.compare-btn');
        
        if (favoriteButton) {
            e.stopPropagation();
            const listingId = parseInt(favoriteButton.closest('.card').dataset.id, 10);
            toggleFavorite(listingId);
        }
        if (compareButton) {
            e.stopPropagation();
            const listingId = parseInt(compareButton.closest('.card').dataset.id, 10);
            toggleCompare(listingId);
        }
    });

    if (saveSearchBtn) {
        saveSearchBtn.addEventListener('click', () => {
            const loggedInUser = stateManager.getLoggedInUser();
            if (!loggedInUser) {
                showNotification(translate('must_be_logged_in_to_save_searches'), 'error');
                return;
            }
            const searchName = prompt(translate('prompt_save_search_name'));
            if (searchName && searchName.trim() !== "") {
                const currentFilters = getCriteriaFromForm();
                stateManager.saveSearch(searchName, currentFilters); // Predpostavlja metodo v stateManager
                showNotification(translate('search_saved_successfully', { searchName }), 'success');
            }
        });
    }

    // --- Začetni prikaz ob nalaganju strani ---
    const initialFilteredListings = filterListings(allListings, currentCriteria);
    displayActiveFilters(currentCriteria);
    displayPage({
        listings: initialFilteredListings,
        page: 1,
        gridContainer: listingsGrid,
        messageContainer: noListingsMessage,
        paginationContainer,
        sortOrderSelect
    });
}