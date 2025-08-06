import { translate } from './i18n.js';

export function initAdvancedSearchPage() {
    // === DOM ELEMENTI ===
    const searchForm = document.getElementById("advancedSearchForm");
    // Elementi za vključitev
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const typeSelect = document.getElementById("type");
    // Elementi za ključne kriterije
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    // Elementi za gorivo
    const fuelSelect = document.getElementById("fuel");
    const electricOptionsRow = document.getElementById("electric-options-row");
    // Elementi za izključitev
    const excludeMakeSelect = document.getElementById("exclude-make");
    const excludeModelSelect = document.getElementById("exclude-model");
    const excludeTypeSelect = document.getElementById("exclude-type");
    const addExclusionBtn = document.getElementById("addExclusionBtn");
    const excludedItemsContainer = document.getElementById("excluded-items-container");
    
    // === PODATKI ===
    let brandModelData = {};
    let exclusionRules = []; // Seznam pravil za izključitev

    // --- FUNKCIJE ZA UPRAVLJANJE Z IZKLJUČITVAMI ---
    function renderExclusionTags() {
        excludedItemsContainer.innerHTML = '';
        exclusionRules.forEach((rule, index) => {
            const tagText = `${rule.make}${rule.model ? ' > ' + rule.model : ''}${rule.type ? ' > ' + rule.type : ''}`;
            const tag = document.createElement('div');
            tag.className = 'excluded-item-tag';
            tag.innerHTML = `<span>${tagText}</span><button type="button" class="remove-item-btn" data-index="${index}" title="Odstrani">&times;</button>`;
            excludedItemsContainer.appendChild(tag);
        });
        addRemoveTagListeners();
    }

    function addRemoveTagListeners() {
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.currentTarget.dataset.index, 10);
                exclusionRules.splice(indexToRemove, 1);
                renderExclusionTags();
            });
        });
    }

    addExclusionBtn.addEventListener('click', () => {
        const make = excludeMakeSelect.value;
        const model = excludeModelSelect.value;
        const type = excludeTypeSelect.value;
        if (!make) return;

        const newRule = { make };
        if (model) newRule.model = model;
        if (type) newRule.type = type;

        if (!exclusionRules.some(rule => JSON.stringify(rule) === JSON.stringify(newRule))) {
            exclusionRules.push(newRule);
            renderExclusionTags();
        }
        // Resetiraj izbiro
        excludeMakeSelect.value = "";
        excludeModelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        excludeModelSelect.disabled = true;
        excludeTypeSelect.innerHTML = '<option value="">Vsi tipi</option>';
        excludeTypeSelect.disabled = true;
    });

    // --- LOGIKA ZA POLNJENJE OBRAZCA ---
    fetch("./json/brands_models_global.json")
      .then(res => res.json())
      .then(data => {
        brandModelData = data;
        const sortedBrands = Object.keys(brandModelData).sort();
        
        // Ponastavi spustne sezname
        makeSelect.innerHTML = '<option value="">Vse znamke</option>';
        excludeMakeSelect.innerHTML = '<option value="">Izberi znamko...</option>';

        sortedBrands.forEach(brand => {
            makeSelect.add(new Option(brand, brand));
            excludeMakeSelect.add(new Option(brand, brand));
        });
        
        // Povezovanje spustnih seznamov za VKLJUČITEV
        makeSelect.addEventListener("change", function () {
            const selectedMake = this.value;
            modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            modelSelect.disabled = true;
            typeSelect.disabled = true;
            if (selectedMake && brandModelData[selectedMake]) {
                Object.keys(brandModelData[selectedMake]).forEach(model => modelSelect.add(new Option(model, model)));
                modelSelect.disabled = false;
            }
        });
        modelSelect.addEventListener("change", function () {
            const selectedMake = makeSelect.value;
            const selectedModel = this.value;
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            typeSelect.disabled = true;
            if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
                brandModelData[selectedMake][selectedModel].forEach(type => typeSelect.add(new Option(type, type)));
                typeSelect.disabled = false;
            }
        });

        // Povezovanje spustnih seznamov za IZKLJUČITEV
        excludeMakeSelect.addEventListener("change", function() {
            const selectedMake = this.value;
            excludeModelSelect.innerHTML = '<option value="">Vsi modeli</option>';
            excludeTypeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            excludeModelSelect.disabled = true;
            excludeTypeSelect.disabled = true;
            if (selectedMake && brandModelData[selectedMake]) {
                Object.keys(brandModelData[selectedMake]).forEach(model => excludeModelSelect.add(new Option(model, model)));
                excludeModelSelect.disabled = false;
            }
        });
        excludeModelSelect.addEventListener("change", function() {
            const selectedMake = excludeMakeSelect.value;
            const selectedModel = this.value;
            excludeTypeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            excludeTypeSelect.disabled = true;
            if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
                brandModelData[selectedMake][selectedModel].forEach(type => excludeTypeSelect.add(new Option(type, type)));
                excludeTypeSelect.disabled = false;
            }
        });
      });
    
    // Polnjenje letnic
    if (yearFromSelect && yearToSelect) {
        const currentYear = new Date().getFullYear();
        yearFromSelect.innerHTML = '<option value="">Vse</option>';
        yearToSelect.innerHTML = '<option value="">Vse</option>';
        for (let y = currentYear; y >= 1980; y--) {
            yearFromSelect.add(new Option(y, y));
            yearToSelect.add(new Option(y, y));
        }
    }

    // Prikaz polj za električna vozila
    fuelSelect.addEventListener('change', () => {
        if (fuelSelect.value === 'Elektrika') {
            electricOptionsRow.style.display = 'grid';
        } else {
            electricOptionsRow.style.display = 'none';
        }
    });

    // --- ODDAJA OBRAZCA ---
    function getCriteriaFromForm() {
        const formData = new FormData(searchForm);
        const criteria = Object.fromEntries(formData.entries());
        if (exclusionRules.length > 0) {
            criteria.exclusionRules = exclusionRules;
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
        exclusionRules = [];
        renderExclusionTags();
        // Resetiraj tudi ostale dinamične selecte
        modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        modelSelect.disabled = true;
        typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
        typeSelect.disabled = true;
    });
}