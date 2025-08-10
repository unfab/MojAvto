import { translate } from './i18n.js';
import { createListingCard } from './components/ListingCard.js';
import { getListings, getBrands } from './dataService.js';

const SLOVENIAN_REGIONS = [
    "Osrednjeslovenska", "Gorenjska", "Goriška", "Obalno-kraška", 
    "Notranjsko-kraška", "Jugovzhodna Slovenija", "Posavska", "Zasavska", 
    "Savinjska", "Koroška", "Podravska", "Pomurska"
];

export function initHomePage() {
    const searchForm = document.getElementById('homeSearchForm');
    const makeSelect = document.getElementById('make');
    const modelSelect = document.getElementById('model');
    const regFromSelect = document.getElementById('reg-from');
    const regionSelect = document.getElementById('region');
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const loadingSpinner = document.getElementById('loading-spinner');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!searchForm || !listingsGrid || !loadingSpinner || !sortOrderSelect || !regionSelect) {
        console.error("Manjka eden od ključnih elementov na domači strani.");
        return;
    }

    const allListings = getListings();
    const brandModelData = getBrands();
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    // --- INICIALIZACIJA STRANI ---
    const sortedBrands = Object.keys(brandModelData).sort();
    sortedBrands.forEach(brand => makeSelect.add(new Option(brand, brand)));
    
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        regFromSelect.add(new Option(y, y));
    }

    SLOVENIAN_REGIONS.forEach(region => {
        regionSelect.add(new Option(region, region));
    });

    displayPage(allListings, 1);
    
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
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.addEventListener('click', () => displayPage(allListings, i));
            paginationContainer.appendChild(pageBtn);
        }
    }
    
    function getCurrentCriteria() {
        const formData = new FormData(searchForm);
        const criteria = {};
        for(const [key, value] of formData.entries()){
            if(value) criteria[key] = value;
        }
        return criteria;
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
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(criteria));
        window.location.hash = '#/search-results';
    });

    sortOrderSelect.addEventListener('change', () => {
        displayPage(allListings, currentPage);
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