// b2b-dashboard.js — Overview page for B2B users
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { getB2BProfile, getRoles } from '../core/b2bContext.js';
import { getDashboardStats } from '../services/b2bService.js';

export async function initB2bDashboardPage() {
    const main = mountB2BShell({ activeRoute: '/b2b', title: 'Pregled' });
    if (!main) return;

    const profile = getB2BProfile();
    const roles = getRoles();

    main.innerHTML = `
        <div class="b2b-grid">
            <div class="b2b-kpi-row">
                ${kpiCard('Rezervacije', '—', 'pending', 'calendar-check', '#2563eb')}
                ${kpiCard('Storitve', '—', 'services', 'tags', '#16a34a')}
                ${kpiCard('Prihodki (opravljeno)', '—', 'revenue', 'euro', '#0d9488')}
                ${roles.includes('dealer') ? kpiCard('Zaloga vozil', '—', 'inventory', 'warehouse', '#f59e0b') : ''}
                ${roles.includes('dealer') ? kpiCard('Nova povpraševanja', '—', 'leads', 'inbox', '#ea580c') : ''}
            </div>

            <section class="b2b-card">
                <h2 class="b2b-card-title"><i data-lucide="zap"></i> Hitra dejanja</h2>
                <div class="b2b-quick-actions">
                    <a href="#/b2b/storitve" class="b2b-quick-btn"><i data-lucide="plus"></i> Dodaj storitev</a>
                    <a href="#/novi-oglas" class="b2b-quick-btn"><i data-lucide="car"></i> Dodaj oglas</a>
                    <a href="#/b2b/rezervacije?status=pending" class="b2b-quick-btn"><i data-lucide="calendar-check"></i> Odpri rezervacije</a>
                    <a href="#/b2b/profil" class="b2b-quick-btn"><i data-lucide="edit"></i> Uredi javni profil</a>
                    ${roles.includes('dealer') ? `<a href="#/b2b/zaloga" class="b2b-quick-btn"><i data-lucide="warehouse"></i> Upravljaj zalogo</a>` : ''}
                    ${roles.includes('vulcanizer') ? `<a href="#/b2b/hotel-gum" class="b2b-quick-btn"><i data-lucide="circle-dot"></i> Hotel za gume</a>` : ''}
                    ${roles.includes('mechanic') ? `<a href="#/b2b/servis-vnos" class="b2b-quick-btn"><i data-lucide="clipboard-list"></i> VIN servis vnos</a>` : ''}
                </div>
            </section>

            <section class="b2b-card">
                <h2 class="b2b-card-title"><i data-lucide="info"></i> Status računa</h2>
                <ul class="b2b-info-list">
                    <li><strong>Ime podjetja:</strong> ${esc(profile?.companyDetails?.companyName || '—')}</li>
                    <li><strong>Davčna:</strong> ${esc(profile?.companyDetails?.taxId || '—')}</li>
                    <li><strong>Naslov:</strong> ${esc(profile?.companyDetails?.address || '—')}</li>
                    <li><strong>Dejavnosti:</strong> ${roles.length ? roles.map(r => roleLabel(r)).join(', ') : '—'}</li>
                    <li><strong>Status:</strong> ${profile?.businessTier === 'verified' ? '<span class="b2b-badge-ok">Verificirano</span>' : '<span class="b2b-badge-warn">V preverjanju</span>'}</li>
                </ul>
            </section>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Load stats
    try {
        const stats = await getDashboardStats();
        setKpi('pending', stats.bookings.pending, `${stats.bookings.total} skupaj`);
        setKpi('services', stats.services, '');
        setKpi('revenue', fmtEur(stats.bookings.revenue), `${stats.bookings.completed} zaključeno`);
        setKpi('inventory', stats.inventory, '');
        setKpi('leads', stats.leads.new, `${stats.leads.total} skupaj`);
    } catch (err) {
        console.warn('[b2b-dashboard] stats failed', err);
        ['pending','services','revenue','inventory','leads'].forEach(k => setKpi(k, '0', 'ni podatkov'));
    }
}

function kpiCard(label, value, key, icon, color) {
    return `
        <div class="b2b-kpi" data-kpi="${key}">
            <div class="b2b-kpi-icon" style="background:${color}1a;color:${color};"><i data-lucide="${icon}"></i></div>
            <div class="b2b-kpi-body">
                <div class="b2b-kpi-label">${label}</div>
                <div class="b2b-kpi-value" data-kpi-value>${value}</div>
                <div class="b2b-kpi-sub" data-kpi-sub>&nbsp;</div>
            </div>
        </div>`;
}

function setKpi(key, value, sub) {
    const card = document.querySelector(`[data-kpi="${key}"]`);
    if (!card) return;
    card.querySelector('[data-kpi-value]').textContent = value;
    card.querySelector('[data-kpi-sub]').textContent = sub || '';
}

function fmtEur(n) {
    return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function roleLabel(r) {
    return { dealer: 'Avtohiša', mechanic: 'Servis', vulcanizer: 'Vulkanizer' }[r] || r;
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
