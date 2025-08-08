import { translate } from './i18n.js';

export function initAdvancedSearchPage() {
    // === FAZA 1: PREVERJANJE OBSTOJA ELEMENTOV ===
    // Najprej preverimo, ali so vsi ključni elementi prisotni v DOM-u.
    // To prepreči napake, če se skripta zažene, preden je HTML naložen.
    const searchForm = document.getElementById("advancedSearchForm");
    const criteriaContainer = document.getElementById("criteria-container");
    const addCriterionBtn = document.getElementById("addCriterionBtn");
    const addExclusionBtn = document.getElementById("addExclusionBtn");

    // Varnostna prekinitev: če katerega od ključnih elementov ni, prekini izvajanje.
    if (!searchForm || !criteriaContainer || !addCriterionBtn || !addExclusionBtn) {
        console.error("Napaka pri inicializaciji: Eden ali več ključnih elementov za napredno iskanje manjka. Prekinjam izvajanje `advanced-search.js`.");
        return;
    }

    // === FAZA 2: NADALJEVANJE, ČE SO ELEMENTI NAJDENI ===
    
    // --- Ostali DOM Elementi ---
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    const fuelSelect = document.getElementById("fuel");
    const gearboxSelect = document.getElementById("gearbox");
    const electricOptionsRow = document.getElementById("electric-options-row");
    const hybridOptionsRow = document.getElementById("hybrid-options-row");
    const excludeMakeSelect = document.getElementById("exclude-make");
    const excludeModelSelect = document.getElementById("exclude-model");
    const excludeTypeSelect = document.getElementById("exclude-type");
    const excludedItemsContainer = document.getElementById("excluded-items-container");
    
    // --- Podatki ---
    let brandModelData = {};
    let exclusionRules = []; 

    // --- Funkcije za izključitve ---
    function renderExclusionTags() {
        excludedItemsContainer.innerHTML = '';
        exclusionRules.forEach((rule, index) => {
            const tagText = `${rule.make}${rule.model ? ' > ' + rule.model : ''}${rule.type ? ' > ' + rule.type : ''}`;
            const tag = document.createElement('div');
            tag.className = 'excluded-brand-tag'; 
            tag.innerHTML = `<span>${tagText}</span><button type="button" class="remove-brand-btn" data-index="${index}" title="Odstrani">&times;</button>`;
            excludedItemsContainer.appendChild(tag);
        });
        document.querySelectorAll('.remove-brand-btn').forEach(button => {
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
        excludeMakeSelect.value = "";
        excludeModelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        excludeModelSelect.disabled = true;
        excludeTypeSelect.innerHTML = '<option value="">Vsi tipi</option>';
        excludeTypeSelect.disabled = true;
    });

    // --- Glavna logika za dinamične kriterije ---
    const MAX_CRITERIA = 3;
    
    function addCriterionRow() {
        if (criteriaContainer.children.length >= MAX_CRITERIA) return;
        const sortedBrands = Object.keys(brandModelData).sort();
        const criterionRow = document.createElement('div');
        criterionRow.className = 'criterion-row';
        criterionRow.innerHTML = `
            <div class="form-group">
                <label>Znamka</label>
                <select name="make" class="make-select">
                    <option value="">Izberi znamko...</option>
                    ${sortedBrands.map(brand => `<option value="${brand}">${brand}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Model</label>
                <select name="model" class="model-select" disabled>
                    <option value="">Najprej izberite znamko</option>
                </select>
            </div>
            <div class="form-group">
                <label>Tip</label>
                <select name="type" class="type-select" disabled>
                    <option value="">Najprej izberite model</option>
                </select>
            </div>
        `;
        if (criteriaContainer.children.length > 0) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-criterion-btn';
            removeBtn.innerHTML = '&times;';
            criterionRow.appendChild(removeBtn);
        }
        criteriaContainer.appendChild(criterionRow);
        updateAddButtonState();
    }

    function updateAddButtonState() {
        addCriterionBtn.style.display = 'block';
        addCriterionBtn.disabled = criteriaContainer.children.length >= MAX_CRITERIA;
    }
    
    // --- Poslušalci dogodkov ---
    criteriaContainer.addEventListener('change', (e) => {
        const target = e.target;
        const row = target.closest('.criterion-row');
        if (!row) return;
        const makeSelect = row.querySelector('.make-select');
        const modelSelect = row.querySelector('.model-select');
        const typeSelect = row.querySelector('.type-select');
        if (target.classList.contains('make-select')) {
            const selectedMake = target.value;
            modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            modelSelect.disabled = true;
            typeSelect.disabled = true;
            if (selectedMake && brandModelData[selectedMake]) {
                Object.keys(brandModelData[selectedMake]).forEach(model => modelSelect.add(new Option(model, model)));
                modelSelect.disabled = false;
            }
        }
        if (target.classList.contains('model-select')) {
            const selectedMake = makeSelect.value;
            const selectedModel = target.value;
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            typeSelect.disabled = true;
            if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
                brandModelData[selectedMake][selectedModel].forEach(type => typeSelect.add(new Option(type, type)));
                typeSelect.disabled = false;
            }
        }
    });

    criteriaContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-criterion-btn')) {
            e.target.closest('.criterion-row').remove();
            updateAddButtonState();
        }
    });

    addCriterionBtn.addEventListener('click', addCriterionRow);

    fuelSelect.addEventListener('change', () => {
        const isElectric = fuelSelect.value === 'Elektrika';
        gearboxSelect.disabled = isElectric;
        if (isElectric) gearboxSelect.value = 'Avtomatski';
        if (electricOptionsRow) electricOptionsRow.style.display = isElectric ? 'grid' : 'none';
        if (hybridOptionsRow) hybridOptionsRow.style.display = fuelSelect.value === 'Hibrid' ? 'grid' : 'none';
    });

    // --- Oddaja in ponastavitev obrazca ---
    function getCriteriaFromForm() {
        const criteria = {};
        const inclusionCriteria = [];
        document.querySelectorAll('#criteria-container .criterion-row').forEach(row => {
            const make = row.querySelector('.make-select').value;
            const model = row.querySelector('.model-select').value;
            const type = row.querySelector('.type-select').value;
            if (make) {
                const criterion = { make };
                if (model) criterion.model = model;
                if (type) criterion.type = type;
                inclusionCriteria.push(criterion);
            }
        });
        if (inclusionCriteria.length > 0) {
            criteria.inclusionCriteria = inclusionCriteria;
        }
        const formData = new FormData(searchForm);
        for (const [key, value] of formData.entries()) {
            if (['make', 'model', 'type'].includes(key)) continue;
            if (value) {
                if (!criteria[key]) {
                    const allValues = formData.getAll(key).filter(v => v);
                    if (allValues.length > 0) {
                       criteria[key] = allValues.length > 1 ? allValues : allValues[0];
                    }
                }
            }
        }
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
        criteriaContainer.innerHTML = '';
        addCriterionRow();
        gearboxSelect.disabled = false;
        if(electricOptionsRow) electricOptionsRow.style.display = 'none';
        if(hybridOptionsRow) hybridOptionsRow.style.display = 'none';
    });

    // --- Inicializacija podatkov ---
    fetch("./json/brands_models_global.json")
      .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
      })
      .then(data => {
        brandModelData = data;
        addCriterionRow();
        const sortedBrands = Object.keys(brandModelData).sort();
        excludeMakeSelect.innerHTML = '<option value="">Izberi znamko...</option>';
        sortedBrands.forEach(brand => excludeMakeSelect.add(new Option(brand, brand)));
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
      })
      .catch(error => {
          console.error("Napaka pri nalaganju podatkov o znamkah:", error);
          // Lahko prikažete sporočilo uporabniku, da podatki niso na voljo
      });
    
    if (yearFromSelect && yearToSelect) {
        const currentYear = new Date().getFullYear();
        yearFromSelect.innerHTML = '<option value="">Vse</option>';
        yearToSelect.innerHTML = '<option value="">Vse</option>';
        for (let y = currentYear; y >= 1900; y--) {
            yearFromSelect.add(new Option(y, y));
            yearToSelect.add(new Option(y, y));
        }
    }
}