import { translate } from './i18n.js';

export function initAdvancedSearchPage() {
    // === DOM ELEMENTI ===
    const searchForm = document.getElementById("advancedSearchForm");
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    
    // === NOVI ELEMENTI ZA IZKLJUČITEV ===
    const excludeMakeInput = document.getElementById("exclude-make-input");
    const excludedBrandsContainer = document.getElementById("excluded-brands-container");
    
    // === SPREMENLJIVKA ZA HRANJENJE IZKLJUČENIH ZNAMK ===
    let excludedBrands = [];

    // --- FUNKCIJE ZA UPRAVLJANJE Z IZKLJUČENIMI ZNAMKAMI ---

    // Funkcija, ki prikaže "značke" izključenih znamk
    function renderExcludedTags() {
        excludedBrandsContainer.innerHTML = ''; // Počistimo obstoječe
        excludedBrands.forEach(brand => {
            const tag = document.createElement('div');
            tag.className = 'excluded-brand-tag';
            tag.innerHTML = `
                <span>${brand}</span>
                <button type="button" class="remove-brand-btn" data-brand="${brand}" title="Odstrani">&times;</button>
            `;
            excludedBrandsContainer.appendChild(tag);
        });

        // Dodamo poslušalce na nove gumbe za odstranjevanje
        addRemoveTagListeners();
    }

    // Funkcija, ki doda poslušalce na 'x' gumbe
    function addRemoveTagListeners() {
        document.querySelectorAll('.remove-brand-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const brandToRemove = e.currentTarget.dataset.brand;
                excludedBrands = excludedBrands.filter(b => b !== brandToRemove);
                renderExcludedTags();
            });
        });
    }

    // Dogodek, ko uporabnik izbere znamko iz spustnega seznama
    excludeMakeInput.addEventListener('change', (e) => {
        const selectedBrand = e.target.value;
        if (selectedBrand && !excludedBrands.includes(selectedBrand)) {
            excludedBrands.push(selectedBrand);
            renderExcludedTags();
        }
        // Po izbiri ponastavimo spustni seznam
        e.target.value = '';
    });

    // --- LOGIKA ZA POLNJENJE OBRAZCA ---
    fetch("./json/brands_models_global.json")
      .then(res => res.json())
      .then(brandModelData => {
        const sortedBrands = Object.keys(brandModelData).sort();
        
        sortedBrands.forEach(brand => {
            // Polnimo seznam za vključitev
            const optionInclude = document.createElement("option");
            optionInclude.value = brand;
            optionInclude.textContent = brand;
            makeSelect.appendChild(optionInclude);

            // Polnimo nov seznam za izključitev
            const optionExclude = document.createElement("option");
            optionExclude.value = brand;
            optionExclude.textContent = brand;
            excludeMakeInput.appendChild(optionExclude);
        });
        
        makeSelect.addEventListener("change", function () { /* ... koda za polnjenje modelov ... */ });
      });
    
    // ... obstoječa koda za polnjenje letnic ...

    // --- ODDAJA OBRAZCA ---
    function getCriteriaFromForm() {
        const formData = new FormData(searchForm);
        const criteria = {};
        for (const [key, value] of formData.entries()) {
            if (value) criteria[key] = value;
        }
        
        // Dodamo seznam izključenih znamk h kriterijem
        if (excludedBrands.length > 0) {
            criteria.excludedMakes = excludedBrands;
        }
        return criteria;
    }

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchCriteria = getCriteriaFromForm();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(searchCriteria));
        window.location.hash = '#/';
    });

    searchForm.addEventListener('reset', () => {
        excludedBrands = [];
        renderExcludedTags();
    });
}