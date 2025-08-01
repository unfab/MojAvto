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

    // Pridobimo izbran oglas iz localStorage
    const listing = JSON.parse(localStorage.getItem("selectedListing"));

    if (!listing) {
        document.querySelector('.listing-container').innerHTML = '<h1>Oglas ni bil najden. Prosimo, vrnite se na domačo stran.</h1>';
        return;
    }

    // DOM elementi za vstavljanje podatkov
    const titleEl = document.getElementById('listing-title');
    const priceEl = document.getElementById('price');
    const keyDetailsEl = document.getElementById('key-details');
    const descriptionEl = document.getElementById('description');
    const sellerNameEl = document.getElementById('seller-name');
    const sellerLocationEl = document.getElementById('seller-location');
    
    // Vstavljanje osnovnih podatkov
    titleEl.textContent = listing.title;
    document.title = `${listing.title} - MojAvto.si`;
    priceEl.textContent = `${listing.price.toLocaleString()} €`;
    descriptionEl.textContent = listing.description || "Prodajalec ni navedel opisa.";
    sellerNameEl.textContent = listing.author || "Neznan prodajalec";
    sellerLocationEl.textContent = listing.region || "Neznana lokacija";

    // Priprava in vstavljanje ključnih podatkov
    const details = {
        "Letnik": listing.year,
        "Stanje": "Rabljeno",
        "Prevoženi km": `${listing.mileage.toLocaleString()} km`,
        "Gorivo": listing.fuel,
        "Menjalnik": listing.transmission,
        "Moč motorja": `${listing.power} kW`
    };

    keyDetailsEl.innerHTML = '';
    for (const [label, value] of Object.entries(details)) {
        if (value) {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item';
            detailItem.innerHTML = `<span class="label">${label}</span><span class="value">${value}</span>`;
            keyDetailsEl.appendChild(detailItem);
        }
    }

    // --- LOGIKA ZA GALERIJO SLIK ---
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    const allImages = [...(listing.images.exterior || []), ...(listing.images.interior || [])];
    let currentIndex = 0;

    function updateGallery() {
        if (allImages.length > 0) {
            mainImage.src = allImages[currentIndex];
            document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentIndex);
            });
        } else {
            mainImage.src = 'https://via.placeholder.com/800x500?text=Ni+slike';
        }
    }

    if (allImages.length > 0) {
        allImages.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = 'thumbnail';
            thumb.addEventListener('click', () => {
                currentIndex = index;
                updateGallery();
            });
            thumbnailContainer.appendChild(thumb);
        });
    }

    prevBtn.addEventListener('click', () => {
        if (allImages.length === 0) return;
        currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        updateGallery();
    });

    nextBtn.addEventListener('click', () => {
        if (allImages.length === 0) return;
        currentIndex = (currentIndex + 1) % allImages.length;
        updateGallery();
    });
    
    updateGallery();
});