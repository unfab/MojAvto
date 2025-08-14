import { translate, setLanguage } from './i18n.js';
import { initHomePage } from './home.js';
import { initAuthPage } from './auth.js';
import { initListingPage } from './listing.js';
import { initCreateListingPage } from './create-listing.js';
import { initDashboardPage } from './dashboard.js';
import { initAdminPage } from './admin.js';
import { initComparePage } from './compare.js';
import { initContactPage } from './contact.js';
import { initAdvancedSearchPage } from './advanced-search.js';
import { initProfilePage } from './profile.js';
import { initSearchResultsPage } from './search-results.js';
import { initLikesPage } from './likes.js';


const routes = {
    '/': { view: 'home.html', init: initHomePage },
    '/about': { view: 'about.html' },
    '/contact': { view: 'contact.html', init: initContactPage },
    '/faq': { view: 'faq.html' },
    '/login': { view: 'login.html', init: initAuthPage },
    '/register': { view: 'register.html', init: initAuthPage },
    '/profile': { view: 'profile.html', init: initProfilePage },
    '/dashboard': { view: 'dashboard.html', init: initDashboardPage },
    '/admin': { view: 'admin.html', init: initAdminPage },
    '/create-listing': { view: 'create-listing.html', init: initCreateListingPage },
    '/advanced-search': { view: 'advanced-search.html', init: initAdvancedSearchPage },
    '/compare': { view: 'compare.html', init: initComparePage },
    '/likes': { view: 'likes.html', init: initLikesPage },
    '/listing/:id': { view: 'listing.html', init: initListingPage },
    '/search-results': { view: 'search-results.html', init: initSearchResultsPage },
    '/404': { view: '404.html' }
};

async function loadView(routeObject, params = {}) {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error("Kontejner #app-container ne obstaja v DOM-u!");
        return;
    }

    try {
        const response = await fetch(`./views/${routeObject.view}`);
        if (!response.ok) throw new Error("Pogled ni bil najden.");
        
        appContainer.innerHTML = await response.text();

        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        
        if (routeObject.init) {
            routeObject.init(params);
        }

    } catch (error) {
        console.error("Napaka pri nalaganju pogleda:", error);
        const response404 = await fetch('./views/404.html');
        appContainer.innerHTML = await response404.text();
        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
    }
}

function handleRouting() {
    const path = window.location.hash.slice(1) || '/';
    const cleanPath = path.split('?')[0];
    const pathParts = cleanPath.split('/');

    let match = null;

    for (const routePath in routes) {
        const routeParts = routePath.split('/');
        if (routeParts.length === pathParts.length) {
            const params = {};
            const isMatch = routeParts.every((part, i) => {
                if (part.startsWith(':')) {
                    params[part.slice(1)] = pathParts[i];
                    return true;
                }
                return part === pathParts[i];
            });

            if (isMatch) {
                match = { routeObject: routes[routePath], params: params };
                break;
            }
        }
    }
    
    if (!match && routes[cleanPath]) {
        match = { routeObject: routes[cleanPath], params: {} };
    }

    if (match) {
        loadView(match.routeObject, match.params);
    } else {
        loadView(routes['/404']);
    }
}

export function initRouter() {
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
}