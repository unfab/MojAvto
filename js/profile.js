export function initProfilePage() {
    // --- VARNOSTNA KONTROLA ---
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        window.location.hash = '#/login'; // Preusmeri neprijavljene
        return;
    }
    // Če je admin, ga preusmeri na njegov namenski dashboard
    if (loggedUser.isAdmin) {
        window.location.hash = '#/dashboard';
        return;
    }

    // --- DOM ELEMENTI IN PODATKI ---
    document.getElementById('welcome-message').textContent = `${translate('dashboard_welcome')}, ${loggedUser.fullname}!`;
    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];

    // --- LOGIKA ZA ZAVIHKE (TABS) ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- FUNKCIJE ZA PRIKAZ VSEBINE ZAVIHKOV ---

    function displayMyListings() {
        const container = document.getElementById('my-listings-container');
        const message = document.getElementById('no-listings-message');
        const userListings = allListings.filter(listing => listing.author === loggedUser.username);
        
        container.innerHTML = '';
        message.style.display = userListings.length === 0 ? 'block' : 'none';

        userListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container"><img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" /></div>
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p></div>
                <div class="card-actions">
                    <a href="#/create-listing?edit=true" class="btn btn-edit" data-id="${listing.id}"><i class="fas fa-pencil-alt"></i> ${translate('edit_btn') || 'Uredi'}</a>
                    <button class="btn btn-delete" data-id="${listing.id}"><i class="fas fa-trash"></i> ${translate('delete_btn') || 'Izbriši'}</button>
                </div>`;
            container.appendChild(card);
        });
        addDeleteListeners();
        addEditListeners();
    }

    function addDeleteListeners() {
        document.querySelectorAll('#my-listings-container .btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm(translate('confirm_delete_listing'))) {
                    const listingId = parseInt(e.currentTarget.dataset.id, 10);
                    let currentListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
                    const updatedListings = currentListings.filter(l => l.id !== listingId);
                    localStorage.setItem('mojavto_listings', JSON.stringify(updatedListings));
                    displayMyListings(); // Ponovno naložimo prikaz
                }
            });
        });
    }

    function addEditListeners() {
        document.querySelectorAll('#my-listings-container .btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const listingId = e.currentTarget.dataset.id;
                sessionStorage.setItem('listingToEditId', listingId);
                // Ruter bo poskrbel za preusmeritev, ker ima link `href`
            });
        });
    }

    function displayFavoriteListings() {
        const container = document.getElementById('favorite-listings-container');
        const message = document.getElementById('no-favorites-message');
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        const userFavorites = allFavorites[loggedUser.username] || [];
        
        container.innerHTML = '';
        message.style.display = userFavorites.length === 0 ? 'block' : 'none';

        const favoriteListings = allListings.filter(l => userFavorites.includes(l.id));
        favoriteListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container"><img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" /></div>
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p></div>`;
            card.addEventListener('click', () => {
                localStorage.setItem('selectedListing', JSON.stringify(listing));
                window.location.hash = `#/listing/${listing.id}`;
            });
            container.appendChild(card);
        });
    }

    function displayRecentlyViewed() {
        const container = document.getElementById('recent-listings-container');
        const message = document.getElementById('no-recent-message');
        const recentlyViewedIds = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        
        container.innerHTML = '';
        message.style.display = recentlyViewedIds.length === 0 ? 'block' : 'none';

        const recentListings = recentlyViewedIds.map(id => allListings.find(l => l.id === id)).filter(Boolean);
        recentListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container"><img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" /></div>
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p></div>`;
            card.addEventListener('click', () => {
                localStorage.setItem('selectedListing', JSON.stringify(listing));
                window.location.hash = `#/listing/${listing.id}`;
            });
            container.appendChild(card);
        });
    }

    // --- UREJANJE PROFILA ---
    const profileForm = document.getElementById('profile-edit-form');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const userRegionInput = document.getElementById('userRegion');
    const userPhoneInput = document.getElementById('userPhone');

    fullnameInput.value = loggedUser.fullname;
    emailInput.value = loggedUser.email;
    userRegionInput.value = loggedUser.region || '';
    userPhoneInput.value = loggedUser.phone || '';

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (confirm(translate('confirm_save_changes'))) {
            const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
            const userIndex = allUsers.findIndex(user => user.username === loggedUser.username);
            if (userIndex > -1) {
                allUsers[userIndex].fullname = fullnameInput.value;
                allUsers[userIndex].email = emailInput.value;
                allUsers[userIndex].region = userRegionInput.value;
                allUsers[userIndex].phone = userPhoneInput.value;
                localStorage.setItem('mojavto_users', JSON.stringify(allUsers));
                const updatedLoggedUser = allUsers[userIndex];
                localStorage.setItem('mojavto_loggedUser', JSON.stringify(updatedLoggedUser));
                alert(translate('profile_updated_successfully'));
                location.reload();
            }
        }
    });

    // Začetni zagon vseh funkcij
    displayMyListings();
    displayFavoriteListings();
    displayRecentlyViewed();
}