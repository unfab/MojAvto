import { translate } from './i18n.js';
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
    const imageInput = document.getElementById("images");
    const previewContainer = document.getElementById("preview");

    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        alert(translate('must_be_logged_in_to_create'));
        window.location.hash = '#/login'; // Preusmeritev v SPA
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
    for (let y = currentYear; y >= 1980; y--) { /* ... koda za polnjenje letnikov ... */ }

    fetch('./json/brands_models_global.json')
      .then(res => res.json())
      .then(brandModelData => {
        Object.keys(brandModelData).sort().forEach(brand => { /* ... koda za polnjenje znamk ... */ });
        brandSelect.addEventListener("change", function () { /* ... koda za polnjenje modelov ... */ });
        modelSelect.addEventListener("change", function () { /* ... koda za polnjenje tipov ... */ });
        
        if (isEditMode && listingToEditId) {
            const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
            const listingToEdit = allListings.find(l => l.id == listingToEditId);
            if (listingToEdit) {
                populateForm(listingToEdit);
            }
        }
    });

    fuelSelect.addEventListener('change', () => { /* ... koda za električna polja ... */ });
    imageInput.addEventListener("change", () => { /* ... koda za predogled slik ... */ });

    listingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = translate('saving');

        const readFileAsDataURL = (file) => new Promise((resolve, reject) => { /* ... */ });
        const imagePromises = Array.from(imageInput.files).map(readFileAsDataURL);
        const base64Images = await Promise.all(imagePromises);
        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        const formData = new FormData(listingForm);
        
        if (isEditMode) {
            const listingIndex = allListings.findIndex(l => l.id == listingToEditId);
            if (listingIndex > -1) {
                const updatedListing = { ...allListings[listingIndex] };
                // ... posodobitev vseh polj ...
                if (base64Images.length > 0) { updatedListing.images.exterior = base64Images; }
                allListings[listingIndex] = updatedListing;
                localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
                sessionStorage.removeItem('listingToEditId');
                alert(translate('listing_updated_successfully'));
                window.location.hash = '#/dashboard';
            }
        } else {
            const newListing = { id: Date.now(), /* ... vsa polja ... */ };
            allListings.push(newListing);
            localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
            alert(translate('listing_created_successfully'));
            window.location.hash = '#/';
        }
    });
}