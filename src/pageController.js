// Page controller — maps view names to their init functions
// Called by router on every route change

import { initLoginPage } from './auth/login.js';
import { initRegisterPage } from './auth/register.js';

// Lazy imports — only loaded when needed
const pageModules = {
    home: () => import('./pages/home.js').then(m => m.initHomePage()),
    oglasi: () => import('./pages/oglasi.js').then(m => m.initOglasiPage()),
    'advanced-search': () => import('./pages/advanced-search.js').then(m => m.initAdvancedSearchPage()),
    listing: () => import('./pages/listing.js').then(m => m.initListingPage()),
    'create-listing': () => import('./pages/create-listing.js').then(m => m.initCreateListingPage()),
    dashboard: () => import('./pages/dashboard.js').then(m => m.initDashboardPage()),
    profile: () => import('./pages/profile.js').then(m => m.initProfilePage()),
    compare: () => import('./pages/compare.js').then(m => m.initComparePage()),
    evaluate: () => import('./pages/evaluate.js').then(m => m.initEvaluatePage()),
    login: () => initLoginPage(),
    register: () => initRegisterPage(),
    map: () => import('./pages/map.js').then(m => m.initMapPage()),
    'business-profile': () => import('./pages/business-profile.js').then(m => m.initBusinessProfilePage()),
    booking: () => import('./pages/booking.js').then(m => m.initBookingPage()),
    'tire-search': () => import('./pages/tire-search.js').then(m => m.initTireSearchPage()),
    'tire-product': () => import('./pages/tire-product.js').then(m => m.initTireProductPage()),
    parts: () => import('./pages/parts.js').then(m => m.initPartsPage()),
    admin: () => import('./pages/admin.js').then(m => m.initAdminPage()),
    'service-entry': () => import('./pages/service-entry.js').then(m => m.initServiceEntryPage()),
    'b2b-evaluate':  () => import('./pages/b2b-evaluate.js').then(m => m.initB2bEvaluatePage()),
};

document.addEventListener('beforeRouteChange', () => {
    // Always attempt to unmount React synchronously when leaving a page
    if (window.unmountReactSearch) {
        window.unmountReactSearch();
    }
    // Tear down oglasi subscriptions and React sidebar when navigating away
    if (window._oglasiUnsubscribe) {
        window._oglasiUnsubscribe();
        delete window._oglasiUnsubscribe;
    }
});

document.addEventListener('routeChanged', (e) => {
    const view = e.detail.view;
    
    const initFn = pageModules[view];
    if (initFn) {
        initFn().catch(err => console.error(`[PageController] Error initializing "${view}":`, err));
    }
});
