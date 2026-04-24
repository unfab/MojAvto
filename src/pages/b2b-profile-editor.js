// b2b-profile-editor.js — CMS for public business profile
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { getMyBusiness, saveMyBusiness, uploadBusinessAsset, listServices } from '../services/b2bService.js';
import { getB2BProfile, getRoles } from '../core/b2bContext.js';

const WEEK_DAYS = [
    { key: 'monday',    label: 'Ponedeljek' },
    { key: 'tuesday',   label: 'Torek' },
    { key: 'wednesday', label: 'Sreda' },
    { key: 'thursday',  label: 'Četrtek' },
    { key: 'friday',    label: 'Petek' },
    { key: 'saturday',  label: 'Sobota' },
    { key: 'sunday',    label: 'Nedelja' },
];

export async function initB2bProfileEditorPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/profil', title: 'Javni profil podjetja' });
    if (!main) return;

    const userProfile = getB2BProfile();
    const roles = getRoles();

    let biz = (await getMyBusiness()) || {};
    let services = [];
    try { services = await listServices(); } catch {}

    // Merge defaults
    biz = {
        name: biz.name || userProfile?.companyDetails?.companyName || '',
        tagline: biz.tagline || '',
        description: biz.description || '',
        logo: biz.logo || '',
        coverImage: biz.coverImage || '',
        gallery: biz.gallery || [],
        contact: {
            email: biz.contact?.email || userProfile?.email || '',
            phone: biz.contact?.phone || userProfile?.phone || '',
            address: biz.contact?.address || userProfile?.companyDetails?.address || '',
            website: biz.contact?.website || '',
        },
        social: {
            facebook: biz.social?.facebook || '',
            instagram: biz.social?.instagram || '',
            youtube: biz.social?.youtube || '',
        },
        workingHours: biz.workingHours || WEEK_DAYS.reduce((acc, d) => ({ ...acc, [d.key]: '' }), {}),
        brands: biz.brands || '',
        certifications: biz.certifications || '',
    };

    main.innerHTML = `
        <div class="b2b-profile-editor-toolbar">
            <p class="b2b-hint">Javni profil je stran, ki jo vidijo stranke na MojAvto.si. Uredite podatke in kliknite <strong>Predogled</strong>, da vidite končni videz.</p>
            <div style="display:flex;gap:0.5rem;">
                <button id="previewFullBtn" class="btn b2b-btn-secondary"><i data-lucide="eye"></i> Predogled v živo</button>
                <button id="saveProfileBtn" type="submit" form="profileForm" class="btn b2b-btn-primary"><i data-lucide="save"></i> Shrani</button>
            </div>
        </div>

        <div class="b2b-profile-editor-grid">
            <!-- ── LEFT: FORM ─────────────────────────────────────── -->
            <form id="profileForm" class="b2b-form-stack">
                <!-- 1. BRANDING -->
                <section class="b2b-card">
                    <h2 class="b2b-card-title"><i data-lucide="image"></i> Grafična podoba</h2>
                    <div class="b2b-asset-row">
                        <div class="b2b-asset">
                            <label>Logotip <span class="b2b-field-hint">(kvadratni, min 400×400 px)</span></label>
                            <div class="b2b-asset-preview b2b-logo-preview">
                                <img id="logoImg" src="${esc(biz.logo)}" alt="" ${biz.logo ? '' : 'hidden'} />
                                <span id="logoPh" ${biz.logo ? 'hidden' : ''}><i data-lucide="image"></i></span>
                            </div>
                            <input type="file" id="logoFile" accept="image/*" hidden />
                            <div style="display:flex;gap:4px;">
                                <button type="button" class="btn b2b-btn-secondary btn-sm" data-upload="logo"><i data-lucide="upload"></i> Naloži</button>
                                ${biz.logo ? `<button type="button" class="btn b2b-btn-secondary btn-sm" data-remove="logo"><i data-lucide="x"></i></button>` : ''}
                            </div>
                        </div>
                        <div class="b2b-asset" style="flex:1;">
                            <label>Naslovna slika <span class="b2b-field-hint">(panoramska, min 1600×500 px)</span></label>
                            <div class="b2b-asset-preview b2b-cover-preview">
                                <img id="coverImg" src="${esc(biz.coverImage)}" alt="" ${biz.coverImage ? '' : 'hidden'} />
                                <span id="coverPh" ${biz.coverImage ? 'hidden' : ''}><i data-lucide="image"></i></span>
                            </div>
                            <input type="file" id="coverFile" accept="image/*" hidden />
                            <div style="display:flex;gap:4px;">
                                <button type="button" class="btn b2b-btn-secondary btn-sm" data-upload="cover"><i data-lucide="upload"></i> Naloži</button>
                                ${biz.coverImage ? `<button type="button" class="btn b2b-btn-secondary btn-sm" data-remove="cover"><i data-lucide="x"></i></button>` : ''}
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:1rem;">
                        <label>Galerija (do 8 slik)</label>
                        <div id="galleryGrid" class="b2b-gallery-grid">
                            ${biz.gallery.map((url, i) => `
                                <div class="b2b-gallery-item" data-idx="${i}">
                                    <img src="${esc(url)}" alt=""/>
                                    <button type="button" class="b2b-gallery-del" data-gallery-del="${i}"><i data-lucide="x"></i></button>
                                </div>
                            `).join('')}
                            ${biz.gallery.length < 8 ? `
                                <button type="button" class="b2b-gallery-add" id="galleryAddBtn">
                                    <i data-lucide="plus"></i>
                                    <span>Dodaj</span>
                                </button>` : ''}
                        </div>
                        <input type="file" id="galleryFile" accept="image/*" hidden />
                    </div>
                </section>

                <!-- 2. OSNOVNI PODATKI -->
                <section class="b2b-card">
                    <h2 class="b2b-card-title"><i data-lucide="info"></i> Osnovni podatki</h2>
                    <label>Ime podjetja<input name="name" required value="${esc(biz.name)}"/></label>
                    <label>Slogan <span class="b2b-field-hint">(kratka oznaka pod imenom)</span><input name="tagline" maxlength="80" placeholder="Vaš zanesljiv servis že od 1985" value="${esc(biz.tagline)}"/></label>
                    <label>Opis podjetja<textarea name="description" rows="5" placeholder="Predstavitev vašega podjetja, zgodovina, vrednote…">${esc(biz.description)}</textarea></label>
                    ${roles.includes('mechanic') || roles.includes('dealer') ? `
                        <label>Blagovne znamke <span class="b2b-field-hint">(ločene z vejico)</span><input name="brands" placeholder="BMW, Audi, Mercedes" value="${esc(biz.brands)}"/></label>
                    ` : ''}
                    <label>Certifikati <span class="b2b-field-hint">(ločeni z vejico)</span><input name="certifications" placeholder="ISO 9001, Bosch Car Service" value="${esc(biz.certifications)}"/></label>
                </section>

                <!-- 3. KONTAKT -->
                <section class="b2b-card">
                    <h2 class="b2b-card-title"><i data-lucide="phone"></i> Kontaktni podatki</h2>
                    <div class="b2b-form-row">
                        <label>Telefon<input name="phone" value="${esc(biz.contact?.phone)}"/></label>
                        <label>E-mail<input name="email" type="email" value="${esc(biz.contact?.email)}"/></label>
                    </div>
                    <label>Naslov<input name="address" value="${esc(biz.contact?.address)}"/></label>
                    <label>Spletna stran<input name="website" type="url" placeholder="https://…" value="${esc(biz.contact?.website)}"/></label>
                </section>

                <!-- 4. DRUŽBENA OMREŽJA -->
                <section class="b2b-card">
                    <h2 class="b2b-card-title"><i data-lucide="share-2"></i> Družbena omrežja</h2>
                    <div class="b2b-form-row">
                        <label>Facebook<input name="facebook" placeholder="https://facebook.com/…" value="${esc(biz.social?.facebook)}"/></label>
                        <label>Instagram<input name="instagram" placeholder="https://instagram.com/…" value="${esc(biz.social?.instagram)}"/></label>
                        <label>YouTube<input name="youtube" placeholder="https://youtube.com/…" value="${esc(biz.social?.youtube)}"/></label>
                    </div>
                </section>

                <!-- 5. DELOVNI ČAS -->
                <section class="b2b-card">
                    <h2 class="b2b-card-title"><i data-lucide="clock"></i> Delovni čas</h2>
                    <div class="b2b-hours">
                        ${WEEK_DAYS.map(d => `
                            <div class="b2b-hours-row">
                                <span>${d.label}</span>
                                <input name="wh_${d.key}" placeholder="8:00 - 16:00 (ali 'zaprto')" value="${esc(biz.workingHours?.[d.key] || '')}"/>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <p id="profileStatus" class="b2b-status-line"></p>
            </form>

            <!-- ── RIGHT: LIVE MINI PREVIEW ─────────────────────── -->
            <aside class="b2b-preview-sticky">
                <div class="b2b-card">
                    <h2 class="b2b-card-title"><i data-lucide="eye"></i> Hitri predogled</h2>
                    <div id="profilePreview" class="b2b-preview"></div>
                    <button type="button" id="previewFullBtn2" class="btn b2b-btn-secondary btn-sm" style="margin-top:0.75rem;width:100%;justify-content:center;">
                        <i data-lucide="maximize-2"></i> Odpri celotni predogled
                    </button>
                </div>
            </aside>
        </div>

        <!-- Fullscreen preview modal -->
        <div id="fullPreviewModal" class="b2b-fullscreen-preview" hidden>
            <div class="b2b-fullscreen-preview-header">
                <div class="b2b-fullscreen-preview-title">
                    <i data-lucide="eye"></i>
                    <span>Predogled — takšnega vidijo vaše stranke</span>
                </div>
                <div class="b2b-device-toggle">
                    <button class="b2b-device-btn active" data-device="desktop"><i data-lucide="monitor"></i> Desktop</button>
                    <button class="b2b-device-btn" data-device="tablet"><i data-lucide="tablet"></i> Tablica</button>
                    <button class="b2b-device-btn" data-device="mobile"><i data-lucide="smartphone"></i> Telefon</button>
                </div>
                <button id="closeFullPreview" class="btn b2b-btn-secondary"><i data-lucide="x"></i> Zapri</button>
            </div>
            <div class="b2b-fullscreen-preview-body">
                <div id="fullPreviewFrame" class="b2b-fullscreen-preview-frame desktop">
                    <div id="fullPreviewContent"></div>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    function collectForm() {
        const fd = new FormData(document.getElementById('profileForm'));
        return {
            name: (fd.get('name') || '').trim(),
            tagline: (fd.get('tagline') || '').trim(),
            description: (fd.get('description') || '').trim(),
            logo: biz.logo || '',
            coverImage: biz.coverImage || '',
            gallery: biz.gallery || [],
            contact: {
                email: (fd.get('email') || '').trim(),
                phone: (fd.get('phone') || '').trim(),
                address: (fd.get('address') || '').trim(),
                website: (fd.get('website') || '').trim(),
            },
            social: {
                facebook: (fd.get('facebook') || '').trim(),
                instagram: (fd.get('instagram') || '').trim(),
                youtube: (fd.get('youtube') || '').trim(),
            },
            workingHours: WEEK_DAYS.reduce((acc, d) => ({ ...acc, [d.key]: fd.get('wh_' + d.key) || '' }), {}),
            brands: (fd.get('brands') || '').trim(),
            certifications: (fd.get('certifications') || '').trim(),
        };
    }

    function renderMiniPreview() {
        const data = collectForm();
        const hours = WEEK_DAYS.map(d => `<li><span>${d.label}</span><span>${esc(data.workingHours[d.key] || '—')}</span></li>`).join('');
        document.getElementById('profilePreview').innerHTML = `
            <div class="preview-cover" style="${data.coverImage ? `background-image:url('${data.coverImage}')` : ''}"></div>
            <div class="preview-header">
                <div class="preview-logo">${data.logo ? `<img src="${data.logo}" alt=""/>` : '<i data-lucide="building-2"></i>'}</div>
                <div>
                    <h3>${esc(data.name || 'Ime podjetja')}</h3>
                    ${data.tagline ? `<p class="preview-tagline">${esc(data.tagline)}</p>` : ''}
                    <p class="preview-address"><i data-lucide="map-pin"></i> ${esc(data.contact.address || '—')}</p>
                </div>
            </div>
            <p class="preview-desc">${esc((data.description || 'Opis podjetja še ni dodan.').slice(0, 160))}${data.description?.length > 160 ? '…' : ''}</p>
            <div class="preview-contact">
                ${data.contact.phone ? `<a href="tel:${esc(data.contact.phone)}"><i data-lucide="phone"></i> ${esc(data.contact.phone)}</a>` : ''}
                ${data.contact.email ? `<a href="mailto:${esc(data.contact.email)}"><i data-lucide="mail"></i> ${esc(data.contact.email)}</a>` : ''}
            </div>
            <ul class="preview-hours">${hours}</ul>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    function renderFullPreview() {
        const data = collectForm();
        const hoursRows = WEEK_DAYS.map(d => {
            const v = data.workingHours[d.key];
            const isClosed = !v || /zaprt/i.test(v);
            return `<tr class="${isClosed ? 'fp-closed' : ''}"><td>${d.label}</td><td>${isClosed ? 'Zaprto' : esc(v)}</td></tr>`;
        }).join('');

        const brandsHtml = data.brands
            ? `<div class="fp-badges">${data.brands.split(',').map(b => `<span class="fp-badge">${esc(b.trim())}</span>`).join('')}</div>`
            : '';

        const certsHtml = data.certifications
            ? `<div class="fp-certs">${data.certifications.split(',').map(c => `<span class="fp-cert"><i data-lucide="award"></i>${esc(c.trim())}</span>`).join('')}</div>`
            : '';

        const socialHtml = (data.social.facebook || data.social.instagram || data.social.youtube) ? `
            <div class="fp-socials">
                ${data.social.facebook ? `<a href="${esc(data.social.facebook)}" target="_blank" rel="noopener"><i data-lucide="facebook"></i></a>` : ''}
                ${data.social.instagram ? `<a href="${esc(data.social.instagram)}" target="_blank" rel="noopener"><i data-lucide="instagram"></i></a>` : ''}
                ${data.social.youtube ? `<a href="${esc(data.social.youtube)}" target="_blank" rel="noopener"><i data-lucide="youtube"></i></a>` : ''}
            </div>` : '';

        const servicesByCat = {};
        for (const s of services) {
            const c = s.category || 'Drugo';
            (servicesByCat[c] = servicesByCat[c] || []).push(s);
        }
        const servicesHtml = Object.keys(servicesByCat).length
            ? Object.entries(servicesByCat).map(([cat, items]) => `
                <div class="fp-svc-group">
                    <h3>${esc(cat)}</h3>
                    <div class="fp-svc-list">
                        ${items.map(s => `
                            <div class="fp-svc-card">
                                <div class="fp-svc-icon"><i data-lucide="${esc(s.icon || 'wrench')}"></i></div>
                                <div class="fp-svc-body">
                                    <div class="fp-svc-name">${esc(s.name)}</div>
                                    ${s.description ? `<div class="fp-svc-desc">${esc(s.description)}</div>` : ''}
                                    <div class="fp-svc-meta">
                                        ${s.duration ? `<span><i data-lucide="clock"></i> ${s.duration} min</span>` : ''}
                                        <span class="fp-svc-price">${priceLabel(s)}</span>
                                    </div>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>`).join('')
            : `<div class="fp-empty"><p>Ni dodanih storitev. <a href="#/b2b/storitve">Dodaj storitve →</a></p></div>`;

        const galleryHtml = data.gallery.length ? `
            <section class="fp-section">
                <h2>Galerija</h2>
                <div class="fp-gallery">
                    ${data.gallery.map(url => `<div class="fp-gallery-item"><img src="${esc(url)}" alt=""/></div>`).join('')}
                </div>
            </section>` : '';

        document.getElementById('fullPreviewContent').innerHTML = `
            <div class="fp-page">
                <!-- Hero -->
                <div class="fp-hero">
                    ${data.coverImage ? `<img class="fp-hero-cover" src="${esc(data.coverImage)}" alt="">` : '<div class="fp-hero-cover fp-hero-placeholder"></div>'}
                    <div class="fp-hero-overlay"></div>
                    <div class="fp-hero-content">
                        <div class="fp-hero-logo">${data.logo ? `<img src="${esc(data.logo)}" alt="">` : '<i data-lucide="building-2"></i>'}</div>
                        <div class="fp-hero-info">
                            <h1>${esc(data.name || 'Ime podjetja')}</h1>
                            ${data.tagline ? `<p class="fp-tagline">${esc(data.tagline)}</p>` : ''}
                            ${brandsHtml}
                        </div>
                        <div class="fp-hero-actions">
                            ${data.contact.phone ? `<a href="tel:${esc(data.contact.phone)}" class="fp-btn primary"><i data-lucide="phone"></i> Kontaktiraj</a>` : ''}
                            <button class="fp-btn outline" onclick="event.preventDefault()"><i data-lucide="calendar"></i> Rezerviraj termin</button>
                        </div>
                    </div>
                </div>

                <!-- Info bar -->
                <div class="fp-info-bar">
                    ${data.contact.address ? `<div class="fp-info-item"><i data-lucide="map-pin"></i> ${esc(data.contact.address)}</div>` : ''}
                    ${data.contact.phone ? `<div class="fp-info-item"><i data-lucide="phone"></i> ${esc(data.contact.phone)}</div>` : ''}
                    ${data.contact.email ? `<div class="fp-info-item"><i data-lucide="mail"></i> ${esc(data.contact.email)}</div>` : ''}
                    ${data.contact.website ? `<div class="fp-info-item"><i data-lucide="globe"></i> <a href="${esc(data.contact.website)}" target="_blank" rel="noopener">${esc(data.contact.website.replace(/^https?:\/\//, ''))}</a></div>` : ''}
                </div>

                <div class="fp-body">
                    <!-- O podjetju -->
                    ${data.description ? `
                    <section class="fp-section">
                        <h2>O podjetju</h2>
                        <p class="fp-description">${esc(data.description).replace(/\n/g, '<br>')}</p>
                        ${certsHtml}
                        ${socialHtml}
                    </section>` : ''}

                    <!-- Storitve -->
                    <section class="fp-section">
                        <h2>Storitve in cenik</h2>
                        ${servicesHtml}
                    </section>

                    <!-- Galerija -->
                    ${galleryHtml}

                    <!-- Delovni čas -->
                    <section class="fp-section fp-hours-section">
                        <h2>Delovni čas</h2>
                        <table class="fp-hours-table">${hoursRows}</table>
                    </section>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    function openFullPreview() {
        renderFullPreview();
        document.getElementById('fullPreviewModal').hidden = false;
        document.body.style.overflow = 'hidden';
    }
    function closeFullPreview() {
        document.getElementById('fullPreviewModal').hidden = true;
        document.body.style.overflow = '';
    }

    document.getElementById('previewFullBtn').addEventListener('click', openFullPreview);
    document.getElementById('previewFullBtn2').addEventListener('click', openFullPreview);
    document.getElementById('closeFullPreview').addEventListener('click', closeFullPreview);

    document.querySelectorAll('.b2b-device-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.b2b-device-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const frame = document.getElementById('fullPreviewFrame');
            frame.className = 'b2b-fullscreen-preview-frame ' + btn.dataset.device;
        });
    });

    renderMiniPreview();
    document.getElementById('profileForm').addEventListener('input', renderMiniPreview);

    // ── Asset upload ──
    document.querySelectorAll('[data-upload]').forEach(btn => {
        btn.addEventListener('click', () => document.getElementById(btn.dataset.upload + 'File').click());
    });
    document.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            const kind = btn.dataset.remove;
            if (kind === 'logo') biz.logo = '';
            else biz.coverImage = '';
            document.getElementById(kind + 'Img').src = '';
            document.getElementById(kind + 'Img').hidden = true;
            document.getElementById(kind + 'Ph').hidden = false;
            btn.remove();
            renderMiniPreview();
        });
    });

    ['logo', 'cover'].forEach(kind => {
        document.getElementById(kind + 'File').addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const status = document.getElementById('profileStatus');
            status.textContent = 'Nalagam sliko…';
            try {
                const url = await uploadBusinessAsset(file, kind);
                document.getElementById(kind + 'Img').src = url;
                document.getElementById(kind + 'Img').hidden = false;
                document.getElementById(kind + 'Ph').hidden = true;
                if (kind === 'logo') biz.logo = url;
                else biz.coverImage = url;
                renderMiniPreview();
                status.textContent = 'Slika naložena. Ne pozabite klikniti Shrani.';
            } catch (err) {
                status.textContent = 'Napaka pri nalaganju: ' + err.message;
            }
        });
    });

    // ── Gallery upload ──
    document.getElementById('galleryAddBtn')?.addEventListener('click', () => document.getElementById('galleryFile').click());
    document.getElementById('galleryFile').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (biz.gallery.length >= 8) { alert('Maksimalno 8 slik v galeriji.'); return; }
        const status = document.getElementById('profileStatus');
        status.textContent = 'Nalagam v galerijo…';
        try {
            const url = await uploadBusinessAsset(file, 'gallery');
            biz.gallery.push(url);
            reRenderGallery();
            renderMiniPreview();
            status.textContent = 'Dodano v galerijo. Ne pozabite klikniti Shrani.';
        } catch (err) {
            status.textContent = 'Napaka: ' + err.message;
        }
        e.target.value = '';
    });

    function reRenderGallery() {
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = `
            ${biz.gallery.map((url, i) => `
                <div class="b2b-gallery-item" data-idx="${i}">
                    <img src="${esc(url)}" alt=""/>
                    <button type="button" class="b2b-gallery-del" data-gallery-del="${i}"><i data-lucide="x"></i></button>
                </div>
            `).join('')}
            ${biz.gallery.length < 8 ? `
                <button type="button" class="b2b-gallery-add" id="galleryAddBtn">
                    <i data-lucide="plus"></i>
                    <span>Dodaj</span>
                </button>` : ''}
        `;
        grid.querySelectorAll('[data-gallery-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                biz.gallery.splice(Number(btn.dataset.galleryDel), 1);
                reRenderGallery();
                renderMiniPreview();
            });
        });
        document.getElementById('galleryAddBtn')?.addEventListener('click', () => document.getElementById('galleryFile').click());
        if (window.lucide) window.lucide.createIcons();
    }
    reRenderGallery();

    // ── Save ──
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = collectForm();
        const btn = document.getElementById('saveProfileBtn');
        btn.disabled = true;
        document.getElementById('profileStatus').textContent = 'Shranjujem…';
        try {
            await saveMyBusiness(data);
            document.getElementById('profileStatus').textContent = '✓ Shranjeno — vaš profil je posodobljen.';
            setTimeout(() => { document.getElementById('profileStatus').textContent = ''; }, 3000);
        } catch (err) {
            document.getElementById('profileStatus').textContent = 'Napaka: ' + err.message;
        } finally {
            btn.disabled = false;
        }
    });
}

function priceLabel(s) {
    if (s.priceType === 'quote' || s.price == null) return 'Po ogledu';
    const val = Number(s.price).toFixed(2).replace(/\.00$/, '') + ' €';
    return s.priceType === 'from' ? `od ${val}` : val;
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
