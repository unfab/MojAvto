import { translate } from '../i18n.js';

/**
 * Ustvari in vrne HTML element za eno kartico oglasa.
 * @param {object} listing - Objekt z vsemi podatki o oglasu.
 * @returns {HTMLElement} - Element 'article' s celotno vsebino kartice.
 */
export function createListingCard(listing) {
    const card = document.createElement('article');
    card.className = 'listing-card';
    card.dataset.id = listing.id; // Dodamo ID na kartico za lažje upravljanje

    const isElectric = listing.fuel === 'Elektrika';

    // Pripravimo specifične podrobnosti za bencinske/dizelske vs. električne avte
    const specificDetails = isElectric
        ? `
            <div class="spec-item">
                <i class="fas fa-battery-full"></i>
                <span>${listing.battery || '-'} kWh</span>
            </div>
            <div class="spec-item">
                <i class="fas fa-road"></i>
                <span>${listing.range || '-'} km</span>
            </div>
        `
        : `
            <div class="spec-item">
                <i class="fas fa-horse-head"></i>
                <span>${listing.power || '-'} kW</span>
            </div>
            <div class="spec-item">
                <i class="fas fa-gas-pump"></i>
                <span>${listing.consumption || '-'} l/100km</span>
            </div>
        `;

    card.innerHTML = `
        <div class="card-image-container">
            <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/400x250?text=MojAvto.si'}" alt="${listing.title}">
            <div class="card-image-overlay">
                <button class="card-action-btn favorite-btn" title="Dodaj med priljubljene">
                    <i class="far fa-heart"></i>
                </button>
                <button class="card-action-btn compare-btn" title="Dodaj v primerjavo">
                    <i class="fas fa-balance-scale"></i>
                </button>
            </div>
            <span class="card-price">${listing.price.toLocaleString('sl-SI')} €</span>
        </div>
        <div class="card-content">
            <h3 class="card-title">${listing.title}</h3>
            <p class="card-location"><i class="fas fa-map-marker-alt"></i> ${listing.location?.city || 'Neznano'}</p>
            <div class="card-specs">
                <div class="spec-item">
                    <i class="far fa-calendar-alt"></i>
                    <span>${listing.year}</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>${listing.mileage.toLocaleString('sl-SI')} km</span>
                </div>
                ${specificDetails}
                <div class="spec-item">
                    <i class="fas fa-cogs"></i>
                    <span>${listing.transmission}</span>
                </div>
            </div>
        </div>
    `;

    return card;
}