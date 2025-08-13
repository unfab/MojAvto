// js/likes.js

import { createListingCard } from './components/ListingCard.js';
// SPREMEMBA: Uvozimo stateManager namesto getListings
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';

export function initLikesPage() {
    const listingsGrid = document.getElementById('listingsGrid');
    const noFavoritesMessage = document.getElementById('noFavoritesMessage');

    if (!listingsGrid || !noFavoritesMessage) return;

    // SPREMEMBA: Podatke pridobimo iz centralnega stateManager-ja
    const allListings = stateManager.getListings();
    const { favorites: favoriteIds, loggedInUser } = stateManager.getState();

    // Dodatno preverimo, ali je uporabnik prijavljen
    if (!loggedInUser) {
        noFavoritesMessage.innerHTML = '<h3>Za ogled priljubljenih oglasov se morate prijaviti.</h3>';
        noFavoritesMessage.style.display = 'block';
        return;
    }

    if (favoriteIds.length === 0) {
        noFavoritesMessage.innerHTML = '<h3>Nimate še nobenega všečkanega oglasa.</h3><p>Ko vam bo oglas všeč, ga boste našli tukaj.</p>';
        noFavoritesMessage.style.display = 'block';
        return;
    }

    const favoriteListings = allListings.filter(listing => favoriteIds.includes(String(listing.id)));

    favoriteListings.forEach(listing => {
        const card = createListingCard(listing);
        listingsGrid.appendChild(card);
    });

    listingsGrid.addEventListener('click', (e) => {
        const target = e.target.closest('.favorite-btn');
        if (!target) return;

        const card = target.closest('.listing-card');
        const listingId = card.dataset.id;
        
        // SPREMEMBA: Uporabimo stateManager za odstranitev
        const result = stateManager.toggleFavorite(listingId);
        if (result.success) {
            showNotification('Odstranjeno iz priljubljenih', 'info');
            // Takoj odstrani kartico iz prikaza
            card.remove();

            // Če ni več všečkov, prikaži sporočilo
            if (listingsGrid.children.length === 0) {
                noFavoritesMessage.style.display = 'block';
            }
        }
    });
}