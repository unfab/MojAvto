import { createListingCard } from './components/ListingCard.js';
import { translate } from './i18n.js';
import { getListings } from './dataService.js';

export function initSearchResultsPage() {
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

    const allListings = getListings();
    let filteredListings = [];
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    const searchCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria')) || {};

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
    filteredListings = filterListings(allListings, searchCriteria);
    displayPage(filteredListings, 1);
        
    sortOrderSelect.addEventListener('change', () => {
        displayPage(filteredListings, currentPage);
    });

    // === DODANO: Poslušalec za akcije na karticah (všečki, primerjava) ===
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

    function toggleFavorite(id, button) {
        let favorites = JSON.parse(localStorage.getItem('mojavto_favoriteItems')) || [];
        const heartIcon = button.querySelector('i');

        if (favorites.includes(id)) {
            favorites = favorites.filter(favId => favId !== id);
            button.classList.remove('active');
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
        } else {
            favorites.push(id);
            button.classList.add('active');
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
        }
        localStorage.setItem('mojavto_favoriteItems', JSON.stringify(favorites));
    }

    function toggleCompare(id, button) {
        let compareItems = JSON.parse(localStorage.getItem('mojavto_compareItems')) || [];
        if (compareItems.includes(id)) {
            compareItems = compareItems.filter(compId => compId !== id);
            button.classList.remove('active');
        } else {
            if (compareItems.length >= 3) {
                alert("Primerjate lahko največ 3 oglase.");
                return;
            }
            compareItems.push(id);
            button.classList.add('active');
        }
        localStorage.setItem('mojavto_compareItems', JSON.stringify(compareItems));
    }
}