import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initGlobalUI } from './ui.js';
import { initUserMenu } from './userMenu.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';
import { filterListings } from './utils/listingManager.js';
// === DODAN IMPORT ZA MODAL ===
import './components/modal.js';

/**
 * Asynchronously loads an HTML component into a specified container.
 * @param {string} url - The path to the component's HTML file.
 * @param {string} containerId - The ID of the HTML element to load the content into.
 */
async function loadComponent(url, containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) return;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Component at ${url} not found.`);
        
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading component ${url}:`, error);
    }
}

/**
 * Checks for new listings that match the user's saved searches since their last visit.
 */
async function checkSavedSearchNotifications() {
    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser) {
        return;
    }

    const savedSearches = stateManager.getSavedSearches();
    if (!savedSearches || savedSearches.length === 0) {
        return;
    }

    const allListings = stateManager.getListings();
    const lastVisit = localStorage.getItem('mojavto_lastVisit');
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
    
    const matchedSearches = new Set();

    savedSearches.forEach(search => {
        const matches = filterListings(newListings, search.criteria);
        if (matches.length > 0) {
            matches.forEach(match => matchedSearches.add(match.id));
        }
    });

    const totalNewMatches = matchedSearches.size;
    
    if (totalNewMatches > 0) {
        const message = `Found ${totalNewMatches} new listings matching your saved searches.`;
        showNotification(message, 'info', 8000);
    }
}

/**
 * Main application entry point.
 */
async function main() {
    // 1. Load all static UI components in parallel.
    await Promise.all([
        loadComponent('./components/header.html', 'header-container'),
        loadComponent('./components/sidebar.html', 'sidebar-container'),
        loadComponent('./components/footer.html', 'footer-container'),
        // === DODAN KLIC ZA NALAGANJE MODALA ===
        loadComponent('./components/modal.html', 'modal-container')
    ]);

    // 2. Initialize the State Manager.
    try {
        await stateManager.initialize();
    } catch (error) {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = "<h1>Oops! Something went wrong.</h1><p>Could not load initial data. Please refresh the page.</p>";
        }
        return;
    }

    // 3. Initialize i18n and other UI elements.
    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromStorage || 'sl');
    
    initGlobalUI(); 
    initUserMenu();

    // 4. Check for notifications for saved searches.
    await checkSavedSearchNotifications();

    // 5. Start the router now that data and UI are ready.
    initRouter();
}

// Run the main function after the initial HTML document has been loaded.
document.addEventListener('DOMContentLoaded', main);