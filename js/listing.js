function getFavorites() {
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) return [];
    const allFavorites = JSON.parse(localStorage.getItem("mojavto_favorites")) || {};
    return allFavorites[loggedUser.username] || [];
}

function toggleFavorite(listingId) {
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        alert(translate('must_be_logged_in_to_favorite'));
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

// Glavna funkcija, ki jo kliče ruter
export function initListingPage(listingId) {
    const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
    const listing = allListings.find(l => l.id == listingId);

    // Shranjevanje nazadnje ogledanih
    if (listing) {
        let recentlyViewed = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        recentlyViewed = recentlyViewed.filter(id => id !== listing.id);
        recentlyViewed.unshift(listing.id);
        localStorage.setItem('mojavto_recentlyViewed', JSON.stringify(recentlyViewed.slice(0, 5)));
    }

    if (!listing) {
        document.querySelector('.listing-container').innerHTML = `<h1 data-i18n-key="listing_not_found">Oglas ni bil najden.</h1>`;
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
    descriptionEl.textContent = listing.description || translate('no_description_provided');
    sellerNameEl.textContent = listing.author || translate('unknown_seller');
    
    const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    const seller = allUsers.find(user => user.username === listing.author);
    sellerLocationEl.textContent = seller ? (seller.region || translate('unknown_location')) : translate('unknown_location');
    
    const details = {
        [translate('spec_year')]: listing.year,
        [translate('spec_condition')]: translate('condition_used'),
        [translate('spec_mileage')]: `${listing.mileage.toLocaleString()} km`,
        [translate('spec_fuel')]: listing.fuel,
        [translate('spec_gearbox')]: listing.transmission,
        [translate('spec_power')]: `${listing.power} kW`,
    };
    
    keyDetailsEl.innerHTML = Object.entries(details).map(([label, value]) => 
        value ? `<div class="detail-item"><span class="label">${label}</span><span class="value">${value}</span></div>` : ''
    ).join('');

    // --- LOGIKA ZA KONTAKTNE GUMBE ---
    contactEmailBtn.addEventListener('click', () => { /* ... ista koda kot prej ... */ });
    if (listing.phone) { /* ... ista koda kot prej ... */ }
    
    // --- LOGIKA ZA GALERIJO ---
    // ... vsa koda za galerijo in podobne oglase gre sem, znotraj te funkcije ...
    
    // --- LOGIKA ZA GUMB "PRILJUBLJENI" ---
    function updateFavoriteButtonUI() {
        if (!favBtnDetails) return;
        const isFavorited = getFavorites().includes(listing.id);
        favBtnDetails.classList.toggle('favorited', isFavorited);
        favBtnDetails.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        favBtnDetails.querySelector('span').textContent = isFavorited ? translate('remove_from_favorites') : translate('add_to_favorites');
    }

    favBtnDetails.addEventListener('click', () => {
        toggleFavorite(listing.id);
        updateFavoriteButtonUI();
    });
    
    updateFavoriteButtonUI();
}