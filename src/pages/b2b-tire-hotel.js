// b2b-tire-hotel.js — Tire storage warehouse system (Hotel za gume)
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { listTireStorage, saveTireStorage, deleteTireStorageItem } from '../services/b2bService.js';
import { hasRole } from '../core/b2bContext.js';

const SEASON = [
    { key: 'summer',     label: 'Poletne' },
    { key: 'winter',     label: 'Zimske' },
    { key: 'all_season', label: 'Cel.let.' },
];

export async function initB2bTireHotelPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/hotel-gum', title: 'Hotel za gume' });
    if (!main) return;
    if (!hasRole('vulcanizer')) {
        main.innerHTML = `<div class="b2b-empty"><p>Hotel za gume je namenjen vulkanizerjem.</p></div>`;
        return;
    }

    main.innerHTML = `
        <div class="b2b-toolbar">
            <div class="b2b-filters">
                <input id="tireSearch" class="b2b-input" placeholder="Išči po imenu, telefonu, dimenziji…"/>
                <select id="tireStatusFilter" class="b2b-select">
                    <option value="stored">V hrambi</option>
                    <option value="picked_up">Prevzeto</option>
                    <option value="">Vse</option>
                </select>
            </div>
            <button id="addTireBtn" class="btn b2b-btn-primary"><i data-lucide="plus"></i> Nov vnos</button>
        </div>

        <div class="b2b-kpi-row" id="tireKpis"></div>

        <div id="tireContent" class="b2b-card b2b-card-flush">
            <div class="b2b-loading"><i data-lucide="loader"></i> Nalagam…</div>
        </div>

        <div id="tireDialog" class="b2b-dialog" hidden>
            <div class="b2b-dialog-card b2b-dialog-wide">
                <h3 id="tireDlgTitle">Nov vnos gum</h3>
                <form id="tireForm" class="b2b-form">
                    <input type="hidden" name="id"/>
                    <fieldset>
                        <legend>Stranka</legend>
                        <div class="b2b-form-row">
                            <label>Ime in priimek<input name="customerName" required/></label>
                            <label>Telefon<input name="customerContact" required placeholder="+386…"/></label>
                        </div>
                        <label>Registrska / vozilo<input name="vehicleLabel" placeholder="LJ ABC-123, Škoda Octavia"/></label>
                    </fieldset>

                    <fieldset>
                        <legend>Gume</legend>
                        <div class="b2b-form-row">
                            <label>Dimenzija<input name="tireSize" required placeholder="205/55 R16"/></label>
                            <label>Sezona<select name="season">${SEASON.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}</select></label>
                        </div>
                        <div class="b2b-form-row">
                            <label>Število kosov<input name="quantity" type="number" min="1" max="8" value="4"/></label>
                            <label>DOT (teden/leto)<input name="dot" placeholder="2223"/></label>
                            <label>Globina (mm)<input name="treadDepth" type="number" step="0.5" min="0" max="15"/></label>
                        </div>
                        <label>Platišča?<select name="hasRims"><option value="false">Samo gume</option><option value="true">Z jeklenimi platišči</option><option value="alloy">Z alu platišči</option></select></label>
                    </fieldset>

                    <fieldset>
                        <legend>Lokacija v skladišču</legend>
                        <div class="b2b-form-row">
                            <label>Regal<input name="rack" placeholder="A"/></label>
                            <label>Polica<input name="shelf" placeholder="3"/></label>
                            <label>Pozicija<input name="position" placeholder="12"/></label>
                        </div>
                    </fieldset>

                    <label>Opombe<textarea name="notes" rows="2"></textarea></label>

                    <div class="b2b-dialog-actions">
                        <button type="button" class="btn b2b-btn-secondary" id="tireCancel">Prekliči</button>
                        <button type="submit" class="btn b2b-btn-primary">Shrani</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    let _items = [];

    async function load() {
        const status = document.getElementById('tireStatusFilter').value;
        try {
            _items = await listTireStorage(status || undefined);
            render();
        } catch (err) {
            document.getElementById('tireContent').innerHTML = `<div class="b2b-empty"><p>Napaka: ${err.message}</p></div>`;
        }
    }

    function render() {
        const term = (document.getElementById('tireSearch').value || '').toLowerCase();
        const filtered = _items.filter(i => !term
            || i.customerName?.toLowerCase().includes(term)
            || i.customerContact?.toLowerCase().includes(term)
            || i.tireSize?.toLowerCase().includes(term)
            || i.vehicleLabel?.toLowerCase().includes(term));

        // KPIs
        const stored = _items.filter(i => i.status === 'stored').length;
        const picked = _items.filter(i => i.status === 'picked_up').length;
        const seasonCounts = SEASON.map(s => ({
            ...s,
            count: _items.filter(i => i.status === 'stored' && i.season === s.key).length
        }));
        document.getElementById('tireKpis').innerHTML = `
            <div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#e0f2fe;color:#0284c7"><i data-lucide="archive"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">V hrambi</div><div class="b2b-kpi-value">${stored}</div></div></div>
            <div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#dcfce7;color:#16a34a"><i data-lucide="check"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">Prevzeto</div><div class="b2b-kpi-value">${picked}</div></div></div>
            ${seasonCounts.map(s => `<div class="b2b-kpi"><div class="b2b-kpi-icon" style="background:#fef3c7;color:#d97706"><i data-lucide="circle-dot"></i></div><div class="b2b-kpi-body"><div class="b2b-kpi-label">${s.label}</div><div class="b2b-kpi-value">${s.count}</div></div></div>`).join('')}
        `;
        if (window.lucide) window.lucide.createIcons();

        const root = document.getElementById('tireContent');
        if (!filtered.length) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="archive"></i><p>Ni zapisov.</p></div>`;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        root.innerHTML = `
            <table class="b2b-table">
                <thead>
                    <tr>
                        <th>Stranka</th>
                        <th>Vozilo</th>
                        <th>Gume</th>
                        <th>Lokacija</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(i => {
                        const loc = [i.storageLocation?.rack, i.storageLocation?.shelf, i.storageLocation?.position].filter(Boolean).join(' · ') || '—';
                        const seasonMeta = SEASON.find(s => s.key === i.season)?.label || '—';
                        return `
                        <tr class="${i.status === 'picked_up' ? 'b2b-row-faded' : ''}">
                            <td>
                                <div class="b2b-cell-primary">${esc(i.customerName)}</div>
                                <div class="b2b-cell-sub"><a href="tel:${esc(i.customerContact)}">${esc(i.customerContact)}</a></div>
                            </td>
                            <td>${esc(i.vehicleLabel || '—')}</td>
                            <td>
                                <div>${esc(i.tireSize)} · ${i.quantity || 4} kos</div>
                                <div class="b2b-cell-sub">${seasonMeta} ${i.dot ? '· DOT ' + esc(i.dot) : ''} ${i.treadDepth ? '· ' + i.treadDepth + ' mm' : ''}</div>
                            </td>
                            <td><code class="b2b-code">${esc(loc)}</code></td>
                            <td>
                                ${i.status === 'stored'
                                    ? `<span class="b2b-pill" style="background:#e0f2fe;color:#0284c7;">V hrambi</span>`
                                    : `<span class="b2b-pill" style="background:#dcfce7;color:#16a34a;">Prevzeto</span>`}
                            </td>
                            <td class="b2b-cell-actions">
                                ${i.status === 'stored'
                                    ? `<button class="b2b-icon-btn" data-pickup="${i.id}" title="Prevzem"><i data-lucide="check-circle"></i></button>`
                                    : `<button class="b2b-icon-btn" data-restore="${i.id}" title="Vrni v hrambo"><i data-lucide="rotate-ccw"></i></button>`}
                                <button class="b2b-icon-btn" data-edit="${i.id}"><i data-lucide="edit"></i></button>
                                <button class="b2b-icon-btn danger" data-del="${i.id}"><i data-lucide="trash-2"></i></button>
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
            if (!confirm('Izbrisati zapis?')) return;
            try { await deleteTireStorageItem(btn.dataset.del); await load(); }
            catch (e) { alert(e.message); }
        }));
        root.querySelectorAll('[data-pickup]').forEach(btn => btn.addEventListener('click', async () => {
            const it = _items.find(x => x.id === btn.dataset.pickup);
            if (!it) return;
            try { await saveTireStorage({ ...it, status: 'picked_up', pickedUpAt: new Date().toISOString() }); await load(); }
            catch (e) { alert(e.message); }
        }));
        root.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', async () => {
            const it = _items.find(x => x.id === btn.dataset.restore);
            if (!it) return;
            try { await saveTireStorage({ ...it, status: 'stored', pickedUpAt: null }); await load(); }
            catch (e) { alert(e.message); }
        }));
        if (window.lucide) window.lucide.createIcons();
    }

    function openDialog(it) {
        const form = document.getElementById('tireForm');
        document.getElementById('tireDlgTitle').textContent = it ? 'Uredi vnos' : 'Nov vnos gum';
        form.reset();
        form.id.value = it?.id || '';
        if (it) {
            form.customerName.value = it.customerName || '';
            form.customerContact.value = it.customerContact || '';
            form.vehicleLabel.value = it.vehicleLabel || '';
            form.tireSize.value = it.tireSize || '';
            form.season.value = it.season || 'summer';
            form.quantity.value = it.quantity || 4;
            form.dot.value = it.dot || '';
            form.treadDepth.value = it.treadDepth || '';
            form.hasRims.value = String(it.hasRims ?? 'false');
            form.rack.value = it.storageLocation?.rack || '';
            form.shelf.value = it.storageLocation?.shelf || '';
            form.position.value = it.storageLocation?.position || '';
            form.notes.value = it.notes || '';
        }
        document.getElementById('tireDialog').hidden = false;
    }

    document.getElementById('addTireBtn').addEventListener('click', () => openDialog());
    document.getElementById('tireCancel').addEventListener('click', () => document.getElementById('tireDialog').hidden = true);
    document.getElementById('tireStatusFilter').addEventListener('change', load);
    document.getElementById('tireSearch').addEventListener('input', render);
    document.getElementById('tireForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            id: fd.get('id') || undefined,
            customerName: fd.get('customerName').trim(),
            customerContact: fd.get('customerContact').trim(),
            vehicleLabel: fd.get('vehicleLabel').trim(),
            tireSize: fd.get('tireSize').trim(),
            season: fd.get('season'),
            quantity: Number(fd.get('quantity')) || 4,
            dot: fd.get('dot').trim(),
            treadDepth: Number(fd.get('treadDepth')) || null,
            hasRims: fd.get('hasRims'),
            storageLocation: {
                rack: fd.get('rack').trim(),
                shelf: fd.get('shelf').trim(),
                position: fd.get('position').trim(),
            },
            notes: fd.get('notes').trim(),
            status: 'stored',
        };
        if (!data.id) delete data.id;
        try {
            await saveTireStorage(data);
            document.getElementById('tireDialog').hidden = true;
            await load();
        } catch (err) { alert('Napaka: ' + err.message); }
    });

    load();
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
