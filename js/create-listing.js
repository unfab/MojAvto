document.addEventListener("DOMContentLoaded", () => {
    // --- 1. KORAK: PREVERJANJE NAČINA DELOVANJA (USTVARI ali UREDI) ---
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';
    const listingToEditId = sessionStorage.getItem('listingToEditId');
    
    // --- 2. KORAK: PRIDOBIVANJE DOM ELEMENTOV ---
    const listingForm = document.getElementById("listingForm");
    const formTitle = document.getElementById("form-title");
    const submitBtn = document.getElementById("submitBtn");
    const brandSelect = document.getElementById("brand");
    const modelSelect = document.getElementById("model");
    const yearSelect = document.getElementById("year");
    // ... in ostali elementi ...

    // --- 3. KORAK: PREVERJANJE PRIJAVE ---
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        alert("Za dostop do te strani se morate prijaviti.");
        window.location.href = "login.html";
        return;
    }

    // --- 4. KORAK: NALAGANJE GLAVE ---
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("header").innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });

    // --- 5. KORAK: FUNKCIJA ZA POLNJENJE OBRAZCA V NAČINU UREJANJA ---
    function populateForm(listing) {
        formTitle.textContent = "Uredi oglas";
        submitBtn.textContent = "Shrani spremembe";

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
        }, 100);
    }

    // --- 6. KORAK: GLAVNA LOGIKA (polnjenje znamk, modelov in urejanje) ---
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
            modelSelect.innerHTML = '<option value="">Izberi model</option>';
            modelSelect.disabled = true;
            if (selectedBrand && brandModelData[selectedBrand]) {
                brandModelData[selectedBrand].forEach(model => {
                    const opt = document.createElement("option");
                    opt.value = model;
                    opt.textContent = model;
                    modelSelect.appendChild(opt);
                });
                modelSelect.disabled = false;
            }
        });
        
        if (isEditMode && listingToEditId) {
            const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
            const listingToEdit = allListings.find(l => l.id == listingToEditId);
            if (listingToEdit) {
                populateForm(listingToEdit);
            } else {
                alert("Oglasa za urejanje ni bilo mogoče najti.");
                window.location.href = 'profile.html';
            }
        }
    });

    // ... koda za polnjenje letnikov, predogled slik in fuelSelect listener ostane enaka ...

    // --- 7. KORAK: POSODOBITEV LOGIKE ZA SHRANJEVANJE ---
    listingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = "Shranjevanje...";

        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        const formData = new FormData(listingForm);
        // ... funkcija readFileAsDataURL in obdelava slik ostaneta enaki ...
        
        if (isEditMode) {
            const listingIndex = allListings.findIndex(l => l.id == listingToEditId);
            if (listingIndex > -1) {
                const updatedListing = { ...allListings[listingIndex] };
                // Posodobimo vse vrednosti iz obrazca
                updatedListing.title = formData.get("title");
                updatedListing.make = formData.get("brand");
                updatedListing.model = formData.get("model");
                updatedListing.price = parseInt(formData.get("price"), 10);
                updatedListing.year = parseInt(formData.get("year"), 10);
                updatedListing.mileage = parseInt(formData.get("mileage"), 10);
                updatedListing.power = parseInt(formData.get("power"), 10);
                updatedListing.fuel = formData.get("fuel");
                updatedListing.transmission = formData.get("transmission");
                updatedListing.phone = formData.get("phone");
                updatedListing.description = formData.get("description");

                allListings[listingIndex] = updatedListing;
                localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
                sessionStorage.removeItem('listingToEditId');
                alert("Oglas uspešno posodobljen!");
                window.location.href = "profile.html";
            }
        } else {
            // Logika za ustvarjanje novega oglasa ostane enaka
            const newListing = { id: Date.now(), author: loggedUser.username, /* ... vsa polja ... */ };
            allListings.push(newListing);
            localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
            alert("Oglas je bil uspešno objavljen!");
            window.location.href = "index.html";
        }
    });
});