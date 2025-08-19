// js/userMenu.js
import { translate } from './i18n.js';
import { showNotification } from './notifications.js'; // Dodan import

export function initUserMenu() {
    const user = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    const userMenu = document.getElementById("userMenu");
    const loginLink = document.getElementById("loginLink");
    const userDropdownBtn = document.getElementById("userDropdownBtn");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");
    const adminLink = document.getElementById("adminLink");
    const profileLink = document.getElementById("profileLink");
    const dashboardLink = document.getElementById("dashboardLink");

    if (!userMenu || !loginLink || !userDropdownBtn) return;
    
    if (user && user.fullname) {
        userMenu.style.display = "inline-block";
        loginLink.style.display = "none";
        userDropdownBtn.innerHTML = `${user.fullname} ▼`;

        if (user.isAdmin) {
            if (adminLink) adminLink.style.display = "block";
            if (dashboardLink) dashboardLink.style.display = "block";
            if (profileLink) profileLink.style.display = "none";
        } else {
            if (profileLink) profileLink.style.display = "block";
            if (adminLink) adminLink.style.display = "none";
            if (dashboardLink) dashboardLink.style.display = "none";
        }
    } else {
        userMenu.style.display = "none";
        loginLink.style.display = "inline";
    }

    userDropdownBtn.addEventListener("click", () => {
        if (userDropdown) {
            userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
        }
    });

    document.addEventListener("click", (e) => {
        if (userMenu && !userMenu.contains(e.target) && userDropdown?.style.display === 'block') {
            userDropdown.style.display = "none";
        }
    });

    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("mojavto_loggedUser");
        // === SPREMEMBA: alert() zamenjan s showNotification() ===
        showNotification(translate('logout_successful'), 'info');
        window.location.hash = '#/login';
        location.reload(); 
    });
}