document.addEventListener("DOMContentLoaded", () => {
    // --- 1. KORAK: PRIDOBIVANJE DOM ELEMENTOV ---
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromInput = document.getElementById("yearFrom");
    const priceToInput = document.getElementById("priceTo");
    const listingsContainer = document.getElementById("listingsContainer");
    const noListingsMessage = document.getElementById("noListingsMessage");
    const compareLink = document.getElementById("compareLink");

    let brandModelData = {};
    let allListings = [];

    // --- 2. KORAK: NALAGANJE PODATKOV ---
    const initialListings = [
        {
          id: 1, make: "Toyota", model: "Corolla", title: "Toyota Corolla 1.8 Hybrid", year: 2019, mileage: 35000, price: 15900, power: 90, fuel: "Hibrid", transmission: "Avtomatski", region: "Osrednjeslovenska", images: { exterior: ["https://cdn3.avto.net/images/2024/07/21/1/300427843.1.jpg"], interior: [] }
        },
        {
          id: 2, make: "Volkswagen", model: "Golf", title: "Volkswagen Golf 8 2.0 TDI", year: 2021, mileage: 48000, price: 24500, power: 110, fuel: "Dizel", transmission: "Ročni", region: "Podravska", images: { exterior: ["https://cdn3.avto.net/images/2024/07/22/1/300516801.1.jpg"], interior: [] }
        },
        {
          id: 3, make: "BMW", model: "Serija 3", title: "BMW 320d M Sport", year: 2020, mileage: 65000, price: 31800, power: 140, fuel: "Dizel", transmission: "Avtomatski", region: "Savinjska", images: { exterior: ["https://cdn3.avto.net/images/2024/07/19/1/300171060.1.jpg"], interior: [] }
        },
        {
          id: 4, make: "Tesla", model: "Model 3", title: "Tesla Model 3 Long Range", year: 2022, mileage: 55000, price: 38900, power: 324, fuel: "Elektrika", transmission: "Avtomatski", battery: 75, range: 560, region: "Osrednjeslovenska", images: { exterior: ["https://cdn3.avto.net/images/2024/07/22/1/300512689.1.jpg"], interior: [] }
        }
    ];

    if (localStorage.getItem("mojavto_listings")) {
        allListings = JSON.parse(localStorage.getItem("mojavto_listings"));
    } else {
        allListings = initialListings;
        localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
    }

    fetch("json/brands_models_global.json")
        .then(res => res.json())
        .then(data => {
            brandModelData = data;
            populateMakeOptions();
        })
        .catch(err => console.error("Napaka pri nalaganju znamk in modelov:", err));

    // --- 3. KORAK: DEFINICIJA VSEH FUNKCIJ ---
    
    function populateMakeOptions() {
        makeSelect.innerHTML = '<option value="">Vse znamke</option>';
        Object.keys(brandModelData).sort().forEach(make => {
            const option = document.createElement("option");
            option.value = make;
            option.textContent = make;
            makeSelect.appendChild(option);
        });
    }

    function filterListings() {
        const make = makeSelect.value;
        const model = modelSelect.value;
        const yearFrom = parseInt(yearFromInput.value, 10);
        const priceTo = parseFloat(priceToInput.value);
        let filtered = allListings;
        if (make) filtered = filtered.filter(item => item.make === make);
        if (model) filtered = filtered.filter(item => item.model === model);
        if (!isNaN(yearFrom)) filtered = filtered.filter(item => item.year >= yearFrom);
        if (!isNaN(priceTo)) filtered = filtered.filter(item => item.price <= priceTo);
        renderListings(filtered);
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

        return filtered;
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
                alert("Za primerjavo lahko izberete največ 4 vozila.");
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
            compareLink.innerHTML = `<i class="fas fa-balance-scale"></i> Primerjava (${compareItems.length})`;
        }
        document.querySelectorAll('.compare-btn').forEach(btn => {
            const cardId = parseInt(btn.dataset.id, 10);
            btn.classList.toggle('selected', compareItems.includes(cardId));
            btn.title = compareItems.includes(cardId) ? "Odstrani iz primerjave" : "Dodaj v primerjavo";
        });
    }

    function renderListings(listings) {
        listingsContainer.innerHTML = "";
        noListingsMessage.style.display = listings.length === 0 ? "block" : "none";

        listings.forEach(listing => {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
                    <button class="compare-btn" data-id="${listing.id}">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-details">Letnik: ${listing.year} | Prevoženih: ${listing.mileage.toLocaleString()} km</p>
                    <p class="card-price">${listing.price.toLocaleString()} €</p>
                </div>`;

            card.addEventListener("click", (e) => {
                if (e.target.closest('.compare-btn')) return;
                localStorage.setItem("selectedListing", JSON.stringify(listing));
                window.location.href = "listing.html";
            });
            card.querySelector('.compare-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCompareItem(listing.id);
            });
            listingsContainer.appendChild(card);
        });
        updateCompareUI();
    }

    // --- 4. KORAK: VEZAVA DOGODKOV IN ZAČETNI ZAGON ---
    makeSelect.addEventListener("change", () => {
        const selectedMake = makeSelect.value;
        modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        modelSelect.disabled = true;
        if (selectedMake && brandModelData[selectedMake]) {
            brandModelData[selectedMake].forEach(model => {
                const option = document.createElement("option");
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            modelSelect.disabled = false;
        }
        filterListings();
    });

    modelSelect.addEventListener("change", filterListings);
    yearFromInput.addEventListener("input", filterListings);
    priceToInput.addEventListener("input", filterListings);

    const advancedCriteria = JSON.parse(sessionStorage.getItem('advancedSearchCriteria'));
    sessionStorage.removeItem('advancedSearchCriteria');

    let listingsToRender = allListings;
    if (advancedCriteria) {
        console.log("Uporabljam napredne filtre:", advancedCriteria);
        listingsToRender = applyAdvancedFilters(allListings, advancedCriteria);
    }
    
    renderListings(listingsToRender);
    updateCompareUI();
});