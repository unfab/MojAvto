import { evaluatePrice } from './utils/priceEvaluator.js';

/**
 * @namespace state
 * @description The central in-memory store for the application's state.
 */
const state = {
    listings: [],
    brands: {},
    users: [],
    articles: [],
    messages: [],
    loggedInUser: null,
    favorites: [],      // Favorites for the currently logged-in user
    allFavorites: {},   // All favorites for all users, keyed by username
    compareItems: [],
    savedSearches: {}   // All saved searches for all users, keyed by username
};

// --- Private Helper Functions ---
function saveStateToLocalStorage() {
    localStorage.setItem('mojavto_users', JSON.stringify(state.users));
    localStorage.setItem('mojavto_listings', JSON.stringify(state.listings));
    localStorage.setItem('mojavto_articles', JSON.stringify(state.articles));
    localStorage.setItem('mojavto_messages', JSON.stringify(state.messages));
    localStorage.setItem('mojavto_loggedUser', JSON.stringify(state.loggedInUser));
    localStorage.setItem('mojavto_compareItems', JSON.stringify(state.compareItems));
    localStorage.setItem('mojavto_savedSearches', JSON.stringify(state.savedSearches));

    if (state.loggedInUser) {
        state.allFavorites[state.loggedInUser.username] = state.favorites;
    }
    localStorage.setItem('mojavto_favorites', JSON.stringify(state.allFavorites));
}

function loadStateFromLocalStorage() {
    state.users = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    state.listings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
    state.articles = JSON.parse(localStorage.getItem('mojavto_articles')) || [];
    state.messages = JSON.parse(localStorage.getItem('mojavto_messages')) || [];
    state.loggedInUser = JSON.parse(localStorage.getItem('mojavto_loggedUser')) || null;
    state.allFavorites = JSON.parse(localStorage.getItem('mojavto_favorites')) || {};
    state.compareItems = JSON.parse(localStorage.getItem('mojavto_compareItems')) || [];
    state.savedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};

    if (state.loggedInUser) {
        state.favorites = state.allFavorites[state.loggedInUser.username] || [];
    } else {
        state.favorites = [];
    }
}

function hydrateListings(localListings, freshListings) {
    if (!freshListings || freshListings.length === 0) return localListings;
    const freshListingTemplate = freshListings[0];
    return localListings.map(listing => {
        const hydratedListing = { ...listing };
        if (hydratedListing.financing === undefined && freshListingTemplate.financing !== undefined) {
            hydratedListing.financing = { available: false };
        }
        if (hydratedListing.priceEvaluation === undefined) {
            hydratedListing.priceEvaluation = evaluatePrice(hydratedListing, localListings);
        }
        return hydratedListing;
    });
}

