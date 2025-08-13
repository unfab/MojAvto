import { stateManager } from './stateManager.js';
import { displayPage, toggleFavorite, toggleCompare, filterListings } from './utils/listingManager.js';
import { translate } from './i18n.js';
import { initCarousel } from './components/Carousel.js';

const SLOVENIAN_REGIONS = [
    "Osrednjeslovenska", "Gorenjska", "Goriška", "Obalno-kraška",
    "Notranjsko-kraška", "Jugovzhodna Slovenija", "Posavska", "Zasavska",
    "Savinjska", "Koroška", "Podravska", "Pomurska"
];

export async function initHomePage() {
    const searchForm = document.getElementById('homeSearchForm');
    const makeSelect = document.getElementById('make');
    const modelSelect = document.getElementById('model');
    const regFromSelect = document.getElementById('reg-from');
    const regionSelect = document.getElementById('region');
    const listingsGrid = document.getElementById('listingsGrid');
    const noListingsMessage = document.getElementById('noListingsMessage');
    const sortOrderSelect = document.getElementById('sortOrder');
    const paginationContainer = document.getElementById('pagination-container');

    if (!searchForm || !listingsGrid || !sortOrderSelect || !regionSelect) {
        console.error("Manjka eden od ključnih elementov na domači strani.");
        return;
    }

    const { allListings, allFavorites } = stateManager.getState();
    const brandModelData = stateManager.getBrands();

    if (!brandModelData || Object.keys(brandModelData).length === 0) {
        console.error("Podatki o znamkah niso na voljo iz stateManagerja.");
        return;
    }

    // --- INICIALIZACIJA STRANI (Polnjenje filtrov) ---
    const sortedBrands = Object.keys(brandModelData).sort();
    sortedBrands.forEach(brand => makeSelect.add(new Option(brand, brand)));
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        regFromSelect.add(new Option(y, y));
    }
    SLOVENIAN_REGIONS.forEach(region => {
        regionSelect.add(new Option(region, region));
    });

    // --- ZAČETNI PRIKAZ GLAVNIH OGLASOV ---
    const displayOptions = {
        listings: allListings,
        page: 1,
        gridContainer: listingsGrid,
        messageContainer: noListingsMessage,
        paginationContainer,
        sortSelect: sortOrderSelect
    };
    displayPage(displayOptions);

    // --- POSLUŠALCI DOGODKOV ZA GLAVNO VSEBINO ---
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
        const formData = new FormData(searchForm);
        const criteria = Object.fromEntries(formData.entries());
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(criteria));
        window.location.hash = '#/search-results';
    });
    
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

    // === PRIKAZ NAZADNJE OGLEDANIH OGLASOV V DRSNIKU ===
    const recentlyViewedIds = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
    const recentSection = document.getElementById('recently-viewed-section');
    if (recentSection && recentlyViewedIds.length > 0) {
        recentSection.style.display = 'block';
        const recentlyViewedListings = recentlyViewedIds
            .map(id => allListings.find(l => String(l.id) === String(id)))
            .filter(Boolean);
        initCarousel({
            trackId: 'recently-viewed-container',
            prevBtnId: 'recent-prev-btn',
            nextBtnId: 'recent-next-btn',
            listings: recentlyViewedListings
        });
    }
    
    // === NOVO: PRIKAZ PRILJUBLJENIH OGLASOV V DRSNIKU ===
    const popularSection = document.getElementById('popular-section');
    if (popularSection && allFavorites) {
        const favoriteCounts = {};
        // Zberemo vse "všečke" vseh uporabnikov
        Object.values(allFavorites).forEach(favArray => {
            favArray.forEach(listingId => {
                favoriteCounts[listingId] = (favoriteCounts[listingId] || 0) + 1;
            });
        });

        const popularListings = Object.entries(favoriteCounts)
            .sort(([, countA], [, countB]) => countB - countA) // Razvrstimo po številu všečkov
            .slice(0, 10) // Vzamemo top 10
            .map(([listingId]) => allListings.find(l => String(l.id) === listingId))
            .filter(Boolean);
            
        if (popularListings.length > 0) {
            popularSection.style.display = 'block';
            initCarousel({
                trackId: 'popular-container',
                prevBtnId: 'popular-prev-btn',
                nextBtnId: 'popular-next-btn',
                listings: popularListings
            });
        }
    }

    // === NOVO: PRIKAZ NOVIH OGLASOV V DRSNIKU ===
    const newestSection = document.getElementById('newest-section');
    if (newestSection) {
        const newestListings = [...allListings] // Ustvarimo kopijo
            .sort((a, b) => new Date(b.date_added) - new Date(a.date_added)) // Razvrstimo po datumu
            .slice(0, 10); // Vzamemo top 10

        if (newestListings.length > 0) {
            newestSection.style.display = 'block';
            initCarousel({
                trackId: 'newest-container',
                prevBtnId: 'newest-prev-btn',
                nextBtnId: 'newest-next-btn',
                listings: newestListings
            });
        }
    }
}