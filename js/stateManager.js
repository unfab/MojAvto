// js/stateManager.js

import { evaluatePrice } from './utils/priceEvaluator.js';

/**
 * @namespace state
 * @description The central in-memory store for the application's state.
 */
const state = {
    listings: [],
    brands: {},
    users: [],
    loggedInUser: null,
    favorites: [],      // Favorites for the currently logged-in user
    allFavorites: {},   // All favorites for all users, keyed by username
    compareItems: [],
    savedSearches: {}   // All saved searches for all users, keyed by username
};

// --- Private Helper Functions ---

/**
 * Saves the current state object to localStorage. This is the single point of truth for writing to storage.
 * @private
 */
function saveStateToLocalStorage() {
    localStorage.setItem('mojavto_users', JSON.stringify(state.users));
    localStorage.setItem('mojavto_listings', JSON.stringify(state.listings));
    localStorage.setItem('mojavto_loggedUser', JSON.stringify(state.loggedInUser));
    localStorage.setItem('mojavto_compareItems', JSON.stringify(state.compareItems));
    localStorage.setItem('mojavto_savedSearches', JSON.stringify(state.savedSearches));

    // Ensure the logged-in user's favorites are up-to-date before saving the entire favorites object.
    if (state.loggedInUser) {
        state.allFavorites[state.loggedInUser.username] = state.favorites;
    }
    localStorage.setItem('mojavto_favorites', JSON.stringify(state.allFavorites));
}

/**
 * Loads the application state from localStorage into the in-memory state object.
 * @private
 */
function loadStateFromLocalStorage() {
    state.users = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    state.listings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
    state.loggedInUser = JSON.parse(localStorage.getItem('mojavto_loggedUser')) || null;
    state.allFavorites = JSON.parse(localStorage.getItem('mojavto_favorites')) || {};
    state.compareItems = JSON.parse(localStorage.getItem('mojavto_compareItems')) || [];
    state.savedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};

    // After loading all data, set the specific favorites list for the currently logged-in user.
    if (state.loggedInUser) {
        state.favorites = state.allFavorites[state.loggedInUser.username] || [];
    } else {
        state.favorites = [];
    }
}

/**
 * Ensures that listings from localStorage are updated with any new properties from the source JSON.
 * This prevents errors when the data structure changes over time.
 * @private
 * @param {object[]} localListings - The array of listings from localStorage.
 * @param {object[]} freshListings - The array of listings from the source JSON file.
 * @returns {object[]} The updated ("hydrated") array of listings.
 */
function hydrateListings(localListings, freshListings) {
    if (!freshListings || freshListings.length === 0) return localListings;

    const freshListingTemplate = freshListings[0];

    return localListings.map(listing => {
        const hydratedListing = { ...listing };

        // Example: Add 'financing' property if it's missing.
        if (hydratedListing.financing === undefined && freshListingTemplate.financing !== undefined) {
            hydratedListing.financing = { available: false }; // Assign a safe default value.
        }

        // Example: Add 'priceEvaluation' if it's missing.
        if (hydratedListing.priceEvaluation === undefined) {
            hydratedListing.priceEvaluation = evaluatePrice(hydratedListing, localListings);
        }
        
        return hydratedListing;
    });
}

// --- Public State Manager Object ---

