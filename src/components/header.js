// Header component — MojAvto.si
// Renders the nav and updates user state dynamically
import { onAuth, logout } from '../auth/auth.js';

export function initHeader() {
    const headerEl = document.getElementById('header');

    function render(user) {
        headerEl.innerHTML = `
      <header>
        <div class="logo">
          <a href="#/">MojAvto<span class="logo-dot">.si</span></a>
        </div>
        <nav id="navLinks">
          <a href="#/">Oglasi</a>
          <a href="#/iskanje"><i class="fas fa-sliders"></i> Napredna iskanja</a>
          <a href="#/primerjava" id="compareLink"><i class="fas fa-balance-scale"></i> Primerjava</a>
          ${user ? `
            <a href="#/novi-oglas" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Objavi oglas</a>
            <div id="userMenu">
              <button id="userMenuBtn" class="user-menu-btn">
                ${user.photoURL
                    ? `<img src="${user.photoURL}" class="avatar" alt="Profil" />`
                    : `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`}
                <span>${user.displayName?.split(' ')[0] || 'Moj račun'}</span>
                <i class="fas fa-chevron-down"></i>
              </button>
              <div id="userDropdown" class="dropdown-menu">
                <a href="#/dashboard"><i class="fas fa-th-large"></i> Dashboard</a>
                <a href="#/profil"><i class="fas fa-user"></i> Moj profil</a>
                <a href="#/garaža"><i class="fas fa-warehouse"></i> Moja garaža</a>
                <div class="dropdown-divider"></div>
                <button id="logoutBtn" class="dropdown-logout"><i class="fas fa-sign-out-alt"></i> Odjava</button>
              </div>
            </div>
          ` : `
            <a href="#/prijava" class="btn btn-outline btn-sm">Prijava</a>
            <a href="#/registracija" class="btn btn-primary btn-sm">Registracija</a>
          `}
        </nav>
        <button class="burger" id="burgerBtn" aria-label="Menu">
          <i class="fas fa-bars"></i>
        </button>
      </header>
    `;

        // Burger menu
        document.getElementById('burgerBtn')?.addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('open');
        });

        // User dropdown
        const menuBtn = document.getElementById('userMenuBtn');
        const dropdown = document.getElementById('userDropdown');
        menuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => dropdown?.classList.remove('open'), { capture: true });

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
