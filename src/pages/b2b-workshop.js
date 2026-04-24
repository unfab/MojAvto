// b2b-workshop.js — Mechanic's daily workshop view
// Aggregates today's/tomorrow's confirmed bookings and links to service entry.
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { listMyBookings, updateBookingStatus, listServices } from '../services/b2bService.js';
import { hasRole } from '../core/b2bContext.js';

export async function initB2bWorkshopPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/delavnica', title: 'Delavnica' });
    if (!main) return;
    if (!hasRole('mechanic')) {
        main.innerHTML = `<div class="b2b-empty"><p>Delavnica je namenjena pooblaščenim servisom.</p></div>`;
        return;
    }

    main.innerHTML = `
        <div class="b2b-workshop-grid">
            <section class="b2b-card b2b-card-flush b2b-workshop-day">
                <header class="b2b-card-title"><i data-lucide="sun"></i> Danes — <span id="today-date">${today()}</span></header>
                <div id="todayList"><div class="b2b-loading"><i data-lucide="loader"></i> Nalagam…</div></div>
            </section>
            <section class="b2b-card b2b-card-flush b2b-workshop-day">
                <header class="b2b-card-title"><i data-lucide="sunrise"></i> Jutri — <span id="tomorrow-date">${offset(1)}</span></header>
                <div id="tomorrowList"></div>
            </section>
            <aside class="b2b-card">
                <header class="b2b-card-title"><i data-lucide="tags"></i> Storitve</header>
                <div id="svcMini"></div>
                <a href="#/b2b/storitve" class="btn b2b-btn-secondary btn-sm" style="margin-top:0.75rem;"><i data-lucide="edit"></i> Uredi cenik</a>
            </aside>
        </div>

        <div class="b2b-workshop-actions">
            <a href="#/b2b/servis-vnos" class="btn b2b-btn-primary"><i data-lucide="clipboard-list"></i> Nov servisni vnos (VIN)</a>
            <a href="#/b2b/rezervacije" class="btn b2b-btn-secondary"><i data-lucide="calendar"></i> Vse rezervacije</a>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
        const [bookings, services] = await Promise.all([listMyBookings(), listServices()]);
        const t = today(), tmrw = offset(1);
        renderDay('todayList', bookings.filter(b => b.date === t));
        renderDay('tomorrowList', bookings.filter(b => b.date === tmrw));

        document.getElementById('svcMini').innerHTML = services.length
            ? `<ul class="b2b-info-list">${services.slice(0, 8).map(s => `<li>${esc(s.name)} <span class="b2b-cell-sub">· ${priceLabel(s)}</span></li>`).join('')}</ul>`
            : '<p class="b2b-cell-sub">Ni shranjenih storitev.</p>';
        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        document.getElementById('todayList').innerHTML = `<p>Napaka: ${err.message}</p>`;
    }
}

function renderDay(id, bookings) {
    const root = document.getElementById(id);
    if (!bookings.length) {
        root.innerHTML = `<div class="b2b-empty-small"><i data-lucide="calendar-x"></i><p>Ni rezervacij.</p></div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    const sorted = [...bookings].sort((a,b) => (a.time||'').localeCompare(b.time||''));
    root.innerHTML = sorted.map(b => `
        <div class="b2b-workshop-slot">
            <div class="b2b-workshop-time">${esc(b.time || '—')}</div>
            <div class="b2b-workshop-info">
                <strong>${esc(b.customerName || 'Stranka')}</strong>
                <span class="b2b-cell-sub">${esc(b.vehicleLabel || '')}</span>
                <span class="b2b-cell-sub">${esc(Array.isArray(b.services) ? b.services.join(', ') : b.serviceId || '—')}</span>
            </div>
            <div class="b2b-workshop-actions-cell">
                ${b.status === 'confirmed' ? `<button class="btn b2b-btn-primary btn-sm" data-complete="${b.id}"><i data-lucide="check"></i> Zaključi</button>` : ''}
                ${b.status === 'pending' ? `<button class="btn b2b-btn-secondary btn-sm" data-confirm="${b.id}"><i data-lucide="check-circle"></i> Potrdi</button>` : ''}
            </div>
        </div>
    `).join('');

    root.querySelectorAll('[data-complete]').forEach(btn => btn.addEventListener('click', async () => {
        try { await updateBookingStatus(btn.dataset.complete, 'completed'); location.reload(); } catch (e) { alert(e.message); }
    }));
    root.querySelectorAll('[data-confirm]').forEach(btn => btn.addEventListener('click', async () => {
        try { await updateBookingStatus(btn.dataset.confirm, 'confirmed'); location.reload(); } catch (e) { alert(e.message); }
    }));
    if (window.lucide) window.lucide.createIcons();
}

function priceLabel(s) {
    if (s.priceType === 'quote' || s.price == null) return 'Po ogledu';
    return (s.priceType === 'from' ? 'od ' : '') + s.price + ' €';
}
function today() { return new Date().toISOString().slice(0, 10); }
function offset(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
