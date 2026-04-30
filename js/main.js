document.addEventListener("DOMContentLoaded", () => {
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromInput = document.getElementById("yearFrom");
    const priceToInput = document.getElementById("priceTo");
    const listingsContainer = document.getElementById("listingsContainer");
    const noListingsMessage = document.getElementById("noListingsMessage");
    const paginationContainer = document.getElementById("pagination-container");
    const compareLink = document.getElementById("compareLink");
    const bodyTypeSelect = document.getElementById("home-bodyType");

    let brandModelData = {};
    let allListings = [];
    let currentFilteredListings = [];
    let currentVehicleType = "Avtomobili"; // Track the active tab

    const listingsPerPage = 9;
    let currentPage = 1;

    const initialListings = [
        { id: 1, type: "Avtomobili", make: "Toyota", model: "Corolla", title: "Toyota Corolla 1.8 Hybrid", year: 2019, mileage: 35000, price: 15900, power: 90, fuel: "Hibrid", transmission: "Avtomatski", region: "Osrednjeslovenska", phone: "041 123 456", images: { exterior: ["https://cdn3.avto.net/images/2024/07/21/1/300427843.1.jpg"], interior: [] } },
        { id: 2, type: "Avtomobili", make: "Volkswagen", model: "Golf", title: "Volkswagen Golf 8 2.0 TDI", year: 2021, mileage: 48000, price: 24500, power: 110, fuel: "Dizel", transmission: "Ročni", region: "Podravska", images: { exterior: ["https://cdn3.avto.net/images/2024/07/22/1/300516801.1.jpg"], interior: [] } },
        { id: 3, type: "Avtomobili", make: "BMW", model: "Series 3", title: "BMW 320d M Sport", year: 2020, mileage: 65000, price: 31800, power: 140, fuel: "Dizel", transmission: "Avtomatski", region: "Savinjska", phone: "031 987 654", images: { exterior: ["https://cdn3.avto.net/images/2024/07/19/1/300171060.1.jpg"], interior: [] } },
        { id: 4, type: "Avtomobili", make: "Tesla", model: "Model 3", title: "Tesla Model 3 Long Range", year: 2022, mileage: 55000, price: 38900, power: 324, fuel: "Elektrika", transmission: "Avtomatski", battery: 75, range: 560, region: "Osrednjeslovenska", images: { exterior: ["https://cdn3.avto.net/images/2024/07/22/1/300512689.1.jpg"], interior: [] } },
        // Motorji
        { id: 5, type: "Motorji", make: "BMW Motorrad", model: "R 1250 GS", title: "BMW R 1250 GS Adventure", year: 2023, mileage: 5200, price: 21500, power: 100, fuel: "Bencin", transmission: "Ročni", region: "Gorenjska", phone: "040 111 222", images: { exterior: ["bmw_r1250gs_moto_1777103973226.png"], interior: [] } },
        { id: 6, type: "Motorji", make: "Honda", model: "CB 650R", title: "Honda CB 650R Neo Sports Cafe", year: 2022, mileage: 8400, price: 7900, power: 70, fuel: "Bencin", transmission: "Ročni", region: "Osrednjeslovenska", images: { exterior: ["honda_cb650r_moto_1777103989405.png"], interior: [] } },
        // Gospodarska vozila
        { id: 7, type: "Gospodarska vozila", make: "Mercedes-Benz", model: "Sprinter", title: "Mercedes-Benz Sprinter 316 CDI", year: 2020, mileage: 125000, price: 28900, power: 120, fuel: "Dizel", transmission: "Ročni", region: "Savinjska", images: { exterior: ["mercedes_sprinter_van_1777104003932.png"], interior: [] } },
        { id: 8, type: "Gospodarska vozila", make: "Volvo", model: "FH", title: "Volvo FH 500 Globetrotter XL", year: 2021, mileage: 350000, price: 85000, power: 368, fuel: "Dizel", transmission: "Avtomatski", region: "Podravska", images: { exterior: ["volvo_fh500_truck_1777104017900.png"], interior: [] } }
    ];

    allListings = initialListings;
    localStorage.setItem("mojavto_listings", JSON.stringify(allListings));

    currentFilteredListings = allListings;

    fetch("json/brands_models_global.json")
        .then(res => res.json())
        .then(data => { brandModelData = data; populateMakeOptions(); });

    function displayPage(listingsToShow) {
        renderListings(listingsToShow);
        renderPagination(listingsToShow.length);
    }

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
                    <button class="fav-btn" data-id="${listing.id}" title="${translate('add_to_favorites')}"><i class="far fa-heart"></i></button>
                    <button class="compare-btn" data-id="${listing.id}" title="${translate('nav_compare')}"><i class="fas fa-balance-scale"></i></button>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-details">${translate('spec_year')}: ${listing.year} | ${translate('spec_mileage')}: ${listing.mileage.toLocaleString()} km</p>
                    <p class="card-price">${listing.price.toLocaleString()} €</p>
                </div>`;

            card.addEventListener("click", (e) => {
                if (e.target.closest('.compare-btn') || e.target.closest('.fav-btn')) return;
                localStorage.setItem("selectedListing", JSON.stringify(listing));
                window.location.href = `listing.html?lang=${currentLang}`;
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

    function renderPagination(totalListings) {
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(totalListings / listingsPerPage);
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                displayPage(currentFilteredListings);
                window.scrollTo(0, 0);
            });
            paginationContainer.appendChild(pageButton);
        }
    }

    function handleFilterChange() {
        currentPage = 1;
        const simpleFilters = getSimpleFilterValues();
        currentFilteredListings = applySimpleFilters(allListings, simpleFilters);
        displayPage(currentFilteredListings);
    }

    function getSimpleFilterValues() {
        return {
            make: document.getElementById('home-make')?.value || "",
            model: document.getElementById('home-model')?.value || "",
            bodyType: document.getElementById('home-bodyType')?.value || "",
            yearFrom: parseInt(document.getElementById('home-reg-from')?.value || yearFromInput?.value, 10),
            priceTo: parseFloat(document.getElementById('home-price-to')?.value || priceToInput?.value),
            vehicleType: currentVehicleType
        };
    }

    function applySimpleFilters(listings, criteria) {
        let filtered = listings;
        
        // Tab Filter
        if (criteria.vehicleType) {
            filtered = filtered.filter(item => item.type === criteria.vehicleType);
        }

        if (criteria.make) filtered = filtered.filter(item => item.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(item => item.model === criteria.model);
        if (criteria.bodyType) filtered = filtered.filter(item => item.bodyType === criteria.bodyType);
        if (!isNaN(criteria.yearFrom)) filtered = filtered.filter(item => item.year >= criteria.yearFrom);
        if (!isNaN(criteria.priceTo)) filtered = filtered.filter(item => item.price <= criteria.priceTo);
        return filtered;
    }

    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return filtered;
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        if (criteria.yearFrom) filtered = filtered.filter(l => l.year >= Number(criteria.yearFrom));
        if (criteria.yearTo) filtered = filtered.filter(l => l.year <= Number(criteria.yearTo));
        if (criteria.mileageTo) filtered = filtered.filter(l => l.mileage <= Number(criteria.mileageTo));
        if (criteria.fuel) filtered = filtered.filter(l => l.fuel === criteria.fuel);
        if (criteria.gearbox) filtered = filtered.filter(l => l.transmission === criteria.gearbox);
        if (criteria.region) filtered = filtered.filter(l => l.region === criteria.region);
        if (criteria.seatMaterial) filtered = filtered.filter(l => l.seatMaterial === criteria.seatMaterial);

        // Filter za hibrid tipe
        if (criteria.hybridTypes && criteria.hybridTypes.length > 0) {
            filtered = filtered.filter(l => {
                return l.hybridType && criteria.hybridTypes.includes(l.hybridType);
            });
        }

        return filtered;
    }

    function populateMakeOptions() {
        makeSelect.innerHTML = `<option value="">${translate('all_brands')}</option>`;
        Object.keys(brandModelData).sort().forEach(make => {
            const option = document.createElement("option");
            option.value = make;
            option.textContent = make;
            makeSelect.appendChild(option);
        });
    }

    function getCompareItems() {
        return JSON.parse(localStorage.getItem("mojavto_compareItems")) || [];
    }

    function toggleCompareItem(listingId) {
        let compareItems = getCompareItems();
        const itemIndex = compareItems.indexOf(listingId);
        if (itemIndex > -1) {
            compareItems.splice(itemIndex, 1);
        } else {
            if (compareItems.length >= 4) {
                alert(translate('compare_limit_4'));
                return;
            }
            compareItems.push(listingId);
        }
        localStorage.setItem("mojavto_compareItems", JSON.stringify(compareItems));
        updateCompareUI();
    }

    function updateCompareUI() {
        const compareItems = getCompareItems();
        if (compareLink) {
            compareLink.innerHTML = `<i class="fas fa-balance-scale"></i> ${translate('nav_compare')} (${compareItems.length})`;
        }
    }

    function getFavorites() {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) return [];
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        return allFavorites[loggedUser.username] || [];
    }

    function toggleFavorite(listingId) {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) {
            alert(translate('must_be_logged_in_to_favorite'));
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

    makeSelect.addEventListener("change", () => {
        const selectedMake = makeSelect.value;
        modelSelect.innerHTML = `<option value="">${translate('all_models') || 'Vsi modeli'}</option>`;
        modelSelect.disabled = true;
        if (selectedMake && brandModelData[selectedMake]) {
            const models = brandModelData[selectedMake];
            const modelKeys = Array.isArray(models) ? models : Object.keys(models);
            modelKeys.forEach(model => {
                const option = document.createElement("option");
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            modelSelect.disabled = false;
        }
        handleFilterChange();
    });
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

    // Connect Homepage Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const title = btn.getAttribute('title');
            if (title) currentVehicleType = title;

            // Update brands data based on type
            let jsonFile = "json/brands_models_global.json";
            if (currentVehicleType === 'Motorji') jsonFile = "json/brands_models_moto.json";
            if (currentVehicleType === 'Gospodarska vozila') jsonFile = "json/brands_models_gospodarska.json";

            fetch(jsonFile)
                .then(res => res.json())
                .then(data => {
                    brandModelData = data;
                    populateMakeOptions();
                    modelSelect.innerHTML = `<option value="">${translate('all_models') || 'Vsi modeli'}</option>`;
                    modelSelect.disabled = true;
                    handleFilterChange();
                });
        });
    });

    displayPage(currentFilteredListings);
    updateCompareUI();
    updateFavoritesUI();
});