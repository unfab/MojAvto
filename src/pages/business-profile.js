// business-profile.js — Business Profile Page — MojAvto.si
// Renders full business profile: hero, info bar, tabs (oglasi/storitve/ocene/o podjetju)

import { getBusinessById, getTypeLabels, getBusinessTypeInfo } from '../services/businessService.js';
import { serviceLabels } from '../data/businesses.js';
import { sampleCars } from '../data/sampleListings.js'; // Reuse existing listings

// ── Helpers ──────────────────────────────────────────────────
function getStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function getTypeColor(type) {
    return { dealer: '#2563eb', service: '#16a34a', vulcanizer: '#ea580c' }[type] || '#7c3aed';
}

// ── Build Hero ────────────────────────────────────────────────
function buildHero(biz) {
    document.getElementById('bizCoverImg').src = biz.coverImage;
    document.getElementById('bizCoverImg').alt = biz.name + ' cover';
    document.getElementById('bizLogoImg').src = biz.logo;
    document.getElementById('bizLogoImg').alt = biz.name;
    document.getElementById('bizName').textContent = biz.name;
    document.getElementById('bizStars').textContent = getStars(biz.rating);
    document.getElementById('bizRatingNum').textContent = biz.rating.toFixed(1);
    document.getElementById('bizRatingCount').textContent = `(${biz.reviewCount} ocen)`;

    // Badges
    const badges = [];
    // Type badges
    biz.businessTypes.forEach(t => {
        const labels = { dealer: 'Avto hiša', service: 'Servis', vulcanizer: 'Vulkanizer' };
        badges.push(`<span class="biz-badge ${t}"><i data-lucide="${t === 'dealer' ? 'building-2' : t === 'service' ? 'wrench' : 'circle'}"></i>${labels[t]}</span>`);
    });
    if (biz.verified) badges.push(`<span class="biz-badge verified"><i data-lucide="badge-check"></i>Verificirano</span>`);
    if (biz.authorizedBrands.length) badges.push(`<span class="biz-badge authorized"><i data-lucide="award"></i>Pooblaščen servis</span>`);
    if (biz.offersLeasing) badges.push(`<span class="biz-badge leasing"><i data-lucide="landmark"></i>Leasing</span>`);
    if (biz.offersTyreStorage) badges.push(`<span class="biz-badge tyre"><i data-lucide="circle"></i>Hramba gum</span>`);

    document.getElementById('bizBadges').innerHTML = badges.join('');

    // CTA buttons
    const actions = [];
    actions.push(`<a href="tel:${biz.contact.phone}" class="biz-cta-btn primary"><i data-lucide="phone"></i>Kontaktiraj</a>`);
    if (biz.businessTypes.includes('service') || biz.businessTypes.includes('vulcanizer')) {
        actions.push(`<button class="biz-cta-btn outline" id="bookingHeroBtn"><i data-lucide="calendar"></i>Rezerviraj termin</button>`);
    }
    if (biz.businessTypes.includes('dealer')) {
        actions.push(`<button class="biz-cta-btn outline" onclick="window._showBizTab('oglasi')"><i data-lucide="car"></i>Poglej oglase</button>`);
    }
    document.getElementById('bizHeroActions').innerHTML = actions.join('');

    // Booking hook (no implementation)
    document.getElementById('bookingHeroBtn')?.addEventListener('click', () => {
        window.location.hash = `#/booking?businessId=${biz.id}`;
    });
}

// ── Build Info Bar ────────────────────────────────────────────
function buildInfoBar(biz) {
    const brands = [...new Set([...biz.authorizedBrands, ...biz.supportedBrands])];
    const brandsHtml = brands.length > 0
        ? `<div class="biz-brands-row">
            ${biz.authorizedBrands.map(b => `<span class="biz-brand-tag authorized" title="Pooblaščen">${b}</span>`).join('')}
            ${biz.supportedBrands.filter(b => !biz.authorizedBrands.includes(b)).map(b => `<span class="biz-brand-tag">${b}</span>`).join('')}
           </div>`
        : '';

    document.getElementById('bizInfoBar').innerHTML = `
        <div class="biz-info-item">
            <i data-lucide="map-pin"></i>
            ${biz.contact.address}
        </div>
        <div class="biz-info-item">
            <i data-lucide="phone"></i>
            <a href="tel:${biz.contact.phone}">${biz.contact.phone}</a>
        </div>
        <div class="biz-info-item">
            <i data-lucide="mail"></i>
            <a href="mailto:${biz.contact.email}">${biz.contact.email}</a>
        </div>
        ${brandsHtml ? `<div class="biz-info-item"><i data-lucide="tag"></i>${brandsHtml}</div>` : ''}
    `;
}

