import { translate } from './i18n.js';
import { createCompareCard } from './components/CompareCard.js';
import { stateManager } from './stateManager.js';
// === NOVO: Uvozimo funkcijo za posodobitev ikone v glavi ===
import { updateCompareIcon } from '../ui.js';

export function initComparePage() {
    const comparisonGrid = document.getElementById("comparisonGrid");
    const noSelectionMessage = document.getElementById("noSelectionMessage");
    const viewButtonsContainer = document.querySelector('.global-view-controls');

    // === SPREMEMBA: Logiko za prikaz smo prestavili v lastno funkcijo ===
    function renderComparePage() {
        if (!comparisonGrid || !noSelectionMessage || !viewButtonsContainer) {
            console.error("Manjka eden od ključnih elementov na strani za primerjavo.");
            return;
        }

        const allListings = stateManager.getListings();
        const { compareItems } = stateManager.getState();

        // Počistimo obstoječo vsebino
        comparisonGrid.innerHTML = '';

        if (compareItems.length === 0) {
            noSelectionMessage.style.display = "block";
            comparisonGrid.style.display = "none";
            viewButtonsContainer.style.display = 'none';
            return;
        }

        noSelectionMessage.style.display = "none";
        comparisonGrid.style.display = "grid";
        viewButtonsContainer.style.display = 'flex'; // Uporabimo flex za poravnavo

        const itemsToCompare = allListings.filter(listing => compareItems.includes(String(listing.id)));

        itemsToCompare.forEach(item => {
            const card = createCompareCard(item);
            comparisonGrid.appendChild(card);
        });
    }

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

    // === NOVO: Poslušalec dogodkov za odstranjevanje oglasov ===
    comparisonGrid.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-from-compare-btn');
        if (removeButton) {
            const card = removeButton.closest('.comparison-card');
            const listingId = card.dataset.id;
            
            // Uporabimo stateManager za odstranitev oglasa iz stanja
            stateManager.toggleCompare(listingId);
            
            // Posodobimo ikono v glavi
            updateCompareIcon();

            // Ponovno izrišemo stran, da se sprememba takoj prikaže
            renderComparePage();
        }
    });

    // === Prvi zagon prikaza strani ===
    renderComparePage();
}