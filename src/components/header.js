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
                <button class="nav-pill ${hash.startsWith('#/iskanje') || hash.startsWith('#/oglasi') ? 'active-pill' : ''}" id="oglasiMenuBtn" style="background:none;border:none;cursor:pointer;font:inherit;padding:inherit;">
                  <i data-lucide="search" style="width:16px;height:16px;"></i> Oglasi
                </button>
                <div id="megaMenu" class="mega-menu">
                  ${renderMegaMenuContent()}
                </div>
              </div>

              <!-- Primerjava -->
              <div class="compare-nav-wrapper">
                <a href="#/primerjava" id="compareNavLink" class="nav-pill ${hash === '#/primerjava' ? 'active-pill' : ''}">
                  <i data-lucide="scale" style="width:16px;height:16px;"></i> Primerjava
                  <span id="compareBadge" class="compare-badge" style="display: none;">0</span>
                </a>
                <div id="comparePreview" class="compare-preview glass-card">
                  <!-- Dynamic content -->
                </div>
              </div>

              <!-- Avtohise — simple link, no submenu -->
              <a href="#/zemljevid?type=dealer" class="nav-pill ${hash.startsWith('#/zemljevid') ? 'active-pill' : ''}">
                <i data-lucide="building-2" style="width:16px;height:16px;"></i> Avtohiše
              </a>

              <!-- Deli in oprema -->
              <a href="${buildSearchUrl(null, null, 'deli')}" class="nav-pill">
                <i data-lucide="wrench" style="width:16px;height:16px;"></i> Deli in oprema
              </a>

              <!-- Nakup pnevmatik -->
              <a href="#/nakup/pnevmatike" class="nav-pill ${hash.startsWith('#/nakup') ? 'active-pill' : ''}">
                <i data-lucide="circle-dot" style="width:16px;height:16px;"></i> Pnevmatike
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
                    <div class="dropdown-divider"></div>
                    <button id="logoutBtn" class="dropdown-logout"><i data-lucide="log-out"></i> Odjava</button>
                  </div>
                </div>
              ` : `
                <a href="#/prijava" class="nav-pill" style="font-size:0.85rem;">
                  <i data-lucide="user" style="width:16px;height:16px;"></i> Prijava
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
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Render the mega menu HTML content (4 columns)
    // ═══════════════════════════════════════════════════════════════════════
    function renderMegaMenuContent() {
        const cats = MAIN_CATEGORIES;
        let html = '<div class="mega-cols">';

        // ── Column 1: Avto ──
        html += `
        <div class="mega-col">
          <a href="${buildSearchUrl('avto')}" class="mega-col-title" data-close-mega>
            <i data-lucide="${cats.avto.icon}"></i> ${cats.avto.label}
          </a>
          <div class="mega-divider"></div>
          <span class="mega-sub-link" style="color:#9ca3af; font-size:0.75rem; cursor:default; padding-top:0.5rem;">
            Napredni filter za avtomobile
          </span>
        </div>`;

        // ── Column 2: Moto ──
        html += `<div class="mega-col">
          <span class="mega-col-title" style="cursor:default;">
            <i data-lucide="${cats.moto.icon}"></i> ${cats.moto.label}
          </span>
          <div class="mega-divider"></div>`;
        for (const [, sub] of Object.entries(cats.moto.subcategories)) {
            if (sub.vehicleTypes && sub.vehicleTypes.length > 0) {
                // Has vehicle types → show drill-down
                html += `<button class="mega-sub-link" data-drill="moto" data-sub="${sub.slug}">
                    <i data-lucide="${sub.icon}"></i> ${sub.label} <i data-lucide="chevron-right" style="width:12px;height:12px;margin-left:auto;opacity:0.4;"></i>
                </button>`;
            } else {
                // Direct link
                html += `<a href="${buildSearchUrl('moto', sub.slug, sub.searchType)}" class="mega-sub-link" data-close-mega>
                    <i data-lucide="${sub.icon}"></i> ${sub.label}
                </a>`;
            }
        }
        html += '</div>';

        // ── Column 3: Gospodarska ──
        html += `<div class="mega-col">
          <span class="mega-col-title" style="cursor:default;">
            <i data-lucide="${cats.gospodarska.icon}"></i> ${cats.gospodarska.label}
          </span>
          <div class="mega-divider"></div>`;
        for (const [, sub] of Object.entries(cats.gospodarska.subcategories)) {
            // All gospodarska subs ask for searchType
            html += `<button class="mega-sub-link" data-drill="gospodarska" data-sub="${sub.slug}">
                <i data-lucide="${sub.icon}"></i> ${sub.label} <i data-lucide="chevron-right" style="width:12px;height:12px;margin-left:auto;opacity:0.4;"></i>
            </button>`;
        }
        html += '</div>';

        // ── Column 4: Prosti čas ──
        html += `<div class="mega-col">
          <span class="mega-col-title" style="cursor:default;">
            <i data-lucide="${cats.prosti_cas.icon}"></i> ${cats.prosti_cas.label}
          </span>
          <div class="mega-divider"></div>`;
        for (const [, sub] of Object.entries(cats.prosti_cas.subcategories)) {
            html += `<a href="${buildSearchUrl('prosti-cas', sub.slug, sub.searchType)}" class="mega-sub-link" data-close-mega>
                <i data-lucide="${sub.icon}"></i> ${sub.label}
            </a>`;
        }
        // Rental toggle
        html += `
          <div class="mega-rental-toggle">
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
              <input type="checkbox" id="megaRentalToggle">
              <span class="toggle-slider-sm"></span>
              <span>Najem</span>
            </label>
          </div>`;
        html += '</div>';

        html += '</div>'; // close mega-cols

        // ── Drill-down panels (hidden by default) ──

        // Panel: Moto → Motorno kolo vehicle types
        const motoKolo = cats.moto.subcategories.motorno_kolo;
        html += `
        <div class="mega-panel" id="panel-moto-motorno-kolo">
          <button class="mega-panel-back" data-panel-back><i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Nazaj</button>
          <div class="mega-panel-title">${motoKolo.label} — Vrsta motorja</div>
          <div class="mega-panel-grid">
            ${motoKolo.vehicleTypes.map(vt => `
              <a href="${buildSearchUrl('moto', motoKolo.slug, 'vozilo', vt.value)}" class="mega-panel-item" data-close-mega>
                ${vt.label}
              </a>
            `).join('')}
          </div>
        </div>`;

        // Panels: Gospodarska subcategories → search type chooser
        for (const [, sub] of Object.entries(cats.gospodarska.subcategories)) {
            html += `
            <div class="mega-panel" id="panel-gospodarska-${sub.slug}">
              <button class="mega-panel-back" data-panel-back><i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Nazaj</button>
              <div class="mega-panel-title">${sub.label} — Kaj iščete?</div>
              <div class="mega-search-type-chooser">
                ${SEARCH_TYPE_OPTIONS.map(opt => `
                  <a href="${buildSearchUrl('gospodarska', sub.slug, opt.value)}" class="mega-search-type-btn" data-close-mega>
                    <i data-lucide="${opt.icon}"></i>
                    ${opt.label}
                  </a>
                `).join('')}
              </div>
            </div>`;
        }

        return html;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Bind click handlers inside mega menu for drill-down panels
    // ═══════════════════════════════════════════════════════════════════════
    function bindMegaMenuInteractions(megaMenu) {
        if (!megaMenu) return;

        // Drill into subcategory panel
        megaMenu.querySelectorAll('[data-drill]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cat = btn.dataset.drill;
                const sub = btn.dataset.sub;
                const panelId = `panel-${cat}-${sub}`;
                const panel = megaMenu.querySelector(`#${panelId}`);
                if (panel) {
                    // Close other panels
                    megaMenu.querySelectorAll('.mega-panel.open').forEach(p => p.classList.remove('open'));
                    panel.classList.add('open');
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        });

        // Back button
        megaMenu.querySelectorAll('[data-panel-back]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.closest('.mega-panel')?.classList.remove('open');
            });
        });

        // Close mega menu on link click
        megaMenu.querySelectorAll('[data-close-mega]').forEach(link => {
            link.addEventListener('click', () => {
                megaMenu.classList.remove('open');
                megaMenu.querySelectorAll('.mega-panel.open').forEach(p => p.classList.remove('open'));
            });
        });

        // Rental toggle for prosti čas links
        const rentalToggle = megaMenu.querySelector('#megaRentalToggle');
        if (rentalToggle) {
            rentalToggle.addEventListener('change', () => {
                const isRental = rentalToggle.checked;
                // Update all prosti-cas links
                megaMenu.querySelectorAll('a[href*="cat=prosti-cas"]').forEach(link => {
                    const hash = link.getAttribute('href');
                    if (isRental) {
                        // Add najem param
                        if (!hash.includes('najem=1')) {
                            link.setAttribute('href', hash + (hash.includes('?') ? '&' : '?') + 'najem=1');
                        }
                    } else {
                        link.setAttribute('href', hash.replace(/[&?]najem=1/, ''));
                    }
                });
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Compare badge & preview (unchanged from original)
    // ═══════════════════════════════════════════════════════════════════════
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
