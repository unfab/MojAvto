document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("header").innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });

    // Preverjanje prijave
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        window.location.href = "login.html";
        return;
    }

    // Prikaz uporabnikovih podatkov
    document.getElementById('welcome-message').textContent = `Pozdravljen, ${loggedUser.fullname}!`;
    
    // --- FUNKCIJE ZA SHRANJENA ISKANJA ---
    function displaySavedSearches() {
        const container = document.getElementById('saved-searches-container');
        const noSearchesMsg = document.getElementById('no-searches-message');
        const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
        const allSavedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};
        let userSearches = allSavedSearches[loggedUser.username] || [];

        if (!container || !noSearchesMsg) return;
        container.innerHTML = '';
        if (userSearches.length === 0) {
            noSearchesMsg.style.display = 'block';
            return;
        }
        
        noSearchesMsg.style.display = 'none';
        userSearches.forEach((search, index) => {
            const currentResultsCount = applyAdvancedFilters(allListings, search.criteria).length;
            const hasNewResults = currentResultsCount > search.lastResultCount;

            const item = document.createElement('div');
            item.className = 'saved-search-item';
            item.innerHTML = `
                <div class="search-name">
                    <span>${search.name}</span>
                    ${hasNewResults ? `<span class="notification-badge">NOVO!</span>` : ''}
                </div>
                <div class="search-actions">
                    <button class="btn btn-run-search" data-index="${index}"><i class="fas fa-search"></i> Zaženi</button>
                    <button class="btn btn-delete-search" data-index="${index}"><i class="fas fa-trash"></i> Izbriši</button>
                </div>`;
            container.appendChild(item);
        });

        container.querySelectorAll('.btn-run-search').forEach(button => {
            button.addEventListener('click', (e) => {
                const search = userSearches[e.currentTarget.dataset.index];
                search.lastResultCount = applyAdvancedFilters(allListings, search.criteria).length;
                localStorage.setItem('mojavto_savedSearches', JSON.stringify(allSavedSearches));
                sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(search.criteria));
                window.location.href = "index.html";
            });
        });
        container.querySelectorAll('.btn-delete-search').forEach(button => {
             button.addEventListener('click', (e) => {
                if (confirm("Ali ste prepričani?")) {
                    userSearches.splice(e.currentTarget.dataset.index, 1);
                    localStorage.setItem('mojavto_savedSearches', JSON.stringify(allSavedSearches));
                    displaySavedSearches();
                }
            });
        });
    }

    // --- FUNKCIJE ZA PRIKAZ MOJIH OGLASOV ---
    function displayMyListings() {
        const myListingsContainer = document.getElementById('my-listings-container');
        const noListingsMessage = document.getElementById('no-listings-message');
        const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
        const userListings = allListings.filter(listing => listing.author === loggedUser.username);

        myListingsContainer.innerHTML = '';
        if (userListings.length === 0) {
            noListingsMessage.style.display = 'block';
            return;
        }
        noListingsMessage.style.display = 'none';

        userListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
                </div>
                <div class="card-body">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-details">Letnik: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p>
                </div>
                <div class="card-actions">
                    <a href="#" class="btn btn-edit" data-id="${listing.id}"><i class="fas fa-pencil-alt"></i> Uredi</a>
                    <button class="btn btn-delete" data-id="${listing.id}"><i class="fas fa-trash"></i> Izbriši</button>
                </div>`;
            myListingsContainer.appendChild(card);
        });
        addDeleteListeners();
        addEditListeners();
    }

    function addDeleteListeners() { /* ... koda za brisanje oglasov ostane enaka ... */ }
    function addEditListeners() { /* ... koda za urejanje oglasov ostane enaka ... */ }

    // --- FUNKCIJA ZA PRIKAZ PRILJUBLJENIH OGLASOV ---
    function displayFavoriteListings() {
        const container = document.getElementById('favorite-listings-container');
        const noFavoritesMsg = document.getElementById('no-favorites-message');
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        const userFavorites = allFavorites[loggedUser.username] || [];
        
        if (!container || !noFavoritesMsg) return;
        container.innerHTML = '';
        if (userFavorites.length === 0) {
            noFavoritesMsg.style.display = 'block';
            return;
        }

        noFavoritesMsg.style.display = 'none';
        const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
        const favoriteListings = allListings.filter(l => userFavorites.includes(l.id));

        favoriteListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
                </div>
                <div class="card-body">
                    <h3 class="card-title">${listing.title}</h3>
                    <p class="card-details">Letnik: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p>
                </div>`;
            card.addEventListener('click', () => {
                localStorage.setItem('selectedListing', JSON.stringify(listing));
                window.location.href = 'listing.html';
            });
            container.appendChild(card);
        });
    }

    function applyAdvancedFilters(listings, criteria) {
        // ... tukaj pride celotna koda za filtriranje, enaka kot v main.js ...
    }

    // --- ZAČETNI ZAGON VSEH FUNKCIJ ---
    displaySavedSearches();
    displayMyListings();
    displayFavoriteListings();
});