// Uvozimo VSE funkcije, ki jih bomo potrebovali za inicializacijo posameznih pogledov
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

// Definicija poti (routes)
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
    '/listing/:id': 'listing' 
};

async function loadView(view, params = {}) {
    const appContainer = document.getElementById('app-container');
    try {
        const response = await fetch(`views/${view}.html`);
        if (!response.ok) throw new Error("View not found");
        
        appContainer.innerHTML = await response.text();

        // Po nalaganju HTML-a, ponovno zaženemo prevajanje za novo vsebino
        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        
        // Zaženemo specifično skripto za naložen pogled
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
        }
    } catch (error) {
        console.error("Error loading view:", error);
        appContainer.innerHTML = `<h1 data-i18n-key="page_not_found">Stran ni bila najdena.</h1>`;
        await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
    }
}

function handleRouting() {
    const path = window.location.hash.slice(1) || '/';
    let match = null;

    const pathParts = path.split('?')[0].split('/');
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
    
    if (!match && routes[path]) {
        match = { view: routes[path], params: {} };
    }

    if (match) {
        loadView(match.view, match.params);
    } else {
        loadView('404');
    }
}

// Izvozimo samo eno funkcijo, ki jo pokliče app.js
export function initRouter() {
    window.addEventListener('hashchange', handleRouting);
    // Začetno nalaganje ob obisku strani
    handleRouting();
}