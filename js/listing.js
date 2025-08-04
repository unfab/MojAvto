document.addEventListener("DOMContentLoaded", () => {
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
        const container = document.querySelector('.listing-container');
        if(container) container.innerHTML = `<h1>${translate('listing_not_found')}</h1>`;
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

    const details = {};
    details[translate('spec_year')] = listing.year;
    details[translate('spec_condition')] = translate('condition_used');
    details[translate('spec_mileage')] = `${listing.mileage.toLocaleString()} km`;
    details[translate('spec_fuel')] = listing.fuel;
    details[translate('spec_gearbox')] = listing.transmission;
    details[translate('spec_power')] = `${listing.power} kW`;
    
    keyDetailsEl.innerHTML = '';
    for (const [label, value] of Object.entries(details)) {
        if (value) {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item';
            detailItem.innerHTML = `<span class="label">${label}</span><span class="value">${value}</span>`;
            keyDetailsEl.appendChild(detailItem);
        }
    }

    // --- LOGIKA ZA KONTAKTNE GUMBE ---
    contactEmailBtn.addEventListener('click', () => {
        if (!seller || !seller.email) {
            alert(translate('seller_contact_unavailable'));
            return;
        }
        const subject = `Vprašanje o oglasu: ${listing.title}`;
        const body = `Pozdravljeni,\n\nzanimam se za oglas "${listing.title}".\n\nLep pozdrav,`;
        window.location.href = `mailto:${seller.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
    if (listing.phone && listing.phone.trim() !== "") {
        showPhoneBtn.style.display = 'block';
        showPhoneBtn.addEventListener('click', () => {
            showPhoneBtn.innerHTML = `<i class="fas fa-phone"></i> ${listing.phone}`;
            showPhoneBtn.disabled = true;
        }, { once: true });
    }
    
    // --- LOGIKA ZA GALERIJO IN PODOBNE OGLASE ---
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const allImages = [...(listing.images?.exterior || []), ...(listing.images?.interior || [])];
    let currentIndex = 0;

    function updateGallery() { /* ... vsa koda za galerijo ... */ }
    function displaySimilarVehicles(targetListing) { /* ... vsa koda za podobne oglase ... */ }

    // --- LOGIKA ZA GUMB "PRILJUBLJENI" ---
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
        if (itemIndex > -1) userFavorites.splice(itemIndex, 1);
        else userFavorites.push(listingId);
        allFavorites[loggedUser.username] = userFavorites;
        localStorage.setItem("mojavto_favorites", JSON.stringify(allFavorites));
    }

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