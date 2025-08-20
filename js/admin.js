import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showModal } from './components/modal.js';
import { showNotification } from './notifications.js';

export function initAdminPage() {
    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser || !loggedInUser.isAdmin) {
        showNotification(translate('admin_unauthorized_access'), 'error');
        window.location.hash = '#/';
        return;
    }

    // === SPREMEMBA: Podatke dobimo iz stateManagerja ===
    const allUsers = stateManager.getUsers();
    const allListings = stateManager.getListings();

    document.getElementById('total-users').textContent = allUsers.length;
    document.getElementById('total-listings').textContent = allListings.length;
    if (allListings.length > 0) {
        const totalValue = allListings.reduce((sum, item) => sum + item.price, 0);
        const avgPrice = totalValue / allListings.length;
        document.getElementById('avg-price').textContent = `${Math.round(avgPrice).toLocaleString()} €`;
    }

    const tableBody = document.getElementById('listings-table-body');
    
    function displayAllListings() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        // === SPREMEMBA: Vedno prikažemo trenutno stanje iz stateManagerja ===
        const currentListings = stateManager.getListings();

        currentListings.forEach(listing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${listing.id}</td>
                <td>${listing.title}</td>
                <td>${listing.author}</td>
                <td>${listing.price.toLocaleString()} €</td>
                <td>
                    <button class="btn-delete" data-id="${listing.id}">${translate('delete_btn')}</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        addDeleteListeners();
    }

    function addDeleteListeners() {
        tableBody.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const confirmed = await showModal('confirm_delete_listing_title', 'confirm_delete_listing_text');
                if (confirmed) {
                    const listingId = parseInt(e.currentTarget.dataset.id, 10);
                    // Brisanje poteka preko stateManagerja, kar je že bilo pravilno
                    stateManager.deleteListing(listingId);
                    showNotification(translate('listing_deleted_successfully'), 'success');
                    displayAllListings(); // Osveži tabelo
                }
            });
        });
    }

    displayAllListings();
}