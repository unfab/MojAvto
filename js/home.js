import { translate } from './i18n.js';
import { createListingCard } from './components/ListingCard.js';

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

    let allListings = [];
    let brandModelData = {};
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    // --- INICIALIZACIJA STRANI ---
    fetch('./json/brands_models_global.json')
        .then(res => res.json())
        .then(data => {
            brandModelData = data;
            const sortedBrands = Object.keys(brandModelData).sort();
            sortedBrands.forEach(brand => makeSelect.add(new Option(brand, brand)));
        });

    loadingSpinner.style.display = 'block';
    fetch('./json/listings.json')
        .then(res => res.json())
        .then(data => {
            allListings = data;
            // Domača stran sedaj vedno prikaže vse oglase (filtriranje je na search-results)
            displayPage(allListings, 1);
        })
        .catch(error => {
            console.error("Napaka pri nalaganju oglasov:", error);
            listingsGrid.innerHTML = `<p style="text-align:center; padding: 2rem;">Napaka pri nalaganju oglasov.</p>`;
        })
        .finally(() => {
            loadingSpinner.style.display = 'none';
        });

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
            pageBtn.addEventListener('click', () => displayPage(allListings, i)); // Sedaj vedno paginira po vseh oglasih
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

    // === POSODOBLJENO: Iskalnik sedaj preusmeri na stran z rezultati ===
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const criteria = getCurrentCriteria();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(criteria));
        window.location.hash = '#/search-results';
    });

    sortOrderSelect.addEventListener('change', () => {
        // Sortiranje sedaj deluje na vseh oglasih na domači strani
        displayPage(allListings, currentPage);
    });

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        regFromSelect.add(new Option(y, y));
    }

    SLOVENIAN_REGIONS.forEach(region => {
        regionSelect.add(new Option(region, region));
    });
}