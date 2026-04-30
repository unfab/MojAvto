// b2b-reservations.js — Provider-side booking management
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { listMyBookings, updateBookingStatus, blockSlot, listPendingTireOrders, confirmTireOrderReceival } from '../services/b2bService.js';

const STATUS_META = {
    pending:   { label: 'Čaka potrditve', color: '#d97706', bg: '#fffbeb' },
    confirmed: { label: 'Potrjeno',       color: '#2563eb', bg: '#eff6ff' },
    completed: { label: 'Zaključeno',     color: '#16a34a', bg: '#f0fdf4' },
    cancelled: { label: 'Preklicano',     color: '#dc2626', bg: '#fef2f2' },
    blocked:   { label: 'Blokiran termin', color: '#6b7280', bg: '#f3f4f6' },
};

export async function initB2bReservationsPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/rezervacije', title: 'Rezervacije' });
    if (!main) return;

    const urlStatus = new URLSearchParams((location.hash.split('?')[1] || '')).get('status') || '';

    main.innerHTML = `
        <div class="b2b-tabs" id="b2bResTabs">
            <button class="b2b-tab active" data-tab="bookings">
                <i data-lucide="calendar-check"></i> Rezervacije
            </button>
            <button class="b2b-tab" data-tab="tire-orders">
                <i data-lucide="package"></i> Naročila gum
                <span class="b2b-tab-badge" id="tireOrderBadge" style="display:none;">0</span>
            </button>
        </div>

        <div id="panelBookings">
            <div class="b2b-toolbar">
                <div class="b2b-filters">
                    <select id="resStatusFilter" class="b2b-select">
                        <option value="">Vsi statusi</option>
                        ${Object.entries(STATUS_META).map(([k, v]) => `<option value="${k}" ${k === urlStatus ? 'selected' : ''}>${v.label}</option>`).join('')}
                    </select>
                    <div class="b2b-view-toggle">
                        <button class="b2b-view-btn active" data-view="list"><i data-lucide="list"></i> Seznam</button>
                        <button class="b2b-view-btn" data-view="calendar"><i data-lucide="calendar"></i> Koledar</button>
                    </div>
                </div>
                <button id="blockSlotBtn" class="btn b2b-btn-secondary"><i data-lucide="ban"></i> Blokiraj termin</button>
            </div>
            <div id="resContent" class="b2b-card b2b-card-flush">
                <div class="b2b-loading"><i data-lucide="loader"></i> Nalagam rezervacije…</div>
            </div>
        </div>

        <div id="panelTireOrders" style="display:none;">
            <div id="tireOrdersContent" class="b2b-card b2b-card-flush">
                <div class="b2b-loading"><i data-lucide="loader"></i> Nalagam naročila…</div>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    let _all = [];
    let _view = 'list';

    async function load() {
        const statusEl = document.getElementById('resStatusFilter');
        const status = statusEl?.value || '';
        try {
            _all = await listMyBookings(status ? { status } : {});
            render();
        } catch (err) {
            document.getElementById('resContent').innerHTML =
                `<div class="b2b-empty"><i data-lucide="alert-triangle"></i><p>Napaka: ${err.message}</p></div>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    function render() {
        const root = document.getElementById('resContent');
        if (_all.length === 0) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="calendar-x"></i><p>Ni rezervacij za izbran filter.</p></div>`;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        if (_view === 'calendar') root.innerHTML = renderCalendar(_all);
        else root.innerHTML = renderList(_all);
        bindRowActions(root);
        if (window.lucide) window.lucide.createIcons();
    }

    document.getElementById('resStatusFilter').addEventListener('change', load);
    document.querySelectorAll('.b2b-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.b2b-view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _view = btn.dataset.view;
            render();
        });
    });
    document.getElementById('blockSlotBtn').addEventListener('click', openBlockDialog);

    // Tab switching
    document.querySelectorAll('.b2b-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.b2b-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const which = tab.dataset.tab;
            document.getElementById('panelBookings').style.display = which === 'bookings' ? '' : 'none';
            document.getElementById('panelTireOrders').style.display = which === 'tire-orders' ? '' : 'none';
            if (which === 'tire-orders') loadTireOrders();
        });
    });

    load();
    loadTireOrdersBadge();

    async function loadTireOrders() {
        const root = document.getElementById('tireOrdersContent');
        root.innerHTML = `<div class="b2b-loading"><i data-lucide="loader"></i> Nalagam naročila…</div>`;
        if (window.lucide) window.lucide.createIcons();
        try {
            const orders = await listPendingTireOrders();
            const badge = document.getElementById('tireOrderBadge');
            if (badge) {
                badge.textContent = orders.length;
                badge.style.display = orders.length ? 'inline-flex' : 'none';
            }
            if (orders.length === 0) {
                root.innerHTML = `<div class="b2b-empty"><i data-lucide="package"></i><p>Ni čakajočih naročil gum.</p></div>`;
                if (window.lucide) window.lucide.createIcons();
                return;
            }
            root.innerHTML = `<div class="b2b-tire-orders-list">${orders.map(renderTireOrderCard).join('')}</div>`;
            bindTireOrderActions(root);
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="alert-triangle"></i><p>Napaka: ${esc(err.message)}</p></div>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    async function loadTireOrdersBadge() {
        try {
            const orders = await listPendingTireOrders();
            const badge = document.getElementById('tireOrderBadge');
            if (badge && orders.length > 0) {
                badge.textContent = orders.length;
                badge.style.display = 'inline-flex';
            }
        } catch (_) {}
    }

    function bindTireOrderActions(root) {
        root.querySelectorAll('.b2b-confirm-tire-order').forEach(btn => {
            btn.addEventListener('click', async () => {
                const orderId = btn.dataset.orderId;
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader"></i> Potrjujem...';
                if (window.lucide) window.lucide.createIcons();
                try {
                    await confirmTireOrderReceival(orderId);
                    const card = btn.closest('.b2b-tire-order-card');
                    card.innerHTML = `
                        <div class="b2b-tire-order-confirmed">
                            <i data-lucide="check-circle" style="color:#16a34a;width:20px;height:20px;"></i>
                            <div>
                                <strong>Sprejem potrjen!</strong><br>
                                <span style="font-size:0.82rem;color:#475569;">Kupec bo prejel SMS z linkom za rezervacijo termina.</span>
                            </div>
                        </div>`;
                    if (window.lucide) window.lucide.createIcons();
                } catch (err) {
                    alert('Napaka: ' + err.message);
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="check-circle"></i> Potrdi sprejem';
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        });
    }

    async function openBlockDialog() {
        const date = prompt('Datum (YYYY-MM-DD):');
        if (!date) return;
        const time = prompt('Ura (HH:MM), lahko prazno za cel dan:') || 'cel dan';
        const reason = prompt('Opomba (neobvezno):') || '';
        try {
            await blockSlot(date, time, reason);
            await load();
        } catch (err) {
            alert('Napaka: ' + err.message);
        }
    }

    function bindRowActions(root) {
        root.querySelectorAll('[data-action="status"]').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const newStatus = e.target.value;
                sel.disabled = true;
                try {
                    await updateBookingStatus(id, newStatus);
                    await load();
                } catch (err) {
                    alert('Napaka: ' + err.message);
                    sel.disabled = false;
                }
            });
        });
    }
}

function renderList(bookings) {
    return `
        <table class="b2b-table">
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Ura</th>
                    <th>Stranka</th>
                    <th>Storitev</th>
                    <th>Znesek</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${bookings.map(b => rowHtml(b)).join('')}
            </tbody>
        </table>`;
}

function rowHtml(b) {
    const meta = STATUS_META[b.status] || { label: b.status, color: '#64748b', bg: '#f1f5f9' };
    const services = Array.isArray(b.services) ? b.services.join(', ') : (b.serviceId || '—');
    return `
        <tr>
            <td>${esc(b.date || '—')}</td>
            <td>${esc(b.time || '—')}</td>
            <td>
                <div class="b2b-cell-primary">${esc(b.customerName || b.customerId || 'Anonimno')}</div>
                <div class="b2b-cell-sub">${esc(b.customerContact || '')}</div>
            </td>
            <td>${esc(services)}</td>
            <td>${b.totalPrice ? b.totalPrice + ' €' : '—'}</td>
            <td>
                <select class="b2b-status-select" data-action="status" data-id="${b.id}" style="background:${meta.bg};color:${meta.color};">
                    ${Object.entries(STATUS_META).map(([k, v]) => `<option value="${k}" ${k === b.status ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select>
            </td>
            <td>${b.notes ? `<span title="${esc(b.notes)}"><i data-lucide="message-square"></i></span>` : ''}</td>
        </tr>`;
}

function renderCalendar(bookings) {
    // Group by date
    const grouped = {};
    for (const b of bookings) {
        const d = b.date || 'nedoločen';
        (grouped[d] = grouped[d] || []).push(b);
    }
    const dates = Object.keys(grouped).sort();
    return `
        <div class="b2b-calendar">
            ${dates.map(d => `
                <div class="b2b-calendar-day">
                    <div class="b2b-calendar-date">${d}</div>
                    <div class="b2b-calendar-slots">
                        ${grouped[d].sort((a,b) => (a.time||'').localeCompare(b.time||'')).map(b => {
                            const meta = STATUS_META[b.status] || { label: b.status, color: '#64748b', bg: '#f1f5f9' };
                            return `
                            <div class="b2b-cal-slot" style="border-left:4px solid ${meta.color};background:${meta.bg};">
                                <div><strong>${esc(b.time || 'cel dan')}</strong> · ${esc(b.customerName || '—')}</div>
                                <div class="b2b-cell-sub">${esc(Array.isArray(b.services) ? b.services.join(', ') : b.serviceId || '')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTireOrderCard(order) {
    const td = order.tireData || {};
    const submittedLabel = order.submittedAt?.toDate
        ? order.submittedAt.toDate().toLocaleString('sl-SI')
        : '—';
    return `
        <div class="b2b-tire-order-card" data-order-id="${order.id}">
            <div class="b2b-tire-order-header">
                <div class="b2b-tire-order-title">
                    <i data-lucide="circle-dot" style="color:#2563eb;width:16px;height:16px;"></i>
                    <strong>${esc(td.brand)} ${esc(td.model)}</strong>
                    &mdash; ${esc(td.dimension)} &times; ${td.quantity || '?'} kos
                </div>
                <div class="b2b-tire-order-time">
                    <i data-lucide="clock" style="width:12px;height:12px;"></i>
                    ${esc(submittedLabel)}
                </div>
            </div>
            <div class="b2b-tire-order-meta">
                <span>Kupec: ${esc(order.buyerId)}</span>
                <span>Pričakovana dostava: <strong>${esc(order.estimatedDeliveryDate || '—')}</strong></span>
            </div>
            <div class="b2b-tire-order-banner">
                <i data-lucide="truck" style="width:14px;height:14px;"></i>
                Gume bodo dostavljene na vaš naslov.
            </div>
            <button class="btn b2b-btn-primary b2b-confirm-tire-order" data-order-id="${order.id}">
                <i data-lucide="check-circle"></i> Potrdi sprejem
            </button>
        </div>
    `;
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
