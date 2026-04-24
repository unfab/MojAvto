// b2b-inventory.js — Dealer inventory (drafts, in-prep, ready, listed)
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { listInventory, saveInventoryItem, deleteInventoryItem } from '../services/b2bService.js';
import { hasRole } from '../core/b2bContext.js';

const STATUSES = [
    { key: 'draft',   label: 'Osnutek',     color: '#6b7280', bg: '#f3f4f6' },
    { key: 'prep',    label: 'V pripravi',  color: '#d97706', bg: '#fffbeb' },
    { key: 'ready',   label: 'Pripravljeno', color: '#0d9488', bg: '#f0fdfa' },
    { key: 'listed',  label: 'Objavljeno',  color: '#2563eb', bg: '#eff6ff' },
    { key: 'sold',    label: 'Prodano',     color: '#16a34a', bg: '#f0fdf4' },
];

export async function initB2bInventoryPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/zaloga', title: 'Zaloga vozil' });
    if (!main) return;
    if (!hasRole('dealer')) {
        main.innerHTML = `<div class="b2b-empty"><p>Ta sekcija je namenjena avtohišam/preprodajalcem.</p></div>`;
        return;
    }

    main.innerHTML = `
        <div class="b2b-toolbar">
            <div class="b2b-filters">
                <select id="invStatusFilter" class="b2b-select">
                    <option value="">Vsi statusi</option>
                    ${STATUSES.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
                </select>
            </div>
            <button id="addInvBtn" class="btn b2b-btn-primary"><i data-lucide="plus"></i> Dodaj vozilo</button>
        </div>

        <div class="b2b-kpi-row" id="invKpis"></div>

        <div id="invContent" class="b2b-card b2b-card-flush">
            <div class="b2b-loading"><i data-lucide="loader"></i> Nalagam zalogo…</div>
        </div>

        <div id="invDialog" class="b2b-dialog" hidden>
            <div class="b2b-dialog-card b2b-dialog-wide">
                <h3 id="invDlgTitle">Novo vozilo</h3>
                <form id="invForm" class="b2b-form">
                    <input type="hidden" name="id"/>
                    <div class="b2b-form-row">
                        <label>Znamka<input name="make" required/></label>
                        <label>Model<input name="model" required/></label>
                    </div>
                    <div class="b2b-form-row">
                        <label>VIN<input name="vin" maxlength="17" pattern="[A-HJ-NPR-Z0-9]{11,17}" placeholder="17-mestna oznaka"/></label>
                        <label>Letnik<input name="year" type="number" min="1950" max="2099"/></label>
                    </div>
                    <div class="b2b-form-row">
                        <label>Nabavna cena (€)<input name="purchasePrice" type="number" min="0" step="1"/></label>
                        <label>Ciljna prodajna cena (€)<input name="expectedPrice" type="number" min="0" step="1"/></label>
                    </div>
                    <div class="b2b-form-row">
                        <label>Vir nakupa<input name="source" placeholder="Dražba / Uvoz DE / Od stranke"/></label>
                        <label>Status<select name="status">${STATUSES.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}</select></label>
                    </div>
                    <label>Opombe<textarea name="notes" rows="3"></textarea></label>
                    <div class="b2b-dialog-actions">
                        <button type="button" class="btn b2b-btn-secondary" id="invCancel">Prekliči</button>
                        <button type="submit" class="btn b2b-btn-primary">Shrani</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    let _items = [];

    async function load() {
        const status = document.getElementById('invStatusFilter').value;
        try {
            _items = await listInventory(status || undefined);
            render();
        } catch (err) {
            document.getElementById('invContent').innerHTML = `<div class="b2b-empty"><p>Napaka: ${err.message}</p></div>`;
        }
    }

    function render() {
        // KPIs
        const byStatus = {};
        for (const s of STATUSES) byStatus[s.key] = 0;
        let totalInvested = 0, expectedRevenue = 0;
        for (const it of _items) {
            byStatus[it.status] = (byStatus[it.status] || 0) + 1;
            totalInvested += Number(it.purchasePrice) || 0;
            expectedRevenue += Number(it.expectedPrice) || 0;
        }
        document.getElementById('invKpis').innerHTML = `
            <div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#dbeafe;color:#2563eb"><i data-lucide="warehouse"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">Skupaj vozil</div><div class="b2b-kpi-value">${_items.length}</div></div></div>
            <div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#fef3c7;color:#d97706"><i data-lucide="hammer"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">V pripravi</div><div class="b2b-kpi-value">${byStatus.prep || 0}</div></div></div>
            <div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#dcfce7;color:#16a34a"><i data-lucide="check-circle"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">Objavljeno</div><div class="b2b-kpi-value">${byStatus.listed || 0}</div></div></div>
            <div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#e0e7ff;color:#4f46e5"><i data-lucide="trending-up"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">Pričakovana marža</div><div class="b2b-kpi-value">${fmtEur(expectedRevenue - totalInvested)}</div></div></div>
        `;
        if (window.lucide) window.lucide.createIcons();

        const root = document.getElementById('invContent');
        if (_items.length === 0) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="warehouse"></i><p>Zaloga je prazna.</p></div>`;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        root.innerHTML = `
            <table class="b2b-table">
                <thead><tr><th>Vozilo</th><th>VIN</th><th>Nabava</th><th>Cilj</th><th>Marža</th><th>Status</th><th></th></tr></thead>
                <tbody>
                    ${_items.map(it => {
                        const margin = (Number(it.expectedPrice)||0) - (Number(it.purchasePrice)||0);
                        const meta = STATUSES.find(s => s.key === it.status) || STATUSES[0];
                        return `
                        <tr>
                            <td>
                                <div class="b2b-cell-primary">${esc(it.make)} ${esc(it.model)}</div>
                                <div class="b2b-cell-sub">${it.year || '—'} · ${esc(it.source || '')}</div>
                            </td>
                            <td><code class="b2b-code">${esc(it.vin || '—')}</code></td>
                            <td>${fmtEur(it.purchasePrice)}</td>
                            <td>${fmtEur(it.expectedPrice)}</td>
                            <td style="color:${margin >= 0 ? '#16a34a' : '#dc2626'};font-weight:600;">${fmtEur(margin)}</td>
                            <td><span class="b2b-pill" style="background:${meta.bg};color:${meta.color};">${meta.label}</span></td>
                            <td class="b2b-cell-actions">
                                <button class="b2b-icon-btn" data-edit="${it.id}"><i data-lucide="edit"></i></button>
                                <button class="b2b-icon-btn danger" data-del="${it.id}"><i data-lucide="trash-2"></i></button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>`;
        root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
            const it = _items.find(x => x.id === btn.dataset.edit);
            if (it) openDialog(it);
        }));
        root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
            if (!confirm('Izbrisati vozilo iz zaloge?')) return;
            try { await deleteInventoryItem(btn.dataset.del); await load(); }
            catch (e) { alert(e.message); }
        }));
        if (window.lucide) window.lucide.createIcons();
    }

    function openDialog(it) {
        const form = document.getElementById('invForm');
        document.getElementById('invDlgTitle').textContent = it ? 'Uredi vozilo' : 'Novo vozilo';
        form.reset();
        form.id.value = it?.id || '';
        if (it) {
            for (const k of ['make','model','vin','year','purchasePrice','expectedPrice','source','status','notes']) {
                if (form[k]) form[k].value = it[k] ?? '';
            }
        } else {
            form.status.value = 'draft';
        }
        document.getElementById('invDialog').hidden = false;
    }

    document.getElementById('addInvBtn').addEventListener('click', () => openDialog());
    document.getElementById('invCancel').addEventListener('click', () => document.getElementById('invDialog').hidden = true);
    document.getElementById('invStatusFilter').addEventListener('change', load);
    document.getElementById('invForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            id: fd.get('id') || undefined,
            make: fd.get('make').trim(),
            model: fd.get('model').trim(),
            vin: fd.get('vin').trim().toUpperCase(),
            year: Number(fd.get('year')) || null,
            purchasePrice: Number(fd.get('purchasePrice')) || 0,
            expectedPrice: Number(fd.get('expectedPrice')) || 0,
            source: fd.get('source').trim(),
            status: fd.get('status'),
            notes: fd.get('notes').trim(),
        };
        if (!data.id) delete data.id;
        try {
            await saveInventoryItem(data);
            document.getElementById('invDialog').hidden = true;
            await load();
        } catch (err) { alert('Napaka: ' + err.message); }
    });

    load();
}

function fmtEur(n) {
    return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
