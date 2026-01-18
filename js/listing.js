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

    fetch("footer.html")
        .then(res => res.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
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
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // --- PRIKAZ PODATKOV O OGLASU ---
    titleEl.textContent = listing.title;
    document.title = `${listing.title} - MojAvto.si`;
    priceEl.textContent = `${listing.price.toLocaleString()} €`;
    descriptionEl.textContent = listing.description || "Prodajalec ni navedel opisa.";
    sellerNameEl.textContent = listing.author || "Neznan prodajalec";
    const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    const seller = allUsers.find(user => user.username === listing.author);
    sellerLocationEl.textContent = seller ? (seller.region || "Neznana lokacija") : "Neznana lokacija";

    // Pripravi ključne podatke
    const details = {
        [translate('spec_brand')]: listing.make,
        [translate('spec_model')]: listing.model,
        [translate('spec_year')]: listing.year,
        [translate('spec_mileage')]: `${listing.mileage.toLocaleString()} km`,
        [translate('spec_power')]: listing.power ? `${listing.power} kW` : 'N/A',
        [translate('spec_fuel')]: listing.fuel,
        [translate('spec_transmission')]: listing.transmission
    };

    // Dodaj material sedežev če obstaja
    if (listing.seatMaterial) {
        details[translate('spec_seat_material') || 'Material sedežev'] = listing.seatMaterial;
    }

    // Dodaj tip hibrida če obstaja
    if (listing.hybridType) {
        details[translate('spec_hybrid_type') || 'Tip hibrida'] = listing.hybridType;
    }

    // Dodaj električne podatke če obstajajo
    if (listing.battery) {
        details[translate('spec_battery') || 'Baterija'] = `${listing.battery} kWh`;
    }
    if (listing.range) {
        details[translate('spec_range') || 'Domet'] = `${listing.range} km`;
    }

    // Prikaži ključne podatke
    for (const [label, value] of Object.entries(details)) {
        const detailItem = document.createElement('p');
        detailItem.innerHTML = `<strong>${label}:</strong> ${value}`;
        keyDetailsEl.appendChild(detailItem);
    }

    // --- LOGIKA ZA KONTAKTNE GUMBE ---
    contactEmailBtn.addEventListener('click', () => {
        const subject = encodeURIComponent(`Povpraševanje za: ${listing.title}`);
        const body = encodeURIComponent(`Pozdravljeni,\n\nZanima me vaš oglas za ${listing.title}.\n\nLep pozdrav`);
        window.location.href = `mailto:${listing.author}@mojavto.si?subject=${subject}&body=${body}`;
    });

    if (listing.phone && listing.phone.trim() !== "") {
        showPhoneBtn.style.display = 'block';
        showPhoneBtn.addEventListener('click', () => {
            showPhoneBtn.innerHTML = `<i class="fas fa-phone"></i> ${listing.phone}`;
            showPhoneBtn.disabled = true;
        }, { once: true });
    }

    // --- LOGIKA ZA GALERIJO ---
    let currentImageIndex = 0;
    const images = listing.images?.exterior || [];

    function updateGallery() {
        if (images.length === 0) {
            mainImage.src = 'https://via.placeholder.com/600x400?text=Ni+slike';
            mainImage.alt = 'Ni slike';
            return;
        }

        mainImage.src = images[currentImageIndex];
        mainImage.alt = `${listing.title} - slika ${currentImageIndex + 1}`;

        // Posodobi thumbnails
        thumbnailContainer.innerHTML = '';
        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.alt = `Thumbnail ${index + 1}`;
            thumb.classList.add('thumbnail');
            if (index === currentImageIndex) {
                thumb.classList.add('active');
            }
            thumb.addEventListener('click', () => {
                currentImageIndex = index;
                updateGallery();
            });
            thumbnailContainer.appendChild(thumb);
        });

        // Prikaži/skrij navigacijske gumbe
        prevBtn.style.display = images.length > 1 ? 'block' : 'none';
        nextBtn.style.display = images.length > 1 ? 'block' : 'none';
    }

    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateGallery();
    });

    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateGallery();
    });

    // --- PODOBNI OGLASI ---
    function displaySimilarVehicles(targetListing) {
        const allListings = JSON.parse(localStorage.getItem("mojavto_listings")) || [];
        const similarVehicles = allListings
            .filter(l => l.id !== targetListing.id && l.make === targetListing.make)
            .slice(0, 3);

        const container = document.getElementById('similar-vehicles-container');
        container.innerHTML = '';

        if (similarVehicles.length === 0) {
            container.innerHTML = '<p>Ni podobnih oglasov.</p>';
            return;
        }

        similarVehicles.forEach(vehicle => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${vehicle.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${vehicle.title}" />
                </div>
                <div class="card-body">
                    <h3 class="card-title">${vehicle.title}</h3>
                    <p class="card-details">${translate('spec_year')}: ${vehicle.year} | ${translate('spec_mileage')}: ${vehicle.mileage.toLocaleString()} km</p>
                    <p class="card-price">${vehicle.price.toLocaleString()} €</p>
                </div>`;

            card.addEventListener('click', () => {
                localStorage.setItem("selectedListing", JSON.stringify(vehicle));
                location.reload();
            });

            container.appendChild(card);
        });
    }

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
        if (itemIndex > -1) {
            userFavorites.splice(itemIndex, 1);
        } else {
            userFavorites.push(listingId);
        }
        allFavorites[loggedUser.username] = userFavorites;
        localStorage.setItem("mojavto_favorites", JSON.stringify(allFavorites));
        updateFavoriteButtonUI();
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