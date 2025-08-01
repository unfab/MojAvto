document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave, preverjanje prijave...
    fetch("header.html").then(res => res.text()).then(data => { /* ... */ });
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) { window.location.href = "login.html"; return; }
    document.getElementById('welcome-message').textContent = `Pozdravljen, ${loggedUser.fullname}!`;

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

    // --- PRIKAZ VSEBINE ZAVIHKOV ---

    function displayMyListings() { /* ... koda je enaka kot v starem profile.js ... */ }
    function displayFavoriteListings() { /* ... koda je enaka kot v starem profile.js ... */ }
    
    function displayRecentlyViewed() {
        const container = document.getElementById('recent-listings-container');
        const noRecentMsg = document.getElementById('no-recent-message');
        const recentlyViewedIds = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        
        container.innerHTML = '';
        if (recentlyViewedIds.length === 0) {
            noRecentMsg.style.display = 'block';
            return;
        }
        noRecentMsg.style.display = 'none';

        // Pripravimo oglase v pravilnem vrstnem redu
        const recentListings = recentlyViewedIds.map(id => allListings.find(l => l.id === id)).filter(Boolean);
        
        recentListings.forEach(listing => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `...`; // Koda za kartico je enaka kot drugje
            card.addEventListener('click', () => {
                localStorage.setItem('selectedListing', JSON.stringify(listing));
                window.location.href = 'listing.html';
            });
            container.appendChild(card);
        });
    }

    // --- UREJANJE PROFILA ---
    const profileForm = document.getElementById('profile-edit-form');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const userPhoneInput = document.getElementById('userPhone');

    // Napolnimo obrazec s trenutnimi podatki
    fullnameInput.value = loggedUser.fullname;
    emailInput.value = loggedUser.email;
    userPhoneInput.value = loggedUser.phone || '';

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
        const userIndex = allUsers.findIndex(user => user.username === loggedUser.username);

        if (userIndex > -1) {
            // Posodobimo podatke v glavnem seznamu uporabnikov
            allUsers[userIndex].fullname = fullnameInput.value;
            allUsers[userIndex].email = emailInput.value;
            allUsers[userIndex].phone = userPhoneInput.value;
            localStorage.setItem('mojavto_users', JSON.stringify(allUsers));
            
            // Posodobimo tudi podatke trenutno prijavljenega uporabnika
            const updatedLoggedUser = allUsers[userIndex];
            localStorage.setItem('mojavto_loggedUser', JSON.stringify(updatedLoggedUser));

            alert('Profil uspešno posodobljen!');
            location.reload(); // Osvežimo stran za prikaz sprememb
        }
    });

    // Začetni zagon vseh funkcij
    displayMyListings();
    displayFavoriteListings();
    displayRecentlyViewed();
});