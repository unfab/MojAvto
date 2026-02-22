// Page controller — maps view names to their init functions
// Called by router on every route change

import { initLoginPage } from './auth/login.js';
import { initRegisterPage } from './auth/register.js';

// Lazy imports — only loaded when needed
const pageModules = {
    home: () => import('./pages/home.js').then(m => m.initHomePage()),
    'advanced-search': () => import('./pages/advanced-search.js').then(m => m.initAdvancedSearchPage()),
    listing: () => import('./pages/listing.js').then(m => m.initListingPage()),
    'create-listing': () => import('./pages/create-listing.js').then(m => m.initCreateListingPage()),
    dashboard: () => import('./pages/dashboard.js').then(m => m.initDashboardPage()),
    profile: () => import('./pages/profile.js').then(m => m.initProfilePage()),
    compare: () => import('./pages/compare.js').then(m => m.initComparePage()),
    login: () => initLoginPage(),
    register: () => initRegisterPage(),
};

document.addEventListener('routeChanged', (e) => {
    const view = e.detail.view;
    const initFn = pageModules[view];
    if (initFn) {
        initFn().catch(err => console.error(`[PageController] Error initializing "${view}":`, err));
    }
});
