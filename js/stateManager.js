// js/stateManager.js

const state = {
    listings: [],
    brands: {},
    users: [],
    loggedInUser: null,
    favorites: [],
    compareItems: []
};

function saveStateToLocalStorage() {
    localStorage.setItem('mojavto_users', JSON.stringify(state.users));
    localStorage.setItem('mojavto_listings', JSON.stringify(state.listings));
    localStorage.setItem('mojavto_loggedUser', JSON.stringify(state.loggedInUser));
    localStorage.setItem('mojavto_favoriteItems', JSON.stringify(state.favorites));
    localStorage.setItem('mojavto_compareItems', JSON.stringify(state.compareItems));
}

function loadStateFromLocalStorage() {
    state.users = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    state.listings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
    state.loggedInUser = JSON.parse(localStorage.getItem('mojavto_loggedUser')) || null;
    state.favorites = JSON.parse(localStorage.getItem('mojavto_favoriteItems')) || [];
    state.compareItems = JSON.parse(localStorage.getItem('mojavto_compareItems')) || [];
}

export const stateManager = {
    async initialize() {
        try {
            const basePath = window.location.hostname.includes('github.io') ? '/MojAvto' : '';
            const [listingsResponse, brandsResponse] = await Promise.all([
                fetch(`${basePath}/json/listings.json`),
                fetch(`${basePath}/json/brands_models_global.json`)
            ]);

            const initialListings = await listingsResponse.json();
            state.brands = await brandsResponse.json();
            
            // Naložimo stanje iz localStorage, če obstaja
            loadStateFromLocalStorage();

            // Če je localStorage prazen, uporabimo začetne podatke iz JSON
            if (state.listings.length === 0) {
                state.listings = initialListings;
            }

            console.log('State Manager inicializiran.');
        } catch (error) {
            console.error("Kritična napaka v State Managerju:", error);
            throw error;
        }
    },

    getState() {
        return { ...state };
    },

    getListings() {
        return state.listings;
    },

    getBrands() {
        return state.brands;
    },
    
    getListingById(id) {
        return state.listings.find(listing => String(listing.id) === String(id));
    },

    setLoggedInUser(user) {
        state.loggedInUser = user;
        saveStateToLocalStorage();
    },

    logoutUser() {
        state.loggedInUser = null;
        saveStateToLocalStorage();
    },

    addUser(user) {
        state.users.push(user);
        saveStateToLocalStorage();
    },

    addListing(listing) {
        listing.id = Date.now();
        listing.author = state.loggedInUser.username;
        state.listings.unshift(listing); // Dodamo na začetek
        saveStateToLocalStorage();
    },

    updateListing(updatedListing) {
        const index = state.listings.findIndex(l => l.id === updatedListing.id);
        if (index !== -1) {
            state.listings[index] = updatedListing;
            saveStateToLocalStorage();
        }
    },
    
    deleteListing(listingId) {
        state.listings = state.listings.filter(l => l.id !== listingId);
        saveStateToLocalStorage();
    },

    toggleFavorite(listingId) {
        const index = state.favorites.indexOf(listingId);
        if (index > -1) {
            state.favorites.splice(index, 1);
        } else {
            state.favorites.push(listingId);
        }
        saveStateToLocalStorage();
        return index === -1; // Vrnemo true, če je bilo dodano
    },

    toggleCompare(listingId) {
        const index = state.compareItems.indexOf(listingId);
        if (index > -1) {
            state.compareItems.splice(index, 1);
        } else if (state.compareItems.length < 3) {
            state.compareItems.push(listingId);
        } else {
            return { success: false, limitReached: true };
        }
        saveStateToLocalStorage();
        return { success: true, added: index === -1 };
    }
};