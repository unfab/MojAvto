// b2b-layout.js — Renders the B2B shell (sidebar + topbar) around a page's content.
// Called by every /b2b/* page before it renders into #b2b-main.

import { getB2BProfile, getRoles, isVerifiedBusiness } from '../core/b2bContext.js';
import { getExtensionsForRoles } from '../core/extensions.js';
import { logout } from '../auth/auth.js';

/**
 * Mounts the B2B shell. Returns the #b2b-main element where the page should render.
 * @param {{ activeRoute: string, title?: string }} opts
 * @returns {HTMLElement|null}
 */
export function mountB2BShell({ activeRoute = '/b2b', title = '' } = {}) {
    const container = document.getElementById('app-container');
    if (!container) return null;

    const profile = getB2BProfile();
    if (!profile || profile.sellerType !== 'business') {
        container.innerHTML = `
            <div style="padding:3rem;text-align:center;">
                <h2>Dostop ni mogoč</h2>
                <p>Ta sekcija je namenjena samo poslovnim uporabnikom.</p>
                <a href="#/dashboard" class="btn btn-primary">Domov</a>
            </div>`;
        return null;
    }

    const roles = getRoles();
    const extensions = getExtensionsForRoles(roles);
    const verified = isVerifiedBusiness();
    const company = profile.companyDetails || {};

    container.innerHTML = `
        <div class="b2b-shell">
            <!-- Sidebar -->
            <aside class="b2b-sidebar">
                <div class="b2b-brand">
                    <a href="#/" class="b2b-brand-link">
                        <span class="b2b-brand-mark">M</span>
                        <span class="b2b-brand-text">MojAvto<span>.si</span></span>
                    </a>
                    <div class="b2b-brand-tag">B2B</div>
                </div>

                <div class="b2b-company">
                    <div class="b2b-company-name" title="${escapeHtml(company.companyName || '')}">${escapeHtml(company.companyName || profile.displayName || 'Podjetje')}</div>
                    <div class="b2b-company-tier ${verified ? 'verified' : 'unverified'}">
                        <i data-lucide="${verified ? 'badge-check' : 'clock'}"></i>
                        ${verified ? 'Verificirano podjetje' : 'V preverjanju'}
                    </div>
                </div>

                <nav class="b2b-nav">
                    ${extensions.map(e => `
                        <a href="#${e.route}" class="b2b-nav-item ${activeRoute === e.route ? 'active' : ''}" data-route="${e.route}">
                            <i data-lucide="${e.icon}"></i>
                            <span>${escapeHtml(e.name)}</span>
                        </a>
                    `).join('')}
                </nav>

                <div class="b2b-sidebar-footer">
                    <a href="#/dashboard" class="b2b-nav-item b2b-exit">
                        <i data-lucide="user"></i> <span>Osebni račun</span>
                    </a>
                    <button id="b2bLogoutBtn" class="b2b-nav-item b2b-logout">
                        <i data-lucide="log-out"></i> <span>Odjava</span>
                    </button>
                </div>
            </aside>

            <!-- Topbar + main -->
            <div class="b2b-main-wrap">
                <header class="b2b-topbar">
                    <div class="b2b-topbar-title">
                        <button class="b2b-sidebar-toggle" id="b2bSidebarToggle" aria-label="Meni"><i data-lucide="menu"></i></button>
                        <h1>${escapeHtml(title)}</h1>
                    </div>
                    <div class="b2b-topbar-actions">
                        ${!verified ? `
                            <div class="b2b-verify-banner">
                                <i data-lucide="info"></i>
                                <span>Vaše podjetje še ni verificirano — nekatere funkcije so omejene.</span>
                            </div>` : ''}
                        <div class="b2b-role-chips">
                            ${roles.map(r => `<span class="b2b-role-chip b2b-role-${r}">${roleLabel(r)}</span>`).join('')}
                        </div>
                    </div>
                </header>

                <main id="b2b-main" class="b2b-main"></main>
            </div>
        </div>
    `;

    // Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Sidebar toggle (mobile)
    document.getElementById('b2bSidebarToggle')?.addEventListener('click', () => {
        document.querySelector('.b2b-sidebar')?.classList.toggle('open');
    });

    // Logout
    document.getElementById('b2bLogoutBtn')?.addEventListener('click', async () => {
        await logout();
        window.location.hash = '/';
    });

    return document.getElementById('b2b-main');
}

function roleLabel(r) {
    return { dealer: 'Avtohiša', mechanic: 'Servis', vulcanizer: 'Vulkanizer' }[r] || r;
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
