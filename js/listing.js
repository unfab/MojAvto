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

    if (listing) {
        // Shranjevanje nazadnje ogledanih
        let recentlyViewed = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        recentlyViewed = recentlyViewed.filter(id => id !== listing.id);
        recentlyViewed.unshift(listing.id);
        const limitedList = recentlyViewed.slice(0, 5);
        localStorage.setItem('mojavto_recentlyViewed', JSON.stringify(limitedList));
    }

    if (!listing) {
        document.querySelector('.listing-container').innerHTML = '<h1>Oglas ni bil najden. Prosimo, vrnite se na domačo stran.</h1>';
        return;
    }

    // --- DOM ELEMENTI ---
    const titleEl = document.getElementById('listing-title');
    const priceEl = document.getElementById('price');
    const keyDetailsEl = document.getElementById('key-details');
    const descriptionEl = document.getElementById('description');
    const sellerNameEl = document.getElementById('seller-name');
    const sellerLocationEl = document.getElementById('seller-location');
    const contactEmailBtn = document.getElementById('contact-email-btn');
    const showPhoneBtn = document.getElementById('show-phone-btn');
    const favBtnDetails = document.getElementById('fav-btn-details');

    // --- PRIKAZ PODATKOV O OGLASU ---
    titleEl.textContent = listing.title;
    document.title = `${listing.title} - MojAvto.si`;
    priceEl.textContent = `${listing.price.toLocaleString()} €`;
    descriptionEl.textContent = listing.description || "Prodajalec ni navedel opisa.";
    sellerNameEl.textContent = listing.author || "Neznan prodajalec";
    const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    const seller = allUsers.find(user => user.username === listing.author);
    sellerLocationEl.textContent = seller ? (seller.region || "Neznana lokacija") : "Neznana lokacija";

    const details = { /* ... koda za pripravo ključnih podatkov ... */ };
    for (const [label, value] of Object.entries(details)) { /* ... koda za prikaz ... */ }

    // --- LOGIKA ZA KONTAKTNE GUMBE ---
    contactEmailBtn.addEventListener('click', () => { /* ... koda za mailto ... */ });
    if (listing.phone && listing.phone.trim() !== "") {
        showPhoneBtn.style.display = 'block';
        showPhoneBtn.addEventListener('click', () => {
            showPhoneBtn.innerHTML = `<i class="fas fa-phone"></i> ${listing.phone}`;
            showPhoneBtn.disabled = true;
        }, { once: true });
    }
    
    // --- LOGIKA ZA GALERIJO IN PODOBNE OGLASE (ostane enaka) ---
    function updateGallery() { /* ... */ }
    function displaySimilarVehicles(targetListing) { /* ... */ }

    // --- LOGIKA ZA GUMB "PRILJUBLJENI" ---
    function getFavorites() { /* ... */ }
    function toggleFavorite(listingId) { /* ... */ }

    function updateFavoriteButtonUI() {
        if (!favBtnDetails) return;
        const favorites = getFavorites();
        const isFavorited = favorites.includes(listing.id);
        favBtnDetails.classList.toggle('favorited', isFavorited);
        const icon = favBtnDetails.querySelector('i');
        const text = favBtnDetails.querySelector('span');
        icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        text.textContent = isFavorited ? translate('remove_from_favorites') : translate('add_to_favorites');
    }

    if (favBtnDetails) {
        favBtnDetails.addEventListener('click', () => {
            toggleFavorite(listing.id);
            updateFavoriteButtonUI();
        });
    }

    // --- ZAČETNI ZAGON ---
    updateGallery();
    displaySimilarVehicles(listing);
    updateFavoriteButtonUI();
});