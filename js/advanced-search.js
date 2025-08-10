import { translate } from './i18n.js';
import { getBrands } from './dataService.js';

// === SPREMEMBA: Funkcija je sedaj 'async' ===
export async function initAdvancedSearchPage() {
    // === FAZA 1: PREVERJANJE OBSTOJA ELEMENTOV ===
    const searchForm = document.getElementById("advancedSearchForm");
    const criteriaContainer = document.getElementById("criteria-container");
    const addCriterionBtn = document.getElementById("addCriterionBtn");
    const addExclusionBtn = document.getElementById("addExclusionBtn");
    const vehicleTypeGrid = document.querySelector(".vehicle-type-grid");
    const selectAllBodyTypesBtn = document.getElementById("selectAllBodyTypesBtn");
    const clearAllBodyTypesBtn = document.getElementById("clearAllBodyTypesBtn");

    if (!searchForm || !criteriaContainer || !addCriterionBtn || !addExclusionBtn || !vehicleTypeGrid || !selectAllBodyTypesBtn || !clearAllBodyTypesBtn) {
        console.error("Napaka pri inicializaciji: Eden ali več ključnih elementov za napredno iskanje manjka.");
        return;
    }

    // === FAZA 2: NADALJEVANJE, ČE SO ELEMENTI NAJDENI ===
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
    
    // === SPREMEMBA: Podatke pridobimo asinhrono in počakamo nanje ===
    const brandModelData = await getBrands();
    let exclusionRules = []; 

    if (!brandModelData || Object.keys(brandModelData).length === 0) {
        console.error("Podatki o znamkah niso na voljo iz dataService za napredno iskanje.");
        if(addCriterionBtn) addCriterionBtn.disabled = true;
        if(addExclusionBtn) addExclusionBtn.disabled = true;
        return;
    }

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
    
    function updateBodyTypeButtons() {
        const activeTypes = vehicleTypeGrid.querySelectorAll('.vehicle-type.active');
        const hasSelection = activeTypes.length > 0;
        
        clearAllBodyTypesBtn.style.display = hasSelection ? 'inline-block' : 'none';
        selectAllBodyTypesBtn.style.display = hasSelection ? 'none' : 'inline-block';
    }

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

    vehicleTypeGrid.addEventListener('click', (e) => {
        const targetType = e.target.closest('.vehicle-type');
        if (targetType) {
            targetType.classList.toggle('active');
            updateBodyTypeButtons();
        }
    });

    selectAllBodyTypesBtn.addEventListener('click', () => {
        vehicleTypeGrid.querySelectorAll('.vehicle-type').forEach(type => {
            type.classList.add('active');
        });
        updateBodyTypeButtons();
    });

    clearAllBodyTypesBtn.addEventListener('click', () => {
        vehicleTypeGrid.querySelectorAll('.vehicle-type.active').forEach(type => {
            type.classList.remove('active');
        });
        updateBodyTypeButtons();
    });

    fuelSelect.addEventListener('change', () => {
        const isElectric = fuelSelect.value === 'Elektrika';
        gearboxSelect.disabled = isElectric;
        if (isElectric) gearboxSelect.value = 'Avtomatski';
        if (electricOptionsRow) electricOptionsRow.style.display = isElectric ? 'grid' : 'none';
        if (hybridOptionsRow) hybridOptionsRow.style.display = fuelSelect.value === 'Hibrid' ? 'grid' : 'none';
    });

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

        const selectedBodyTypes = Array.from(vehicleTypeGrid.querySelectorAll('.vehicle-type.active'))
            .map(el => el.dataset.type);
        if (selectedBodyTypes.length > 0) {
            criteria.body_type = selectedBodyTypes;
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
        window.location.hash = '#/search-results';
    });

    searchForm.addEventListener('reset', () => {
        exclusionRules = [];
        renderExclusionTags();
        criteriaContainer.innerHTML = '';
        addCriterionRow();
        
        vehicleTypeGrid.querySelectorAll('.vehicle-type.active').forEach(el => el.classList.remove('active'));
        updateBodyTypeButtons();

        gearboxSelect.disabled = false;
        if(electricOptionsRow) electricOptionsRow.style.display = 'none';
        if(hybridOptionsRow) hybridOptionsRow.style.display = 'none';
    });
    
    // Inicializacija forme
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