export const stateManager = {
    /**
     * Initializes the state manager by fetching source data, loading from localStorage,
     * ensuring data consistency, and saving the final state.
     */
    async initialize() {
        try {
            const basePath = window.location.hostname.includes('github.io') ? '/MojAvto' : '';
            const [listingsResponse, brandsResponse] = await Promise.all([
                fetch(`${basePath}/json/listings.json`),
                fetch(`${basePath}/json/brands_models_global.json`)
            ]);

            if (!listingsResponse.ok || !brandsResponse.ok) {
                throw new Error('Failed to fetch initial data.');
            }

            const initialListings = await listingsResponse.json();
            state.brands = await brandsResponse.json();

            loadStateFromLocalStorage();

            if (state.listings.length === 0) {
                // If localStorage is empty, populate it with fresh data.
                state.listings = initialListings;
                state.listings.forEach(listing => {
                    listing.priceEvaluation = evaluatePrice(listing, state.listings);
                });
            } else {
                // If listings exist in localStorage, "hydrate" them with any new properties.
                state.listings = hydrateListings(state.listings, initialListings);
            }

            saveStateToLocalStorage();
            console.log('State Manager initialized, data is ready.');

        } catch (error) {
            console.error("Critical error in State Manager:", error);
            throw error; // Propagate the error to be handled by the main app entry point.
        }
    },

    // ... (The rest of the methods remain exactly the same as in your provided code)
    
    /**
     * Returns a shallow copy of the current state.
     * @returns {object} The application state.
     */
    getState() {
        return { ...state };
    },

    /**
     * Returns all listings.
     * @returns {object[]}
     */
    getListings() {
        return state.listings;
    },

    /**
     * Returns all brands and their models.
     * @returns {object}
     */
    getBrands() {
        return state.brands;
    },

    /**
     * Finds and returns a listing by its ID.
     * @param {string|number} id The ID of the listing.
     * @returns {object|undefined}
     */
    getListingById(id) {
        return state.listings.find(listing => String(listing.id) === String(id));
    },

    /**
     * Sets the currently logged-in user and updates the state.
     * @param {object} user The user object.
     */
    setLoggedInUser(user) {
        state.loggedInUser = user;
        if (user) {
            state.favorites = state.allFavorites[user.username] || [];
        } else {
            state.favorites = [];
        }
        saveStateToLocalStorage();
    },

    /**
     * Logs out the current user.
     */
    logoutUser() {
        state.loggedInUser = null;
        state.favorites = [];
        saveStateToLocalStorage();
    },

    /**
     * Adds a new user to the state.
     * @param {object} user The new user object.
     */
    addUser(user) {
        state.users.push(user);
        saveStateToLocalStorage();
    },

    /**
     * Adds a new listing to the state.
     * @param {object} listing The new listing object.
     */
    addListing(listing) {
        listing.id = Date.now();
        listing.author = state.loggedInUser.username;
        listing.priceEvaluation = evaluatePrice(listing, state.listings);
        state.listings.unshift(listing);
        saveStateToLocalStorage();
    },

    /**
     * Updates an existing listing.
     * @param {object} updatedListing The listing object with updated data.
     */
    updateListing(updatedListing) {
        const index = state.listings.findIndex(l => l.id === updatedListing.id);
        if (index !== -1) {
            // Recalculate price evaluation if the price has changed.
            if (state.listings[index].price !== updatedListing.price) {
                updatedListing.priceEvaluation = evaluatePrice(updatedListing, state.listings);
            }
            state.listings[index] = updatedListing;
            saveStateToLocalStorage();
        }
    },

    /**
     * Deletes a listing by its ID.
     * @param {string|number} listingId The ID of the listing to delete.
     */
    deleteListing(listingId) {
        state.listings = state.listings.filter(l => l.id !== Number(listingId));
        saveStateToLocalStorage();
    },

    /**
     * Toggles a listing in the user's favorites.
     * @param {string|number} listingId The ID of the listing.
     * @returns {{success: boolean, added: boolean, reason?: string}}
     */
    toggleFavorite(listingId) {
        if (!state.loggedInUser) {
            console.warn("User not logged in. Cannot save favorites.");
            return { success: false, reason: 'unauthenticated' };
        }
        const favId = String(listingId);
        const index = state.favorites.indexOf(favId);
        let wasAdded;
        if (index > -1) {
            state.favorites.splice(index, 1);
            wasAdded = false;
        } else {
            state.favorites.push(favId);
            wasAdded = true;
        }
        saveStateToLocalStorage();
        return { success: true, added: wasAdded };
    },

    /**
     * Toggles a listing in the comparison list.
     * @param {string|number} listingId The ID of the listing.
     * @returns {{success: boolean, added?: boolean, limitReached?: boolean}}
     */
    toggleCompare(listingId) {
        const idStr = String(listingId);
        const index = state.compareItems.indexOf(idStr);
        let wasAdded;
        if (index > -1) {
            state.compareItems.splice(index, 1);
            wasAdded = false;
        } else if (state.compareItems.length < 4) {
            state.compareItems.push(idStr);
            wasAdded = true;
        } else {
            return { success: false, limitReached: true };
        }
        saveStateToLocalStorage();
        return { success: true, added: wasAdded };
    },

    /**
     * Clears all items from the comparison list.
     */
    clearCompareItems() {
        state.compareItems = [];
        saveStateToLocalStorage();
    },

    /**
     * Adds a saved search for the logged-in user.
     * @param {string} searchName The name for the saved search.
     * @param {object} criteria The search criteria object.
     */
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

    /**
     * Deletes a saved search by its ID.
     * @param {string|number} searchId The ID of the saved search.
     */
    deleteSavedSearch(searchId) {
        if (!state.loggedInUser) return;
        const username = state.loggedInUser.username;
        if (state.savedSearches[username]) {
            state.savedSearches[username] = state.savedSearches[username].filter(s => s.id !== searchId);
            saveStateToLocalStorage();
        }
    },

    /**
     * Retrieves saved searches for the logged-in user.
     * @returns {object[]} An array of saved search objects.
     */
    getSavedSearches() {
        if (!state.loggedInUser) return [];
        return state.savedSearches[state.loggedInUser.username] || [];
    }
};