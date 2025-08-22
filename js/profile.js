import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showModal } from './components/modal.js';
import { showNotification } from './notifications.js';

export function initProfilePage() {
    const proStatusContainer = document.getElementById('pro-status-container');
    const { loggedInUser, favorites } = stateManager.getState();
    const allListings = stateManager.getListings();
    const SLOVENIAN_REGIONS = [
        "Osrednjeslovenska", "Gorenjska", "Goriška", "Obalno-kraška",
        "Primorsko-notranjska", "Jugovzhodna Slovenija", "Posavska", "Zasavska",
        "Savinjska", "Koroška", "Podravska", "Pomurska"
    ];

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
            const isFeatured = listing.featuredUntil && new Date(listing.featuredUntil) > new Date();
            let featureHTML = '';
            
            if (isFeatured) {
                const expiryDate = new Date(listing.featuredUntil);
                featureHTML = `<div class="card-featured-badge">Izpostavljen do ${expiryDate.toLocaleDateString('sl-SI')}</div>`;
            } else {
                featureHTML = `<button class="btn btn-feature" data-id="${listing.id}"><i class="fas fa-star"></i> Izpostavi (2.99€)</button>`;
            }

            card.innerHTML = `
                ${isFeatured ? '<div class="card-featured-overlay"></div>' : ''}
                <div class="card-image-container"><img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" /></div>
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Cena: ${listing.price.toLocaleString()} €</p></div>
                <div class="card-actions">
                    <a href="#/create-listing?edit=true" class="btn btn-edit" data-id="${listing.id}"><i class="fas fa-pencil-alt"></i> ${translate('edit_btn') || 'Uredi'}</a>
                    <button class="btn btn-delete" data-id="${listing.id}"><i class="fas fa-trash"></i> ${translate('delete_btn') || 'Izbriši'}></button>
                    ${featureHTML}
                </div>`;
            container.appendChild(card);
        });
        addDeleteListeners();
        addEditListeners();
        addFeatureListeners();
    }

    function addDeleteListeners() {
        document.querySelectorAll('#my-listings-container .btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const confirmed = await showModal('confirm_delete_listing_title', 'confirm_delete_listing_text');
                if (confirmed) {
                    const listingId = parseInt(e.currentTarget.dataset.id, 10);
                    stateManager.deleteListing(listingId);
                    showNotification(translate('listing_deleted_successfully'), 'success');
                    displayMyListings();
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

    function addFeatureListeners() {
        document.querySelectorAll('#my-listings-container .btn-feature').forEach(button => {
            button.addEventListener('click', async (e) => {
                const listingId = e.currentTarget.dataset.id;
                const confirmed = await showModal(
                    'Potrditev izpostavitve', 
                    'Ali ste prepričani, da želite izpostaviti ta oglas za 7 dni za ceno 2.99€? (To je simulacija)'
                );
                if (confirmed) {
                    stateManager.featureListing(listingId, 7);
                    showNotification('Oglas je bil uspešno izpostavljen!', 'success');
                    displayMyListings();
                }
            });
        });
    }

    function displayGarageVehicles() {
        const container = document.getElementById('garage-container');
        const message = document.getElementById('no-garage-vehicles-message');
        const garageVehicles = stateManager.getGarageVehicles(loggedInUser.username);

        container.innerHTML = '';
        message.style.display = garageVehicles.length === 0 ? 'block' : 'none';

        garageVehicles.forEach(vehicle => {
            const card = document.createElement('article');
            card.className = 'card garage-card';
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${vehicle.images[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${vehicle.nickname}" />
                </div>
                <div class="card-body">
                    <h3 class="card-title">${vehicle.nickname}</h3>
                    <p class="card-details">${vehicle.brand} ${vehicle.model} (${vehicle.year})</p>
                </div>
                <div class="card-actions">
                    <a href="#/garage/edit/${vehicle.id}" class="btn btn-edit"><i class="fas fa-pencil-alt"></i> Uredi</a>
                    <button class="btn btn-delete-garage" data-id="${vehicle.id}"><i class="fas fa-trash"></i> Izbriši</button>
                </div>
            `;
            container.appendChild(card);
        });
        
        // =======================================================
        // NOVO: Aktiviramo poslušalce za urejanje in brisanje
        // =======================================================
        addGarageDeleteListeners();
    }

    // =======================================================
    // NOVO: Funkcija za poslušanje na gumb za brisanje iz garaže
    // =======================================================
    function addGarageDeleteListeners() {
        document.querySelectorAll('#garage-container .btn-delete-garage').forEach(button => {
            button.addEventListener('click', async (e) => {
                const vehicleId = e.currentTarget.dataset.id;
                const confirmed = await showModal(
                    'Potrditev brisanja vozila', 
                    'Ali ste prepričani, da želite trajno odstraniti to vozilo iz vaše Garaže?'
                );
                if (confirmed) {
                    stateManager.deleteVehicleFromGarage(loggedInUser.username, vehicleId);
                    showNotification('Vozilo je bilo uspešno odstranjeno iz Garaže!', 'success');
                    displayGarageVehicles(); // Ponovno izrišemo Garažo
                }
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

    function displaySavedSearches() {
        const container = document.getElementById('saved-searches-container');
        const message = document.getElementById('no-saved-searches-message');
        const savedSearches = stateManager.getSavedSearches();

        container.innerHTML = '';
        message.style.display = savedSearches.length === 0 ? 'block' : 'none';

        savedSearches.forEach(search => {
            const searchItem = document.createElement('div');
            searchItem.className = 'saved-search-item';
            searchItem.innerHTML = `
                <a href="#/search-results" class="search-link">${search.name}</a>
                <button class="btn-delete-search" data-id="${search.id}" title="Izbriši iskanje">&times;</button>
            `;

            searchItem.querySelector('.search-link').addEventListener('click', () => {
                sessionStorage.setItem('searchCriteria', JSON.stringify(search.criteria));
            });
            
            searchItem.querySelector('.btn-delete-search').addEventListener('click', async () => {
                const confirmed = await showModal('confirm_delete_search_title', 'confirm_delete_search_text');
                if (confirmed) {
                    stateManager.deleteSavedSearch(search.id);
                    showNotification(translate('search_deleted_successfully'), 'success');
                    displaySavedSearches();
                }
            });

            container.appendChild(searchItem);
        });
    }

    function displayProStatus() {
        if (!proStatusContainer) return;
        
        if (loggedInUser.isPro) {
            proStatusContainer.classList.add('is-pro');
            proStatusContainer.innerHTML = `
                <h4><i class="fas fa-gem"></i> Imate PRO račun</h4>
                <p>Uživajte v vseh prednostih, ki vam jih prinaša PRO status!</p>
            `;
        } else {
            proStatusContainer.classList.add('is-not-pro');
            proStatusContainer.innerHTML = `
                <h4>Odklenite svoj polni potencial!</h4>
                <p>Nadgradite na PRO račun in pridobite dostop do ekskluzivnih funkcij.</p>
                <a href="#/upgrade-pro" class="btn btn-primary" style="margin-top: 1rem;">Nadgradi na PRO</a>
            `;
        }
    }

    function displayRecentlyViewed() {
        const container = document.getElementById('recent-listings-container');
        const message = document.getElementById('no-recent-message');
        const recentlyViewedIds = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        
        container.innerHTML = '';
        message.style.display = recentlyViewedIds.length === 0 ? 'block' : 'none';

        const recentListings = recentlyViewedIds.map(id => allListings.find(l => String(l.id) === String(id))).filter(Boolean);
        recentListings.forEach(listing => {
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

    const profileForm = document.getElementById('profile-edit-form');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const userRegionInput = document.getElementById('userRegion');
    const userPhoneInput = document.getElementById('userPhone');

    userRegionInput.innerHTML = `<option value="">${translate('form_region_select')}</option>`;
    SLOVENIAN_REGIONS.forEach(region => {
        userRegionInput.add(new Option(region, region));
    });

    fullnameInput.value = loggedInUser.fullname;
    emailInput.value = loggedInUser.email;
    userRegionInput.value = loggedInUser.region || '';
    userPhoneInput.value = loggedInUser.phone || '';

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmed = await showModal('confirm_save_changes_title', 'confirm_save_changes_text');
        if (confirmed) {
            const updatedUserData = {
                ...loggedInUser,
                fullname: fullnameInput.value,
                email: emailInput.value,
                region: userRegionInput.value,
                phone: userPhoneInput.value,
            };
            
            stateManager.updateUser(updatedUserData);
            
            showNotification(translate('profile_updated_successfully'), 'success');
            location.reload(); 
        }
    });

    displayMyListings();
    displayGarageVehicles();
    displayFavoriteListings();
    displaySavedSearches();
    displayRecentlyViewed();
    displayProStatus();
}