// Uvozimo vse funkcije, ki jih bomo potrebovali za inicializacijo posameznih pogledov
import { initHomePage } from './main.js';
import { initAuthPage } from './auth.js';
import { initListingPage } from './listing.js';
import { initCreateListingPage } from './create-listing.js';
import { initDashboardPage } from './dashboard.js';
import { initAdminPage } from './admin.js';
import { initComparePage } from './compare.js';
import { initContactPage } from './contact.js';

// Pomožna funkcija za nalaganje pogleda (view) in zagon skript
async function loadView(view, params = {}) {
    const appContainer = document.getElementById('app-container');
    try {
        const response = await fetch(`views/${view}.html`);
        if (!response.ok) throw new Error("View not found");
        
        const html = await response.text();
        appContainer.innerHTML = html;

        if (typeof setLanguage === 'function') {
            await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        }
        
        // Zaženemo specifično skripto za naložen pogled
        switch (view) {
            case 'home':
                initHomePage();
                break;
            case 'login':
            case 'register':
                initAuthPage();
                break;
            case 'listing':
                initListingPage(params.id); // Pošljemo ID oglasa v funkcijo
                break;
            case 'create-listing':
                initCreateListingPage();
                break;
            case 'dashboard':
                initDashboardPage();
                break;
            case 'admin':
                initAdminPage();
                break;
            case 'compare':
                initComparePage();
                break;
            case 'contact':
                initContactPage();
                break;
            // Za about.html in faq.html ne potrebujemo posebne JS funkcije
        }

    } catch (error) {
        console.error("Error loading view:", error);
        appContainer.innerHTML = `<h1 data-i18n-key="page_not_found">Stran ni bila najdena.</h1>`;
        if (typeof setLanguage === 'function') {
            await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        }
    }
}

// Definicija poti (routes)
const routes = {
    '/': 'home',
    '/about': 'about',
    '/contact': 'contact',
    '/faq': 'faq',
    '/login': 'login',
    '/register': 'register',
    '/dashboard': 'dashboard',
    '/admin': 'admin',
    '/create-listing': 'create-listing',
    '/compare': 'compare',
    '/listing/:id': 'listing' 
};

// Glavna funkcija ruterja, ki zdaj podpira tudi parametre (npr. ID oglasa)
function router() {
    const path = window.location.hash.slice(1) || '/';
    let match = null;

    // Preverimo poti s parametri
    const pathParts = path.split('/');
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
    
    // Če ni ujemanja, preverimo še statične poti
    if (!match && routes[path]) {
        match = { view: routes[path], params: {} };
    }

    if (match) {
        loadView(match.view, match.params);
    } else {
        loadView('404'); // Naloži views/404.html za prikaz napake
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    setTimeout(router, 100); 
});