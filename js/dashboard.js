document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave, preverjanje prijave in logika za zavihke ostanejo enaki...
    fetch("header.html").then(res => res.text()).then(data => {
        const headerDiv = document.getElementById("header");
        if(headerDiv) headerDiv.innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
    });
    
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) { window.location.href = "login.html"; return; }
    document.getElementById('welcome-message').textContent = `Pozdravljen, ${loggedUser.fullname}!`;

    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];

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

    // Vse funkcije za prikaz vsebine (displayMyListings, displayFavoriteListings, itd.) ostanejo enake...
    function displayMyListings() { /* ... koda ostane enaka ... */ }
    function displayFavoriteListings() { /* ... koda ostane enaka ... */ }
    function displayRecentlyViewed() { /* ... koda ostane enaka ... */ }

    // --- UREJANJE PROFILA ---
    const profileForm = document.getElementById('profile-edit-form');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const userRegionInput = document.getElementById('userRegion');
    const userPhoneInput = document.getElementById('userPhone');

    // Napolnimo obrazec s trenutnimi podatki
    fullnameInput.value = loggedUser.fullname;
    emailInput.value = loggedUser.email;
    userRegionInput.value = loggedUser.region || '';
    userPhoneInput.value = loggedUser.phone || '';

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // SPREMEMBA: Dodana potrditev pred shranjevanjem
        if (confirm("Ali ste prepričani, da želite shraniti spremembe?")) {
            
            // Vsa obstoječa logika za shranjevanje gre znotraj te potrditve
            const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
            const userIndex = allUsers.findIndex(user => user.username === loggedUser.username);

            if (userIndex > -1) {
                // Posodobimo podatke v glavnem seznamu uporabnikov
                allUsers[userIndex].fullname = fullnameInput.value;
                allUsers[userIndex].email = emailInput.value;
                allUsers[userIndex].region = userRegionInput.value;
                allUsers[userIndex].phone = userPhoneInput.value;
                localStorage.setItem('mojavto_users', JSON.stringify(allUsers));
                
                // Posodobimo tudi podatke trenutno prijavljenega uporabnika
                const updatedLoggedUser = allUsers[userIndex];
                localStorage.setItem('mojavto_loggedUser', JSON.stringify(updatedLoggedUser));

                alert('Profil uspešno posodobljen!');
                location.reload(); // Osvežimo stran za prikaz sprememb
            } else {
                alert('Napaka pri shranjevanju. Uporabnik ni bil najden.');
            }
        }
        // Če uporabnik klikne "Prekliči", se ne zgodi nič.
    });

    // Začetni zagon vseh funkcij
    displayMyListings();
    displayFavoriteListings();
    displayRecentlyViewed();
});