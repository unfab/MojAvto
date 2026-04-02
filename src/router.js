// SPA Router — MojAvto.si
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

// ── Route definitions ─────────────────────────────────────────────────────────
const routes = {
    '/': { view: 'home', protected: false },
    '/oglasi': { view: 'oglasi', protected: false },
    '/iskanje': { view: 'advanced-search', protected: false },
    '/oglas': { view: 'listing', protected: false },
    '/prijava': { view: 'login', protected: false },
    '/registracija': { view: 'register', protected: false },
    '/dashboard': { view: 'dashboard', protected: true },
    '/novi-oglas': { view: 'create-listing', protected: true },
    '/profil': { view: 'profile', protected: true },
    '/primerjava': { view: 'compare', protected: false },
    '/oceni-vrednost': { view: 'evaluate', protected: false },
    '/o-nas': { view: 'about', protected: false },
    '/kontakt': { view: 'contact', protected: false },
    '/faq': { view: 'faq', protected: false },
    '/admin': { view: 'admin', protected: true },
    '/zemljevid': { view: 'map', protected: false },
    '/poslovni-profil': { view: 'business-profile', protected: false },
    '/booking': { view: 'booking', protected: false },
    '/nakup/pnevmatike': { view: 'tire-search', protected: false },
    '/nakup/pnevmatika': { view: 'tire-product', protected: false },
};

const PROTECTED_REDIRECT = '/prijava';
const APP = document.getElementById('app-container');

// ── Load a view HTML into the main container ──────────────────────────────────
async function loadView(viewName) {
    try {
        const res = await fetch(`/views/${viewName}.html?v=${new Date().getTime()}`);
        if (!res.ok) throw new Error(`View not found: ${viewName}`);
        APP.innerHTML = await res.text();
        // Dispatch so page-specific scripts can init
        document.dispatchEvent(new CustomEvent('routeChanged', { detail: { view: viewName } }));
    } catch {
        APP.innerHTML = `<div class="error-page"><h1>404</h1><p>Stran ni bila najdena.</p><a href="#/">← Domov</a></div>`;
    }
}

// ── Main router function ──────────────────────────────────────────────────────
async function router() {
    const hash = window.location.hash.slice(1) || '/';
    // Strip query params for route matching
    const path = hash.split('?')[0];

    // Support dimension-in-path URLs: /nakup/pnevmatike/205-55-r16
    let route = routes[path];
    if (!route && path.startsWith('/nakup/pnevmatike/')) {
        route = { view: 'tire-search', protected: false };
    }
    route = route || { view: '404', protected: false };

    if (route.protected) {
        // Wait for auth state before deciding
        await new Promise(resolve => {
            const unsub = onAuthStateChanged(auth, user => {
                unsub();
                if (!user) {
                    window.location.hash = PROTECTED_REDIRECT;
                } else {
                    loadView(route.view);
                }
                resolve();
            });
        });
    } else {
        await loadView(route.view);
    }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

export { router };
