// Main entry point — MojAvto.si
import './src/router.js';
import './src/pageController.js';
import { onAuth } from './src/auth/auth.js';
import { initHeader } from './src/components/header.js';

// Boot header (persists across route changes)
initHeader();

// Track auth state globally so views can use it
window.__authReady = new Promise(resolve => {
    onAuth(user => {
        window.__currentUser = user || null;
        resolve(user);
    });
});
