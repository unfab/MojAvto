import { createListingCard } from './components/ListingCard.js';
import { getListings } from './dataService.js';

export function initLikesPage() {
    const listingsGrid = document.getElementById('listingsGrid');
    const noFavoritesMessage = document.getElementById('noFavoritesMessage');

    if (!listingsGrid || !noFavoritesMessage) return;

    const allListings = getListings();
    const favoriteIds = JSON.parse(localStorage.getItem('mojavto_favoriteItems')) || [];

    if (favoriteIds.length === 0) {
        noFavoritesMessage.style.display = 'block';
        return;
    }

    const favoriteListings = allListings.filter(listing => favoriteIds.includes(String(listing.id)));

    favoriteListings.forEach(listing => {
        const card = createListingCard(listing);
        listingsGrid.appendChild(card);
    });

    // Dodamo enako logiko za od-všečkanje, kot na domači strani
    listingsGrid.addEventListener('click', (e) => {
        const target = e.target.closest('.favorite-btn');
        if (!target) return;

        const card = target.closest('.listing-card');
        const listingId = card.dataset.id;
        
        // Odstrani iz všečkov
        let favorites = JSON.parse(localStorage.getItem('mojavto_favoriteItems')) || [];
        favorites = favorites.filter(favId => favId !== listingId);
        localStorage.setItem('mojavto_favoriteItems', JSON.stringify(favorites));
        
        // Takoj odstrani kartico iz prikaza
        card.remove();

        // Če ni več všečkov, prikaži sporočilo
        if (document.querySelectorAll('.listing-card').length === 0) {
            noFavoritesMessage.style.display = 'block';
        }
    });
}