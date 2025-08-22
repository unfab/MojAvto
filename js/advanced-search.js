import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';

const INTERIOR_COLORS = [
    { name: 'Črna', value: 'crna', hex: '#2d3748' },
    { name: 'Siva', value: 'siva', hex: '#a0aec0' },
    { name: 'Bež', value: 'bez', hex: '#f6e05e' },
    { name: 'Rjava', value: 'rjava', hex: '#975a16' },
    { name: 'Bela', value: 'bela', hex: '#ffffff' },
    { name: 'Rdeča', value: 'rdeca', hex: '#e53e3e' }
];

export async function initAdvancedSearchPage(containerElement, prefillCriteria = {}, onSearchCallback) {
    if (!containerElement) {
        console.error("Vsebnik za filtre ni bil podan.");
        return;
    }

    const searchForm = containerElement.querySelector("#advancedSearchForm");
    const criteriaContainer = containerElement.querySelector("#criteria-container");
    const addCriterionBtn = containerElement.querySelector("#addCriterionBtn");
    const addExclusionBtn = containerElement.querySelector("#addExclusionBtn");
    const vehicleTypeGrid = containerElement.querySelector(".vehicle-type-grid");
    const selectAllBodyTypesBtn = containerElement.querySelector("#selectAllBodyTypesBtn");
    const clearAllBodyTypesBtn = containerElement.querySelector("#clearAllBodyTypesBtn");
    const fuelSelect = containerElement.querySelector("#adv-fuel");
    const gearboxSelect = containerElement.querySelector("#adv-gearbox");
    const electricOptionsRow = containerElement.querySelector("#electric-options-row");
    const hybridOptionsRow = containerElement.querySelector("#hybrid-options-row");
    const excludeMakeSelect = containerElement.querySelector("#adv-exclude-make");
    const excludeModelSelect = containerElement.querySelector("#adv-exclude-model");
    const excludeTypeSelect = containerElement.querySelector("#adv-exclude-type");
    const excludedItemsContainer = containerElement.querySelector("#excluded-items-container");
    const colorOptionsContainer = containerElement.querySelector("#color-options-container");

    if (!searchForm || !criteriaContainer || !addCriterionBtn) {
        console.error("Napaka pri inicializaciji: Eden ali več ključnih elementov za napredno iskanje manjka v DOM-u.");
        return;
    }

    const brandModelData = stateManager.getBrands();
    let exclusionRules = prefillCriteria.exclusionRules || [];
    const sortedBrands = Object.keys(brandModelData).sort();

    function renderColorOptions() {
        if (!colorOptionsContainer) return;
        let html = '';
        INTERIOR_COLORS.forEach(color => {
            html += `
                <label class="color-option" for="color-${color.value}" title="${color.name}">
                    <input type="radio" id="color-${color.value}" name="interior_color" value="${color.value}">
                    <span class="color-swatch" style="--swatch-color: ${color.hex};"></span>
                </label>
            `;
        });
        colorOptionsContainer.innerHTML = html;
    }

    function renderExclusionTags() {
        if (!excludedItemsContainer) return;
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

    const MAX_CRITERIA = 3;

    function addCriterionRow(criterion = null) {
        if (!criteriaContainer || criteriaContainer.children.length >= MAX_CRITERIA) return;
        const rowId = `criterion-row-${criteriaContainer.children.length}`;
        const criterionRow = document.createElement('div');
        criterionRow.className = 'criterion-row';
        criterionRow.id = rowId;
        criterionRow.innerHTML = `
            <div class="form-group">
                <label for="${rowId}-make">Znamka</label>
                <select id="${rowId}-make" name="make" class="make-select">
                    <option value="">Izberi znamko...</option>
                    ${sortedBrands.map(brand => `<option value="${brand}">${brand}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="${rowId}-model">Model</label>
                <select id="${rowId}-model" name="model" class="model-select" disabled>
                    <option value="">Najprej izberite znamko</option>
                </select>
            </div>
            <div class="form-group">
                <label for="${rowId}-type">Tip</label>
                <select id="${rowId}-type" name="type" class="type-select" disabled>
                    <option value="">Najprej izberite model</option>
                </select>
            </div>`;
        if (criteriaContainer.children.length > 0) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-criterion-btn';
            removeBtn.innerHTML = '&times;';
            criterionRow.appendChild(removeBtn);
        }
        criteriaContainer.appendChild(criterionRow);
        updateAddButtonState();

        if (criterion) {
            const makeSelect = criterionRow.querySelector('.make-select');
            makeSelect.value = criterion.make || '';
            makeSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                const modelSelect = criterionRow.querySelector('.model-select');
                modelSelect.value = criterion.model || '';
                modelSelect.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    const typeSelect = criterionRow.querySelector('.type-select');
                    typeSelect.value = criterion.type || '';
                }, 100);
            }, 100);
        }
    }

    function updateAddButtonState() {
        if (!addCriterionBtn) return;
        addCriterionBtn.style.display = criteriaContainer.children.length < MAX_CRITERIA ? 'block' : 'none';
        addCriterionBtn.disabled = criteriaContainer.children.length >= MAX_CRITERIA;
    }

    function updateBodyTypeButtons() {
        if (!vehicleTypeGrid) return;
        const activeTypes = vehicleTypeGrid.querySelectorAll('.vehicle-type.active');
        const hasSelection = activeTypes.length > 0;
        if (clearAllBodyTypesBtn) clearAllBodyTypesBtn.style.display = hasSelection ? 'inline-block' : 'none';
        if (selectAllBodyTypesBtn) selectAllBodyTypesBtn.style.display = hasSelection ? 'none' : 'inline-block';
    }

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
        if (inclusionCriteria.length > 0) criteria.inclusionCriteria = inclusionCriteria;
        
        if (vehicleTypeGrid) {
            const selectedBodyTypes = Array.from(vehicleTypeGrid.querySelectorAll('.vehicle-type.active')).map(el => el.dataset.type);
            if (selectedBodyTypes.length > 0) criteria.body_type = selectedBodyTypes;
        }

        const formData = new FormData(searchForm);
        for (const [key, value] of formData.entries()) {
            if (['make', 'model', 'type'].includes(key) || !value) continue;
            const allValues = formData.getAll(key).filter(v => v);
            if (!criteria[key] && allValues.length > 0) {
                criteria[key] = allValues.length > 1 ? allValues : allValues[0];
            }
        }
        if (exclusionRules.length > 0) criteria.exclusionRules = exclusionRules;
        return criteria;
    }
    
    function prefillForm(criteria) {
        if (!criteria || Object.keys(criteria).length === 0) {
            criteriaContainer.innerHTML = '';
            addCriterionRow();
            return;
        }
        
        for (const key in criteria) {
            const elements = searchForm.elements[key];
            if (!elements) continue;
            
            const value = criteria[key];
            if (elements.length && (elements[0].type === 'checkbox' || elements[0].type === 'radio')) {
                const values = Array.isArray(value) ? value : [value];
                elements.forEach(el => {
                    if(values.includes(el.value)) {
                        el.checked = true;
                    }
                });
            } else if (elements.tagName === 'SELECT') {
                elements.value = value;
            } else {
                elements.value = value;
            }
        }

        if (criteria.body_type && Array.isArray(criteria.body_type) && vehicleTypeGrid) {
            criteria.body_type.forEach(type => {
                const el = vehicleTypeGrid.querySelector(`[data-type="${type}"]`);
                if (el) el.classList.add('active');
            });
            updateBodyTypeButtons();
        }

        criteriaContainer.innerHTML = '';
        if (criteria.inclusionCriteria && criteria.inclusionCriteria.length > 0) {
            criteria.inclusionCriteria.forEach(crit => addCriterionRow(crit));
        } else if (criteria.make) {
            addCriterionRow({ make: criteria.make, model: criteria.model, type: criteria.type });
        } else {
            addCriterionRow();
        }
        
        renderExclusionTags();
    }

    if (addExclusionBtn) {
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
                Object.keys(brandModelData[selectedMake]).sort().forEach(model => modelSelect.add(new Option(model, model)));
                modelSelect.disabled = false;
            }
        }
        if (target.classList.contains('model-select')) {
            const selectedMake = makeSelect.value;
            const selectedModel = target.value;
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            typeSelect.disabled = true;
            if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
                brandModelData[selectedMake][selectedModel].sort().forEach(type => typeSelect.add(new Option(type, type)));
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

    addCriterionBtn.addEventListener('click', () => addCriterionRow(null));

    if (vehicleTypeGrid) {
        vehicleTypeGrid.addEventListener('click', (e) => {
            const targetType = e.target.closest('.vehicle-type');
            if (targetType) {
                targetType.classList.toggle('active');
                updateBodyTypeButtons();
            }
        });
    }

    if(selectAllBodyTypesBtn) {
        selectAllBodyTypesBtn.addEventListener('click', () => {
            if(vehicleTypeGrid) vehicleTypeGrid.querySelectorAll('.vehicle-type').forEach(type => type.classList.add('active'));
            updateBodyTypeButtons();
        });
    }

    if(clearAllBodyTypesBtn) {
        clearAllBodyTypesBtn.addEventListener('click', () => {
            if(vehicleTypeGrid) vehicleTypeGrid.querySelectorAll('.vehicle-type.active').forEach(type => type.classList.remove('active'));
            updateBodyTypeButtons();
        });
    }

    if (fuelSelect) {
        fuelSelect.addEventListener('change', () => {
            const isElectric = fuelSelect.value === 'Elektrika';
            if (gearboxSelect) gearboxSelect.disabled = isElectric;
            if (isElectric && gearboxSelect) gearboxSelect.value = 'Avtomatski';
            if (electricOptionsRow) electricOptionsRow.style.display = isElectric ? 'grid' : 'none';
            if (hybridOptionsRow) hybridOptionsRow.style.display = fuelSelect.value === 'Hibrid' ? 'grid' : 'none';
        });
    }

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchCriteria = getCriteriaFromForm();
        sessionStorage.setItem('searchCriteria', JSON.stringify(searchCriteria));
        
        if (typeof onSearchCallback === 'function') {
            onSearchCallback(searchCriteria);
        } else {
            window.location.hash = '#/search-results';
        }
    });

    searchForm.addEventListener('reset', () => {
        exclusionRules = [];
        renderExclusionTags();
        criteriaContainer.innerHTML = '';
        addCriterionRow();
        if(vehicleTypeGrid) vehicleTypeGrid.querySelectorAll('.vehicle-type.active').forEach(el => el.classList.remove('active'));
        updateBodyTypeButtons();
        if(gearboxSelect) gearboxSelect.disabled = false;
        if(electricOptionsRow) electricOptionsRow.style.display = 'none';
        if(hybridOptionsRow) hybridOptionsRow.style.display = 'none';
    });
    
    if (excludeMakeSelect) {
        excludeMakeSelect.innerHTML = '<option value="">Izberi znamko...</option>';
        sortedBrands.forEach(brand => excludeMakeSelect.add(new Option(brand, brand)));
        
        excludeMakeSelect.addEventListener("change", function() {
            const selectedMake = this.value;
            excludeModelSelect.innerHTML = '<option value="">Vsi modeli</option>';
            excludeTypeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            excludeModelSelect.disabled = true;
            excludeTypeSelect.disabled = true;
            if (selectedMake && brandModelData[selectedMake]) {
                Object.keys(brandModelData[selectedMake]).sort().forEach(model => excludeModelSelect.add(new Option(model, model)));
                excludeModelSelect.disabled = false;
            }
        });

        excludeModelSelect.addEventListener("change", function() {
            const selectedMake = excludeMakeSelect.value;
            const selectedModel = this.value;
            excludeTypeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            excludeTypeSelect.disabled = true;
            if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
                brandModelData[selectedMake][selectedModel].sort().forEach(type => excludeTypeSelect.add(new Option(type, type)));
                excludeTypeSelect.disabled = false;
            }
        });
    }
    
    const yearSelects = document.querySelectorAll('select[name="yearFrom"], select[name="yearTo"]');
    if (yearSelects.length > 0) {
        const currentYear = new Date().getFullYear();
        yearSelects.forEach(select => {
            select.innerHTML = '<option value="">Vse</option>';
            for (let y = currentYear; y >= 1900; y--) {
                select.add(new Option(y, y));
            }
        });
    }

    renderColorOptions();
    prefillForm(prefillCriteria);
}