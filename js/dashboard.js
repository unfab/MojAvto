document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave in preverjanje prijave
    fetch("header.html").then(res => res.text()).then(data => {
        const headerDiv = document.getElementById("header");
        if(headerDiv) headerDiv.innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
    });
    
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) { window.location.href = "login.html"; return; }
    document.getElementById('welcome-message').textContent = `${translate('dashboard_welcome')}, ${loggedUser.fullname}!`;

    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];

    // Logika za preklapljanje med zavihki
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- VSE FUNKCIJE ZA PRIKAZ VSEBINE ---

    function displayMyListings() {
        const container = document.getElementById('my-listings-container');
        const message = document.getElementById('no-listings-message');
        const userListings = allListings.filter(listing => listing.author === loggedUser.username);
        // ... preostanek kode za prikaz, kot v prejšnjih verzijah ...
    }

    function displayFavoriteListings() {
        const container = document.getElementById('favorite-listings-container');
        const message = document.getElementById('no-favorites-message');
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        const userFavorites = allFavorites[loggedUser.username] || [];
        // ... preostanek kode za prikaz, kot v prejšnjih verzijah ...
    }
    
    function displayRecentlyViewed() {
        const container = document.getElementById('recent-listings-container');
        const message = document.getElementById('no-recent-message');
        const recentlyViewedIds = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        // ... preostanek kode za prikaz, kot v prejšnjih verzijah ...
    }
    
    // --- UREJANJE PROFILA ---
    const profileForm = document.getElementById('profile-edit-form');
    // ... preostanek kode za urejanje profila ...

    // Začetni zagon vseh funkcij
    displayMyListings();
    displayFavoriteListings();
    displayRecentlyViewed();
});