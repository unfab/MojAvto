// Oglasi (Listings Board) page — MojAvto.si
// Renders car listing cards + comparison tray logic

const MAX_COMPARE = 3;

import { sampleCars } from '../data/sampleListings.js';

// ── Price Rating Logic ──────────────────────────────────────
// Compares car price to average of similar vehicles in same segment
// Returns { score: 1|2|3, label, color }
function getPriceRating(car, allCars) {
    // Find comparable cars: same segment, year within ±2 years
    const yearNum = parseInt(car.year.split('/').pop(), 10);
    const comps = allCars.filter(c => {
        if (c.id === car.id) return false;
        if (c.segment !== car.segment) return false;
        const cYear = parseInt(c.year.split('/').pop(), 10);
        return Math.abs(cYear - yearNum) <= 2;
    });

    if (comps.length === 0) {
        // Not enough data — return neutral
        return { score: 2, label: 'Povprečna cena', color: 'amber' };
    }

    const avgPrice = comps.reduce((s, c) => s + c.priceRaw, 0) / comps.length;
    const ratio = car.priceRaw / avgPrice;

    if (ratio <= 0.88) return { score: 3, label: 'Odlična cena', color: 'green' };
    if (ratio <= 1.08) return { score: 2, label: 'Povprečna cena', color: 'amber' };
    return { score: 1, label: 'Nad povprečjem', color: 'red' };
}

// ── Comparison State ────────────────────────────────────────
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
        image: car.images[0],
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

function clearCompare() {
    compareList = [];
    saveCompareState();
}

// ── Render Car Card ─────────────────────────────────────────
function renderCarCard(car) {
    const inCompare = isInCompare(car.id);
    const images = car.images || [car.image];
    const rating = getPriceRating(car, sampleCars);
    
    return `
    <div class="car-listing" data-car-id="${car.id}">
        <div class="car-listing-main">
            <!-- Image Section -->
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

            <!-- Content Section (ALL data on the right) -->
            <div class="car-listing-content">
                <div class="car-listing-header">
                    <div class="car-info">
                        ${car.isNew ? '<span class="badge-new-pill">NEU</span>' : ''}
                        <h2 class="car-listing-title">${car.title}</h2>
                        <p class="car-listing-subtitle">${car.subtitle}</p>
                    </div>
                    <div class="car-price-box">
                        <span class="price-rating rating-${rating.color}">${rating.label}</span>
                        <span class="price-value">${car.price}</span>
                    </div>
                </div>

                <div class="spec-pills-row">
                    <div class="spec-pill condition-pill">
                        <i data-lucide="info"></i> ${car.condition}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="calendar"></i> ${car.year}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="gauge"></i> ${car.mileage}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="zap"></i> ${car.power}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="fuel"></i> ${car.fuel}
                    </div>
                </div>

                ${car.sellerNote ? `
                <div class="car-listing-note">
                    <div class="spec-pill seller-note-pill">
                        <i data-lucide="message-square"></i> <em>"${car.sellerNote}"</em>
                    </div>
                </div>
                ` : ''}

                <div class="car-listing-footer">
                    <div class="car-listing-location" style="display: flex; align-items: center; gap: 0.65rem;">
                        <img src="${car.sellerImage}" class="seller-avatar-mini" alt="${car.seller}">
                        <span>${car.location} • <strong>${car.seller}</strong></span>
                    </div>
                    <div class="car-listing-actions">
                        <button class="pill-btn contact-btn" onclick="showContactPopup('${car.id}')">
                            <i data-lucide="mail"></i> Kontakt
                        </button>
                        <button class="pill-btn listing-compare-btn ${inCompare ? 'active' : ''}" data-car-id="${car.id}">
                            <i data-lucide="scale"></i> Primerjaj
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ── Contact Popup Logic ──────────────────────────────────────
window.showContactPopup = function(carId) {
    const car = sampleCars.find(c => c.id === carId);
    if (!car) return;

    const overlay = document.createElement('div');
    overlay.className = 'contact-popup-overlay active';
    overlay.innerHTML = `
        <div class="contact-popup-card">
            <button class="close-btn" style="position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; cursor: pointer; color: #94a3b8;">
                <i data-lucide="x"></i>
            </button>
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <img src="${car.sellerImage}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 4px solid var(--color-primary-start);">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem;">${car.seller}</h3>
                <p style="color: #64748b; font-size: 0.9rem; font-weight: 500;">${car.sellerType === 'dealer' ? 'Pooblaščeni trgovec' : 'Zasebni prodajalec'}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 1.25rem; padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <i data-lucide="map-pin" style="color: var(--color-primary-start);"></i>
                    <span style="font-weight: 600; font-size: 0.9rem;">${car.location}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <i data-lucide="phone" style="color: var(--color-primary-start);"></i>
                    <span style="font-weight: 600; font-size: 0.9rem;">+386 41 123 456</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i data-lucide="mail" style="color: var(--color-primary-start);"></i>
                    <span style="font-weight: 600; font-size: 0.9rem;">info@mojavto.si</span>
                </div>
            </div>

            <button class="pill-btn primary" style="width: 100%;">Pošlji sporočilo</button>
        </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    const closePopup = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePopup();
    });
};

// ── Render All Listings ─────────────────────────────────────
function renderListings(cars) {
    const container = document.getElementById('carListingsContainer');
    if (!container) return;
    container.innerHTML = cars.map(renderCarCard).join('');

    // Init Lucide icons inside the rendered content
    if (window.lucide) window.lucide.createIcons();

    // Bind card click for navigation
    container.querySelectorAll('.car-listing').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking an action button or carousel btn
            if (e.target.closest('.pill-btn') || e.target.closest('.carousel-btn') || e.target.closest('.carousel-dots')) {
                return;
            }
            const carId = card.getAttribute('data-car-id');
            window.location.hash = `#/oglas?id=${carId}`;
        });
    });

    // Bind compare buttons
    container.querySelectorAll('.listing-compare-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const carId = btn.getAttribute('data-car-id');
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

    // Bind carousel logic
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
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIdx);
            });
        }

        prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIdx = (currentIdx - 1 + imagesCount) % imagesCount;
            updateCarousel();
        });

        nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIdx = (currentIdx + 1) % imagesCount;
            updateCarousel();
        });
    });
}

// Removed renderCompareTray - now handled in header.js hover

// ── Page Init ───────────────────────────────────────────────
export function initOglasiPage() {
    console.log('[OglasiPage] init');

    // Render listings
    renderListings(sampleCars);

    // Update header badge from stored state
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

    // Removed tray button listeners as tray is removed

    // Init Lucide icons
    if (window.lucide) window.lucide.createIcons();
}
