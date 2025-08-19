import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initGlobalUI } from './ui.js';
import { initUserMenu } from './userMenu.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';
import { filterListings } from './utils/listingManager.js';
import { initializeModalListeners } from './components/modal.js';

/**
 * Asynchronously loads an HTML component's content into a specified container.
 * @param {string} url - The path to the component's HTML file.
 * @param {string} containerId - The ID of the HTML element to load the content into.
 */
async function loadComponent(url, containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container with ID "${containerId}" not found.`);
            return;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Component at ${url} not found (status: ${response.status}).`);
        }
        
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading component from ${url}:`, error);
    }
}

/**
 * Checks for new listings that match the user's saved searches since their last visit.
 */
async function checkSavedSearchNotifications() {
    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser) return;

    const savedSearches = stateManager.getSavedSearches();
    if (!savedSearches || savedSearches.length === 0) return;

    const allListings = stateManager.getListings();
    const lastVisit = localStorage.getItem('mojavto_lastVisit');
    
    // Set the current visit time immediately to prevent re-notifications on refresh.
    const now = new Date().toISOString();
    localStorage.setItem('mojavto_lastVisit', now);

    if (!lastVisit) {
        console.log("First visit, not checking for notifications.");
        return;
    }
    
    const newListings = allListings.filter(listing => 
        listing.date_added && new Date(listing.date_added) > new Date(lastVisit)
    );

    if (newListings.length === 0) {
        console.log("No new listings since last visit.");
        return;
    }
    
    const matchedListingIds = new Set();
    savedSearches.forEach(search => {
        const matches = filterListings(newListings, search.criteria);
        if (matches.length > 0) {
            matches.forEach(match => matchedListingIds.add(match.id));
        }
    });

    const totalNewMatches = matchedListingIds.size;
    
    if (totalNewMatches > 0) {
        const message = `Našli smo ${totalNewMatches} novih oglasov, ki ustrezajo vašim shranjenim iskanjem.`;
        showNotification(message, 'info', 8000);
    }
}

/**
 * Main application entry point that orchestrates the initialization sequence.
 */
async function main() {
    // 1. Load all static UI components in parallel for faster startup.
    await Promise.all([
        loadComponent('./components/header.html', 'header-container'),
        loadComponent('./components/sidebar.html', 'sidebar-container'),
        loadComponent('./components/footer.html', 'footer-container'),
        loadComponent('./components/modal.html', 'modal-container')
    ]);

    // 2. Initialize modal listeners now that its HTML is loaded.
    initializeModalListeners();

    // 3. Initialize the State Manager to load all application data.
    try {
        await stateManager.initialize();
    } catch (error) {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = "<h1>Oops! Nekaj je šlo narobe.</h1><p>Osnovnih podatkov ni bilo mogoče naložiti. Prosimo, osvežite stran.</p>";
        }
        return; // Stop execution if data fails to load.
    }

    // 4. Set language and initialize main UI elements.
    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromStorage || 'sl');
    
    initGlobalUI(); 
    initUserMenu();

    // 5. Check for notifications.
    await checkSavedSearchNotifications();

    // 6. Start the router now that everything is ready.
    initRouter();
}

// Run the main function after the initial HTML document has been parsed.
document.addEventListener('DOMContentLoaded', main);