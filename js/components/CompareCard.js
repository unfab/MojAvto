import { translate } from '../i18n.js';

/**
 * Ustvari in vrne HTML element za eno kartico oglasa na primerjalni strani.
 * @param {object} item - Objekt z vsemi podatki o oglasu.
 * @returns {HTMLElement} - Element 'div' s celotno vsebino kartice.
 */
export function createCompareCard(item) {
    const card = document.createElement("div");
    card.className = "comparison-card";

    const detailsHTML = `
        <ul class="comparison-details">
            <li><span class="label">${translate('spec_year')}</span><span class="value">${item.year || '-'}</span></li>
            <li><span class="label">${translate('spec_mileage')}</span><span class="value">${item.mileage ? item.mileage.toLocaleString('sl-SI') + ' km' : '-'}</span></li>
            <li><span class="label">${translate('spec_fuel')}</span><span class="value">${item.fuel || '-'}</span></li>
            <li><span class="label">${translate('spec_power')}</span><span class="value">${item.power ? item.power + ' kW' : '-'}</span></li>
            <li><span class="label">${translate('spec_gearbox')}</span><span class="value">${item.transmission || '-'}</span></li>
            ${item.fuel === 'Elektrika' ? `
            <li><span class="label">${translate('spec_battery')}</span><span class="value">${item.battery ? item.battery + ' kWh' : '-'}</span></li>
            <li><span class="label">${translate('spec_range')}</span><span class="value">${item.range ? item.range + ' km' : '-'}</span></li>
            ` : ''}
        </ul>
    `;

    card.innerHTML = `
        <img src="${item.images?.exterior[0] || 'https://via.placeholder.com/400x250?text=Zunanjost'}" 
             alt="${item.title}"
             data-exterior="${item.images?.exterior[0] || 'https://via.placeholder.com/400x250?text=Zunanjost'}"
             data-interior="${item.images?.interior[0] || 'https://via.placeholder.com/400x250?text=Notranjost'}">
        <div class="comparison-content">
            <h3>${item.title}</h3>
            <p class="price">${item.price.toLocaleString('sl-SI')} €</p>
            ${detailsHTML}
        </div>
        <div class="card-map">
            <div id="map-${item.id}" class="map-placeholder" style="width:100%; height:150px;"></div>
        </div>
    `;

    return card;
}