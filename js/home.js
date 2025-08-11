import { stateManager } from './stateManager.js';
import { displayPage, toggleFavorite, toggleCompare, filterListings } from './utils/listingManager.js';
import { translate } from './i18n.js';

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

    const allListings = stateManager.getListings();
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

    // --- ZAČETNI PRIKAZ OGLASOV ---
    let currentFilteredListings = [...allListings];
    
    const displayOptions = {
        listings: currentFilteredListings,
        page: 1,
        gridContainer: listingsGrid,
        messageContainer: noListingsMessage,
        paginationContainer,
        sortSelect: sortOrderSelect
    };
    displayPage(displayOptions);

    // --- FUNKCIJA ZA FILTRIRANJE ---
    function performFiltering() {
        const formData = new FormData(searchForm);
        const criteria = Object.fromEntries(formData.entries());
        // Uporabimo master funkcijo za filtriranje iz listingManagerja
        currentFilteredListings = filterListings(allListings, criteria);
        
        // Posodobimo prikaz
        displayOptions.listings = currentFilteredListings;
        displayOptions.page = 1; // Ob vsakem novem filtriranju gremo na prvo stran
        displayPage(displayOptions);
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

    // SPREMEMBA: Gumb "submit" sedaj samo sproži filtriranje na isti strani
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performFiltering();
    });
    
    // DODATNO: Dodamo poslušalce, da se filtriranje izvede takoj ob spremembi kateregakoli polja
    searchForm.querySelectorAll('select, input').forEach(input => {
        input.addEventListener('change', performFiltering);
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
}