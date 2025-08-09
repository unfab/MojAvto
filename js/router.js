import { translate, setLanguage } from './i18n.js';

// Uvozimo VSE "init" funkcije, ki jih ruter potrebuje.
// Uporabljamo vašo obstoječo, obsežno listo uvozov.
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

// === POSODOBLJENO: Nova, boljša struktura za definiranje poti ===
// Vsaka pot je sedaj objekt, ki vsebuje pot do HTML datoteke in pripadajočo "init" funkcijo.
const routes = {
    '/': { view: 'home.html', init: initHomePage },
    '/about': { view: 'about.html' }, // Strani brez JS logike nimajo 'init' funkcije
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
    '/listing/:id': { view: 'listing.html', init: initListingPage },
    '/404': { view: '404.html' } // Posebna pot za stran "Ni najdeno"
};

/**
 * Naloži HTML pogled in zažene ustrezno inicializacijsko funkcijo.
 * @param {object} routeObject - Objekt, ki definira pot (npr. { view: 'home.html', init: initHomePage }).
 * @param {object} params - Parametri iz URL-ja (npr. { id: '123' }).
 */
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
        
        // === POSODOBLJENO: Odstranjen 'switch' stavek ===
        // Sedaj direktno kličemo 'init' funkcijo iz route objekta, če ta obstaja.
        // Parametre (npr. ID oglasa) posredujemo funkciji.
        if (routeObject.init) {
            routeObject.init(params);
        }

    } catch (error) {
        console.error("Napaka pri nalaganju pogleda:", error);
        // Naložimo 404 stran, če pride do napake
        const response404 = await fetch('./views/404.html');
        appContainer.innerHTML = await response404.text();
        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
    }
}

/**
 * Analizira pot v URL-ju (hash) in kliče loadView s pravilnimi parametri.
 * Ta funkcija je sedaj prilagojena za delo z novo strukturo poti.
 */
function handleRouting() {
    const path = window.location.hash.slice(1) || '/';
    const cleanPath = path.split('?')[0];
    const pathParts = cleanPath.split('/');

    let match = null;

    // Preveri dinamične poti (npr. /listing/:id)
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
    
    // Če ni dinamičnega ujemanja, preveri statične poti
    if (!match && routes[cleanPath]) {
        match = { routeObject: routes[cleanPath], params: {} };
    }

    // Naloži pogled ali prikaži 404 stran
    if (match) {
        loadView(match.routeObject, match.params);
    } else {
        loadView(routes['/404']);
    }
}

/**
 * Glavna funkcija za inicializacijo ruterja. (nespremenjeno)
 */
export function initRouter() {
    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // Začetno usmerjanje ob nalaganju strani
}