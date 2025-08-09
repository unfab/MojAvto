import { translate } from './i18n.js';
// POSODOBLJENO: Uvozimo tudi renderMap, če ga boste uporabljali
import { renderMap } from './maps.js';

export function initComparePage() {
    const comparisonGrid = document.getElementById("comparisonGrid");
    const noSelectionMessage = document.getElementById("noSelectionMessage");
    // DODANO: Referenca na gumbe za preklop pogleda
    const viewButtonsContainer = document.querySelector('.global-view-controls');

    // Preverimo, da elementi obstajajo, preden nadaljujemo
    if (!comparisonGrid || !noSelectionMessage || !viewButtonsContainer) {
        console.error("Manjka eden od ključnih elementov na strani za primerjavo.");
        return;
    }

    // Uporabimo vašo logiko za pridobivanje podatkov iz localStorage
    const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
    const comparedIds = JSON.parse(localStorage.getItem("mojavto_compareItems")) || [];

    if (comparedIds.length === 0) {
        noSelectionMessage.style.display = "block";
        comparisonGrid.style.display = "none";
        // DODANO: Skrijemo tudi gumbe, če ni izbora
        viewButtonsContainer.style.display = 'none';
        return;
    }

    noSelectionMessage.style.display = "none";
    comparisonGrid.style.display = "grid";
    viewButtonsContainer.style.display = 'block';
    comparisonGrid.innerHTML = ''; // Počistimo morebitno staro vsebino

    const itemsToCompare = allListings.filter(listing => comparedIds.includes(listing.id));

    itemsToCompare.forEach(item => {
        const card = document.createElement("div");
        card.className = "comparison-card";

        // Uporabimo vašo logiko za prevajanje in pripravo podrobnosti
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

        // POSODOBLJENO: V <img> dodamo data- atribute za preklop slik
        // in na konec dodamo div za zemljevid
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

        comparisonGrid.appendChild(card);
    });
    
    // DODANO: Po izrisu kartic, inicializiramo zemljevide
    itemsToCompare.forEach(item => {
        if (item.location) {
            renderMap(`map-${item.id}`, item.location.lat, item.location.lng);
        }
    });

    /**
     * DODANA FUNKCIJA: Upravlja preklapljanje med zunanjostjo in notranjostjo.
     * @param {string} view - 'exterior' ali 'interior'
     */
    function toggleAllViews(view) {
        viewButtonsContainer.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        document.querySelectorAll('.comparison-card img').forEach(img => {
            img.src = img.dataset[view] || img.src; // Uporabi img.dataset.exterior ali img.dataset.interior
        });
    }

    // DODANO: Poslušalec dogodkov za gumbe za preklop pogleda
    viewButtonsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.view-btn');
        if (button) {
            const view = button.dataset.view;
            if (view) {
                toggleAllViews(view);
            }
        }
    });
}