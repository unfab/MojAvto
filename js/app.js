// js/app.js

import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initGlobalUI } from './ui.js';
import { initUserMenu } from './userMenu.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';
import { filterListings } from './utils/listingManager.js';
import { initializeModalListeners } from './components/modal.js';
// SPREMEMBA: Uvozimo novo logiko za sidebar
import { initSidebar } from './sidebar.js';

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
 * Initializes the search functionality in the header.
 */
function initHeaderSearch() {
    const headerSearchForm = document.getElementById('headerSearchForm');
    const searchInput = document.getElementById('header-search-input');

    if (headerSearchForm) {
        headerSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                const criteria = { "query": query };
                sessionStorage.setItem('searchCriteria', JSON.stringify(criteria));
                
                if (window.location.hash === '#/search-results') {
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                } else {
                    window.location.hash = '#/search-results';
                }

                searchInput.value = '';
            }
        });
    }
}

/**
 * Initializes the language switcher functionality.
 */
function initLangSwitcher() {
    const langBtn = document.getElementById('lang-switcher-btn');
    const langDropdown = document.getElementById('lang-switcher-dropdown');
    const currentLangSpan = document.getElementById('current-lang');

    if (!langBtn || !langDropdown || !currentLangSpan) return;

    // Set initial language display (SI/EN)
    const currentLang = localStorage.getItem('mojavto_lang') || 'sl';
    currentLangSpan.textContent = currentLang.toUpperCase();

    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });

    langDropdown.addEventListener('click', async (e) => {
        e.preventDefault();
        const target = e.target.closest('a[data-lang]');
        if (target) {
            const lang = target.dataset.lang;
            await setLanguage(lang);
            location.reload(); // Reload the page to apply the new language
        }
    });

    // Close the dropdown when clicking outside of it
    document.addEventListener('click', () => {
        if (langDropdown.classList.contains('show')) {
            langDropdown.classList.remove('show');
        }
    });
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

function checkUnreadMessages() {
    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser) return;

    const unreadMessages = stateManager.getUnreadMessagesForUser(loggedInUser.username);
    
    if (unreadMessages.length > 0) {
        const message = `Imate ${unreadMessages.length} novih sporočil! Oglejte si jih v svojem profilu.`;
        showNotification(message, 'success', 8000);
        
        const unreadIds = unreadMessages.map(msg => msg.id);
        stateManager.markMessagesAsRead(unreadIds);
    }
}


/**
 * Main application entry point that orchestrates the initialization sequence.
 */
async function main() {
    await Promise.all([
        loadComponent('./components/header.html', 'header-container'),
        loadComponent('./components/sidebar.html', 'sidebar'),
        loadComponent('./components/footer.html', 'footer-container'),
        loadComponent('./components/modal.html', 'modal-container')
    ]);

    initializeModalListeners();

    try {
        await stateManager.initialize();
    } catch (error) {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = "<h1>Oops! Nekaj je šlo narobe.</h1><p>Osnovnih podatkov ni bilo mogoče naložiti. Prosimo, osvežite stran.</p>";
        }
        return;
    }

    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromStorage || 'sl');
    
    initGlobalUI(); 
    initUserMenu();
    initHeaderSearch();
    initLangSwitcher();
    initSidebar(); // SPREMEMBA: Kličemo novo funkcijo za sidebar

    await checkSavedSearchNotifications();
    checkUnreadMessages();

    initRouter();
}

document.addEventListener('DOMContentLoaded', main);

/* SPREMEMBA: Začasno onemogočimo Service Worker za lažji razvoj
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker uspešno registriran:', registration);
            })
            .catch(error => {
                console.error('Registracija Service Workerja neuspešna:', error);
            });
    });
}
*/