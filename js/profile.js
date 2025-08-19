import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showModal } from './components/modal.js';
import { showNotification } from './notifications.js';

export function initProfilePage() {
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
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Price: ${listing.price.toLocaleString()} €</p></div>
                <div class="card-actions">
                    <a href="#/create-listing?edit=true" class="btn btn-edit" data-id="${listing.id}"><i class="fas fa-pencil-alt"></i> ${translate('edit_btn') || 'Edit'}</a>
                    <button class="btn btn-delete" data-id="${listing.id}"><i class="fas fa-trash"></i> ${translate('delete_btn') || 'Delete'}</button>
                </div>`;
            container.appendChild(card);
        });
        addDeleteListeners();
        addEditListeners();
    }

    function addDeleteListeners() {
        document.querySelectorAll('#my-listings-container .btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const confirmed = await showModal('confirm_delete_listing_title', 'confirm_delete_listing_text');
                if (confirmed) {
                    const listingId = parseInt(e.currentTarget.dataset.id, 10);
                    stateManager.deleteListing(listingId);
                    showNotification(translate('listing_deleted_successfully'), 'success');
                    displayMyListings(); // Refresh the list
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
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Price: ${listing.price.toLocaleString()} €</p></div>`;
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
                <button class="btn-delete-search" data-id="${search.id}" title="Delete search">&times;</button>
            `;

            searchItem.querySelector('.search-link').addEventListener('click', () => {
                sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(search.criteria));
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
                <div class="card-body"><h3 class="card-title">${listing.title}</h3><p class="card-details">${translate('spec_year')}: ${listing.year} | Price: ${listing.price.toLocaleString()} €</p></div>`;
            card.addEventListener('click', () => {
                window.location.hash = `#/listing/${listing.id}`;
            });
            container.appendChild(card);
        });
    }

    // --- PROFILE EDITING ---
    const profileForm = document.getElementById('profile-edit-form');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const userRegionInput = document.getElementById('userRegion');
    const userPhoneInput = document.getElementById('userPhone');

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
            // No reload needed if UI updates reactively, but for simplicity, we'll keep it
            location.reload(); 
        }
    });

    // Initial render of all sections
    displayMyListings();
    displayFavoriteListings();
    displaySavedSearches();
    displayRecentlyViewed();
}