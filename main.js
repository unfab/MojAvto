// Main entry point — MojAvto.si
import './src/router.js';
import './src/pageController.js';
import { onAuth } from './src/auth/auth.js';
import { initHeader } from './src/components/header.js';
import './src/index.css';

// Boot header (persists across route changes)
initHeader();

// Boot footer
fetch('/views/footer.html')
    .then(r => r.text())
    .then(html => {
        const footerEl = document.getElementById('footer');
        if (footerEl) footerEl.innerHTML = html;
    })
    .catch(err => console.error("Error loading footer:", err));

// Track auth state globally so views can use it
window.__authReady = new Promise(resolve => {
    onAuth(user => {
        window.__currentUser = user || null;
        resolve(user);
    });
});
