// b2b-leads.js — Lead inbox CRM for dealers
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { listLeads, updateLead } from '../services/b2bService.js';
import { hasRole } from '../core/b2bContext.js';

const LEAD_STATUS = [
    { key: 'new',       label: 'Novo',     color: '#2563eb', bg: '#eff6ff' },
    { key: 'contacted', label: 'Kontaktirano', color: '#d97706', bg: '#fffbeb' },
    { key: 'meeting',   label: 'Ogled dogovorjen', color: '#7c3aed', bg: '#f5f3ff' },
    { key: 'closed',    label: 'Zaključeno', color: '#16a34a', bg: '#f0fdf4' },
    { key: 'lost',      label: 'Izgubljeno', color: '#dc2626', bg: '#fef2f2' },
];

export async function initB2bLeadsPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/leads', title: 'Povpraševanja' });
    if (!main) return;
    if (!hasRole('dealer')) {
        main.innerHTML = `<div class="b2b-empty"><p>Ta sekcija je namenjena avtohišam/preprodajalcem.</p></div>`;
        return;
    }

    main.innerHTML = `
        <div class="b2b-inbox">
            <aside class="b2b-inbox-list">
                <div class="b2b-inbox-filters">
                    <select id="leadStatusFilter" class="b2b-select">
                        <option value="">Vsi</option>
                        ${LEAD_STATUS.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
                    </select>
                </div>
                <div id="leadList" class="b2b-inbox-items">
                    <div class="b2b-loading"><i data-lucide="loader"></i> Nalagam…</div>
                </div>
            </aside>
            <section class="b2b-inbox-detail" id="leadDetail">
                <div class="b2b-empty"><i data-lucide="inbox"></i><p>Izberite povpraševanje.</p></div>
            </section>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    let _leads = [];
    let _selected = null;

    async function load() {
        const status = document.getElementById('leadStatusFilter').value;
        try {
            _leads = await listLeads(status || undefined);
            renderList();
            if (_leads.length && !_selected) select(_leads[0].id);
            else if (!_leads.length) _selected = null, renderDetail();
        } catch (err) {
            document.getElementById('leadList').innerHTML = `<div class="b2b-empty"><p>Napaka: ${err.message}</p></div>`;
        }
    }

    function renderList() {
        const root = document.getElementById('leadList');
        if (!_leads.length) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="inbox"></i><p>Trenutno ni povpraševanj.</p></div>`;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        root.innerHTML = _leads.map(l => {
            const meta = LEAD_STATUS.find(s => s.key === l.status) || LEAD_STATUS[0];
            return `
                <button class="b2b-inbox-item ${_selected === l.id ? 'active' : ''}" data-id="${l.id}">
                    <div class="b2b-inbox-item-head">
                        <span class="b2b-inbox-name">${esc(l.customerName || 'Anonimno')}</span>
                        <span class="b2b-pill" style="background:${meta.bg};color:${meta.color};">${meta.label}</span>
                    </div>
                    <div class="b2b-inbox-sub">${esc(l.vehicleLabel || l.vehicleId || '—')}</div>
                    <div class="b2b-inbox-preview">${esc((l.message || '').slice(0, 80))}</div>
                </button>`;
        }).join('');
        root.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => select(btn.dataset.id)));
    }

    function select(id) {
        _selected = id;
        renderList();
        renderDetail();
    }

    function renderDetail() {
        const root = document.getElementById('leadDetail');
        const l = _leads.find(x => x.id === _selected);
        if (!l) {
            root.innerHTML = `<div class="b2b-empty"><i data-lucide="inbox"></i><p>Izberite povpraševanje.</p></div>`;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        root.innerHTML = `
            <header class="b2b-inbox-head">
                <div>
                    <h3>${esc(l.customerName || 'Anonimno')}</h3>
                    <p class="b2b-cell-sub">${esc(l.customerContact || '—')}</p>
                </div>
                <select id="leadStatus" class="b2b-status-select">
                    ${LEAD_STATUS.map(s => `<option value="${s.key}" ${s.key === l.status ? 'selected' : ''}>${s.label}</option>`).join('')}
                </select>
            </header>

            <dl class="b2b-kv">
                <dt>Vozilo</dt><dd>${esc(l.vehicleLabel || l.vehicleId || '—')}</dd>
                <dt>Prejeto</dt><dd>${l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleString('sl-SI') : '—'}</dd>
            </dl>

            <div class="b2b-msg">
                <h4>Sporočilo stranke</h4>
                <p>${esc(l.message || '—')}</p>
            </div>

            <div class="b2b-reply">
                <h4>Hitri odgovor</h4>
                <textarea id="replyBox" rows="4" placeholder="Odgovor stranki…">${esc(l.replyDraft || '')}</textarea>
                <div class="b2b-dialog-actions">
                    <button class="btn b2b-btn-secondary" id="saveDraft">Shrani osnutek</button>
                    <a class="btn b2b-btn-primary" id="sendMail" href="mailto:${esc(l.customerContact || '')}?subject=Odgovor na vaše povpraševanje&body=" target="_blank"><i data-lucide="mail"></i> Pošlji po e-pošti</a>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('leadStatus').addEventListener('change', async (e) => {
            try { await updateLead(l.id, { status: e.target.value }); await load(); }
            catch (err) { alert(err.message); }
        });
        document.getElementById('saveDraft').addEventListener('click', async () => {
            try { await updateLead(l.id, { replyDraft: document.getElementById('replyBox').value }); }
            catch (err) { alert(err.message); }
        });
        document.getElementById('sendMail').addEventListener('click', () => {
            const body = encodeURIComponent(document.getElementById('replyBox').value);
            document.getElementById('sendMail').href = `mailto:${l.customerContact || ''}?subject=Odgovor na vaše povpraševanje&body=${body}`;
        });
    }

    document.getElementById('leadStatusFilter').addEventListener('change', load);
    load();
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
