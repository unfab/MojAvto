// js/utils/listingManager.js

import { createListingCard } from '../components/ListingCard.js';
import { showNotification } from '../notifications.js';
import { translate } from '../i18n.js';

const ITEMS_PER_PAGE = 12;

/**
 * Razvrsti oglase glede na izbrano možnost.
 * @param {Array} listings - Seznam oglasov.
 * @param {string} order - Način razvrščanja.
 * @returns {Array} - Razvrščen seznam oglasov.
 */
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

/**
 * Ustvari in prikaže oštevilčevanje strani.
 * @param {number} totalItems - Skupno število oglasov.
 * @param {number} currentPage - Trenutna stran.
 * @param {HTMLElement} container - HTML element za oštevilčevanje.
 * @param {Function} onPageClick - Funkcija, ki se pokliče ob kliku na stran.
 */
function renderPagination(totalItems, currentPage, container, onPageClick) {
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = 'page-btn';
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.addEventListener('click', () => onPageClick(i));
        container.appendChild(pageBtn);
    }
}

/**
 * Prikaže določeno stran z oglasi.
 * @param {object} options - Objekt z nastavitvami.
 */
export function displayPage({ listings, page, gridContainer, messageContainer, paginationContainer, sortSelect }) {
    gridContainer.innerHTML = '';
    if (messageContainer) messageContainer.style.display = 'none';

    if (!listings || listings.length === 0) {
        if (messageContainer) messageContainer.style.display = 'block';
        renderPagination(0, page, paginationContainer, () => {});
        return;
    }

    const sorted = sortListings(listings, sortSelect.value);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedItems = sorted.slice(start, end);

    paginatedItems.forEach(listing => {
        const card = createListingCard(listing);
        gridContainer.appendChild(card);
    });

    renderPagination(listings.length, page, paginationContainer, (newPage) => {
        displayPage({ listings, page: newPage, gridContainer, messageContainer, paginationContainer, sortSelect });
    });
}


/**
 * Filtrira oglase glede na podane kriterije.
 * @param {Array} listings - Seznam vseh oglasov.
 * @param {object} criteria - Objekt z iskalnimi kriteriji.
 * @returns {Array} - Filtriran seznam oglasov.
 */
export function filterListings(listings, criteria) {
    if (!criteria || Object.keys(criteria).length === 0) return listings;

    const energyClassOrder = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    
    return listings.filter(listing => {
        if (criteria.make && listing.make !== criteria.make) return false;
        if (criteria.model && listing.model !== criteria.model) return false;
        if (criteria.yearFrom && listing.year < parseInt(criteria.yearFrom, 10)) return false;
        if (criteria.priceTo && listing.price > parseInt(criteria.priceTo, 10)) return false;
        if (criteria.fuel && listing.fuel !== criteria.fuel) return false;
        if (criteria.mileageTo && listing.mileage > parseInt(criteria.mileageTo, 10)) return false;
        if (criteria.region && listing.region !== criteria.region) return false;
        if (criteria.priceFrom && listing.price < parseInt(criteria.priceFrom, 10)) return false;
        if (criteria.yearTo && listing.year > parseInt(criteria.yearTo, 10)) return false;
        if (criteria.mileageFrom && listing.mileage < parseInt(criteria.mileageFrom, 10)) return false;
        if (criteria.gearbox && listing.transmission !== criteria.gearbox) return false;
        if (criteria.body_type && !criteria.body_type.includes(listing.body_type)) return false;
        if (criteria.condition && listing.condition !== criteria.condition) return false;
        if (criteria.owners && listing.owners > parseInt(criteria.owners, 10)) return false;
        if (criteria.service_history === 'true' && !listing.history?.service_book) return false;
        if (criteria.undamaged === 'true' && !listing.history?.undamaged) return false;
        if (criteria.equipment && criteria.equipment.length > 0) {
            if (!listing.equipment || !criteria.equipment.every(item => listing.equipment.includes(item))) {
                return false;
            }
        }
        if (criteria.euro_norm && listing.specs?.euro_norm !== criteria.euro_norm) return false;
        if (criteria.co2_emissions && listing.specs?.co2_emissions > parseInt(criteria.co2_emissions, 10)) return false;
        if (criteria.interior_color && listing.specs?.interior_color?.toLowerCase() !== criteria.interior_color.toLowerCase()) return false;
        if (criteria.consumption_combined && listing.specs?.consumption?.combined > parseFloat(criteria.consumption_combined)) return false;
        if (criteria.consumption_city && listing.specs?.consumption?.city > parseFloat(criteria.consumption_city)) return false;
        if (criteria.consumption_highway && listing.specs?.consumption?.highway > parseFloat(criteria.consumption_highway)) return false;
        if (criteria.energy_class) {
            const listingClassIndex = energyClassOrder.indexOf(listing.specs?.energy_class);
            const criteriaClassIndex = energyClassOrder.indexOf(criteria.energy_class);
            if (listingClassIndex === -1 || listingClassIndex > criteriaClassIndex) {
                return false;
            }
        }
        if (criteria.particulate_filter === 'true' && !listing.specs?.particulate_filter) return false;
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

/**
 * Doda ali odstrani oglas iz seznama priljubljenih.
 * @param {string} id - ID oglasa.
 * @param {HTMLElement} button - Gumb, ki je bil kliknjen.
 */
export function toggleFavorite(id, button) {
    let favorites = JSON.parse(localStorage.getItem('mojavto_favoriteItems')) || [];
    const heartIcon = button.querySelector('i');
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        button.classList.remove('active');
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        showNotification('Odstranjeno iz priljubljenih', 'info');
    } else {
        favorites.push(id);
        button.classList.add('active');
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        showNotification('Dodano med priljubljene!');
    }
    localStorage.setItem('mojavto_favoriteItems', JSON.stringify(favorites));
}

/**
 * Doda ali odstrani oglas iz seznama za primerjavo.
 * @param {string} id - ID oglasa.
 * @param {HTMLElement} button - Gumb, ki je bil kliknjen.
 */
export function toggleCompare(id, button) {
    let compareItems = JSON.parse(localStorage.getItem('mojavto_compareItems')) || [];
    if (compareItems.includes(id)) {
        compareItems = compareItems.filter(compId => compId !== id);
        button.classList.remove('active');
        showNotification('Odstranjeno iz primerjave', 'info');
    } else {
        if (compareItems.length >= 3) {
            showNotification('Primerjate lahko največ 3 oglase.', 'error');
            return;
        }
        compareItems.push(id);
        button.classList.add('active');
        showNotification('Dodano v primerjavo!');
    }
    localStorage.setItem('mojavto_compareItems', JSON.stringify(compareItems));
}