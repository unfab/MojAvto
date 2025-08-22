import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';

// Spremenimo funkcijo, da sprejme 'params' iz usmerjevalnika (router.js)
export function initGarageFormPage(params) {
    const { loggedInUser } = stateManager.getState();

    // Stran je dostopna samo prijavljenim uporabnikom
    if (!loggedInUser) {
        window.location.hash = '#/login';
        return;
    }

    const garageForm = document.getElementById('garage-form');
    if (!garageForm) return;

    // --- DOM Elementi ---
    const formTitle = document.getElementById('garage-form-title');
    const brandSelect = document.getElementById("garage-brand");
    const modelSelect = document.getElementById("garage-model");
    const yearSelect = document.getElementById("garage-year");
    const nicknameInput = document.getElementById("garage-nickname");
    const descriptionTextarea = document.getElementById("garage-description");
    const submitBtn = document.getElementById('submit-garage-btn');

    // =======================================================
    // NOVO: Preverimo, ali smo v načinu urejanja
    // =======================================================
    const isEditMode = params && params.vehicleId;
    let vehicleToEdit = null;

    // --- Polnjenje dinamičnih polj ---
    const brandModelData = stateManager.getBrands();
    Object.keys(brandModelData).sort().forEach(brand => {
        brandSelect.add(new Option(brand, brand));
    });

    brandSelect.addEventListener("change", function () {
        const selectedMake = this.value;
        modelSelect.innerHTML = `<option value="">Izberi model</option>`;
        modelSelect.disabled = true;
        if (selectedMake && brandModelData[selectedMake]) {
            Object.keys(brandModelData[selectedMake]).sort().forEach(model => modelSelect.add(new Option(model, model)));
            modelSelect.disabled = false;
        }
    });

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        yearSelect.add(new Option(y, y));
    }

    // =======================================================
    // NOVO: Logika za pred-izpolnitev obrazca v načinu urejanja
    // =======================================================
    if (isEditMode) {
        vehicleToEdit = stateManager.getVehicleFromGarage(loggedInUser.username, params.vehicleId);

        if (vehicleToEdit) {
            // Posodobimo naslov in gumb
            formTitle.textContent = 'Uredi vozilo v Garaži';
            submitBtn.textContent = 'Shrani spremembe';

            // Pred-izpolnimo obrazec s podatki vozila
            nicknameInput.value = vehicleToEdit.nickname;
            descriptionTextarea.value = vehicleToEdit.description;
            yearSelect.value = vehicleToEdit.year;
            
            // Posebna logika za odvisne izbirne menije
            brandSelect.value = vehicleToEdit.brand;
            brandSelect.dispatchEvent(new Event('change')); // Sprožimo dogodek, da se napolnijo modeli
            
            // Počakamo trenutek, da se modeli naložijo, preden izberemo pravega
            setTimeout(() => {
                modelSelect.value = vehicleToEdit.model;
            }, 100);
        } else {
            // Če vozilo z danim ID-jem ne obstaja, preusmerimo uporabnika
            showNotification('Vozilo ni bilo najdeno.', 'error');
            window.location.hash = '#/profile';
        }
    }

    // --- Logika ob oddaji obrazca ---
    garageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(garageForm);
        const data = Object.fromEntries(formData.entries());

        // =======================================================
        // SPREMEMBA: Logika loči med dodajanjem in urejanjem
        // =======================================================
        if (isEditMode && vehicleToEdit) {
            // POSODABLJANJE obstoječega vozila
            const updatedVehicle = {
                ...vehicleToEdit, // Ohrani stari ID in slike
                brand: data.brand,
                model: data.model,
                year: parseInt(data.year, 10),
                nickname: data.nickname || `${data.brand} ${data.model}`,
                description: data.description,
            };
            stateManager.updateVehicleInGarage(loggedInUser.username, updatedVehicle);
            showNotification('Vozilo je bilo uspešno posodobljeno!', 'success');
        } else {
            // DODAJANJE novega vozila
            const newVehicle = {
                brand: data.brand,
                model: data.model,
                year: parseInt(data.year, 10),
                nickname: data.nickname || `${data.brand} ${data.model}`,
                description: data.description,
                images: ['https://via.placeholder.com/400x250?text=Vozilo+iz+garaže']
            };
            stateManager.addVehicleToGarage(loggedInUser.username, newVehicle);
            showNotification('Vozilo je bilo uspešno dodano v vašo Garažo!', 'success');
        }
        
        window.location.hash = '#/profile';
    });
}