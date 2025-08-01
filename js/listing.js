document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave in uporabniškega menija
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("header").innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });

    const listing = JSON.parse(localStorage.getItem("selectedListing"));
    // Takoj za "const listing = JSON.parse(localStorage.getItem("selectedListing"));"

if (listing) {
    // Shranjevanje nazadnje ogledanih
    let recentlyViewed = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
    // Odstranimo ID, če že obstaja, da ga lahko postavimo na začetek
    recentlyViewed = recentlyViewed.filter(id => id !== listing.id);
    // Dodamo ID na začetek seznama
    recentlyViewed.unshift(listing.id);
    // Omejimo seznam na zadnjih 5 ogledanih
    const limitedList = recentlyViewed.slice(0, 5);
    localStorage.setItem('mojavto_recentlyViewed', JSON.stringify(limitedList));
}
    if (!listing) {
        document.querySelector('.listing-container').innerHTML = '<h1>Oglas ni bil najden. Prosimo, vrnite se na domačo stran.</h1>';
        return;
    }

    // --- PRIKAZ GLAVNEGA OGLASA (ostane enako) ---
    // ... vsa koda za prikaz naslova, cene, opisa, ključnih podatkov in kontaktnih gumbov ...

    // --- LOGIKA ZA GALERIJO SLIK (ostane enaka) ---
    // ... vsa koda za delovanje galerije slik ...

    // --- FUNKCIJA ZA PRIKAZ PODOBNIH OGLASOV (ostane enaka) ---
    function displaySimilarVehicles(targetListing) {
        // ... vsa koda za prikaz podobnih oglasov ...
    }

    // --- NOVO: LOGIKA ZA GUMB "PRILJUBLJENI" NA STRANI OGLASA ---
    const favBtnDetails = document.getElementById('fav-btn-details');

    // Pomožni funkciji, ki sta potrebni za delovanje
    function getFavorites() {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) return [];
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        return allFavorites[loggedUser.username] || [];
    }

    function toggleFavorite(listingId) {
        const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
        if (!loggedUser) {
            alert("Za shranjevanje priljubljenih oglasov se morate prijaviti.");
            return;
        }
        const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
        let userFavorites = allFavorites[loggedUser.username] || [];
        const itemIndex = userFavorites.indexOf(listingId);
        if (itemIndex > -1) {
            userFavorites.splice(itemIndex, 1);
        } else {
            userFavorites.push(listingId);
        }
        allFavorites[loggedUser.username] = userFavorites;
        localStorage.setItem("mojavto_favorites", JSON.stringify(allFavorites));
    }

    // Funkcija za posodabljanje izgleda gumba
    function updateFavoriteButtonUI() {
        if (!favBtnDetails) return;
        const favorites = getFavorites();
        const isFavorited = favorites.includes(listing.id);
        favBtnDetails.classList.toggle('favorited', isFavorited);
        
        const icon = favBtnDetails.querySelector('i');
        const text = favBtnDetails.querySelector('span');

        icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        text.textContent = isFavorited ? 'Odstrani iz priljubljenih' : 'Dodaj med priljubljene';
    }

    // Povežemo klik na gumb z logiko
    if (favBtnDetails) {
        favBtnDetails.addEventListener('click', () => {
            toggleFavorite(listing.id);
            updateFavoriteButtonUI();
        });
    }

    // --- ZAČETNI ZAGON VSEH FUNKCIJ ---
    // updateGallery(); // Klic te funkcije je že v vaši obstoječi kodi
    // displaySimilarVehicles(listing); // Tudi ta klic je že v obstoječi kodi
    updateFavoriteButtonUI(); // Dodamo klic za posodobitev gumba ob nalaganju strani
});