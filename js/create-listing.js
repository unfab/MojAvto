export function initCreateListingPage() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
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
    const hybridFields = document.getElementById("hybrid-fields");
    const imageInput = document.getElementById("images");
    const previewContainer = document.getElementById("preview");

    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        alert(translate('must_be_logged_in_to_create'));
        window.location.hash = '#/login';
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
        listingForm.seatMaterial.value = listing.seatMaterial || '';

        if (listing.hybridType) {
            listingForm.hybridType.value = listing.hybridType;
        }

        listingForm.brand.dispatchEvent(new Event('change'));
        setTimeout(() => {
            listingForm.model.value = listing.model;
            listingForm.model.dispatchEvent(new Event('change'));
            setTimeout(() => {
                listingForm.type.value = listing.type;
            }, 100);
        }, 100);

        // Trigger fuel change to show electric/hybrid fields if needed
        listingForm.fuel.dispatchEvent(new Event('change'));
    }

    // Polnjenje letnikov
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // Nalaganje znamk in modelov
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
                const selectedMake = brandSelect.value;
                modelSelect.innerHTML = `<option value="" data-i18n-key="select_model_first">Najprej izberi znamko</option>`;
                typeSelect.innerHTML = `<option value="" data-i18n-key="select_model_first">Najprej izberi model</option>`;
                modelSelect.disabled = true;
                typeSelect.disabled = true;

                if (selectedMake && brandModelData[selectedMake]) {
                    const models = brandModelData[selectedMake];
                    const modelKeys = Array.isArray(models) ? models : Object.keys(models);
                    modelKeys.forEach(model => {
                        const option = document.createElement("option");
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.disabled = false;
                }
            });

            modelSelect.addEventListener("change", function () {
                const selectedMake = brandSelect.value;
                const selectedModel = modelSelect.value;
                typeSelect.innerHTML = `<option value="" data-i18n-key="select_type">Izberi tip</option>`;
                typeSelect.disabled = true;

                if (selectedMake && selectedModel && brandModelData[selectedMake]) {
                    const models = brandModelData[selectedMake];
                    if (!Array.isArray(models) && models[selectedModel]) {
                        models[selectedModel].forEach(type => {
                            const option = document.createElement("option");
                            option.value = type;
                            option.textContent = type;
                            typeSelect.appendChild(option);
                        });
                        typeSelect.disabled = false;
                    }
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

    // Prikaz/skrivanje polj glede na gorivo
    fuelSelect.addEventListener('change', () => {
        const selectedFuel = fuelSelect.value;

        if (selectedFuel === 'Elektrika') {
            electricFields.style.display = 'flex';
            hybridFields.style.display = 'none';
        } else if (selectedFuel === 'Hibrid') {
            electricFields.style.display = 'none';
            hybridFields.style.display = 'flex';
        } else {
            electricFields.style.display = 'none';
            hybridFields.style.display = 'none';
        }
    });

    // Predogled slik
    imageInput.addEventListener("change", () => {
        previewContainer.innerHTML = "";
        Array.from(imageInput.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement("img");
                img.src = e.target.result;
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    // Oddaja obrazca
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
                updatedListing.title = formData.get('title');
                updatedListing.make = formData.get('brand');
                updatedListing.model = formData.get('model');
                updatedListing.type = formData.get('type');
                updatedListing.price = Number(formData.get('price'));
                updatedListing.year = Number(formData.get('year'));
                updatedListing.mileage = Number(formData.get('mileage'));
                updatedListing.power = Number(formData.get('power'));
                updatedListing.fuel = formData.get('fuel');
                updatedListing.transmission = formData.get('transmission');
                updatedListing.phone = formData.get('phone');
                updatedListing.description = formData.get('description');
                updatedListing.seatMaterial = formData.get('seatMaterial');

                if (formData.get('battery')) updatedListing.battery = Number(formData.get('battery'));
                if (formData.get('range')) updatedListing.range = Number(formData.get('range'));
                if (formData.get('hybridType')) updatedListing.hybridType = formData.get('hybridType');

                if (base64Images.length > 0) {
                    updatedListing.images.exterior = base64Images;
                }

                allListings[listingIndex] = updatedListing;
                localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
                sessionStorage.removeItem('listingToEditId');
                alert(translate('listing_updated_successfully'));
                window.location.hash = '#/dashboard';
            }
        } else {
            const newListing = {
                id: Date.now(),
                title: formData.get('title'),
                make: formData.get('brand'),
                model: formData.get('model'),
                type: formData.get('type'),
                price: Number(formData.get('price')),
                year: Number(formData.get('year')),
                mileage: Number(formData.get('mileage')),
                power: Number(formData.get('power')),
                fuel: formData.get('fuel'),
                transmission: formData.get('transmission'),
                phone: formData.get('phone'),
                description: formData.get('description'),
                seatMaterial: formData.get('seatMaterial'),
                author: loggedUser.username,
                region: loggedUser.region || "Neznana",
                images: {
                    exterior: base64Images,
                    interior: []
                }
            };

            if (formData.get('battery')) newListing.battery = Number(formData.get('battery'));
            if (formData.get('range')) newListing.range = Number(formData.get('range'));
            if (formData.get('hybridType')) newListing.hybridType = formData.get('hybridType');

            allListings.push(newListing);
            localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
            alert(translate('listing_created_successfully'));
            window.location.hash = '#/';
        }
    });
}