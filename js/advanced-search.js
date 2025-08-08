import { translate } from './i18n.js';

export function initAdvancedSearchPage() {
    // === DOM ELEMENTI ===
    const searchForm = document.getElementById("advancedSearchForm");
    
    // --- NOVI ELEMENTI ZA IZBIRO VEČ ZNAMK ---
    const makeContainer = document.getElementById("make-container");
    const addMakeBtn = document.getElementById("addMakeBtn");
    const MAX_MAKES = 3;

    // Elementi za vključitev (model in tip ostajata)
    const modelSelect = document.getElementById("model");
    const typeSelect = document.getElementById("type");
    
    // Elementi za ključne kriterije
    const yearFromSelect = document.getElementById("year-from");
    const yearToSelect = document.getElementById("year-to");
    // Elementi za gorivo
    const fuelSelect = document.getElementById("fuel");
    const electricOptionsRow = document.getElementById("electric-options-row");
    const hybridOptionsRow = document.getElementById("hybrid-options-row");
    // Elementi za izključitev
    const excludeMakeSelect = document.getElementById("exclude-make");
    const excludeModelSelect = document.getElementById("exclude-model");
    const excludeTypeSelect = document.getElementById("exclude-type");
    const addExclusionBtn = document.getElementById("addExclusionBtn");
    const excludedItemsContainer = document.getElementById("excluded-items-container");
    
    // === PODATKI ===
    let brandModelData = {};
    let exclusionRules = []; // Seznam pravil za izključitev

    // --- FUNKCIJE ZA UPRAVLJANJE Z IZKLJUČITVAMI (ostane nespremenjeno) ---
    function renderExclusionTags() {
        excludedItemsContainer.innerHTML = '';
        exclusionRules.forEach((rule, index) => {
            const tagText = `${rule.make}${rule.model ? ' > ' + rule.model : ''}${rule.type ? ' > ' + rule.type : ''}`;
            const tag = document.createElement('div');
            // Uporaba obstoječega stila za tage izključitev
            tag.className = 'excluded-brand-tag'; 
            tag.innerHTML = `<span>${tagText}</span><button type="button" class="remove-brand-btn" data-index="${index}" title="Odstrani">&times;</button>`;
            excludedItemsContainer.appendChild(tag);
        });
        addRemoveTagListeners();
    }

    function addRemoveTagListeners() {
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

    // --- LOGIKA ZA POLNJENJE OBRAZCA ---
    fetch("./json/brands_models_global.json")
      .then(res => res.json())
      .then(data => {
        brandModelData = data;
        const sortedBrands = Object.keys(brandModelData).sort();
        
        // --- LOGIKA ZA IZBIRO VEČ ZNAMK (NADOMEŠČA STARO) ---
        
        /** Ustvari in doda novo vrstico za izbiro znamke */
        const addMakeSelector = () => {
            if (makeContainer.children.length >= MAX_MAKES) return;

            const row = document.createElement('div');
            row.className = 'make-selector-row';

            const select = document.createElement('select');
            select.name = 'make'; // Ime je 'make', da ga `new FormData` pravilno zajame
            select.className = 'make-select';
            select.innerHTML = `<option value="">Izberi znamko...</option>` +
                sortedBrands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
            
            row.appendChild(select);

            if (makeContainer.children.length > 0) {
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-make-btn';
                removeBtn.innerHTML = '&times;';
                row.appendChild(removeBtn);
            }

            makeContainer.appendChild(row);
            updateBrandFormState();
        };

        /** Posodobi stanje obrazca glede na izbrane znamke */
        const updateBrandFormState = () => {
            const selectedMakes = Array.from(makeContainer.querySelectorAll('.make-select'))
                .map(s => s.value).filter(v => v);

            addMakeBtn.style.display = 'block';
            addMakeBtn.disabled = makeContainer.children.length >= MAX_MAKES;
            
            if (selectedMakes.length === 1) {
                const selectedMake = selectedMakes[0];
                modelSelect.disabled = false;
                typeSelect.disabled = true;
                modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
                typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
                if (brandModelData[selectedMake]) {
                    Object.keys(brandModelData[selectedMake]).forEach(model => modelSelect.add(new Option(model, model)));
                }
            } else {
                modelSelect.disabled = true;
                typeSelect.disabled = true;
                const message = selectedMakes.length > 1 ? 'Izbranih več znamk' : 'Najprej izberite znamko';
                modelSelect.innerHTML = `<option value="">${message}</option>`;
                typeSelect.innerHTML = `<option value="">${message}</option>`;
            }
        };

        // Event listenerji za dinamične elemente
        addMakeBtn.addEventListener('click', addMakeSelector);
        
        makeContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('make-select')) {
                updateBrandFormState();
            }
        });

        makeContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-make-btn')) {
                event.target.closest('.make-selector-row').remove();
                updateBrandFormState();
            }
        });

        // Prva inicializacija
        addMakeSelector();
        
        // Poslušalec za model, da napolni tipe (ta logika ostane, ker je vezana na eno znamko)
        modelSelect.addEventListener("change", function () {
            const selectedMakes = Array.from(makeContainer.querySelectorAll('.make-select'))
                .map(s => s.value).filter(v => v);

            if (selectedMakes.length !== 1) return; // Nadaljuj samo, če je izbrana ena znamka
            
            const selectedMake = selectedMakes[0];
            const selectedModel = this.value;
            typeSelect.innerHTML = '<option value="">Vsi tipi</option>';
            typeSelect.disabled = true;

            if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
                brandModelData[selectedMake][selectedModel].forEach(type => typeSelect.add(new Option(type, type)));
                typeSelect.disabled = false;
            }
        });
        
        // --- KONEC NOVE LOGIKE ZA ZNAMKE ---
        
        // Logika za polja za izključitev (ostane nespremenjena)
        excludeMakeSelect.innerHTML = '<option value="">Izberi znamko...</option>';
        sortedBrands.forEach(brand => {
            excludeMakeSelect.add(new Option(brand, brand));
        });

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
    
    // Polnjenje letnic (ostane nespremenjeno)
    if (yearFromSelect && yearToSelect) {
        const currentYear = new Date().getFullYear();
        yearFromSelect.innerHTML = '<option value="">Vse</option>';
        yearToSelect.innerHTML = '<option value="">Vse</option>';
        for (let y = currentYear; y >= 1900; y--) {
            yearFromSelect.add(new Option(y, y));
            yearToSelect.add(new Option(y, y));
        }
    }

    // Prikaz polj za električna in hibridna vozila (ostane nespremenjeno)
    fuelSelect.addEventListener('change', () => {
        const electricRow = document.getElementById('electric-options-row');
        const hybridRow = document.getElementById('hybrid-options-row');
        if (!electricRow || !hybridRow) return;

        if (fuelSelect.value === 'Elektrika') {
            electricRow.style.display = 'grid';
            hybridRow.style.display = 'none';
        } else if (fuelSelect.value === 'Hibrid') {
            electricRow.style.display = 'none';
            hybridRow.style.display = 'grid';
        } else {
            electricRow.style.display = 'none';
            hybridRow.style.display = 'none';
        }
    });

    // --- ODDAJA OBRAZCA ---
    function getCriteriaFromForm() {
        const formData = new FormData(searchForm);
        const criteria = {};
        
        // Ta funkcija že pravilno deluje z več vrednostmi za isti ključ (npr. 'make')
        for (const [key, value] of formData.entries()) {
            if (value) { // Dodamo samo, če vrednost ni prazna
                 if (!criteria[key]) {
                    const allValues = formData.getAll(key).filter(v => v); // Filtriramo prazne vrednosti
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
        
        // --- POSODOBITEV ZA RESETIRANJE NOVIH POLJ ---
        makeContainer.innerHTML = ''; // Počisti vse izbirnike znamk
        // Ponovno zaženi logiko za dodajanje prvega izbirnika
        const firstSelectorRow = document.createElement('div');
        firstSelectorRow.className = 'make-selector-row';
        const firstSelect = document.createElement('select');
        firstSelect.name = 'make';
        firstSelect.className = 'make-select';
        firstSelect.innerHTML = `<option value="">Izberi znamko...</option>` +
            Object.keys(brandModelData).sort().map(brand => `<option value="${brand}">${brand}</option>`).join('');
        firstSelectorRow.appendChild(firstSelect);
        makeContainer.appendChild(firstSelectorRow);
        
        // Ročno ponastavi še ostala polja
        modelSelect.innerHTML = '<option value="">Najprej izberite znamko</option>';
        modelSelect.disabled = true;
        typeSelect.innerHTML = '<option value="">Najprej izberite znamko</option>';
        typeSelect.disabled = true;
        
        const electricRow = document.getElementById('electric-options-row');
        const hybridRow = document.getElementById('hybrid-options-row');
        if(electricRow) electricRow.style.display = 'none';
        if(hybridRow) hybridRow.style.display = 'none';
    });
}