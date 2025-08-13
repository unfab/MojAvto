import { translate } from './i18n.js';
import { createCompareCard } from './components/CompareCard.js';
import { stateManager } from './stateManager.js';
// === NOVO: Uvozimo funkcijo za posodobitev ikone v glavi ===
import { updateCompareIcon } from './ui.js';

export function initComparePage() {
    const comparisonGrid = document.getElementById("comparisonGrid");
    const noSelectionMessage = document.getElementById("noSelectionMessage");
    // === SPREMEMBA: Uporabljamo nove ID-je iz HTML-ja ===
    const compareHeader = document.getElementById("compare-header"); 
    const viewButtonsContainer = document.getElementById("view-controls");
    const clearCompareBtn = document.getElementById("clear-compare-btn");

    function renderComparePage() {
        if (!comparisonGrid || !noSelectionMessage || !viewButtonsContainer || !compareHeader) {
            console.error("Manjka eden od ključnih elementov na strani za primerjavo.");
            return;
        }

        const allListings = stateManager.getListings();
        const { compareItems } = stateManager.getState();

        comparisonGrid.innerHTML = '';

        if (compareItems.length === 0) {
            // === SPREMEMBA: Skrijemo elemente, ko ni izbora ===
            noSelectionMessage.style.display = "block";
            comparisonGrid.style.display = "none";
            viewButtonsContainer.style.display = 'none';
            compareHeader.style.display = 'none'; // Skrijemo tudi glavo z gumbom
            return;
        }

        // === SPREMEMBA: Prikažemo elemente, ko obstaja izbor ===
        noSelectionMessage.style.display = "none";
        comparisonGrid.style.display = "grid";
        viewButtonsContainer.style.display = 'flex';
        compareHeader.style.display = 'flex'; // Prikažemo tudi glavo z gumbom

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
            img.src = img.dataset[view] || 'https://via.placeholder.com/400x250?text=Ni+slike';
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

    comparisonGrid.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-from-compare-btn');
        if (removeButton) {
            const card = removeButton.closest('.comparison-card');
            const listingId = card.dataset.id;
            
            stateManager.toggleCompare(listingId);
            updateCompareIcon();
            renderComparePage();
        }
    });
    
    // === NOVO: Poslušalec dogodkov za gumb "Počisti izbor" ===
    clearCompareBtn.addEventListener('click', () => {
        // Uporabimo novo funkcijo iz stateManager-ja
        stateManager.clearCompareItems();
        // Posodobimo ikono v glavi
        updateCompareIcon();
        // Ponovno izrišemo stran, da se prikaže sporočilo, da ni izbora
        renderComparePage();
    });

    // Prvi zagon prikaza strani
    renderComparePage();
}