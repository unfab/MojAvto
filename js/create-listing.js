document.addEventListener("DOMContentLoaded", () => {
    // --- 1. PREVERJANJE PRIJAVE ---
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        alert("Za objavo oglasa se morate najprej prijaviti.");
        window.location.href = "login.html";
        return; // Ustavi izvajanje skripte, če uporabnik ni prijavljen
    }

    // --- 2. PRIDOBIVANJE DOM ELEMENTOV ---
    const listingForm = document.getElementById("listingForm");
    const brandSelect = document.getElementById("brand");
    const modelSelect = document.getElementById("model");
    const yearSelect = document.getElementById("year");
    const fuelSelect = document.getElementById("fuel");
    const electricFields = document.getElementById("electric-fields");
    const imageInput = document.getElementById("images");
    const previewContainer = document.getElementById("preview");
    const submitBtn = document.getElementById("submitBtn");

    // --- 3. NALAGANJE GLAVE IN UPORABNIŠKEGA MENIJA ---
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("header").innerHTML = data;
        // Počakamo, da se glava naloži, preden zaženemo skripto za meni
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });

    // --- 4. DINAMIČNO POLNJENJE OBRAZCA ---
    // Polnjenje letnikov
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    // Polnjenje znamk in modelov
    fetch("json/brands_models_global.json") // Preverite, da je pot pravilna
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
      });
      
    // Prikaz polj za električna vozila
    fuelSelect.addEventListener('change', () => {
        if (fuelSelect.value === 'Elektrika') {
            electricFields.style.display = 'flex';
        } else {
            electricFields.style.display = 'none';
        }
    });

    // --- 5. PREDOGLED SLIK ---
    imageInput.addEventListener("change", () => {
        previewContainer.innerHTML = ""; // Počisti obstoječe slike
        if (!imageInput.files.length) return;
        Array.from(imageInput.files).forEach(file => {
            if (!file.type.startsWith("image/")) return;
            const reader = new FileReader();
            reader.onload = e => {
                const img = document.createElement("img");
                img.src = e.target.result;
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    // --- 6. SHRANJEVANJE OGLASA OB ODDAJI OBRAZCA ---
    listingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = "Shranjevanje...";

        // Pomožna funkcija za branje slik
        const readFileAsDataURL = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        // Pretvorba slik v base64 format
        const imagePromises = Array.from(imageInput.files).map(readFileAsDataURL);
        const base64Images = await Promise.all(imagePromises);

        // Zbiranje podatkov iz obrazca
        const formData = new FormData(listingForm);
        const newListing = {
            id: Date.now(), // Enostaven unikaten ID
            author: loggedUser.username,
            title: formData.get("title"),
            make: formData.get("brand"),
            model: formData.get("model"),
            price: parseInt(formData.get("price"), 10),
            year: parseInt(formData.get("year"), 10),
            mileage: parseInt(formData.get("mileage"), 10),
            power: parseInt(formData.get("power"), 10),
            fuel: formData.get("fuel"),
            transmission: formData.get("transmission"),
            description: formData.get("description"),
            images: {
                exterior: base64Images,
                interior: [] // Zaenkrat pustimo prazno, lahko dodate ločen input
            }
        };
        
        // Dodatni podatki za električna vozila
        if (newListing.fuel === 'Elektrika') {
            newListing.battery = parseInt(formData.get('battery'), 10);
            newListing.range = parseInt(formData.get('range'), 10);
        }

        // Shranjevanje v localStorage
        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        allListings.push(newListing);
        localStorage.setItem("mojavto_listings", JSON.stringify(allListings));

        alert("Oglas je bil uspešno objavljen!");
        window.location.href = "index.html"; // Preusmeritev na domačo stran
    });
});