// ── Build Tabs ────────────────────────────────────────────────
function buildTabs(biz) {
    const tabs = [];
    if (biz.businessTypes.includes('dealer')) tabs.push({ id: 'oglasi', label: 'Oglasi', icon: 'car' });
    if (biz.businessTypes.includes('service') || biz.businessTypes.includes('vulcanizer')) {
        tabs.push({ id: 'storitve', label: 'Storitve', icon: 'wrench' });
    }
    tabs.push({ id: 'ocene', label: 'Ocene', icon: 'star' });
    tabs.push({ id: 'o-podjetju', label: 'O podjetju', icon: 'info' });

    const nav = document.getElementById('bizTabsNav');
    nav.innerHTML = tabs.map((tab, i) => `
        <button class="biz-tab-btn ${i === 0 ? 'active' : ''}" data-tab="${tab.id}" id="tabBtn-${tab.id}">
            <i data-lucide="${tab.icon}"></i>${tab.label}
        </button>
    `).join('');

    // Show first tab
    if (tabs.length > 0) showTab(tabs[0].id);

    // Bind tab clicks
    nav.querySelectorAll('.biz-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
    });
}

function showTab(tabId) {
    document.querySelectorAll('.biz-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.biz-tab-btn').forEach(btn => btn.classList.remove('active'));

    const content = document.getElementById(`tab-${tabId}`);
    const btn = document.querySelector(`.biz-tab-btn[data-tab="${tabId}"]`);
    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');

    if (window.lucide) window.lucide.createIcons();
}

// Global for CTA button in hero
window._showBizTab = showTab;

// ── Build Listings Tab ────────────────────────────────────────
function buildListingsTab(biz) {
    const grid = document.getElementById('bizListingsGrid');
    if (!grid) return;

    // Filter sampleCars by sellerId (using biz.id or biz.name as seller match)
    let listings = sampleCars.filter(c =>
        c.seller === biz.name ||
        c.sellerId === biz.id
    );

    // Fallback: if dealer, show all dealer cars for demo
    if (listings.length === 0 && biz.businessTypes.includes('dealer')) {
        listings = sampleCars.filter(c => c.sellerType === 'dealer').slice(0, 3);
    }

    if (listings.length === 0) {
        grid.innerHTML = `<div class="biz-empty"><div style="font-size:2rem;margin-bottom:0.5rem;">🚗</div><div>Ta avto hiša nima aktivnih oglasov.</div></div>`;
        return;
    }

    grid.innerHTML = listings.map(car => `
        <div class="biz-listing-card" onclick="window.location.hash='#/oglas?id=${car.id}'">
            <img class="biz-listing-img" src="${car.images[0]}" alt="${car.title}" loading="lazy" />
            <div class="biz-listing-body">
                <div class="biz-listing-title">${car.title}</div>
                <div class="biz-listing-sub">${car.subtitle}</div>
                <div class="biz-listing-price">${car.price}</div>
            </div>
        </div>
    `).join('');
}

// ── Build Services Tab ────────────────────────────────────────
const serviceIcons = {
    tyre_change: 'circle', tyre_storage: 'archive', tyre_repair: 'tool',
    oil_change: 'droplets', brake_service: 'disc', diagnostics: 'activity',
    inspection: 'clipboard-check', air_conditioning: 'wind', wheel_alignment: 'settings',
    wheel_balancing: 'loader', clutch_repair: 'settings-2', body_repair: 'shield',
    electrical_repair: 'zap', battery_service: 'battery-charging',
    software_update: 'cpu', hybrid_service: 'leaf', washing: 'sparkles'
};