// --- Public State Manager Object ---
export const stateManager = {
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
                state.listings = initialListings;
                state.listings.forEach(listing => {
                    listing.priceEvaluation = evaluatePrice(listing, state.listings);
                });
            } else {
                state.listings = hydrateListings(state.listings, initialListings);
            }

            saveStateToLocalStorage();
            console.log('State Manager initialized, data is ready.');
        } catch (error) {
            console.error("Critical error in State Manager:", error);
            throw error;
        }
    },
    
    // --- Splošne Get funkcije ---
    getState() { return { ...state }; },
    getListings() { return state.listings; },
    getUsers() { return state.users; },
    getBrands() { return state.brands; },
    getListingById(id) { return state.listings.find(listing => String(listing.id) === String(id)); },

    // --- Upravljanje z uporabniki ---
    setLoggedInUser(user) {
        state.loggedInUser = user;
        if (user) {
            state.favorites = state.allFavorites[user.username] || [];
        } else {
            state.favorites = [];
        }
        saveStateToLocalStorage();
    },

    logoutUser() {
        state.loggedInUser = null;
        state.favorites = [];
        saveStateToLocalStorage();
    },

    addUser(user) {
        user.isPro = false;
        user.unlockedAnalyses = [];
        user.garage = [];
        state.users.push(user);
        saveStateToLocalStorage();
    },
    
    updateUser(updatedUserData) {
        const index = state.users.findIndex(u => u.username === updatedUserData.username);
        if (index !== -1) {
            state.users[index] = updatedUserData;
            if (state.loggedInUser && state.loggedInUser.username === updatedUserData.username) {
                state.loggedInUser = updatedUserData;
            }
            saveStateToLocalStorage();
        }
    },

    // --- Upravljanje z oglasi ---
    addListing(listing) {
        listing.id = Date.now();
        listing.author = state.loggedInUser.username;
        listing.priceEvaluation = evaluatePrice(listing, state.listings);
        listing.featuredUntil = null;
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
        state.listings = state.listings.filter(l => l.id !== Number(listingId));
        saveStateToLocalStorage();
    },

    // --- Uporabniške akcije (Všečki, Primerjave, Iskanja) ---
    toggleFavorite(listingId) {
        if (!state.loggedInUser) {
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

    clearCompareItems() {
        state.compareItems = [];
        saveStateToLocalStorage();
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
    },

    // --- Funkcije za PRO in monetizacijo ---
    upgradeUserToPro(username) {
        const userIndex = state.users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            state.users[userIndex].isPro = true;
            if (state.loggedInUser && state.loggedInUser.username === username) {
                state.loggedInUser.isPro = true;
            }
            saveStateToLocalStorage();
            return true;
        }
        return false;
    },

    featureListing(listingId, durationDays = 7) {
        const listingIndex = state.listings.findIndex(l => l.id === Number(listingId));
        if (listingIndex !== -1) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);
            state.listings[listingIndex].featuredUntil = expiryDate.toISOString();
            saveStateToLocalStorage();
            return true;
        }
        return false;
    },

    hasUserUnlockedAnalysis(username, listingId) {
        const user = state.users.find(u => u.username === username);
        return user?.unlockedAnalyses?.includes(Number(listingId)) || false;
    },

    unlockAnalysisForUser(username, listingId) {
        const userIndex = state.users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            if (!state.users[userIndex].unlockedAnalyses) {
                state.users[userIndex].unlockedAnalyses = [];
            }
            state.users[userIndex].unlockedAnalyses.push(Number(listingId));

            if (state.loggedInUser && state.loggedInUser.username === username) {
                if (!state.loggedInUser.unlockedAnalyses) {
                    state.loggedInUser.unlockedAnalyses = [];
                }
                state.loggedInUser.unlockedAnalyses.push(Number(listingId));
            }
            saveStateToLocalStorage();
            return true;
        }
        return false;
    },
    
    // =======================================================
    // NOVO: FUNKCIJE ZA UPRAVLJANJE Z GARAŽO
    // =======================================================
    getGarageVehicles(username) {
        const user = state.users.find(u => u.username === username);
        return user ? (user.garage || []) : [];
    },

    addVehicleToGarage(username, vehicleData) {
        const userIndex = state.users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            if (!state.users[userIndex].garage) {
                state.users[userIndex].garage = [];
            }
            vehicleData.id = Date.now(); // Unikaten ID za vozilo v garaži
            state.users[userIndex].garage.push(vehicleData);
            
            // Posodobimo tudi prijavljenega uporabnika
            if(state.loggedInUser && state.loggedInUser.username === username) {
                state.loggedInUser = state.users[userIndex];
            }
            saveStateToLocalStorage();
        }
    },
    // =======================================================

    // --- Upravljanje z Vsebino (Članki, Sporočila) ---
    addArticle(article) {
        if (!state.loggedInUser || !state.loggedInUser.isAdmin) return;
        article.id = Date.now();
        article.author = state.loggedInUser.fullname;
        article.date = new Date().toISOString();
        state.articles.unshift(article);
        saveStateToLocalStorage();
    },

    getArticles() {
        return [...state.articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getArticleById(id) {
        return state.articles.find(article => String(article.id) === String(id));
    },
    
    addMessage(message) {
        message.id = Date.now();
        message.timestamp = new Date().toISOString();
        message.isRead = false;
        state.messages.unshift(message);
        saveStateToLocalStorage();
    },

    getUnreadMessagesForUser(username) {
        return state.messages.filter(msg => msg.recipient === username && !msg.isRead);
    },

    markMessagesAsRead(messageIds) {
        state.messages.forEach(msg => {
            if (messageIds.includes(msg.id)) {
                msg.isRead = true;
            }
        });
        saveStateToLocalStorage();
    }
};