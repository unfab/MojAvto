// Oglasi (Listings Board) page — MojAvto.si
// Renders car listing cards + comparison tray logic

const MAX_COMPARE = 3;
const MAX_NOTE_CHARS = 110;

import { sampleCars } from '../data/sampleListings.js';
import { auth } from '../firebase.js';
import { showAuthGate } from '../utils/authGate.js';
import { addToFavourites, removeFromFavourites, isFavourite } from '../services/garageService.js';

// ── Fuel pill map ────────────────────────────────────────────
const FUEL_MAP = {
    'bencin':            { code: 'B',   cls: 'fuel-pill-B',  icon: 'fuel',     title: 'Bencin' },
    'benzin':            { code: 'B',   cls: 'fuel-pill-B',  icon: 'fuel',     title: 'Bencin' },
    'diesel':            { code: 'D',   cls: 'fuel-pill-D',  icon: 'fuel',     title: 'Dizel' },
    'dizel':             { code: 'D',   cls: 'fuel-pill-D',  icon: 'fuel',     title: 'Dizel' },
    'hibrid':            { code: 'H',   cls: 'fuel-pill-H',  icon: 'zap',      title: 'Hibrid' },
    'priključni hibrid': { code: 'HB',  cls: 'fuel-pill-HB', icon: 'plug-zap', title: 'Priključni hibrid' },
    'elektrika':         { code: 'E',   cls: 'fuel-pill-E',  icon: 'zap',      title: 'Električno vozilo' },
    'električno':        { code: 'E',   cls: 'fuel-pill-E',  icon: 'zap',      title: 'Električno vozilo' },
    'lpg':               { code: 'LPG', cls: 'fuel-pill-LPG',icon: 'flame',    title: 'LPG' },
};

function getFuelPill(fuelStr) {
    const key = (fuelStr || '').toLowerCase().trim();
    const f = FUEL_MAP[key];
    if (!f) {
        return `<div class="spec-pill"><i data-lucide="fuel"></i> ${fuelStr}</div>`;
    }
    return `<div class="spec-pill fuel-coded ${f.cls}" title="${f.title}">
        <i data-lucide="${f.icon}"></i>
        <strong>${f.code}</strong>
    </div>`;
}

function getPowerPill(powerKw) {
    if (!powerKw) return '';
    const km = Math.round(powerKw * 1.3596);
    return `<div class="spec-pill power-pill" data-kw="${powerKw}" data-km="${km}">
        <i data-lucide="dumbbell"></i>
        <span class="power-val">${powerKw} kW</span>
    </div>`;
}

function getConsumptionPill(car) {
    const fuelKey = (car.fuel || '').toLowerCase().trim();
    if (fuelKey === 'elektrika' || fuelKey === 'električno') {
        if (!car.electricRangeKm) return '';
        return `<div class="spec-pill consumption-pill" title="Domet WLTP">
            <i data-lucide="gauge"></i>
            ${car.electricRangeKm} km
        </div>`;
    }
    if (car.electricRangeKm && car.fuelL100km) {
        return `<div class="spec-pill consumption-pill" title="Poraba / električni domet">
            <i data-lucide="droplets"></i>
            ${car.fuelL100km} l · ${car.electricRangeKm} km E
        </div>`;
    }
    if (!car.fuelL100km) return '';
    return `<div class="spec-pill consumption-pill" title="Poraba goriva">
        <i data-lucide="droplets"></i>
        ${car.fuelL100km} l/100km
    </div>`;
}

function getTransmissionPill(transStr) {
    const t = (transStr || '').toLowerCase().trim();
    let code = 'A';
    let label = 'Avtomatski';
    if (t.includes('roč') || t.includes('manual')) { code = 'R'; label = 'Ročni'; }
    else if (t.includes('sekven')) { code = 'S'; label = 'Sekvenčni'; }
    
    return `<div class="spec-pill" title="Menjalnik: ${label}">
        <i data-lucide="settings-2"></i>
        <strong>${code}</strong>
    </div>`;
}

// ── Power unit toggle ────────────────────────────────────────
let currentPowerUnit = 'kw';

