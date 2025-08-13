// js/stateManager.js

import { evaluatePrice } from './utils/priceEvaluator.js';

const state = {
    listings: [],
    brands: {},
    users: [],
    loggedInUser: null,
    // SPREMEMBA: 'favorites' je sedaj seznam za TRENUTNO prijavljenega uporabnika.
    favorites: [], 
    // SPREMEMBA: 'allFavorites' hrani VSE priljubljene oglase VSEH uporabnikov.
    allFavorites: {}, 
    compareItems: [],
    savedSearches: {}
};

function saveStateToLocalStorage() {
    localStorage.setItem('mojavto_users', JSON.stringify(state.users));
    localStorage.setItem('mojavto_listings', JSON.stringify(state.listings));
    localStorage.setItem('mojavto_loggedUser', JSON.stringify(state.loggedInUser));
    
    // SPREMEMBA: Posodobimo objekt z vsemi favoriti in ga shranimo.
    if (state.loggedInUser) {
        state.allFavorites[state.loggedInUser.username] = state.favorites;
    }
    localStorage.setItem('mojavto_favorites', JSON.stringify(state.allFavorites));

    localStorage.setItem('mojavto_compareItems', JSON.stringify(state.compareItems));
    localStorage.setItem('mojavto_savedSearches', JSON.stringify(state.savedSearches));
}

function loadStateFromLocalStorage() {
    state.users = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    state.listings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
    state.loggedInUser = JSON.parse(localStorage.getItem('mojavto_loggedUser')) || null;
    
    // SPREMEMBA: Naložimo VSE favorite in nato nastavimo tiste za trenutnega uporabnika.
    state.allFavorites = JSON.parse(localStorage.getItem('mojavto_favorites')) || {};
    if (state.loggedInUser) {
        state.favorites = state.allFavorites[state.loggedInUser.username] || [];
    } else {
        state.favorites = [];
    }
    
    state.compareItems = JSON.parse(localStorage.getItem('mojavto_compareItems')) || [];
    state.savedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};
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
            
            loadStateFromLocalStorage();

            if (state.listings.length === 0) {
                state.listings = initialListings;
            }

            state.listings.forEach(listing => {
                if (listing.priceEvaluation === undefined) {
                    listing.priceEvaluation = evaluatePrice(listing, state.listings);
                }
            });
            
            saveStateToLocalStorage();

            console.log('State Manager inicializiran, cene so ocenjene.');
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
        // SPREMEMBA: Ob prijavi naložimo specifične favorite za tega uporabnika.
        if (user) {
            state.favorites = state.allFavorites[user.username] || [];
        } else {
            state.favorites = [];
        }
        saveStateToLocalStorage();
    },

    logoutUser() {
        state.loggedInUser = null;
        // SPREMEMBA: Ob odjavi počistimo seznam aktivnih favoritov.
        state.favorites = [];
        saveStateToLocalStorage();
    },

    addUser(user) {
        state.users.push(user);
        saveStateToLocalStorage();
    },

    addListing(listing) {
        listing.id = Date.now();
        listing.author = state.loggedInUser.username;
        listing.priceEvaluation = evaluatePrice(listing, state.listings);
        state.listings.unshift(listing);
        saveStateToLocalStorage();
    },

    updateListing(updatedListing) {
        const index = state.listings.findIndex(l => l.id === updatedListing.id);
        if (index !== -1) {
            if (state.listings[index].price !== updatedListing.price) {
                updatedListing.priceEvaluation = evaluatePrice(updatedListing, state.listings);
            }
            state.listings[index] = updatedListing;
            saveStateToLocalStorage();
        }
    },
    
    deleteListing(listingId) {
        state.listings = state.listings.filter(l => l.id !== listingId);
        saveStateToLocalStorage();
    },

    toggleFavorite(listingId) {
        // SPREMEMBA: Dodamo preverjanje, ali je uporabnik sploh prijavljen.
        if (!state.loggedInUser) {
            console.warn("Uporabnik ni prijavljen. Shranjevanje med priljubljene ni mogoče.");
            return { success: false, reason: 'unauthenticated' };
        }
        const index = state.favorites.indexOf(String(listingId));
        if (index > -1) {
            state.favorites.splice(index, 1);
        } else {
            state.favorites.push(String(listingId));
        }
        saveStateToLocalStorage();
        // Vrnemo `true`, če je bil dodan.
        return { success: true, added: index === -1 }; 
    },

    toggleCompare(listingId) {
        const idStr = String(listingId);
        const index = state.compareItems.indexOf(idStr);
        if (index > -1) {
            state.compareItems.splice(index, 1);
        } else if (state.compareItems.length < 3) {
            state.compareItems.push(idStr);
        } else {
            return { success: false, limitReached: true };
        }
        saveStateToLocalStorage();
        return { success: true, added: index === -1 };
    },

    addSavedSearch(searchName, criteria) {
        if (!state.loggedInUser) return;
        const username = state.loggedInUser.username;
        if (!state.savedSearches[username]) {
            state.savedSearches[username] = [];
        }
        
        const newSearch = {
            id: Date.now(),
            name: searchName,
            criteria: criteria
        };

        state.savedSearches[username].unshift(newSearch);
        saveStateToLocalStorage();
    },

    deleteSavedSearch(searchId) {
        if (!state.loggedInUser) return;
        const username = state.loggedInUser.username;
        if (state.savedSearches[username]) {
            state.savedSearches[username] = state.savedSearches[username].filter(s => s.id !== searchId);
            saveStateToLocalStorage();
        }
    },

    getSavedSearches() {
        if (!state.loggedInUser) return [];
        return state.savedSearches[state.loggedInUser.username] || [];
    }
};