const servicePricesMock = {
    tyre_change: 'od 15 €/guma', tyre_storage: 'od 40 €/sezona', tyre_repair: 'od 8 €',
    oil_change: 'od 49 €', brake_service: 'od 79 €', diagnostics: 'od 29 €',
    inspection: 'po dogovoru', air_conditioning: 'od 59 €', wheel_alignment: 'od 39 €',
    wheel_balancing: 'od 8 €/guma', clutch_repair: 'od 299 €', body_repair: 'po ogledu',
    electrical_repair: 'od 49 €', battery_service: 'po ogledu', software_update: 'od 99 €',
    hybrid_service: 'od 119 €', washing: 'od 12 €'
};

function buildServicesTab(biz) {
    const grid = document.getElementById('bizServicesGrid');
    const bookingBanner = document.getElementById('bizBookingBanner');
    const bookingBtn = document.getElementById('bizBookingBtn');
    if (!grid) return;

    if (biz.servicesOffered.length === 0) {
        grid.innerHTML = `<div class="biz-empty" style="grid-column:1/-1;"><div style="font-size:2rem;margin-bottom:0.5rem;">🔧</div><div>Storitve niso navedene.</div></div>`;
        if (bookingBanner) bookingBanner.style.display = 'none';
        return;
    }

    grid.innerHTML = biz.servicesOffered.map(s => `
        <div class="biz-service-card">
            <div class="biz-service-icon">
                <i data-lucide="${serviceIcons[s] || 'settings'}"></i>
            </div>
            <div class="biz-service-name">${serviceLabels[s] || s}</div>
            <div class="biz-service-price">${servicePricesMock[s] || 'po dogovoru'}</div>
            <button class="biz-service-cta" onclick="window.location.hash='#/booking?businessId=${biz.id}&service=${s}'">
                Rezerviraj →
            </button>
        </div>
    `).join('');

    // Booking banner
    if (bookingBtn) {
        bookingBtn.addEventListener('click', () => {
            window.location.hash = `#/booking?businessId=${biz.id}`;
        });
    }
}

// ── Build Reviews Tab ─────────────────────────────────────────
const mockReviews = [
    { author: 'Marko K.', avatar: 'https://ui-avatars.com/api/?name=MK&background=2563eb&color=fff&size=64', rating: 5, date: '15. 3. 2024', text: 'Odlična izkušnja! Hitri, strokovni in prijazni. Termin sem dobil isti dan.' },
    { author: 'Ana L.', avatar: 'https://ui-avatars.com/api/?name=AL&background=7c3aed&color=fff&size=64', rating: 4, date: '2. 2. 2024', text: 'Zelo zadovoljna s storitvijo. Cena je bila transparentna, brez skritih stroškov.' },
    { author: 'Jure P.', avatar: 'https://ui-avatars.com/api/?name=JP&background=16a34a&color=fff&size=64', rating: 5, date: '18. 1. 2024', text: 'Najboljši servis v mestu. Priporočam vsem!' },
    { author: 'Petra M.', avatar: 'https://ui-avatars.com/api/?name=PM&background=ea580c&color=fff&size=64', rating: 4, date: '5. 12. 2023', text: 'Dobra komunikacija in kakovostno delo. Vrnil sem se že tretjič.' },
    { author: 'Tomaž V.', avatar: 'https://ui-avatars.com/api/?name=TV&background=0891b2&color=fff&size=64', rating: 3, date: '22. 11. 2023', text: 'Solidno, je pa bilo treba malo počakati na termin.' }
];

