// SPA Router — MojAvto.si
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchB2BProfile } from './core/b2bContext.js';

// ── Route definitions ─────────────────────────────────────────────────────────
const routes = {
    '/': { view: 'home', protected: false },
    '/oglasi': { view: 'oglasi', protected: false },
    '/iskanje': { view: 'advanced-search', protected: false },
    '/oglas': { view: 'listing', protected: false },
    '/prijava': { view: 'login', protected: false },
    '/registracija': { view: 'register', protected: false },
    '/dashboard': { view: 'dashboard', protected: true },
    '/novi-oglas': { view: 'create-listing', protected: false },
    '/profil': { view: 'profile', protected: true },
    '/garaža': { view: 'profile', protected: true },
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
    '/deli': { view: 'parts', protected: false },
    '/del': { view: 'parts-listing', protected: false },
    '/servis/vnos': { view: 'service-entry', protected: true },
    '/b2b/oceni': { view: 'b2b-evaluate', protected: false },

    // ── B2B Operating System ──
    '/b2b': { view: 'b2b-dashboard', protected: true, b2bOnly: true },
    '/b2b/rezervacije': { view: 'b2b-reservations', protected: true, b2bOnly: true },
    '/b2b/storitve': { view: 'b2b-services', protected: true, b2bOnly: true },
    '/b2b/profil': { view: 'b2b-profile-editor', protected: true, b2bOnly: true },
    '/b2b/zaloga': { view: 'b2b-inventory', protected: true, b2bOnly: true },
    '/b2b/leads': { view: 'b2b-leads', protected: true, b2bOnly: true },
    '/b2b/orodja': { view: 'b2b-tools', protected: true, b2bOnly: true },
    '/b2b/delavnica': { view: 'b2b-workshop', protected: true, b2bOnly: true },
    '/b2b/servis-vnos': { view: 'service-entry', protected: true, b2bOnly: true },
    '/b2b/hotel-gum': { view: 'b2b-tire-hotel', protected: true, b2bOnly: true },
};

const PROTECTED_REDIRECT = '/prijava';
const APP = document.getElementById('app-container');

// Views that render entirely in JS (no matching /views/*.html file)
const JS_ONLY_VIEWS = new Set([
    'b2b-dashboard', 'b2b-reservations', 'b2b-services', 'b2b-profile-editor',
    'b2b-inventory', 'b2b-leads', 'b2b-tools', 'b2b-workshop', 'b2b-tire-hotel',
]);

// ── Load a view HTML into the main container ──────────────────────────────────
async function loadView(viewName) {
    try {
        if (JS_ONLY_VIEWS.has(viewName)) {
            // JS-only pages: clear container and let the page init render into it.
            APP.innerHTML = '';
        } else {
            const res = await fetch(`/views/${viewName}.html?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error(`View not found: ${viewName}`);
            APP.innerHTML = await res.text();
        }
        // Dispatch so page-specific scripts can init
        document.dispatchEvent(new CustomEvent('routeChanged', { detail: { view: viewName } }));
    } catch {
        APP.innerHTML = `<div class="error-page"><h1>404</h1><p>Stran ni bila najdena.</p><a href="#/">← Domov</a></div>`;
    }
}

// ── Main router function ──────────────────────────────────────────────────────
async function router() {
    const hash = window.location.hash.slice(1) || '/';
    // Strip query params and decode special characters (e.g. č, š, ž)
    const path = decodeURIComponent(hash.split('?')[0]);

    // Restore site navbar if leaving admin
    document.getElementById('adm-hide-sitenav')?.remove();

    // Dispatch event to allow cleanup (e.g. unmounting React) before replacing content
    document.dispatchEvent(new CustomEvent('beforeRouteChange', { detail: { path } }));

    // Support dimension-in-path URLs: /nakup/pnevmatike/205-55-r16
    let route = routes[path];
    if (!route && path.startsWith('/nakup/pnevmatike/')) {
        route = { view: 'tire-search', protected: false };
    }
    route = route || { view: '404', protected: false };

    if (route.protected) {
        // Wait for auth state before deciding
        await new Promise(resolve => {
            const unsub = onAuthStateChanged(auth, async user => {
                unsub();
                if (!user) {
                    window.location.hash = PROTECTED_REDIRECT;
                    resolve();
                    return;
                }
                // B2B-only gate
                if (route.b2bOnly) {
                    const profile = await fetchB2BProfile(user);
                    if (profile?.sellerType !== 'business') {
                        window.location.hash = '/dashboard';
                        resolve();
                        return;
                    }
                }
                // Auto-redirect business users to B2B home if they hit /dashboard
                if (route.view === 'dashboard') {
                    const profile = await fetchB2BProfile(user);
                    if (profile?.sellerType === 'business') {
                        window.location.hash = '/b2b';
                        resolve();
                        return;
                    }
                }
                loadView(route.view);
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
