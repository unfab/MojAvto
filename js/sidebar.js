import { stateManager } from './stateManager.js';

export function initSidebar() {
    const { loggedInUser } = stateManager.getState();
    const userMenuSection = document.getElementById('user-menu-section');
    const publicLikesLink = document.getElementById('public-likes-link');

    if (!userMenuSection || !publicLikesLink) {
        console.error("Sidebar elements for dynamic menu not found.");
        return;
    }

    if (loggedInUser) {
        // Uporabnik je prijavljen
        userMenuSection.style.display = 'block';
        publicLikesLink.style.display = 'none';

        const profileToggle = document.getElementById('profile-menu-toggle');
        const submenu = document.getElementById('profile-submenu');

        if (profileToggle && submenu) {
            profileToggle.addEventListener('click', (e) => {
                e.preventDefault(); // Prepreči navigacijo, če je <a>
                const parentLi = profileToggle.parentElement;
                parentLi.classList.toggle('open');
            });
        }

    } else {
        // Uporabnik ni prijavljen
        userMenuSection.style.display = 'none';
        publicLikesLink.style.display = 'none'; // Všečki so vidni samo prijavljenim
    }
}