import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';

// Struktura opreme, kopirana iz advanced-search za doslednost
const equipmentDefinition = {
    "Varnost": ["Alarmna naprava", "Nadzor zračnega tlaka (TPMS)", "ISOFIX pritrdišča", "Meglenke", "Sistem za klic v sili (eCall)", "Zračne zavese"],
    "Asistenčni sistemi": ["Aktivni tempomat", "Sistem za ohranjanje voznega pasu", "Opozarjanje na mrtvi kot", "Samodejno zaviranje v sili", "Prepoznavanje prometnih znakov", "Parkirni senzorji", "Parkirna kamera (360°)", "Sistem za samodejno parkiranje", "Head-up zaslon", "Night Vision"],
    "Udobje & Notranjost": ["Avtomatska klimatska naprava", "Ogrevani sedeži", "Prezračevani/hlajeni sedeži", "Masažni sedeži", "Gretje volana", "Električni sedeži s spominom", "Keyless Go", "Ambientalna osvetlitev", "Senzor za dež", "Električno poklopna ogledala", "Digitalni števci", "Hlajen predal", "Webasto", "Usnjeni sedeži", "Alcantara sedeži", "Delno usnje"],
    "Videz & Zunanjost": ["LED / Matrix žarometi", "Aluminijasta platišča", "Vlečna kljuka", "Panoramska streha", "Športni paket", "Zatemnjena stekla", "Strešne sani", "Električni prtljažnik", "Ogrevano prednje steklo"],
    "Multimedija & Povezljivost": ["Navigacijski sistem", "Apple CarPlay / Android Auto", "Bluetooth", "Digitalni radio (DAB+)", "Brezžično polnjenje telefona", "Premium ozvočenje", "Upravljanje z gestami", "Wi-Fi Hotspot"],
    "Podvozje & Pogon": ["Športno podvozje", "Zračno vzmetenje", "Štirikolesni pogon", "Zapora diferenciala", "Prilagodljivo vzmetenje", "Štirikolesno krmiljenje"]
};

