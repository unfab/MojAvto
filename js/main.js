document.addEventListener("DOMContentLoaded", () => {
    // --- 1. KORAK: PRIDOBIVANJE DOM ELEMENTOV IN NASTAVITEV STANJA ---
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromInput = document.getElementById("yearFrom");
    const priceToInput = document.getElementById("priceTo");
    const listingsContainer = document.getElementById("listingsContainer");
    const noListingsMessage = document.getElementById("noListingsMessage");
    const paginationContainer = document.getElementById("pagination-container");
    const compareLink = document.getElementById("compareLink");

    let brandModelData = {};
    let allListings = [];
    let currentFilteredListings = [];

    const listingsPerPage = 9;
    let currentPage = 1;

    // --- 2. KORAK: NALAGANJE PODATKOV ---
    const initialListings = [ /* Vaš seznam testnih oglasov */ ];
    if (localStorage.getItem("mojavto_listings")) {
        allListings = JSON.parse(localStorage.getItem("mojavto_listings"));
    } else {
        allListings = initialListings;
        localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
    }
    currentFilteredListings = allListings;

    fetch("json/brands_models_global.json")
        .then(res => res.json())
        .then(data => { brandModelData = data; populateMakeOptions(); });

    // --- 3. KORAK: DEFINICIJA VSEH FUNKCIJ ---

    function displayPage(listingsToShow) {
        renderListings(listingsToShow);
        renderPagination(listingsToShow.length);
    }

    // POSODOBLJENA FUNKCIJA za prikaz oglasov z vsemi gumbi
    function renderListings(listings) {
        listingsContainer.innerHTML = "";
        noListingsMessage.style.display = listings.length === 0 ? "block" : "none";
        
        const startIndex = (currentPage - 1) * listingsPerPage;
        const endIndex = startIndex + listingsPerPage;
        const paginatedListings = listings.slice(startIndex, endIndex);

        paginatedListings.forEach(listing => {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
                    <button class="fav-btn" data-id="${listing.id}" title="Dodaj med priljubljene">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="compare-btn" data-id="${listing.id}" title="Dodaj v primerjavo">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-details">Letnik: ${listing.year} | Prevoženih: ${listing.mileage.toLocaleString()} km</p>
                    <p class="card-price">${listing.price.toLocaleString()} €</p>
                </div>`;

            card.addEventListener("click", (e) => {
                if (e.target.closest('.compare-btn') || e.target.closest('.fav-btn')) return;
                localStorage.setItem("selectedListing", JSON.stringify(listing));
                window.location.href = "listing.html";
            });

            card.querySelector('.compare-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCompareItem(listing.id);
            });

            card.querySelector('.fav-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(listing.id);
            });
            
            listingsContainer.appendChild(card);
        });
        updateCompareUI();
        updateFavoritesUI();
    }

    function renderPagination(totalListings) { /* ... koda ostane enaka ... */ }
    function handleFilterChange() { /* ... koda ostane enaka ... */ }
    function getSimpleFilterValues() { /* ... koda ostane enaka ... */ }
    function applySimpleFilters(listings, criteria) { /* ... koda ostane enaka ... */ }
    function applyAdvancedFilters(listings, criteria) { /* ... koda ostane enaka ... */ }
    function populateMakeOptions() { /* ... koda ostane enaka ... */ }
    function getCompareItems() { /* ... koda ostane enaka ... */ }
    function toggleCompareItem(listingId) { /* ... koda ostane enaka ... */ }
    function updateCompareUI() { /* ... koda ostane enaka ... */ }

    // NOVE funkcije za priljubljene
    function getFavorites() {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) return [];
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        return allFavorites[loggedUser.username] || [];
    }

    function toggleFavorite(listingId) {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) {
            alert("Za shranjevanje priljubljenih oglasov se morate prijaviti.");
            return;
        }
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        let userFavorites = allFavorites[loggedUser.username] || [];
        const itemIndex = userFavorites.indexOf(listingId);
        if (itemIndex > -1) {
            userFavorites.splice(itemIndex, 1);
        } else {
            userFavorites.push(listingId);
        }
        allFavorites[loggedUser.username] = userFavorites;
        localStorage.setItem("mojavto_favorites", JSON.stringify(allFavorites));
        updateFavoritesUI();
    }

    function updateFavoritesUI() {
        const favorites = getFavorites();
        document.querySelectorAll('.fav-btn').forEach(btn => {
            const cardId = parseInt(btn.dataset.id, 10);
            const isFavorited = favorites.includes(cardId);
            btn.classList.toggle('favorited', isFavorited);
            const icon = btn.querySelector('i');
            icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        });
    }

    // --- 4. KORAK: VEZAVA DOGODKOV IN ZAČETNI ZAGON ---
    makeSelect.addEventListener("change", () => { /* ... koda ostane enaka ... */ });
    modelSelect.addEventListener("change", handleFilterChange);
    yearFromInput.addEventListener("input", handleFilterChange);
    priceToInput.addEventListener("input", handleFilterChange);

    const advancedCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria'));
    sessionStorage.removeItem('advancedSearchCriteria');

    if (advancedCriteria) {
        currentFilteredListings = applyAdvancedFilters(allListings, advancedCriteria);
    } else {
        currentFilteredListings = allListings;
    }
    
    displayPage(currentFilteredListings);
    updateCompareUI();
    updateFavoritesUI();
});