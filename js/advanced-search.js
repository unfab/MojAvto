import { translate } from './i18n.js';

export function initAdvancedSearchPage() {
    // === DOM ELEMENTI ===
    const searchForm = document.getElementById("advancedSearchForm");
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const typeSelect = document.getElementById("type"); // NOVO
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    const fuelSelect = document.getElementById("fuel"); // NOVO
    const rangeGroup = document.getElementById("range-group"); // NOVO
    const excludeMakeInput = document.getElementById("exclude-make-input");
    const excludedBrandsContainer = document.getElementById("excluded-brands-container");
    
    let excludedBrands = [];

    // --- FUNKCIJE ZA IZKLJUČEVANJE ZNAMK (ostanejo enake) ---
    function renderExcludedTags() { /* ... koda ostane enaka ... */ }
    function addRemoveTagListeners() { /* ... koda ostane enaka ... */ }
    excludeMakeInput.addEventListener('change', () => { /* ... koda ostane enaka ... */ });


    // --- LOGIKA ZA POLNJENJE OBRAZCA ---
    fetch("./json/brands_models_global.json")
      .then(res => res.json())
      .then(brandModelData => {
        const sortedBrands = Object.keys(brandModelData).sort();
        
        sortedBrands.forEach(brand => {
            makeSelect.add(new Option(brand, brand));
            excludeMakeInput.add(new Option(brand, brand));
        });
        
        // SPREMEMBA: Logika za polnjenje modelov IN tipov
        makeSelect.addEventListener("change", function () {
            const selectedMake = this.value;
            modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>'; // Počisti tudi tipe
            modelSelect.disabled = true;
            typeSelect.disabled = true;

            if (selectedMake && brandModelData[selectedMake]) {
                const models = Object.keys(brandModelData[selectedMake]);
                models.forEach(model => modelSelect.add(new Option(model, model)));
                modelSelect.disabled = false;
            }
        });

        // NOVO: Dogodek ob spremembi modela, ki napolni tipe
        modelSelect.addEventListener("change", function () {
            const selectedMake = makeSelect.value;
            const selectedModel = this.value;
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            typeSelect.disabled = true;

            if (selectedModel && brandModelData[selectedMake] && brandModelData[selectedMake][selectedModel]) {
                const types = brandModelData[selectedMake][selectedModel];
                types.forEach(type => typeSelect.add(new Option(type, type)));
                typeSelect.disabled = false;
            }
        });
      });
    
    // ... koda za polnjenje letnic ostane enaka ...

    // NOVO: Dogodek ob spremembi goriva za prikaz dometa
    fuelSelect.addEventListener('change', () => {
        if (fuelSelect.value === 'Elektrika') {
            rangeGroup.style.display = 'block';
        } else {
            rangeGroup.style.display = 'none';
        }
    });

    // --- ODDAJA OBRAZCA (funkcija ostane enaka) ---
    function getCriteriaFromForm() { /* ... koda ostane enaka ... */ }
    searchForm.addEventListener("submit", (e) => { /* ... koda ostane enaka ... */ });
    searchForm.addEventListener('reset', () => { /* ... koda ostane enaka ... */ });
}