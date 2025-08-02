document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';
    const listingToEditId = sessionStorage.getItem('listingToEditId');
    
    const listingForm = document.getElementById("listingForm");
    const formTitle = document.getElementById("form-title");
    const submitBtn = document.getElementById("submitBtn");
    const brandSelect = document.getElementById("brand");
    const modelSelect = document.getElementById("model");
    const typeSelect = document.getElementById("type");
    const yearSelect = document.getElementById("year");
    const fuelSelect = document.getElementById("fuel");
    const electricFields = document.getElementById("electric-fields");
    const imageInput = document.getElementById("images");
    const previewContainer = document.getElementById("preview");

    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        alert(translate('must_be_logged_in_to_create'));
        window.location.href = "login.html";
        return;
    }

    function populateForm(listing) {
        formTitle.textContent = translate('page_title_edit_listing');
        submitBtn.textContent = translate('save_changes');

        listingForm.title.value = listing.title;
        listingForm.price.value = listing.price;
        listingForm.year.value = listing.year;
        listingForm.mileage.value = listing.mileage;
        listingForm.power.value = listing.power;
        listingForm.fuel.value = listing.fuel;
        listingForm.transmission.value = listing.transmission;
        listingForm.phone.value = listing.phone || '';
        listingForm.description.value = listing.description;
        listingForm.brand.value = listing.make;
        
        listingForm.brand.dispatchEvent(new Event('change'));
        setTimeout(() => {
            listingForm.model.value = listing.model;
            listingForm.model.dispatchEvent(new Event('change'));
            setTimeout(() => {
                listingForm.type.value = listing.type;
            }, 100);
        }, 100);
    }

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    fetch("json/brands_models_global.json")
      .then(res => res.json())
      .then(brandModelData => {
        Object.keys(brandModelData).sort().forEach(brand => {
            const option = document.createElement("option");
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });

        brandSelect.addEventListener("change", function () {
            const selectedBrand = this.value;
            modelSelect.innerHTML = `<option value="">${translate('select_model') || 'Izberi model'}</option>`;
            typeSelect.innerHTML = `<option value="">${translate('select_type_first') || 'Najprej izberi model'}</option>`;
            modelSelect.disabled = true;
            typeSelect.disabled = true;

            if (selectedBrand && brandModelData[selectedBrand]) {
                const models = brandModelData[selectedBrand];
                const modelKeys = Array.isArray(models) ? models : Object.keys(models);
                modelKeys.forEach(model => {
                    const opt = document.createElement("option");
                    opt.value = model;
                    opt.textContent = model;
                    modelSelect.appendChild(opt);
                });
                modelSelect.disabled = false;
            }
        });

        modelSelect.addEventListener("change", function () {
            const selectedBrand = brandSelect.value;
            const selectedModel = this.value;
            typeSelect.innerHTML = `<option value="">${translate('select_type') || 'Izberi tip'}</option>`;
            typeSelect.disabled = true;

            const brandData = brandModelData[selectedBrand];
            if (selectedModel && brandData && typeof brandData === 'object' && !Array.isArray(brandData) && brandData[selectedModel]) {
                const types = brandData[selectedModel];
                types.forEach(type => {
                    const opt = document.createElement("option");
                    opt.value = type;
                    opt.textContent = type;
                    typeSelect.appendChild(opt);
                });
                typeSelect.disabled = false;
            }
        });
        
        if (isEditMode && listingToEditId) {
            const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
            const listingToEdit = allListings.find(l => l.id == listingToEditId);
            if (listingToEdit) {
                populateForm(listingToEdit);
            }
        }
    });

    fuelSelect.addEventListener('change', () => {
        electricFields.style.display = fuelSelect.value === 'Elektrika' ? 'flex' : 'none';
    });

    imageInput.addEventListener("change", () => { /* ... koda za predogled slik ... */ });

    listingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = translate('saving');

        const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const imagePromises = Array.from(imageInput.files).map(readFileAsDataURL);
        const base64Images = await Promise.all(imagePromises);

        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        const formData = new FormData(listingForm);
        
        if (isEditMode) {
            const listingIndex = allListings.findIndex(l => l.id == listingToEditId);
            if (listingIndex > -1) {
                const updatedListing = { ...allListings[listingIndex] };
                // ... posodobitev vseh polj ...
                if (base64Images.length > 0) { // Posodobi slike samo, če so bile naložene nove
                    updatedListing.images.exterior = base64Images;
                }
                allListings[listingIndex] = updatedListing;
                localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
                sessionStorage.removeItem('listingToEditId');
                alert(translate('listing_updated_successfully'));
                window.location.href = "dashboard.html";
            }
        } else {
            const newListing = { /* ... kreiranje novega oglasa ... */ };
            allListings.push(newListing);
            localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
            alert(translate('listing_created_successfully'));
            window.location.href = "index.html";
        }
    });
});