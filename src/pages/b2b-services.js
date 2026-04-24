// b2b-services.js — CRUD for business services & pricing
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { listServices, saveService, deleteService } from '../services/b2bService.js';
import { SERVICE_ICONS, findIcon, groupedIcons } from '../data/serviceIcons.js';

const CATEGORIES = ['Servis', 'Pnevmatike', 'Diagnostika', 'Avtoličarstvo', 'Pranje', 'Drugo'];

export async function initB2bServicesPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/storitve', title: 'Storitve in cenik' });
    if (!main) return;

    main.innerHTML = `
        <div class="b2b-toolbar">
            <p class="b2b-hint">Storitve, ki jih tukaj vnesete, se samodejno prikažejo na vašem javnem profilu.</p>
            <button id="addServiceBtn" class="btn b2b-btn-primary"><i data-lucide="plus"></i> Nova storitev</button>
        </div>

        <div id="servicesContent" class="b2b-card b2b-card-flush">
            <div class="b2b-loading"><i data-lucide="loader"></i> Nalagam…</div>
        </div>

        <div id="serviceDialog" class="b2b-dialog" hidden>
            <div class="b2b-dialog-card b2b-dialog-wide">
                <h3 id="svcDlgTitle">Nova storitev</h3>
                <form id="svcForm" class="b2b-form">
                    <input type="hidden" name="id"/>
                    <input type="hidden" name="iconId"/>

                    <label>Ikona
                        <button type="button" id="iconPickerBtn" class="b2b-icon-pick-btn">
                            <span class="b2b-icon-pick-current" id="iconPickCurrent">
                                <i data-lucide="wrench"></i>
                            </span>
                            <span class="b2b-icon-pick-label" id="iconPickLabel">Izberi ikono…</span>
                            <i data-lucide="chevron-down" style="margin-left:auto;opacity:0.5;"></i>
                        </button>
                    </label>

                    <label>Ime storitve<input name="name" required placeholder="Menjava olja"/></label>

                    <div class="b2b-form-row">
                        <label>Kategorija<select name="category">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label>
                        <label>Trajanje (min)<input name="duration" type="number" min="5" step="5" placeholder="30"/></label>
                    </div>
                    <div class="b2b-form-row">
                        <label>Cena (€)<input name="price" type="number" min="0" step="0.01" placeholder="49.90"/></label>
                        <label>Tip<select name="priceType"><option value="fixed">Fiksna</option><option value="from">Od …</option><option value="quote">Po ogledu</option></select></label>
                    </div>
                    <label>Opis (neobvezno)<textarea name="description" rows="3"></textarea></label>

                    <div class="b2b-dialog-actions">
                        <button type="button" class="btn b2b-btn-secondary" id="svcCancel">Prekliči</button>
                        <button type="submit" class="btn b2b-btn-primary">Shrani</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Icon picker dialog -->
        <div id="iconDialog" class="b2b-dialog" hidden>
            <div class="b2b-dialog-card b2b-dialog-wide">
                <h3>Izberi ikono</h3>
                <input type="text" id="iconSearch" class="b2b-input" placeholder="Išči ikono…" style="width:100%;margin-bottom:1rem;"/>
                <div id="iconGrid" class="b2b-icon-grid-wrap"></div>
                <div class="b2b-dialog-actions">
                    <button type="button" class="btn b2b-btn-secondary" id="iconDialogClose">Zapri</button>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    let _services = [];
    let _pickedIcon = null;

    async function load() {
        try {
            _services = await listServices();
            render();
        } catch (err) {
            document.getElementById('servicesContent').innerHTML =
                `<div class="b2b-empty"><p>Napaka: ${err.message}</p></div>`;
        }
    }

    function render() {
        const root = document.getElementById('servicesContent');
        if (_services.length === 0) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="tag"></i><p>Še nimate storitev.</p><button class="btn b2b-btn-primary" id="emptyAdd">Dodaj prvo storitev</button></div>`;
            document.getElementById('emptyAdd').addEventListener('click', () => openDialog());
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        const grouped = {};
        for (const s of _services) {
            const c = s.category || 'Drugo';
            (grouped[c] = grouped[c] || []).push(s);
        }

        root.innerHTML = Object.entries(grouped).map(([cat, items]) => `
            <div class="b2b-group">
                <h3 class="b2b-group-title">${cat}</h3>
                <table class="b2b-table">
                    <thead><tr><th style="width:60px;"></th><th>Ime</th><th>Trajanje</th><th>Cena</th><th></th></tr></thead>
                    <tbody>
                        ${items.map(s => `
                            <tr>
                                <td><div class="b2b-svc-icon"><i data-lucide="${s.icon || 'wrench'}"></i></div></td>
                                <td>
                                    <div class="b2b-cell-primary">${esc(s.name)}</div>
                                    ${s.description ? `<div class="b2b-cell-sub">${esc(s.description)}</div>` : ''}
                                </td>
                                <td>${s.duration ? s.duration + ' min' : '—'}</td>
                                <td>${priceLabel(s)}</td>
                                <td class="b2b-cell-actions">
                                    <button class="b2b-icon-btn" data-edit="${s.id}" title="Uredi"><i data-lucide="edit"></i></button>
                                    <button class="b2b-icon-btn danger" data-del="${s.id}" title="Izbriši"><i data-lucide="trash-2"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');

        root.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = _services.find(x => x.id === btn.dataset.edit);
                if (s) openDialog(s);
            });
        });
        root.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Izbrisati to storitev?')) return;
                try { await deleteService(btn.dataset.del); await load(); }
                catch (e) { alert(e.message); }
            });
        });
        if (window.lucide) window.lucide.createIcons();
    }

    function setPickedIcon(iconPack) {
        _pickedIcon = iconPack;
        const form = document.getElementById('svcForm');
        form.iconId.value = iconPack?.id || '';
        const cur = document.getElementById('iconPickCurrent');
        const lbl = document.getElementById('iconPickLabel');
        if (iconPack) {
            cur.innerHTML = `<i data-lucide="${iconPack.icon}"></i>`;
            lbl.textContent = iconPack.name;
        } else {
            cur.innerHTML = `<i data-lucide="wrench"></i>`;
            lbl.textContent = 'Izberi ikono…';
        }
        if (window.lucide) window.lucide.createIcons();
    }

    function openDialog(service) {
        const dlg = document.getElementById('serviceDialog');
        const form = document.getElementById('svcForm');
        document.getElementById('svcDlgTitle').textContent = service ? 'Uredi storitev' : 'Nova storitev';
        form.reset();
        form.id.value = service?.id || '';

        if (service) {
            form.name.value = service.name || '';
            form.category.value = service.category || CATEGORIES[0];
            form.duration.value = service.duration || '';
            form.price.value = service.price ?? '';
            form.priceType.value = service.priceType || 'fixed';
            form.description.value = service.description || '';
            setPickedIcon(service.iconId ? findIcon(service.iconId) : null);
        } else {
            setPickedIcon(null);
        }
        dlg.hidden = false;
    }

    function closeDialog() {
        document.getElementById('serviceDialog').hidden = true;
    }

    // ── Icon picker ────────────────────────────────────────────────────
    function openIconPicker() {
        document.getElementById('iconDialog').hidden = false;
        renderIconGrid('');
        document.getElementById('iconSearch').value = '';
        document.getElementById('iconSearch').focus();
    }
    function closeIconPicker() {
        document.getElementById('iconDialog').hidden = true;
    }
    function renderIconGrid(term) {
        const root = document.getElementById('iconGrid');
        const q = (term || '').toLowerCase().trim();
        const groups = groupedIcons();
        root.innerHTML = Object.entries(groups).map(([group, items]) => {
            const filtered = items.filter(i => !q
                || i.name.toLowerCase().includes(q)
                || i.icon.toLowerCase().includes(q));
            if (!filtered.length) return '';
            return `
                <div class="b2b-icon-grid-group">
                    <h4>${group}</h4>
                    <div class="b2b-icon-grid">
                        ${filtered.map(i => `
                            <button type="button" class="b2b-icon-tile ${_pickedIcon?.id === i.id ? 'active' : ''}" data-pick="${i.id}" title="${esc(i.name)}">
                                <i data-lucide="${i.icon}"></i>
                                <span>${esc(i.name)}</span>
                            </button>`).join('')}
                    </div>
                </div>`;
        }).join('') || `<p class="b2b-hint">Ni zadetkov za "${esc(term)}".</p>`;

        root.querySelectorAll('[data-pick]').forEach(btn => {
            btn.addEventListener('click', () => {
                setPickedIcon(findIcon(btn.dataset.pick));
                closeIconPicker();
            });
        });
        if (window.lucide) window.lucide.createIcons();
    }

    document.getElementById('iconPickerBtn').addEventListener('click', openIconPicker);
    document.getElementById('iconDialogClose').addEventListener('click', closeIconPicker);
    document.getElementById('iconSearch').addEventListener('input', (e) => renderIconGrid(e.target.value));

    document.getElementById('addServiceBtn').addEventListener('click', () => openDialog());
    document.getElementById('svcCancel').addEventListener('click', closeDialog);
    document.getElementById('svcForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const iconId = fd.get('iconId') || '';
        const iconPack = iconId ? findIcon(iconId) : null;
        const data = {
            id: fd.get('id') || undefined,
            name: fd.get('name').trim(),
            category: fd.get('category'),
            duration: Number(fd.get('duration')) || null,
            price: fd.get('priceType') === 'quote' ? null : Number(fd.get('price')),
            priceType: fd.get('priceType'),
            description: fd.get('description').trim(),
            iconId: iconPack?.id || '',
            icon: iconPack?.icon || 'wrench',
        };
        if (!data.id) delete data.id;
        try {
            await saveService(data);
            closeDialog();
            await load();
        } catch (err) {
            alert('Napaka: ' + err.message);
        }
    });

    load();
}

function priceLabel(s) {
    if (s.priceType === 'quote' || s.price == null) return 'Po ogledu';
    const val = Number(s.price).toFixed(2).replace(/\.00$/, '') + ' €';
    return s.priceType === 'from' ? `od ${val}` : val;
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