function buildReviewsTab(biz) {
    const summary = document.getElementById('bizReviewsSummary');
    const list = document.getElementById('bizReviewsList');
    if (!summary || !list) return;

    // Rating distribution (mock)
    const distMock = [
        { stars: 5, pct: 68 }, { stars: 4, pct: 20 }, { stars: 3, pct: 8 },
        { stars: 2, pct: 2 }, { stars: 1, pct: 2 }
    ];

    summary.innerHTML = `
        <div class="biz-reviews-big-rating">
            <div class="biz-rating-big">${biz.rating.toFixed(1)}</div>
            <div class="biz-rating-stars-big">${getStars(biz.rating)}</div>
            <div class="biz-rating-total">${biz.reviewCount} ocen</div>
        </div>
        <div class="biz-rating-bars">
            ${distMock.map(d => `
                <div class="biz-rating-bar-row">
                    <span style="min-width:12px;">${d.stars}</span>
                    <i data-lucide="star" style="width:11px;height:11px;color:#f59e0b;"></i>
                    <div class="biz-rating-bar-bg">
                        <div class="biz-rating-bar-fill" style="width:${d.pct}%;"></div>
                    </div>
                    <span style="min-width:30px;">${d.pct}%</span>
                </div>
            `).join('')}
        </div>
    `;

    list.innerHTML = mockReviews.map(r => `
        <div class="biz-review-card">
            <div class="biz-review-header">
                <img class="biz-review-avatar" src="${r.avatar}" alt="${r.author}" />
                <div>
                    <div class="biz-review-author">${r.author}</div>
                    <div class="biz-review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                    <div class="biz-review-date">${r.date}</div>
                </div>
            </div>
            <div class="biz-review-text">${r.text}</div>
        </div>
    `).join('');
}

// ── Build About Tab ───────────────────────────────────────────
function buildAboutTab(biz) {
    const container = document.getElementById('bizAboutContent');
    if (!container) return;

    const sections = [];

    sections.push(`
        <div class="biz-about-section">
            <h3><i data-lucide="info"></i>O podjetju</h3>
            <p class="biz-about-text">${biz.description}</p>
        </div>
    `);

    if (biz.offersLeasing && biz.leasingPartners.length > 0) {
        sections.push(`
            <div class="biz-about-section">
                <h3><i data-lucide="landmark"></i>Leasing partnerji</h3>
                <div class="biz-leasing-partners">
                    ${biz.leasingPartners.map(p => `<span class="biz-leasing-tag">✓ ${p}</span>`).join('')}
                </div>
            </div>
        `);
    }

    if (biz.authorizedBrands.length > 0) {
        sections.push(`
            <div class="biz-about-section">
                <h3><i data-lucide="award"></i>Pooblaščene znamke</h3>
                <div class="biz-brands-row">
                    ${biz.authorizedBrands.map(b => `<span class="biz-brand-tag authorized">${b}</span>`).join('')}
                </div>
            </div>
        `);
    }

    const typeLabels = getTypeLabels(biz);
    sections.push(`
        <div class="biz-about-section">
            <h3><i data-lucide="map-pin"></i>Kontakt & lokacija</h3>
            <p class="biz-about-text">
                <strong>Naslov:</strong> ${biz.contact.address}<br/>
                <strong>Telefon:</strong> <a href="tel:${biz.contact.phone}" style="color:var(--color-primary-start);">${biz.contact.phone}</a><br/>
                <strong>E-pošta:</strong> <a href="mailto:${biz.contact.email}" style="color:var(--color-primary-start);">${biz.contact.email}</a><br/>
                <strong>Tip:</strong> ${typeLabels.join(', ')}
            </p>
        </div>
    `);

    container.innerHTML = sections.join('');
}

// ── Page Init ─────────────────────────────────────────────────
export function initBusinessProfilePage() {
    console.log('[BusinessProfile] init');

    const loading = document.getElementById('bizProfileLoading');
    const error = document.getElementById('bizProfileError');
    const content = document.getElementById('bizProfileContent');

    // Get business ID from URL hash: #/poslovni-profil?id=XXX
    const hash = window.location.hash;
    const idMatch = hash.match(/[?&]id=([^&]+)/);
    const bizId = idMatch ? idMatch[1] : null;

    if (!bizId) {
        loading.style.display = 'none';
        error.style.display = 'block';
        return;
    }

    const biz = getBusinessById(bizId);

    if (!biz) {
        loading.style.display = 'none';
        error.style.display = 'block';
        return;
    }

    // Render
    loading.style.display = 'none';
    content.style.display = 'block';

    buildHero(biz);
    buildInfoBar(biz);
    buildTabs(biz);
    buildListingsTab(biz);
    buildServicesTab(biz);
    buildReviewsTab(biz);
    buildAboutTab(biz);

    // Init Lucide icons
    if (window.lucide) window.lucide.createIcons();
}
