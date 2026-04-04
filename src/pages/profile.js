// Profile page — MojAvto.si
// Moja garaža: add/manage vehicles with tire info
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../services/garageService.js';
import { getBrands, getModels } from '../services/adminService.js';

export async function initProfilePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const user = window.__currentUser;
    if (!user) { window.location.hash = '/prijava'; return; }

    container.innerHTML = `
    <div style="max-width:900px;margin:2rem auto;padding:0 1rem;">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        ${user.photoURL
            ? `<img src="${user.photoURL}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;" />`
            : `<div style="width:56px;height:56px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👤</div>`}
        <div>
          <h1 style="margin:0;font-size:1.5rem;font-weight:700;">${user.displayName || 'Uporabnik'}</h1>
          <p style="margin:0;color:#6b7280;font-size:0.9rem;">${user.email}</p>
        </div>
        <a href="#/dashboard" style="margin-left:auto;font-size:0.85rem;font-weight:600;color:#2563eb;text-decoration:none;">← Dashboard</a>
      </div>

      <!-- Moja garaža -->
      <div style="background:var(--bg-glass);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:var(--border-glass);border-radius:2rem;padding:1.5rem;box-shadow:var(--shadow-glass);margin-bottom:2rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
          <h2 style="margin:0;font-size:1.1rem;font-weight:800;color:#1e293b;">🏎️ Moja garaža</h2>
          <button id="btn-add-vehicle" style="font-size:0.85rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#2563eb,#4f46e5);border:none;padding:8px 20px;border-radius:9999px;cursor:pointer;transition:all 0.2s;">+ Dodaj vozilo</button>
        </div>

        <!-- Add/edit form (hidden by default) -->
        <div id="vehicle-form-wrap" style="display:none;margin-bottom:1.5rem;">
          <div style="background:rgba(255,255,255,0.6);border:1.5px solid #e2e8f0;border-radius:1.25rem;padding:1.25rem;">
            <h3 id="vehicle-form-title" style="margin:0 0 1rem;font-size:1rem;font-weight:700;color:#1e293b;">Novo vozilo</h3>
            <form id="vehicle-form" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
              <div style="grid-column:1/-1;">
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Vzdevek / ime</label>
                <input id="vf-nickname" type="text" placeholder="npr. Moj BMW" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;">
              </div>

              <div>
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Znamka *</label>
                <select id="vf-make" required style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;background:#fff;">
                  <option value="">Izberi znamko</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Model *</label>
                <select id="vf-model" required style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;background:#fff;">
                  <option value="">Najprej izberi znamko</option>
                </select>
              </div>

              <div>
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Letnik *</label>
                <input id="vf-year" type="number" min="1950" max="2026" required placeholder="2020" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Gorivo</label>
                <select id="vf-fuel" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;background:#fff;">
                  <option value="">Izberi</option>
                  <option value="Bencin">Bencin</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Električni">Električni</option>
                  <option value="Hibrid">Hibrid</option>
                  <option value="Plug-in hibrid">Plug-in hibrid</option>
                  <option value="LPG">LPG</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div>
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Reg. številka</label>
                <input id="vf-plate" type="text" placeholder="LJ AB-123" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;text-transform:uppercase;">
              </div>
              <div>
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Kilometri</label>
                <input id="vf-km" type="number" min="0" placeholder="120000" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;">
              </div>

              <!-- Tire section -->
              <div style="grid-column:1/-1;margin-top:0.5rem;">
                <div style="border-top:1.5px solid #e2e8f0;padding-top:1rem;">
                  <h4 style="margin:0 0 0.75rem;font-size:0.9rem;font-weight:700;color:#1e293b;">🛞 Pnevmatike</h4>
                </div>
              </div>

              <div style="grid-column:1/-1;">
                <label style="font-size:0.78rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Trenutna vrsta pnevmatik</label>
                <select id="vf-tire-season" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;background:#fff;">
                  <option value="">Izberi</option>
                  <option value="letne">Letne</option>
                  <option value="zimske">Zimske</option>
                  <option value="celoletne">Celoletne</option>
                </select>
              </div>

              <!-- Letne pnevmatike -->
              <div style="grid-column:1/-1;">
                <p style="font-size:0.78rem;font-weight:700;color:#f59e0b;margin:0.5rem 0 0.4rem;">☀️ Letne pnevmatike</p>
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Širina</label>
                <input id="vf-summer-width" type="number" placeholder="205" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Profil</label>
                <input id="vf-summer-profile" type="number" placeholder="55" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Premer (R)</label>
                <input id="vf-summer-rim" type="number" placeholder="16" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Znamka</label>
                <input id="vf-summer-brand" type="text" placeholder="Michelin" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>

              <!-- Zimske pnevmatike -->
              <div style="grid-column:1/-1;">
                <p style="font-size:0.78rem;font-weight:700;color:#3b82f6;margin:0.5rem 0 0.4rem;">❄️ Zimske pnevmatike</p>
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Širina</label>
                <input id="vf-winter-width" type="number" placeholder="195" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Profil</label>
                <input id="vf-winter-profile" type="number" placeholder="65" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Premer (R)</label>
                <input id="vf-winter-rim" type="number" placeholder="15" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>
              <div>
                <label style="font-size:0.75rem;color:#64748b;display:block;margin-bottom:3px;">Znamka</label>
                <input id="vf-winter-brand" type="text" placeholder="Continental" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.85rem;font-family:inherit;">
              </div>

              <!-- Buttons -->
              <div style="grid-column:1/-1;display:flex;gap:0.75rem;margin-top:0.5rem;">
                <button type="submit" id="vf-submit" style="flex:1;padding:10px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;border:none;border-radius:0.75rem;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;">Shrani vozilo</button>
                <button type="button" id="vf-cancel" style="padding:10px 20px;background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:inherit;">Prekliči</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Vehicle list -->
        <div id="vehicles-container">
          <div style="text-align:center;padding:2rem;color:#9ca3af;">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i>
            <p style="margin:0.5rem 0 0;font-size:0.85rem;">Nalagam vozila...</p>
          </div>
        </div>
      </div>

      <!-- Back link -->
      <div style="text-align:center;margin-top:1.5rem;">
        <a href="#/dashboard" style="font-size:0.9rem;color:#6b7280;text-decoration:none;">← Nazaj na Dashboard</a>
      </div>
    </div>
    `;

    // ── Load brands into make select ─────────────────────────────────────────
    const makeSelect = document.getElementById('vf-make');
    const modelSelect = document.getElementById('vf-model');
    let brandsCache = [];

    try {
        brandsCache = await getBrands('avto');
        brandsCache.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.name;
            opt.textContent = b.name;
            opt.dataset.brandId = b.id;
            makeSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('[Profile] Failed to load brands:', err);
        // Fallback: let user type freely
        makeSelect.insertAdjacentHTML('afterend',
            '<input id="vf-make-text" type="text" placeholder="Vpiši znamko" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:0.75rem;font-size:0.9rem;font-family:inherit;margin-top:4px;">');
    }

    // ── Load models when brand changes ───────────────────────────────────────
    makeSelect.addEventListener('change', async () => {
        modelSelect.innerHTML = '<option value="">Nalagam...</option>';
        const brand = brandsCache.find(b => b.name === makeSelect.value);
        if (!brand) {
            modelSelect.innerHTML = '<option value="">Izberi model</option>';
            return;
        }
        try {
            const models = await getModels(brand.id);
            modelSelect.innerHTML = '<option value="">Izberi model</option>';
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.textContent = m.name;
                modelSelect.appendChild(opt);
            });
        } catch {
            modelSelect.innerHTML = '<option value="">Vpiši model</option>';
        }
    });

    // ── Show/hide form ───────────────────────────────────────────────────────
    const formWrap = document.getElementById('vehicle-form-wrap');
    const form = document.getElementById('vehicle-form');
    let editingId = null;

    document.getElementById('btn-add-vehicle').addEventListener('click', () => {
        editingId = null;
        form.reset();
        document.getElementById('vehicle-form-title').textContent = 'Novo vozilo';
        document.getElementById('vf-submit').textContent = 'Shrani vozilo';
        formWrap.style.display = 'block';
        formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    document.getElementById('vf-cancel').addEventListener('click', () => {
        formWrap.style.display = 'none';
        editingId = null;
    });

    // ── Form submit ──────────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('vf-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Shranjujem...';

        const vehicle = {
            nickname: document.getElementById('vf-nickname').value.trim(),
            make: makeSelect.value || document.getElementById('vf-make-text')?.value?.trim() || '',
            model: modelSelect.value || '',
            year: Number(document.getElementById('vf-year').value) || 0,
            fuel: document.getElementById('vf-fuel').value,
            plate: document.getElementById('vf-plate').value.trim().toUpperCase(),
            mileageKm: Number(document.getElementById('vf-km').value) || 0,
            tires: {
                currentSeason: document.getElementById('vf-tire-season').value,
                summer: {
                    width: Number(document.getElementById('vf-summer-width').value) || null,
                    profile: Number(document.getElementById('vf-summer-profile').value) || null,
                    rim: Number(document.getElementById('vf-summer-rim').value) || null,
                    brand: document.getElementById('vf-summer-brand').value.trim(),
                },
                winter: {
                    width: Number(document.getElementById('vf-winter-width').value) || null,
                    profile: Number(document.getElementById('vf-winter-profile').value) || null,
                    rim: Number(document.getElementById('vf-winter-rim').value) || null,
                    brand: document.getElementById('vf-winter-brand').value.trim(),
                },
            },
        };

        try {
            if (editingId) {
                await updateVehicle(user.uid, editingId, vehicle);
            } else {
                await addVehicle(user.uid, vehicle);
            }
            formWrap.style.display = 'none';
            editingId = null;
            await renderVehicles();
        } catch (err) {
            console.error('[Profile] Save vehicle error:', err);
            alert('Napaka pri shranjevanju vozila.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = editingId ? 'Posodobi vozilo' : 'Shrani vozilo';
        }
    });

    // ── Render vehicles list ─────────────────────────────────────────────────
    async function renderVehicles() {
        const vc = document.getElementById('vehicles-container');
        try {
            const vehicles = await getVehicles(user.uid);

            if (vehicles.length === 0) {
                vc.innerHTML = `
                    <div style="text-align:center;padding:2.5rem 1rem;color:#94a3b8;">
                        <div style="font-size:2.5rem;margin-bottom:0.5rem;">🚗</div>
                        <p style="margin:0;font-size:0.9rem;font-weight:500;">Vaša garaža je prazna.</p>
                        <p style="margin:0.25rem 0 0;font-size:0.8rem;">Dodajte svoje vozilo za lažje upravljanje pnevmatik in servisov.</p>
                    </div>`;
                return;
            }

            vc.innerHTML = vehicles.map(v => {
                const tireLabel = formatTireLabel(v.tires);
                const seasonBadge = v.tires?.currentSeason
                    ? `<span style="font-size:0.7rem;font-weight:700;padding:3px 10px;border-radius:9999px;${seasonStyle(v.tires.currentSeason)}">${seasonText(v.tires.currentSeason)}</span>`
                    : '';

                return `
                <div style="border:1.5px solid #e2e8f0;border-radius:1.25rem;padding:1.25rem;margin-bottom:0.75rem;background:rgba(255,255,255,0.7);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                                <span style="font-size:1.3rem;">🚗</span>
                                <h3 style="margin:0;font-size:1.05rem;font-weight:800;color:#1e293b;">
                                    ${v.nickname || (v.make + ' ' + v.model)}
                                </h3>
                                ${seasonBadge}
                            </div>
                            ${v.nickname ? `<p style="margin:0.2rem 0 0;font-size:0.82rem;color:#64748b;">${v.make} ${v.model}${v.year ? ' · ' + v.year : ''}</p>` : ''}
                            ${!v.nickname && v.year ? `<p style="margin:0.2rem 0 0;font-size:0.82rem;color:#64748b;">Letnik ${v.year}${v.fuel ? ' · ' + v.fuel : ''}${v.mileageKm ? ' · ' + new Intl.NumberFormat('sl-SI').format(v.mileageKm) + ' km' : ''}</p>` : ''}
                            ${v.nickname && v.year ? '' : ''}
                            ${v.plate ? `<p style="margin:0.15rem 0 0;font-size:0.78rem;color:#94a3b8;font-weight:600;letter-spacing:1px;">${v.plate}</p>` : ''}
                            ${tireLabel ? `<div style="margin-top:0.5rem;font-size:0.78rem;color:#475569;">${tireLabel}</div>` : ''}
                        </div>
                        <div style="display:flex;gap:0.5rem;flex-shrink:0;">
                            <button class="edit-vehicle-btn" data-id="${v.id}" style="padding:6px 14px;font-size:0.78rem;font-weight:600;border:1.5px solid #e2e8f0;background:#f8fafc;color:#475569;border-radius:0.5rem;cursor:pointer;font-family:inherit;">Uredi</button>
                            <button class="delete-vehicle-btn" data-id="${v.id}" style="padding:6px 14px;font-size:0.78rem;font-weight:600;border:1.5px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:0.5rem;cursor:pointer;font-family:inherit;">Izbriši</button>
                        </div>
                    </div>
                </div>`;
            }).join('');

            // Bind edit buttons
            vc.querySelectorAll('.edit-vehicle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const v = vehicles.find(x => x.id === btn.dataset.id);
                    if (!v) return;
                    editingId = v.id;
                    document.getElementById('vehicle-form-title').textContent = 'Uredi vozilo';
                    document.getElementById('vf-submit').textContent = 'Posodobi vozilo';

                    document.getElementById('vf-nickname').value = v.nickname || '';
                    makeSelect.value = v.make || '';
                    makeSelect.dispatchEvent(new Event('change'));
                    setTimeout(() => { modelSelect.value = v.model || ''; }, 500);
                    document.getElementById('vf-year').value = v.year || '';
                    document.getElementById('vf-fuel').value = v.fuel || '';
                    document.getElementById('vf-plate').value = v.plate || '';
                    document.getElementById('vf-km').value = v.mileageKm || '';
                    document.getElementById('vf-tire-season').value = v.tires?.currentSeason || '';
                    document.getElementById('vf-summer-width').value = v.tires?.summer?.width || '';
                    document.getElementById('vf-summer-profile').value = v.tires?.summer?.profile || '';
                    document.getElementById('vf-summer-rim').value = v.tires?.summer?.rim || '';
                    document.getElementById('vf-summer-brand').value = v.tires?.summer?.brand || '';
                    document.getElementById('vf-winter-width').value = v.tires?.winter?.width || '';
                    document.getElementById('vf-winter-profile').value = v.tires?.winter?.profile || '';
                    document.getElementById('vf-winter-rim').value = v.tires?.winter?.rim || '';
                    document.getElementById('vf-winter-brand').value = v.tires?.winter?.brand || '';

                    formWrap.style.display = 'block';
                    formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            });

            // Bind delete buttons
            vc.querySelectorAll('.delete-vehicle-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Ali res želite izbrisati to vozilo iz garaže?')) return;
                    btn.disabled = true;
                    btn.textContent = 'Brišem...';
                    try {
                        await deleteVehicle(user.uid, btn.dataset.id);
                        await renderVehicles();
                    } catch (err) {
                        console.error('[Profile] Delete error:', err);
                        alert('Napaka pri brisanju.');
                        btn.disabled = false;
                        btn.textContent = 'Izbriši';
                    }
                });
            });

        } catch (err) {
            console.error('[Profile] Load vehicles error:', err);
            vc.innerHTML = '<p style="color:#ef4444;text-align:center;font-size:0.85rem;">Napaka pri nalaganju vozil.</p>';
        }
    }

    // ── Initial load ─────────────────────────────────────────────────────────
    await renderVehicles();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTireLabel(tires) {
    if (!tires) return '';
    const parts = [];
    if (tires.summer?.width) {
        const s = tires.summer;
        parts.push(`☀️ Letne: ${s.width}/${s.profile} R${s.rim}${s.brand ? ' (' + s.brand + ')' : ''}`);
    }
    if (tires.winter?.width) {
        const w = tires.winter;
        parts.push(`❄️ Zimske: ${w.width}/${w.profile} R${w.rim}${w.brand ? ' (' + w.brand + ')' : ''}`);
    }
    return parts.join('<br>');
}

function seasonStyle(season) {
    switch (season) {
        case 'letne': return 'background:#fef3c7;color:#d97706;border:1px solid #fde68a;';
        case 'zimske': return 'background:#dbeafe;color:#2563eb;border:1px solid #bfdbfe;';
        case 'celoletne': return 'background:#d1fae5;color:#059669;border:1px solid #a7f3d0;';
        default: return 'background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;';
    }
}

function seasonText(season) {
    switch (season) {
        case 'letne': return '☀️ Letne';
        case 'zimske': return '❄️ Zimske';
        case 'celoletne': return '🔄 Celoletne';
        default: return season;
    }
}