export function initCreateListingPage() {
    // === DOM Elementi ===
    const listingForm = document.getElementById("listingForm");
    if (!listingForm) return;

    const formTitle = document.getElementById("form-title");
    const submitBtn = document.getElementById("submitBtn");
    const brandSelect = document.getElementById("listing-brand");
    const modelSelect = document.getElementById("listing-model");
    const typeSelect = document.getElementById("listing-type");
    const yearSelect = document.getElementById("listing-year");
    const fuelSelect = document.getElementById("listing-fuel");
    const electricFields = document.getElementById("electric-fields");
    const equipmentContainer = document.getElementById("equipment-container");
    const exteriorImageInput = document.getElementById("images-exterior");
    const interiorImageInput = document.getElementById("images-interior");
    const exteriorPreviewContainer = document.getElementById("preview-exterior");
    const interiorPreviewContainer = document.getElementById("preview-interior");
    const financingYesRadio = document.getElementById('financing-yes');
    const financingNoRadio = document.getElementById('financing-no');
    const financingOptionsContainer = document.getElementById('financing-options-container');
    const financingImageInput = document.getElementById('financing-images');
    const financingPreview = document.getElementById('financing-preview');

    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser) {
        showNotification(translate('must_be_logged_in_to_create'), 'error');
        window.location.hash = '#/login';
        return;
    }

    // === Dinamično generiranje opreme ===
    function renderEquipment() {
        equipmentContainer.innerHTML = '';
        for (const category in equipmentDefinition) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'equipment-category';
            
            let itemsHTML = '';
            equipmentDefinition[category].forEach(item => {
                // Ustvarimo unikaten ID za vsak checkbox
                const itemId = `equip-${item.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
                itemsHTML += `
                    <label for="${itemId}">
                        <input type="checkbox" id="${itemId}" name="equipment" value="${item}"> ${item}
                    </label>
                `;
            });

            categoryDiv.innerHTML = `
                <h4>${category}</h4>
                <div class="equipment-grid">${itemsHTML}</div>
            `;
            equipmentContainer.appendChild(categoryDiv);
        }
    }
    
    // === Polnjenje obrazca (za urejanje) ===
    function populateForm(listing) {
        formTitle.textContent = translate('page_title_edit_listing');
        submitBtn.textContent = translate('save_changes');
        
        brandSelect.value = listing.make;
        brandSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
            modelSelect.value = listing.model;
            modelSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                typeSelect.value = listing.type || '';
            }, 100);
        }, 100);

        listingForm.querySelector('#listing-price').value = listing.price;
        listingForm.querySelector('#listing-year').value = listing.year;
        listingForm.querySelector('#listing-mileage').value = listing.mileage;
        listingForm.querySelector('#listing-power').value = listing.power;
        listingForm.querySelector('#listing-fuel').value = listing.fuel;
        listingForm.querySelector('#listing-transmission').value = listing.transmission;
        listingForm.querySelector('#listing-phone').value = listing.phone || '';
        listingForm.querySelector('#listing-description').value = listing.description;
        listingForm.querySelector('#listing-videoUrl').value = listing.videoUrl || '';

        if (listing.fuel === 'Elektrika') {
            electricFields.style.display = 'grid';
            listingForm.querySelector('#listing-battery').value = listing.specs?.battery || '';
            listingForm.querySelector('#listing-range').value = listing.specs?.range || '';
        }

        if (listing.equipment && Array.isArray(listing.equipment)) {
            listing.equipment.forEach(item => {
                const itemId = `equip-${item.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
                const checkbox = document.getElementById(itemId);
                if (checkbox) checkbox.checked = true;
            });
        }

        if (listing.financing && listing.financing.available) {
            financingYesRadio.checked = true;
            financingOptionsContainer.style.display = 'block';
            if (listing.financing.options) {
                listing.financing.options.forEach(option => {
                    const checkbox = document.querySelector(`input[name="financingOptions"][value="${option}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            listingForm.querySelector('#financing-description').value = listing.financing.description || '';
        } else {
            financingNoRadio.checked = true;
            financingOptionsContainer.style.display = 'none';
        }
    }
    
    // === Inicializacija obrazca ===
    renderEquipment();

    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = `<option value="">${translate('form_select_year')}</option>`;
    for (let y = currentYear; y >= 1950; y--) {
        yearSelect.add(new Option(y, y));
    }

    const brandModelData = stateManager.getBrands();
    Object.keys(brandModelData).sort().forEach(brand => {
        brandSelect.add(new Option(brand, brand));
    });

    brandSelect.addEventListener("change", function () {
        const selectedMake = this.value;
        modelSelect.innerHTML = `<option value="">${translate('select_brand_first')}</option>`;
        typeSelect.innerHTML = `<option value="">${translate('select_model_first')}</option>`;
        modelSelect.disabled = true;
        typeSelect.disabled = true;
        if (selectedMake && brandModelData[selectedMake]) {
            Object.keys(brandModelData[selectedMake]).sort().forEach(model => modelSelect.add(new Option(model, model)));
            modelSelect.disabled = false;
        }
    });

    modelSelect.addEventListener("change", function () {
        const selectedMake = brandSelect.value;
        const selectedModel = this.value;
        typeSelect.innerHTML = `<option value="">${translate('select_model_first')}</option>`;
        typeSelect.disabled = true;
        if (selectedModel && brandModelData[selectedMake]?.[selectedModel]) {
            brandModelData[selectedMake][selectedModel].sort().forEach(type => typeSelect.add(new Option(type, type)));
            typeSelect.disabled = false;
        }
    });

    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const isEditMode = urlParams.get('edit') === 'true';
    const listingToEditId = sessionStorage.getItem('listingToEditId');

    if (isEditMode && listingToEditId) {
        const listingToEdit = stateManager.getListingById(listingToEditId);
        if (listingToEdit) {
            populateForm(listingToEdit);
        }
    }

    fuelSelect.addEventListener('change', () => {
        electricFields.style.display = fuelSelect.value === 'Elektrika' ? 'grid' : 'none';
    });
    
    financingYesRadio.addEventListener('change', () => financingOptionsContainer.style.display = 'block');
    financingNoRadio.addEventListener('change', () => financingOptionsContainer.style.display = 'none');

    function handleImagePreview(inputElement, previewContainer) {
        previewContainer.innerHTML = '';
        Array.from(inputElement.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'image-preview-wrapper';
                const img = document.createElement('img');
                img.src = e.target.result;
                imgWrapper.appendChild(img);
                previewContainer.appendChild(imgWrapper);
            };
            reader.readAsDataURL(file);
        });
    }

    exteriorImageInput.addEventListener("change", () => handleImagePreview(exteriorImageInput, exteriorPreviewContainer));
    interiorImageInput.addEventListener("change", () => handleImagePreview(interiorImageInput, interiorPreviewContainer));
    financingImageInput.addEventListener("change", () => handleImagePreview(financingImageInput, financingPreview));

    // === Logika ob oddaji obrazca ===
    listingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = translate('saving');

        const formData = new FormData(listingForm);
        const data = Object.fromEntries(formData.entries());
        const selectedEquipment = formData.getAll('equipment');

        // Avtomatsko generiranje naslova
        const title = `${data.brand} ${data.model} ${data.type || ''}`.trim();

        // Priprava podatkov
        let financingData = { available: data.financingAvailable === 'yes' };
        if (financingData.available) {
            financingData.options = formData.getAll('financingOptions');
            financingData.description = data.financingDescription || '';
        }

        const newListingData = {
            make: data.brand,
            model: data.model,
            type: data.type,
            title: title,
            price: parseInt(data.price, 10),
            year: parseInt(data.year, 10),
            mileage: parseInt(data.mileage, 10),
            power: parseInt(data.power, 10),
            fuel: data.fuel,
            transmission: data.transmission,
            phone: data.phone,
            description: data.description,
            videoUrl: data.videoUrl || '',
            equipment: selectedEquipment,
            financing: financingData,
            specs: {
                battery: data.battery ? parseInt(data.battery, 10) : undefined,
                range: data.range ? parseInt(data.range, 10) : undefined,
            }
        };

        if (isEditMode && listingToEditId) {
            const existingListing = stateManager.getListingById(listingToEditId);
            const updatedListing = { ...existingListing, ...newListingData };
            stateManager.updateListing(updatedListing);
            sessionStorage.removeItem('listingToEditId');
            showNotification(translate('listing_updated_successfully'), 'success');
            window.location.hash = `#/listing/${listingToEditId}`;
        } else {
            const finalNewListing = {
                ...newListingData,
                id: Date.now(),
                author: loggedInUser.username,
                date_added: new Date().toISOString(),
                location: { region: loggedInUser.region },
                isFeatured: false
            };
            stateManager.addListing(finalNewListing);
            showNotification(translate('listing_created_successfully'), 'success');
            window.location.hash = '#/';
        }
    });
}