// Header component — MojAvto.si
// Renders the nav with mega-menu for Oglasi categories
import { onAuth, logout } from '../auth/auth.js';
import { MAIN_CATEGORIES, SEARCH_TYPE_OPTIONS, buildSearchUrl } from '../data/categories.js';

export function initHeader() {
    const headerEl = document.getElementById('header');

    function render(user) {
        const hash = window.location.hash;
        headerEl.innerHTML = `
      <div class="sticky-nav">
        <div class="nav-container">
          <div class="glass-card rounded-pill nav-inner">
            <a href="#/" class="logo-text">MojAvto<span class="logo-accent">.si</span></a>

            <nav id="navLinks" class="desktop-links">
              <!-- Oglasi — mega menu trigger -->
              <div class="mega-menu-wrapper">
                <button class="nav-pill ${hash.startsWith('#/iskanje') || hash.startsWith('#/oglasi') ? 'active-pill' : ''}" id="oglasiMenuBtn">
                  <i data-lucide="search"></i> Oglasi
                </button>
                <div id="megaMenu" class="mega-menu">
                  ${renderMegaMenuContent()}
                </div>
              </div>

              <!-- Avtohise — simple link, no submenu -->
              <a href="#/zemljevid?type=dealer" class="nav-pill ${hash.startsWith('#/zemljevid') ? 'active-pill' : ''}">
                <i data-lucide="building-2"></i> Avtohiše
              </a>

              <!-- Deli in oprema -->
              <a href="#/deli" class="nav-pill ${hash.startsWith('#/deli') ? 'active-pill' : ''}">
                <i data-lucide="wrench"></i> Deli in oprema
              </a>

              <!-- Nakup pnevmatik -->
              <a href="#/nakup/pnevmatike" class="nav-pill ${hash.startsWith('#/nakup') ? 'active-pill' : ''}">
                <i data-lucide="circle-dot"></i> Pnevmatike
              </a>
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
                    <a href="#/primerjava" style="display: flex; align-items: center; justify-content: space-between;">
                        <span><i data-lucide="scale"></i> Primerjalni kotiček</span>
                        <span id="compareBadgeDropdown" class="compare-badge-small" style="display: none; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.65rem; align-items: center; justify-content: center; font-weight: 800;">0</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <button id="logoutBtn" class="dropdown-logout"><i data-lucide="log-out"></i> Odjava</button>
                  </div>
                </div>
              ` : `
                <a href="#/novi-oglas" class="pill-btn primary btn-sm">
                  <i data-lucide="plus"></i> Objavi oglas
                </a>
                <a href="#/prijava" class="pill-btn success btn-sm" style="background: linear-gradient(135deg, #10b981, #059669) !important; color: white !important; font-weight: 700; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;">
                  <i data-lucide="user"></i> Prijava
                </a>
              `}
              <button class="pill-btn secondary btn-icon" id="themeToggleBtn" aria-label="Preklopi temo">
                <i data-lucide="${document.body.classList.contains('dark-mode') ? 'sun' : 'moon'}"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        if (window.lucide) window.lucide.createIcons();

        // ── Theme Toggle ──
        document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            render(user);
        });

        // ── Mega Menu toggle ──
        const megaBtn = document.getElementById('oglasiMenuBtn');
        const megaMenu = document.getElementById('megaMenu');
        if (megaBtn && megaMenu) {
            megaBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                megaMenu.classList.toggle('open');
                // Close any open panels inside
                megaMenu.querySelectorAll('.mega-panel.open').forEach(p => p.classList.remove('open'));
            });
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!megaMenu.contains(e.target) && e.target !== megaBtn) {
                    megaMenu.classList.remove('open');
                }
            });
        }

        // ── Mega menu interaction: subcategory drilling ──
        bindMegaMenuInteractions(megaMenu);

        // ── User dropdown ──
        const menuBtn = document.getElementById('userMenuBtn');
        const dropdown = document.getElementById('userDropdown');
        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => dropdown.classList.remove('open'), { capture: true });
        }

        // ── Logout ──
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await logout();
            window.location.hash = '/';
        });

        // Store user for hashchange re-renders
        window._currentUser = user;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    // Render the mega menu HTML content (Vertical List)
    // ═══════════════════════════════════════════════════════════════════════
    function renderMegaMenuContent() {
        const cats = MAIN_CATEGORIES;
        return `
        <div class="mega-vertical-list">
          <a href="${buildSearchUrl('avto')}" class="mega-vertical-item" data-close-mega>
            <i data-lucide="${cats.avto.icon}"></i> <span>${cats.avto.label}</span>
          </a>
          <a href="${buildSearchUrl('moto')}" class="mega-vertical-item" data-close-mega>
            <i data-lucide="${cats.moto.icon}"></i> <span>${cats.moto.label}</span>
          </a>
          <a href="${buildSearchUrl('gospodarska')}" class="mega-vertical-item" data-close-mega>
            <i data-lucide="${cats.gospodarska.icon}"></i> <span>${cats.gospodarska.label}</span>
          </a>
          <a href="${buildSearchUrl('prosti-cas')}" class="mega-vertical-item" data-close-mega>
            <i data-lucide="${cats.prosti_cas.icon}"></i> <span>${cats.prosti_cas.label}</span>
          </a>
        </div>`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Bind click handlers inside mega menu 
    // ═══════════════════════════════════════════════════════════════════════
    function bindMegaMenuInteractions(megaMenu) {
        if (!megaMenu) return;

        // Close mega menu on link click
        megaMenu.querySelectorAll('[data-close-mega]').forEach(link => {
            link.addEventListener('click', () => {
                megaMenu.classList.remove('open');
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Compare badge & preview (unchanged from original)
    // ═══════════════════════════════════════════════════════════════════════
    window.updateHeaderCompare = () => {
        const compareList = JSON.parse(localStorage.getItem('mojavto_compare') || '[]');
        const badge = document.getElementById('compareBadgeDropdown');

        if (badge) {
            badge.innerText = compareList.length;
            badge.style.display = compareList.length > 0 ? 'flex' : 'none';
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

    // Re-render on hash change to update active pill states
    window.addEventListener('hashchange', () => {
        // We need to get the current user or just re-render with what we have
        // Since render is called with (user), we might need to store the user locally
        render(window._currentUser || null);
    });
}
