// Create Listing Page logic — MojAvto.si
import { createListing } from '../services/listingService.js';

export function initCreateListingPage() {
    const user = window.__currentUser;
    if (!user) {
        alert("Za objavo oglasa se morate prijaviti.");
        window.location.hash = '/prijava';
        return;
    }

    const listingForm = document.getElementById("listingForm");
    if (!listingForm) return; // HTML not loaded properly

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

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // Load brands and models
    fetch("/json/brands_models_global.json")
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
                modelSelect.innerHTML = `<option value="">Najprej izberi znamko</option>`;
                typeSelect.innerHTML = `<option value="">Najprej izberi model</option>`;
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
                typeSelect.innerHTML = `<option value="">Izberi tip/različico</option>`;
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
        }).catch(err => {
            console.warn("Could not load brands_models_global.json. Make dropdown might be empty.", err);
        });

    // Toggle fields based on fuel
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

    // Image preview
    imageInput.addEventListener("change", () => {
        previewContainer.innerHTML = "";
        Array.from(imageInput.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.maxHeight = '100px';
                img.style.margin = '5px';
                img.style.borderRadius = '8px';
                img.style.objectFit = 'cover';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    // Submit form
    listingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const files = Array.from(imageInput.files);
        if (files.length === 0) {
            alert("Prosim, naložite vsaj eno sliko vozila.");
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Objavljam...';

        try {
            const formData = new FormData(listingForm);

            const listingData = {
                title: formData.get('title'),
                make: formData.get('brand'),
                model: formData.get('model'),
                type: formData.get('type') || '',
                price: Number(formData.get('price')),
                year: Number(formData.get('year')),
                mileage: Number(formData.get('mileage')),
                power: Number(formData.get('power')) || 0,
                fuel: formData.get('fuel'),
                transmission: formData.get('transmission'),
                phone: formData.get('phone') || '',
                description: formData.get('description'),
                seatMaterial: formData.get('seatMaterial') || '',
                authorName: user.displayName || 'Uporabnik',
            };

            if (formData.get('battery')) listingData.battery = Number(formData.get('battery'));
            if (formData.get('range')) listingData.range = Number(formData.get('range'));
            if (formData.get('hybridType')) listingData.hybridType = formData.get('hybridType');

            await createListing(listingData, files, user);

            alert('Oglas uspešno objavljen!');
            window.location.hash = '/dashboard';
        } catch (error) {
            console.error("Error creating listing", error);
            alert("Napaka pri objavi oglasa: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}
