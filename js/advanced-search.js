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

export async function initAdvancedSearchPage(prefillCriteria = {}, onSearchCallback) {
    console.log('Initializing advanced search page...'); // Dodan logging

    const searchForm = document.getElementById("advancedSearchForm");
    if (!searchForm) {
        console.error("Advanced search form not found in DOM"); // Dodan logging
        return;
    }
    
    const criteriaContainer = searchForm.querySelector("#criteria-container");
    const addCriterionBtn = searchForm.querySelector("#addCriterionBtn");
    const addExclusionBtn = searchForm.querySelector("#addExclusionBtn");
    const vehicleTypeGrid = searchForm.querySelector(".vehicle-type-grid");
    const selectAllBodyTypesBtn = searchForm.querySelector("#selectAllBodyTypesBtn");
    const clearAllBodyTypesBtn = searchForm.querySelector("#clearAllBodyTypesBtn");
    const fuelSelect = searchForm.querySelector("#adv-fuel");
    const gearboxSelect = searchForm.querySelector("#adv-gearbox");
    const electricOptionsRow = searchForm.querySelector("#electric-options-row");
    const hybridOptionsRow = searchForm.querySelector("#hybrid-options-row");
    const excludeMakeSelect = searchForm.querySelector("#adv-exclude-make");
    const excludeModelSelect = searchForm.querySelector("#adv-exclude-model");
    const excludeTypeSelect = searchForm.querySelector("#adv-exclude-type");
    const excludedItemsContainer = searchForm.querySelector("#excluded-items-container");
    const colorOptionsContainer = searchForm.querySelector("#color-options-container");

    // Dodano debugiranje za vse DOM elemente
    console.log('Found DOM elements:', {
        criteriaContainer: !!criteriaContainer,
        addCriterionBtn: !!addCriterionBtn,
        addExclusionBtn: !!addExclusionBtn,
        vehicleTypeGrid: !!vehicleTypeGrid,
        selectAllBodyTypesBtn: !!selectAllBodyTypesBtn,
        clearAllBodyTypesBtn: !!clearAllBodyTypesBtn,
        fuelSelect: !!fuelSelect,
        gearboxSelect: !!gearboxSelect,
        electricOptionsRow: !!electricOptionsRow,
        hybridOptionsRow: !!hybridOptionsRow,
        excludeMakeSelect: !!excludeMakeSelect,
        excludeModelSelect: !!excludeModelSelect,
        excludeTypeSelect: !!excludeTypeSelect,
        excludedItemsContainer: !!excludedItemsContainer,
        colorOptionsContainer: !!colorOptionsContainer
    });

    if (!criteriaContainer || !addCriterionBtn) {
        console.error("Napaka pri inicializaciji: Eden ali več ključnih elementov za napredno iskanje manjka v DOM-u.");
        return;
    }

    const brandModelData = stateManager.getBrands();
    console.log('Loaded brand data:', Object.keys(brandModelData).length, 'brands'); // Dodan logging
    
    let exclusionRules = prefillCriteria.exclusionRules || [];
    const sortedBrands = Object.keys(brandModelData).sort();

    function renderColorOptions() {
        console.log('Rendering color options...'); // Dodan logging
        if (!colorOptionsContainer) {
            console.error('Color options container not found!'); // Dodan logging
            return;
        }
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
        console.log('Color options rendered successfully'); // Dodan logging
    }

    function renderExclusionTags() {
        console.log('Rendering exclusion tags...'); // Dodan logging
        if (!excludedItemsContainer) {
            console.error('Excluded items container not found!'); // Dodan logging
            return;
        }
        excludedItemsContainer.innerHTML = '';
        exclusionRules.forEach((rule, index) => {
            const tagText = `${rule.make}${rule.model ? ' > ' + rule.model : ''}${rule.type ? ' > ' + rule.type : ''}`;
            const tag = document.createElement('div');
            tag.className = 'excluded-brand-tag';
            tag.innerHTML = `<span>${tagText}</span><button type="button" class="remove-brand-btn" data-index="${index}" title="Odstrani">&times;</button>`;
            excludedItemsContainer.appendChild(tag);
        });
        console.log('Exclusion tags rendered:', exclusionRules.length, 'rules'); // Dodan logging

        document.querySelectorAll('.remove-brand-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.currentTarget.dataset.index, 10);
                console.log('Removing exclusion rule at index:', indexToRemove); // Dodan logging
                exclusionRules.splice(indexToRemove, 1);
                renderExclusionTags();
            });
        });
    }

    const MAX_CRITERIA = 3;

    function addCriterionRow(criterion = null) {
        console.log('Adding criterion row:', criterion); // Dodan logging
        if (!criteriaContainer || criteriaContainer.children.length >= MAX_CRITERIA) {
            console.warn('Cannot add more criteria rows:', {
                containerExists: !!criteriaContainer,
                currentCount: criteriaContainer?.children.length,
                maxAllowed: MAX_CRITERIA
            });
            return;
        }

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
        console.log('Criterion row added successfully:', rowId); // Dodan logging

        if (criterion) {
            console.log('Prefilling criterion:', criterion); // Dodan logging
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
        const currentCount = criteriaContainer.children.length;
        console.log('Updating add button state:', { currentCount, maxAllowed: MAX_CRITERIA }); // Dodan logging
        addCriterionBtn.style.display = currentCount < MAX_CRITERIA ? 'block' : 'none';
        addCriterionBtn.disabled = currentCount >= MAX_CRITERIA;
    }

    function updateBodyTypeButtons() {
        if (!vehicleTypeGrid) return;
        const activeTypes = vehicleTypeGrid.querySelectorAll('.vehicle-type.active');
        const hasSelection = activeTypes.length > 0;
        console.log('Updating body type buttons:', { 
            activeTypesCount: activeTypes.length,
            hasSelection 
        }); // Dodan logging
        if (clearAllBodyTypesBtn) clearAllBodyTypesBtn.style.display = hasSelection ? 'inline-block' : 'none';
        if (selectAllBodyTypesBtn) selectAllBodyTypesBtn.style.display = hasSelection ? 'none' : 'inline-block';
    }

    function getCriteriaFromForm() {
        console.log('Getting criteria from form...'); // Dodan logging
        const criteria = {};
        const inclusionCriteria = [];

        searchForm.querySelectorAll('#criteria-container .criterion-row').forEach(row => {
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
        
        console.log('Collected form criteria:', criteria); // Dodan logging
        return criteria;
    }
    
    function prefillForm(criteria) {
        console.log('Prefilling form with criteria:', criteria); // Dodan logging
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
        console.log('Form prefilled successfully'); // Dodan logging
    }

    // Event Listeners
    if (addExclusionBtn) {
        addExclusionBtn.addEventListener('click', () => {
            console.log('Adding exclusion rule...'); // Dodan logging
            const make = excludeMakeSelect.value;
            const model = excludeModelSelect.value;
            const type = excludeTypeSelect.value;
            if (!make) return;
            const newRule = { make };
            if (model) newRule.model = model;
            if (type) newRule.type = type;
            if (!exclusionRules.some(rule => JSON.stringify(rule) === JSON.stringify(newRule))) {
                exclusionRules.push(newRule);
                console.log('New exclusion rule added:', newRule); // Dodan logging
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

        console.log('Criterion row changed:', { 
            targetClass: target.className,
            rowId: row.id
        }); // Dodan logging

        const makeSelect = row.querySelector('.make-select');
        const modelSelect = row.querySelector('.model-select');
        const typeSelect = row.querySelector('.type-select');

        if (target.classList.contains('make-select')) {
            const selectedMake = target.value;
            console.log('Make selected:', selectedMake); // Dodan logging
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
            console.log('Model selected:', { make: selectedMake, model: selectedModel }); // Dodan logging
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
            console.log('Removing criterion row'); // Dodan logging
            e.target.closest('.criterion-row').remove();
            updateAddButtonState();
        }
    });

    addCriterionBtn.addEventListener('click', () => {
        console.log('Add criterion button clicked'); // Dodan logging
        addCriterionRow(null);
    });

    if (vehicleTypeGrid) {
        vehicleTypeGrid.addEventListener('click', (e) => {
            const targetType = e.target.closest('.vehicle-type');
            if (targetType) {
                console.log('Vehicle type clicked:', targetType.dataset.type); // Dodan logging
                targetType.classList.toggle('active');
                updateBodyTypeButtons();
            }
        });
    }

    if(selectAllBodyTypesBtn) {
        selectAllBodyTypesBtn.addEventListener('click', () => {
            console.log('Selecting all body types'); // Dodan logging
            if(vehicleTypeGrid) vehicleTypeGrid.querySelectorAll('.vehicle-type').forEach(type => type.classList.add('active'));
            updateBodyTypeButtons();
        });
    }

    if(clearAllBodyTypesBtn) {
        clearAllBodyTypesBtn.addEventListener('click', () => {
            console.log('Clearing all body types'); // Dodan logging
            if(vehicleTypeGrid) vehicleTypeGrid.querySelectorAll('.vehicle-type.active').forEach(type => type.classList.remove('active'));
            updateBodyTypeButtons();
        });
    }

    if (fuelSelect) {
        fuelSelect.addEventListener('change', () => {
            const isElectric = fuelSelect.value === 'Elektrika';
            const isHybrid = fuelSelect.value === 'Hibrid';
            console.log('Fuel type changed:', { isElectric, isHybrid }); // Dodan logging
            
            if (gearboxSelect) gearboxSelect.disabled = isElectric;
            if (isElectric && gearboxSelect) gearboxSelect.value = 'Avtomatski';
            if (electricOptionsRow) electricOptionsRow.style.display = isElectric ? 'grid' : 'none';
            if (hybridOptionsRow) hybridOptionsRow.style.display = isHybrid ? 'grid' : 'none';
        });
        fuelSelect.dispatchEvent(new Event('change'));
    }

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log('Form submitted'); // Dodan logging
        const searchCriteria = getCriteriaFromForm();
        console.log('Search criteria:', searchCriteria); // Dodan logging
        
        sessionStorage.setItem('searchCriteria', JSON.stringify(searchCriteria));
        
        if (typeof onSearchCallback === 'function') {
            onSearchCallback(searchCriteria);
        } else {
            window.location.hash = '#/search-results';
        }
    });

    searchForm.addEventListener('reset', (e) => {
        e.preventDefault();
        console.log('Resetting form'); // Dodan logging
        searchForm.reset();
        
        exclusionRules = [];
        renderExclusionTags();
        criteriaContainer.innerHTML = '';
        addCriterionRow();
        if(vehicleTypeGrid) vehicleTypeGrid.querySelectorAll('.vehicle-type.active').forEach(el => el.classList.remove('active'));
        updateBodyTypeButtons();
        if(gearboxSelect) gearboxSelect.disabled = false;
        
        if (fuelSelect) {
            fuelSelect.dispatchEvent(new Event('change'));
        }
    });
    
    if (excludeMakeSelect) {
        excludeMakeSelect.innerHTML = '<option value="">Izberi znamko...</option>';
        sortedBrands.forEach(brand => excludeMakeSelect.add(new Option(brand, brand)));
        
        excludeMakeSelect.addEventListener("change", function() {
            const selectedMake = this.value;
            console.log('Exclude make selected:', selectedMake); // Dodan logging
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
            console.log('Exclude model selected:', { make: selectedMake, model: selectedModel }); // Dodan logging
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
        console.log('Initializing year selects:', { currentYear }); // Dodan logging
        yearSelects.forEach(select => {
            select.innerHTML = '<option value="">Vse</option>';
            for (let y = currentYear; y >= 1900; y--) {
                select.add(new Option(y, y));
            }
        });
    }
    
    console.log('Setting up initial state...'); // Dodan logging
    renderColorOptions();
    prefillForm(prefillCriteria);
    console.log('Advanced search page initialized successfully'); // Dodan logging
}