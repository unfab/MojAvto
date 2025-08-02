document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave (se izvede preko i18n.js)

    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser || !loggedUser.isAdmin) {
        alert(translate('admin_unauthorized_access'));
        window.location.href = "index.html";
        return;
    }

    const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];

    document.getElementById('total-users').textContent = allUsers.length;
    document.getElementById('total-listings').textContent = allListings.length;
    if (allListings.length > 0) {
        const totalValue = allListings.reduce((sum, item) => sum + item.price, 0);
        const avgPrice = totalValue / allListings.length;
        document.getElementById('avg-price').textContent = `${Math.round(avgPrice).toLocaleString()} €`;
    }

    const tableBody = document.getElementById('listings-table-body');
    
    function displayAllListings() {
        tableBody.innerHTML = '';
        const currentListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
        currentListings.forEach(listing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${listing.id}</td>
                <td>${listing.title}</td>
                <td>${listing.author}</td>
                <td>${listing.price.toLocaleString()} €</td>
                <td><button class="btn-delete" data-id="${listing.id}">${translate('delete_btn') || 'Izbriši'}</button></td>
            `;
            tableBody.appendChild(row);
        });
        addDeleteListeners();
    }

    function addDeleteListeners() {
        tableBody.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm(translate('confirm_delete_listing'))) {
                    const listingId = parseInt(e.currentTarget.dataset.id, 10);
                    let listings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
                    const updatedListings = listings.filter(l => l.id !== listingId);
                    localStorage.setItem('mojavto_listings', JSON.stringify(updatedListings));
                    displayAllListings();
                }
            });
        });
    }

    displayAllListings();
});