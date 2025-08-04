export function initComparePage() {
    const comparisonGrid = document.getElementById("comparisonGrid");
    const noSelectionMessage = document.getElementById("noSelectionMessage");

    // Preverimo, da elementi obstajajo, preden nadaljujemo
    if (!comparisonGrid || !noSelectionMessage) return;

    const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
    const comparedIds = JSON.parse(localStorage.getItem("mojavto_compareItems")) || [];

    if (comparedIds.length === 0) {
        noSelectionMessage.style.display = "block";
        comparisonGrid.style.display = "none";
        return;
    }

    noSelectionMessage.style.display = "none";
    comparisonGrid.style.display = "grid";
    comparisonGrid.innerHTML = ''; // Počistimo morebitno staro vsebino

    const itemsToCompare = allListings.filter(listing => comparedIds.includes(listing.id));

    itemsToCompare.forEach(item => {
        const card = document.createElement("div");
        card.className = "comparison-card";

        // SPREMEMBA: Uporaba translate() funkcije za oznake
        const detailsHTML = `
            <ul class="comparison-details">
                <li><span class="label">${translate('spec_year')}</span><span class="value">${item.year || '-'}</span></li>
                <li><span class="label">${translate('spec_mileage')}</span><span class="value">${item.mileage ? item.mileage.toLocaleString() + ' km' : '-'}</span></li>
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
            <img src="${item.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${item.title}">
            <div class="comparison-content">
                <h3>${item.title}</h3>
                <p class="price">${item.price.toLocaleString()} €</p>
                ${detailsHTML}
            </div>
        `;

        comparisonGrid.appendChild(card);
    });
}