function applyPowerUnit(unit) {
    currentPowerUnit = unit;
    document.querySelectorAll('.power-pill').forEach(pill => {
        const val = pill.querySelector('.power-val');
        if (!val) return;
        val.textContent = unit === 'kw'
            ? pill.dataset.kw + ' kW'
            : pill.dataset.km + ' KM';
    });
    // Sync toggle buttons in legend popup
    document.querySelectorAll('.power-unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    const label = document.getElementById('powerToggleLabel');
    if (label) label.textContent = unit === 'kw' ? 'prikaži v KM' : 'prikaži v kW';
}

// ── Price Rating Logic ───────────────────────────────────────
function getPriceRating(car, allCars) {
    const yearNum = parseInt(car.year?.split('/').pop(), 10);
    const comps = allCars.filter(c => {
        if (c.id === car.id) return false;
        if (c.segment !== car.segment) return false;
        const cYear = parseInt(c.year?.split('/').pop(), 10);
        return Math.abs(cYear - yearNum) <= 2;
    });

    if (comps.length === 0) {
        return { score: 2, label: 'Povprečna cena', color: 'amber' };
    }

    const avgPrice = comps.reduce((s, c) => s + c.priceRaw, 0) / comps.length;
    const ratio = car.priceRaw / avgPrice;

    if (ratio <= 0.88) return { score: 3, label: 'Odlična cena', color: 'green' };
    if (ratio <= 1.08) return { score: 2, label: 'Povprečna cena', color: 'amber' };
    return { score: 1, label: 'Nad povprečjem', color: 'red' };
}

// ── Comparison State ─────────────────────────────────────────
let compareList = JSON.parse(localStorage.getItem('mojavto_compare') || '[]');

function saveCompareState() {
    localStorage.setItem('mojavto_compare', JSON.stringify(compareList));
}

function isInCompare(carId) {
    return compareList.some(c => c.id === carId);
}

function addToCompare(car) {
    if (compareList.length >= MAX_COMPARE) {
        alert(`Lahko primerjate največ ${MAX_COMPARE} vozila naenkrat.`);
        return false;
    }
    if (isInCompare(car.id)) return false;
    const rating = getPriceRating(car, sampleCars);
    compareList.push({
        id: car.id,
        title: car.title,
        subtitle: car.subtitle,
        image: car.images?.exterior?.[0] || car.image,
        year: car.year,
        price: car.price,
        priceRaw: car.priceRaw,
        mileage: car.mileage,
        power: car.power,
        fuel: car.fuel,
        location: car.location,
        seller: car.seller,
        sellerType: car.sellerType,
        priceRating: rating
    });
    saveCompareState();
    return true;
}

function removeFromCompare(carId) {
    compareList = compareList.filter(c => c.id !== carId);
    saveCompareState();
}

// ── Favourite toggle ─────────────────────────────────────────
async function toggleFavourite(btn, carId, car) {
    let user = auth.currentUser;

    if (!user) {
        try {
            user = await showAuthGate({
                icon: '❤️',
                title: 'Shrani med všečkane',
                message: 'Prijavite se, da shranite oglas v svojo garažo všečkanih vozil.',
            });
        } catch {
            return; // user cancelled
        }
    }

    btn.disabled = true;
    try {
        const liked = btn.classList.contains('active');
        if (liked) {
            await removeFromFavourites(user.uid, carId);
            btn.classList.remove('active');
        } else {
            await addToFavourites(user.uid, car);
            btn.classList.add('active');
        }
    } finally {
        btn.disabled = false;
    }
}

// ── Check favourites on load ─────────────────────────────────
async function checkFavouriteStates() {
    const user = auth.currentUser;
    if (!user) return;
    const btns = document.querySelectorAll('.listing-fav-btn[data-car-id]');
    await Promise.all(Array.from(btns).map(async btn => {
        const carId = btn.getAttribute('data-car-id');
        if (await isFavourite(user.uid, carId)) {
            btn.classList.add('active');
        }
    }));
}

// ── Render Car Card ──────────────────────────────────────────
function renderCarCard(car) {
    const inCompare = isInCompare(car.id);
    const images = car.images?.exterior || [car.image];
    const rating = getPriceRating(car, sampleCars);
    const note = car.sellerNote
        ? (car.sellerNote.length > MAX_NOTE_CHARS
            ? car.sellerNote.slice(0, MAX_NOTE_CHARS) + '…'
            : car.sellerNote)
        : null;

    return `
    <div class="car-listing" data-car-id="${car.id}">
        <div class="car-listing-main">
            <!-- Image -->
            <div class="car-listing-img" data-current-idx="0">
                <div class="carousel-track">
                    ${images.map(img => `<img src="${img}" alt="${car.title}" loading="lazy">`).join('')}
                </div>
                <div class="img-count">
                    <i data-lucide="camera"></i> ${car.imgCount}
                </div>
                ${images.length > 1 ? `
                    <button class="carousel-btn prev" aria-label="Prejšnja slika">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <button class="carousel-btn next" aria-label="Naslednja slika">
                        <i data-lucide="chevron-right"></i>
                    </button>
                    <div class="carousel-dots">
                        ${images.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- Content -->
            <div class="car-listing-content">
                <div class="car-listing-header">
                    <div class="car-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                            ${car.isNew ? '<span class="badge-new-pill">NEU</span>' : ''}
                            <h2 class="car-listing-title">${car.title}</h2>
                            <div class="spec-pill condition-pill" style="margin-left: 0.5rem; padding: 0.25rem 0.65rem; font-size: 0.7rem;">
                                ${car.condition}
                            </div>
                        </div>
                    </div>
                    <div class="car-price-box">
                        <span class="price-rating rating-${rating.color}">${rating.label}</span>
                        <span class="price-value">${car.price}</span>
                    </div>
                </div>

                <!-- Row 1: Year & Mileage -->
                <div class="spec-pills-row" style="margin-top: 0;">
                    <div class="spec-pill">
                        <i data-lucide="calendar"></i> ${car.year}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="gauge"></i> ${car.mileage}
                    </div>
                </div>

                <!-- Row 2: Tech specs (Power, Fuel, Consumption, Transmission) -->
                <div class="spec-pills-row" style="margin-top: 0;">
                    ${getPowerPill(car.powerKw)}
                    ${getFuelPill(car.fuel)}
                    ${getConsumptionPill(car)}
                    ${getTransmissionPill(car.transmission)}
                </div>

                <div class="car-listing-bottom-row" style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem;gap:1rem;">
                    <div style="flex:1;min-width:0;overflow:hidden;">
                        ${note ? `
                        <div class="spec-pill seller-note-pill" style="display:inline-flex !important;max-width:100%;overflow:hidden;">
                            <i data-lucide="message-square"></i>
                            <em style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">"${note}"</em>
                        </div>` : ''}
                    </div>
                    <div class="car-listing-actions" style="display:flex;gap:0.5rem;flex-shrink:0;">
                        <button class="action-circle-btn contact-btn" onclick="showContactPopup('${car.id}')" title="Kontakt">
                            <i data-lucide="phone"></i>
                        </button>
                        <button class="action-circle-btn listing-fav-btn" data-car-id="${car.id}" title="Shrani med všečkane">
                            <i data-lucide="heart"></i>
                        </button>
                        <button class="action-circle-btn listing-compare-btn ${inCompare ? 'active' : ''}" data-car-id="${car.id}" title="Primerjaj">
                            <i data-lucide="scale"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ── Contact Popup ────────────────────────────────────────────
window.showContactPopup = function(carId) {
    const car = sampleCars.find(c => c.id === carId);
    if (!car) return;

    const overlay = document.createElement('div');
    overlay.className = 'contact-popup-overlay active';
    overlay.innerHTML = `
        <div class="contact-popup-card">
            <button class="close-btn" style="position:absolute;top:1.5rem;right:1.5rem;background:none;border:none;cursor:pointer;color:#94a3b8;">
                <i data-lucide="x"></i>
            </button>
            <div style="text-align:center;margin-bottom:1.5rem;">
                <img src="${car.sellerImage}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:1rem;border:4px solid var(--color-primary-start);">
                <h3 style="font-size:1.25rem;font-weight:800;color:#1e293b;margin-bottom:0.25rem;">${car.seller}</h3>
                <p style="color:#64748b;font-size:0.9rem;font-weight:500;">${car.sellerType === 'dealer' ? 'Pooblaščeni trgovec' : 'Zasebni prodajalec'}</p>
            </div>
            <div style="background:#f8fafc;border-radius:1.25rem;padding:1.25rem;margin-bottom:1.5rem;">
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                    <i data-lucide="map-pin" style="color:var(--color-primary-start);"></i>
                    <span style="font-weight:600;font-size:0.9rem;">${typeof car.location === 'object' ? car.location.city : car.location}</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                    <i data-lucide="phone" style="color:var(--color-primary-start);"></i>
                    <span style="font-weight:600;font-size:0.9rem;">+386 41 123 456</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <i data-lucide="mail" style="color:var(--color-primary-start);"></i>
                    <span style="font-weight:600;font-size:0.9rem;">info@mojavto.si</span>
                </div>
            </div>
            <button class="pill-btn primary" style="width:100%;">Pošlji sporočilo</button>
        </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    const closePopup = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closePopup);
    overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
};

// ── Render All Listings ──────────────────────────────────────
function renderListings(cars) {
    const container = document.getElementById('carListingsContainer');
    if (!container) return;
    container.innerHTML = cars.map(renderCarCard).join('');

    if (window.lucide) window.lucide.createIcons();
    applyPowerUnit(currentPowerUnit);

    // Card click → navigate to listing
    container.querySelectorAll('.car-listing').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('.pill-btn') || e.target.closest('.action-circle-btn') ||
                e.target.closest('.carousel-btn') || e.target.closest('.carousel-dots')) return;
            window.location.hash = `#/oglas?id=${card.getAttribute('data-car-id')}`;
        });
    });

    // Favourite buttons
    container.querySelectorAll('.listing-fav-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const carId = btn.getAttribute('data-car-id');
            const car = cars.find(c => c.id === carId);
            if (!car) return;
            await toggleFavourite(btn, carId, car);
        });
    });

    // Compare buttons
    container.querySelectorAll('.listing-compare-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const carId = btn.getAttribute('data-car-id');
            const user = auth.currentUser;

            if (!user) {
                try {
                    await showAuthGate({
                        icon: '⚖️',
                        title: 'Primerjaj vozila',
                        message: 'Prijavite se, da dodate vozilo v primerjavo.',
                    });
                } catch {
                    return;
                }
            }

            const car = cars.find(c => c.id === carId);
            if (!car) return;

            if (isInCompare(carId)) {
                removeFromCompare(carId);
                btn.classList.remove('active');
            } else {
                const added = addToCompare(car);
                if (added) btn.classList.add('active');
            }
            if (window.updateHeaderCompare) window.updateHeaderCompare();
        });
    });

    // Carousel
    container.querySelectorAll('.car-listing-img').forEach(imageWrapper => {
        const track = imageWrapper.querySelector('.carousel-track');
        const dots = imageWrapper.querySelectorAll('.dot');
        const prevBtn = imageWrapper.querySelector('.carousel-btn.prev');
        const nextBtn = imageWrapper.querySelector('.carousel-btn.next');
        const imagesCount = imageWrapper.querySelectorAll('img').length;

        if (imagesCount <= 1) return;
        let currentIdx = 0;

        function updateCarousel() {
            track.style.transform = `translateX(-${currentIdx * 100}%)`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIdx));
        }

        prevBtn?.addEventListener('click', e => {
            e.stopPropagation();
            currentIdx = (currentIdx - 1 + imagesCount) % imagesCount;
            updateCarousel();
        });
        nextBtn?.addEventListener('click', e => {
            e.stopPropagation();
            currentIdx = (currentIdx + 1) % imagesCount;
            updateCarousel();
        });
    });

    // Async: mark already-favourited cars
    checkFavouriteStates();
}

