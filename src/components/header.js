// Header component — MojAvto.si
// Renders the nav and updates user state dynamically
import { onAuth, logout } from '../auth/auth.js';

export function initHeader() {
    const headerEl = document.getElementById('header');

    function render(user) {
        headerEl.innerHTML = `
      <div class="sticky-nav">
        <div class="nav-container">
          <div class="glass-card rounded-pill nav-inner">
            <a href="#/" class="logo-text">MojAvto<span class="logo-accent">.si</span></a>
            
            <nav id="navLinks" class="desktop-links">
              <a href="#/" class="nav-pill ${window.location.hash === '#/' || window.location.hash === '' || window.location.hash === '#/domov' ? 'active-pill' : ''}">Oglasi</a>
              <a href="#/iskanje" class="nav-pill ${window.location.hash === '#/iskanje' ? 'active-pill' : ''}"><i data-lucide="sliders"></i> Napredna iskanja</a>
              <a href="#/primerjava" id="compareLink" class="nav-pill ${window.location.hash === '#/primerjava' ? 'active-pill' : ''}"><i data-lucide="scale"></i> Primerjava</a>
            </nav>

            <div class="nav-actions">
              ${user ? `
                <a href="#/novi-oglas" class="pill-btn primary btn-sm"><i data-lucide="plus"></i> Objavi oglas</a>
                <div id="userMenu" class="relative">
                  <button id="userMenuBtn" class="pill-btn secondary user-btn">
                    ${user.photoURL
                        ? `<img src="${user.photoURL}" class="avatar" style="border-radius:50%; width:24px; height:24px; object-fit:cover;" alt="Profil" />`
                        : `<i data-lucide="user"></i>`}
                    <span>${user.displayName?.split(' ')[0] || 'Moj račun'}</span>
                  </button>
                  <div id="userDropdown" class="glass-dropdown">
                    <a href="#/dashboard"><i data-lucide="layout-dashboard"></i> Dashboard</a>
                    <a href="#/profil"><i data-lucide="user"></i> Moj profil</a>
                    <a href="#/garaža"><i data-lucide="warehouse"></i> Moja garaža</a>
                    <div class="dropdown-divider"></div>
                    <button id="logoutBtn" class="dropdown-logout"><i data-lucide="log-out"></i> Odjava</button>
                  </div>
                </div>
              ` : `
                <a href="#/prijava" class="nav-login"><i data-lucide="user"></i> Prijava</a>
                <a href="#/registracija" class="pill-btn primary btn-sm">Registracija</a>
              `}
              <button class="burger-btn hidden-md" id="burgerBtn" aria-label="Menu">
                <i data-lucide="menu"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Burger menu
        document.getElementById('burgerBtn')?.addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('open');
        });

        // User dropdown
        const menuBtn = document.getElementById('userMenuBtn');
        const dropdown = document.getElementById('userDropdown');
        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => dropdown.classList.remove('open'), { capture: true });
        }

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await logout();
            window.location.hash = '/';
        });
    }

    // First render (no user yet)
    render(null);

    // Keep header in sync with auth state
    onAuth(user => render(user));
}
