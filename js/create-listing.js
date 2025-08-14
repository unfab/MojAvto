import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';

export function initCreateListingPage() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const isEditMode = urlParams.get('edit') === 'true';
    const listingToEditId = sessionStorage.getItem('listingToEditId');
    
    const listingForm = document.getElementById("listingForm");
    const formTitle = document.getElementById("form-title");
    const submitBtn = document.getElementById("submitBtn");
    const brandSelect = document.getElementById("listing-brand");
    const modelSelect = document.getElementById("listing-model");
    const typeSelect = document.getElementById("listing-type");
    const yearSelect = document.getElementById("listing-year");
    const fuelSelect = document.getElementById("listing-fuel");
    const electricFields = document.getElementById("electric-fields");
    
    const exteriorImageInput = document.getElementById("images-exterior");
    const interiorImageInput = document.getElementById("images-interior");
    const exteriorPreviewContainer = document.getElementById("preview-exterior");
    const interiorPreviewContainer = document.getElementById("preview-interior");

    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser) {
        showNotification(translate('must_be_logged_in_to_create'), 'error');
        window.location.hash = '#/login';
        return;
    }
    
    function populateForm(listing) {
        formTitle.textContent = translate('page_title_edit_listing');
        submitBtn.textContent = translate('save_changes');
        
        brandSelect.value = listing.make;
        brandSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
            modelSelect.value = listing.model;
            modelSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                typeSelect.value = listing.type;
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
    }

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

    if (isEditMode && listingToEditId) {
        const listingToEdit = stateManager.getListingById(listingToEditId);
        if (listingToEdit) {
            populateForm(listingToEdit);
        }
    }

    fuelSelect.addEventListener('change', () => {
        electricFields.style.display = fuelSelect.value === 'Elektrika' ? 'grid' : 'none';
    });
    
    function handleImagePreview(inputElement, previewContainer) {
        previewContainer.innerHTML = '';
        const files = inputElement.files;
        if (files) {
            Array.from(files).forEach(file => {
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
    }

    exteriorImageInput.addEventListener("change", () => handleImagePreview(exteriorImageInput, exteriorPreviewContainer));
    interiorImageInput.addEventListener("change", () => handleImagePreview(interiorImageInput, interiorPreviewContainer));

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

        const exteriorImagePromises = Array.from(exteriorImageInput.files).map(readFileAsDataURL);
        const interiorImagePromises = Array.from(interiorImageInput.files).map(readFileAsDataURL);

        const [base64ExteriorImages, base64InteriorImages] = await Promise.all([
            Promise.all(exteriorImagePromises),
            Promise.all(interiorImagePromises)
        ]);
        
        const formData = new FormData(listingForm);
        const data = Object.fromEntries(formData.entries());

        if (isEditMode && listingToEditId) {
            const existingListing = stateManager.getListingById(listingToEditId);
            const updatedListing = {
                ...existingListing,
                make: data.brand,
                model: data.model,
                type: data.type,
                title: `${data.brand} ${data.model} ${data.type || ''}`.trim(),
                price: parseInt(data.price, 10),
                year: parseInt(data.year, 10),
                mileage: parseInt(data.mileage, 10),
                power: parseInt(data.power, 10),
                fuel: data.fuel,
                transmission: data.transmission,
                phone: data.phone,
                description: data.description,
                videoUrl: data.videoUrl || '',
                specs: {
                    ...existingListing.specs,
                    battery: data.battery ? parseInt(data.battery, 10) : undefined,
                    range: data.range ? parseInt(data.range, 10) : undefined,
                },
                images: {
                    exterior: base64ExteriorImages.length > 0 ? base64ExteriorImages : existingListing.images.exterior,
                    interior: base64InteriorImages.length > 0 ? base64InteriorImages : existingListing.images.interior,
                }
            };
            
            stateManager.updateListing(updatedListing);
            sessionStorage.removeItem('listingToEditId');
            showNotification(translate('listing_updated_successfully'), 'success');
            window.location.hash = `#/listing/${listingToEditId}`;

        } else {
            const newListing = {
                id: Date.now(),
                title: `${data.brand} ${data.model} ${data.type || ''}`.trim(),
                make: data.brand,
                model: data.model,
                type: data.type,
                year: parseInt(data.year, 10),
                mileage: parseInt(data.mileage, 10),
                price: parseInt(data.price, 10),
                fuel: data.fuel,
                transmission: data.transmission,
                power: parseInt(data.power, 10),
                videoUrl: data.videoUrl || '',
                author: loggedInUser.username,
                date_added: new Date().toISOString(),
                location: {
                    city: "Ljubljana",
                    region: loggedInUser.region
                },
                images: {
                    exterior: base64ExteriorImages,
                    interior: base64InteriorImages
                },
                description: data.description,
                condition: "Rabljeno",
                owners: 1,
                history: {
                    service_book: true,
                    undamaged: true
                },
                equipment: [],
                specs: {
                    battery: data.battery ? parseInt(data.battery, 10) : undefined,
                    range: data.range ? parseInt(data.range, 10) : undefined,
                },
                isFeatured: false
            };
            
            stateManager.addListing(newListing);
            showNotification(translate('listing_created_successfully'), 'success');
            window.location.hash = '#/';
        }
    });
}