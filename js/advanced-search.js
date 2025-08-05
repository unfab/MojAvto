import { translate } from './i18n.js';

export function initAdvancedSearchPage() {
    // DOM ELEMENTI
    const searchForm = document.getElementById("advancedSearchForm");
    const makeSelect = document.getElementById("make");
    const excludeMakeSelect = document.getElementById("exclude-make");
    const modelSelect = document.getElementById("model");
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    
    // === POSODOBLJENA LOGIKA ZA POLNJENJE LETNIC ===
    if (yearFromSelect && yearToSelect) {
        const currentYear = new Date().getFullYear();
        // Ponastavimo obe polji in dodamo prvo opcijo
        yearFromSelect.innerHTML = '<option value="">Vse</option>';
        yearToSelect.innerHTML = '<option value="">Vse</option>';

        for (let y = currentYear; y >= 1980; y--) {
            const optionFrom = document.createElement('option');
            optionFrom.value = y;
            optionFrom.textContent = y;
            yearFromSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = y;
            optionTo.textContent = y;
            yearToSelect.appendChild(optionTo);
        }
    }
    // ===============================================

    // Logika za znamke in modele
    fetch("./json/brands_models_global.json")
      .then(res => res.json())
      .then(brandModelData => {
        // Napolnimo obe select polji (za vključitev in izključitev)
        Object.keys(brandModelData).sort().forEach(brand => {
            const optionInclude = document.createElement("option");
            optionInclude.value = brand;
            optionInclude.textContent = brand;
            makeSelect.appendChild(optionInclude);

            const optionExclude = document.createElement("option");
            optionExclude.value = brand;
            optionExclude.textContent = brand;
            excludeMakeSelect.appendChild(optionExclude);
        });
        
        makeSelect.addEventListener("change", function () {
            const selectedMake = this.value;
            modelSelect.innerHTML = `<option value="">Vsi modeli</option>`;
            modelSelect.disabled = true;
            if (selectedMake && brandModelData[selectedMake]) {
                const models = Object.keys(brandModelData[selectedMake]);
                models.forEach(model => {
                    const option = document.createElement("option");
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });
                modelSelect.disabled = false;
            }
        });
      });

    // Funkcija, ki zbere vse kriterije iz obrazca
    function getCriteriaFromForm() {
        const formData = new FormData(searchForm);
        const criteria = {};
        for (const [key, value] of formData.entries()) {
            if (value) {
                criteria[key] = value;
            }
        }
        
        const excludedMakes = Array.from(excludeMakeSelect.selectedOptions).map(option => option.value);
        if (excludedMakes.length > 0) {
            criteria.excludedMakes = excludedMakes;
        }

        return criteria;
    }

    // Dogodek ob oddaji obrazca
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchCriteria = getCriteriaFromForm();
        sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(searchCriteria));
        window.location.hash = '#/';
    });
}