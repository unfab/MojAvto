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
              <a href="#/iskanje" class="nav-pill ${window.location.hash === '#/iskanje' ? 'active-pill' : ''}">Oglasi</a>
              <div class="compare-nav-wrapper">
                <a href="#/primerjava" id="compareNavLink" class="nav-pill ${window.location.hash === '#/primerjava' ? 'active-pill' : ''}">
                  <i data-lucide="scale" style="width:16px;height:16px;"></i> Primerjava
                  <span id="compareBadge" class="compare-badge" style="display: none;">0</span>
                </a>
                <div id="comparePreview" class="compare-preview glass-card">
                  <!-- Dynamic content -->
                </div>
              </div>
              <div class="compare-nav-wrapper">
                <button class="nav-pill ${window.location.hash.startsWith('#/zemljevid') ? 'active-pill' : ''}" id="avtohiseMenuBtn" style="background:none;border:none;cursor:pointer;font:inherit;padding:inherit;">
                  <i data-lucide="building-2" style="width:16px;height:16px;"></i> Avtohiše
                </button>
                <div id="avtohiseDropdown" class="glass-dropdown">
                  <a href="#/zemljevid?type=dealer"><i data-lucide="building-2"></i> Avtohiše</a>
                  <a href="#/zemljevid?type=service"><i data-lucide="wrench"></i> Servisne hiše</a>
                </div>
              </div>
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
              <button class="pill-btn secondary btn-icon" id="themeToggleBtn" aria-label="Preklopi temo">
                <i data-lucide="${document.body.classList.contains('dark-mode') ? 'sun' : 'moon'}"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Theme Toggle logic
        document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            render(user); // Re-render to update icon
        });


        // Avtohiše dropdown
        const avtohiseBtn = document.getElementById('avtohiseMenuBtn');
        const avtohiseDropdown = document.getElementById('avtohiseDropdown');
        if (avtohiseBtn && avtohiseDropdown) {
            avtohiseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                avtohiseDropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => avtohiseDropdown.classList.remove('open'), { capture: true });
        }

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

    // Function to update compare badge and preview
    window.updateHeaderCompare = () => {
        const compareList = JSON.parse(localStorage.getItem('mojavto_compare') || '[]');
        const badge = document.getElementById('compareBadge');
        const preview = document.getElementById('comparePreview');

        if (badge) {
            badge.innerText = compareList.length;
            badge.style.display = compareList.length > 0 ? 'flex' : 'none';
        }

        if (preview) {
            if (compareList.length === 0) {
                preview.innerHTML = '<div class="preview-empty">Ni izbranih vozil</div>';
            } else {
                preview.innerHTML = compareList.map(item => `
                    <div class="preview-item">
                        <img src="${item.image}" alt="${item.title}" class="preview-img">
                        <div class="preview-info">
                            <div class="preview-name">${item.title}</div>
                            <div class="preview-year">${item.year || '2020'}</div>
                        </div>
                    </div>
                `).join('') + `
                    <div class="preview-footer">
                        <a href="#/primerjava" class="preview-btn">Poglej primerjavo</a>
                    </div>
                `;
            }
        }
    };

    // First render (no user yet)
    render(null);

    // Initial badge update
    setTimeout(window.updateHeaderCompare, 0);

    // Keep header in sync with auth state
    onAuth(user => {
        render(user);
        window.updateHeaderCompare();
    });
}