// ── Legend popup ─────────────────────────────────────────────
function initLegendPopup() {
    const btn = document.getElementById('legendBtn');
    const overlay = document.getElementById('legendOverlay');
    const closeBtn = document.getElementById('legendCloseBtn');
    if (!btn || !overlay) return;

    const openLegend = () => {
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('active'));
        if (window.lucide) window.lucide.createIcons({ context: overlay });
    };

    const closeLegend = () => {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 250);
    };

    btn.addEventListener('click', openLegend);
    closeBtn?.addEventListener('click', closeLegend);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLegend(); });

    // Power unit buttons inside legend
    overlay.querySelectorAll('.power-unit-btn').forEach(puBtn => {
        puBtn.addEventListener('click', () => {
            applyPowerUnit(puBtn.dataset.unit);
        });
    });

    // Clicking the power toggle label also toggles
    document.getElementById('powerToggleLabel')?.addEventListener('click', () => {
        applyPowerUnit(currentPowerUnit === 'kw' ? 'km' : 'kw');
    });

    overlay.style.display = 'none';
}

// ── Page Init ────────────────────────────────────────────────
export function initOglasiPage() {
    console.log('[OglasiPage] init');

    renderListings(sampleCars);

    if (window.updateHeaderCompare) window.updateHeaderCompare();

    // Mobile filter toggle
    const mobileToggle = document.getElementById('mobileFilterToggle');
    const filtersCard = document.getElementById('filtersCard');
    const chevron = document.getElementById('mobileFilterChevron');

    if (mobileToggle && filtersCard) {
        mobileToggle.addEventListener('click', () => {
            filtersCard.classList.toggle('mobile-open');
            if (chevron) {
                chevron.style.transform = filtersCard.classList.contains('mobile-open')
                    ? 'rotate(180deg)' : '';
            }
        });
    }

    // Payment toggle
    document.querySelectorAll('.payment-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-toggle button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    initLegendPopup();

    if (window.lucide) window.lucide.createIcons();
}
