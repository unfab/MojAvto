import { translate } from './i18n.js';
import { renderMap } from './maps.js';
import { createCompareCard } from './components/CompareCard.js';
// === POSODOBLJENO: Uvozimo funkcijo iz dataService ===
import { getListings } from './dataService.js';

export function initComparePage() {
    const comparisonGrid = document.getElementById("comparisonGrid");
    const noSelectionMessage = document.getElementById("noSelectionMessage");
    const viewButtonsContainer = document.querySelector('.global-view-controls');

    if (!comparisonGrid || !noSelectionMessage || !viewButtonsContainer) {
        console.error("Manjka eden od ključnih elementov na strani za primerjavo.");
        return;
    }

    // === POSODOBLJENO: Seznam vseh oglasov dobimo iz dataService ===
    const allListings = getListings();
    // Seznam ID-jev za primerjavo še vedno beremo iz localStorage, kar je pravilno
    const comparedIds = JSON.parse(localStorage.getItem("mojavto_compareItems")) || [];

    if (comparedIds.length === 0) {
        noSelectionMessage.style.display = "block";
        comparisonGrid.style.display = "none";
        viewButtonsContainer.style.display = 'none';
        return;
    }

    noSelectionMessage.style.display = "none";
    comparisonGrid.style.display = "grid";
    viewButtonsContainer.style.display = 'block';
    comparisonGrid.innerHTML = ''; 

    const itemsToCompare = allListings.filter(listing => comparedIds.includes(String(listing.id)));

    itemsToCompare.forEach(item => {
        const card = createCompareCard(item);
        comparisonGrid.appendChild(card);
    });
    
    itemsToCompare.forEach(item => {
        if (item.location) {
            renderMap(`map-${item.id}`, item.location.lat, item.location.lng);
        }
    });

    function toggleAllViews(view) {
        viewButtonsContainer.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        document.querySelectorAll('.comparison-card img').forEach(img => {
            img.src = img.dataset[view] || img.src;
        });
    }

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