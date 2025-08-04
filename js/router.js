import { translate } from './i18n.js';
// Uvozimo VSE "init" funkcije, ki jih ruter potrebuje za zagon specifičnih strani.
import { initHomePage } from './main.js';
import { initAuthPage } from './auth.js';
import { initListingPage } from './listing.js';
import { initCreateListingPage } from './create-listing.js';
import { initDashboardPage } from './dashboard.js';
import { initAdminPage } from './admin.js';
import { initComparePage } from './compare.js';
import { initContactPage } from './contact.js';
import { initAdvancedSearchPage } from './advanced-search.js';
import { initProfilePage } from './profile.js';
import { setLanguage } from './i18n.js';

// Definicija vseh poti (routes) v aplikaciji.
// Ključ je pot v URL-ju (za znakom #), vrednost je ime HTML datoteke v mapi /views.
const routes = {
    '/': 'home',
    '/about': 'about',
    '/contact': 'contact',
    '/faq': 'faq',
    '/login': 'login',
    '/register': 'register',
    '/profile': 'profile',
    '/dashboard': 'dashboard',
    '/admin': 'admin',
    '/create-listing': 'create-listing',
    '/advanced-search': 'advanced-search',
    '/compare': 'compare',
    '/listing/:id': 'listing' // Pot s parametrom za ID oglasa
};

/**
 * Naloži HTML pogled iz mape /views in zažene ustrezno inicializacijsko funkcijo.
 * @param {string} view - Ime HTML datoteke (brez .html).
 * @param {object} params - Parametri, pridobljeni iz URL-ja (npr. { id: '123' }).
 */
async function loadView(view, params = {}) {
    const appContainer = document.getElementById('app-container');
    try {
        // Uporabimo relativno pot './' za združljivost z GitHub Pages.
        const response = await fetch(`./views/${view}.html`);
        if (!response.ok) {
            // Če pogled ne obstaja, naložimo stran za napako 404.
            const response404 = await fetch('./views/404.html');
            appContainer.innerHTML = await response404.text();
        } else {
            appContainer.innerHTML = await response.text();
        }

        // Po vsakem nalaganju pogleda ponastavimo jezik, da se prevede nova vsebina.
        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        
        // Glede na naložen pogled zaženemo ustrezno "init" funkcijo.
        switch (view) {
            case 'home': initHomePage(); break;
            case 'login': case 'register': initAuthPage(); break;
            case 'listing': initListingPage(params.id); break;
            case 'create-listing': initCreateListingPage(); break;
            case 'profile': initProfilePage(); break;
            case 'dashboard': initDashboardPage(); break;
            case 'admin': initAdminPage(); break;
            case 'compare': initComparePage(); break;
            case 'contact': initContactPage(); break;
            case 'advanced-search': initAdvancedSearchPage(); break;
            // Za preproste strani, kot sta 'about' in 'faq', ne potrebujemo posebne JS funkcije.
        }
    } catch (error) {
        console.error("Napaka pri nalaganju pogleda:", error);
        appContainer.innerHTML = `<h1 data-i18n-key="page_not_found">Stran ni bila najdena.</h1>`;
        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
    }
}

/**
 * Analizira pot v URL-ju (hash) in kliče loadView s pravilnimi parametri.
 */
function handleRouting() {
    // Pridobimo pot za znakom #, npr. '/listing/123?edit=true'
    const path = window.location.hash.slice(1) || '/';
    let match = null;

    // Odstranimo morebitne query parametre za primerjavo poti
    const cleanPath = path.split('?')[0]; 
    const pathParts = cleanPath.split('/');

    // Najprej preverimo, ali se pot ujema s katero od poti, ki vsebujejo parametre (npr. /listing/:id)
    for (const route in routes) {
        const routeParts = route.split('/');
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
                match = { view: routes[route], params: params };
                break;
            }
        }
    }
    
    // Če se pot ne ujema z nobeno dinamično potjo, preverimo še statične poti.
    if (!match && routes[cleanPath]) {
        match = { view: routes[cleanPath], params: {} };
    }

    // Če smo našli ujemanje, naložimo pogled, sicer prikažemo stran 404.
    if (match) {
        loadView(match.view, match.params);
    } else {
        loadView('404'); 
    }
}

/**
 * Glavna funkcija za inicializacijo ruterja. Doda poslušalce dogodkov.
 * To funkcijo izvozimo in jo kličemo iz osrednje datoteke app.js.
 */
export function initRouter() {
    window.addEventListener('hashchange', handleRouting);
    // Začetno usmerjanje, ko se stran prvič naloži.
    handleRouting();
}