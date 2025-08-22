import { stateManager } from './stateManager.js';

export function initPublicGaragePage(params) {
    const username = params.username;
    if (!username) {
        window.location.hash = '/not-found';
        return;
    }

    const garageOwner = stateManager.getUserByUsername(username);
    const garageVehicles = stateManager.getGarageVehicles(username);

    const titleEl = document.getElementById('garage-owner-title');
    const container = document.getElementById('public-garage-container');
    const message = document.getElementById('garage-not-found-message');

    if (!garageOwner || garageVehicles.length === 0) {
        titleEl.textContent = 'Garaža ni na voljo';
        container.style.display = 'none';
        message.style.display = 'block';
        return;
    }

    titleEl.textContent = `Garaža uporabnika ${garageOwner.fullname}`;
    container.innerHTML = '';
    message.style.display = 'none';

    garageVehicles.forEach(vehicle => {
        const card = document.createElement('article');
        card.className = 'card garage-card';
        card.innerHTML = `
            <div class="card-image-container">
                <img src="${vehicle.images[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${vehicle.nickname}" />
            </div>
            <div class="card-body">
                <h3 class="card-title">${vehicle.nickname}</h3>
                <p class="card-details">${vehicle.brand} ${vehicle.model} (${vehicle.year})</p>
                <p class="card-description">${vehicle.description}</p>
            </div>
        `;
        container.appendChild(card);
    });
}