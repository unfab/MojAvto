document.addEventListener("DOMContentLoaded", () => {
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        window.location.href = "login.html";
        return;
    }
    // Varnostni preusmeritev: Če je admin, ga preusmeri na njegov dashboard
    if (loggedUser.isAdmin) {
        window.location.href = "dashboard.html";
        return;
    }

    document.getElementById('welcome-message').textContent = `${translate('dashboard_welcome')}, ${loggedUser.fullname}!`;
    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];

    // Logika za preklapljanje med zavihki
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => { /* ... koda za zavihke ostane enaka ... */ });

    // Funkcije za prikaz vsebine (v celoti prenešene iz dashboard.js)
    function displayMyListings() { /* ... koda je enaka kot v prejšnjem dashboard.js ... */ }
    function displayFavoriteListings() { /* ... koda je enaka kot v prejšnjem dashboard.js ... */ }
    function displayRecentlyViewed() { /* ... koda je enaka kot v prejšnjem dashboard.js ... */ }

    // Logika za urejanje profila (v celoti prenešena iz dashboard.js)
    const profileForm = document.getElementById('profile-edit-form');
    // ... vsa koda za urejanje profila, vključno s `confirm` okno ...
    
    // Začetni zagon vseh funkcij
    displayMyListings();
    displayFavoriteListings();
    displayRecentlyViewed();
});