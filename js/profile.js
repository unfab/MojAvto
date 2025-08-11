import { translate } from './i18n.js';
// === NOVO: Uvozimo stateManager ===
import { stateManager } from './stateManager.js';

export function initProfilePage() {
    // === SPREMEMBA: Podatke dobimo direktno iz stateManagerja ===
    const { loggedInUser, favorites } = stateManager.getState();
    const allListings = stateManager.getListings();

    if (!loggedInUser) {
        window.location.hash = '#/login';
        return;
    }
    if (loggedInUser.isAdmin) {
        window.location.hash = '#/dashboard';
        return;
    }

    document.getElementById('welcome-message').textContent = `${translate('dashboard_welcome')}, ${loggedInUser.fullname}!`;

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

    function displayMyListings() {
        const container = document.getElementById('my-listings-container');
        const message = document.getElementById('no-listings-message');
        const userListings = allListings.filter(listing => listing.author === loggedInUser.username);
        
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
                    // === SPREMEMBA: Uporabimo stateManager za brisanje ===
                    stateManager.deleteListing(listingId);
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
            });
        });
    }

    function displayFavoriteListings() {
        const container = document.getElementById('favorite-listings-container');
        const message = document.getElementById('no-favorites-message');
        
        container.innerHTML = '';
        message.style.display = favorites.length === 0 ? 'block' : 'none';

        const favoriteListings = allListings.filter(l => favorites.includes(String(l.id)));
        favoriteListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container"><img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" /></div>
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p></div>`;
            card.addEventListener('click', () => {
                window.location.hash = `#/listing/${listing.id}`;
            });
            container.appendChild(card);
        });
    }

    // Funkcija displayRecentlyViewed lahko ostane nespremenjena, saj je to lokalna, začasna shramba
    function displayRecentlyViewed() {
        // ... koda ostane nespremenjena ...
    }

    // --- UREJANJE PROFILA (brez sprememb, ker že pravilno deluje) ---
    // ... koda za urejanje profila ostane nespremenjena ...

    // Začetni zagon vseh funkcij
    displayMyListings();
    displayFavoriteListings();
    displayRecentlyViewed();
}