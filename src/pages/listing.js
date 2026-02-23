// Listing detail page — MojAvto.si
import { getListingById } from '../services/listingService.js';

export async function initListingPage() {
    console.log('[ListingPage] init');

    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const listingId = urlParams.get('id');

    if (!listingId) {
        document.querySelector('.listing-container').innerHTML = '<h2>Oglas ni bil najden.</h2><a href="#/">Nazaj na domov</a>';
        return;
    }

    try {
        const listing = await getListingById(listingId);
        populateListingData(listing);
    } catch (err) {
        console.error("Failed to fetch listing:", err);
        document.querySelector('.listing-container').innerHTML = `<h2>Oglas ne obstaja.</h2><p>${err.message}</p><a href="#/">Nazaj na domov</a>`;
    }
}

function populateListingData(listing) {
    // Basic stuff
    document.getElementById('listing-title').textContent = `${listing.make} ${listing.model} ${listing.type || ''}`;

    const priceFormatted = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price);
    document.getElementById('price').textContent = priceFormatted;

    document.getElementById('description').textContent = listing.description || 'Ni opisa.';

    // Seller Info
    document.getElementById('seller-name').textContent = listing.authorName || 'Zasebni prodajalec';
    document.getElementById('seller-location').textContent = listing.region || 'Slovenija';

    const phoneBtn = document.getElementById('show-phone-btn');
    if (listing.phone) {
        phoneBtn.style.display = 'inline-block';
        phoneBtn.addEventListener('click', () => {
            phoneBtn.innerHTML = `<i class="fas fa-phone"></i> ${listing.phone}`;
        });
    }

    document.getElementById('contact-email-btn').addEventListener('click', () => {
        alert("Funkcija za pošiljanje sporočil še ni implementirana.");
    });

    // Key specs
    const keyDetailsEl = document.getElementById('key-details');
    keyDetailsEl.innerHTML = `
        <div class="spec-item"><i class="fas fa-calendar"></i> <span>Letnik:</span> <strong>${listing.year}</strong></div>
        <div class="spec-item"><i class="fas fa-road"></i> <span>Prevoženi:</span> <strong>${listing.mileage} km</strong></div>
        <div class="spec-item"><i class="fas fa-gas-pump"></i> <span>Gorivo:</span> <strong>${listing.fuel}</strong></div>
        <div class="spec-item"><i class="fas fa-cogs"></i> <span>Menjalnik:</span> <strong>${listing.transmission}</strong></div>
        <div class="spec-item"><i class="fas fa-bolt"></i> <span>Moč motorja:</span> <strong>${listing.power} kW</strong></div>
    `;

    // Images
    const images = listing.images?.exterior || [];
    const mainImg = document.getElementById('main-image');
    const thumbnailsContainer = document.getElementById('thumbnail-container');

    let currentImageIndex = 0;

    if (images.length > 0) {
        mainImg.src = images[0];

        images.forEach((url, i) => {
            const thumb = document.createElement('img');
            thumb.src = url;
            thumb.className = i === 0 ? 'active' : '';
            thumb.addEventListener('click', () => {
                currentImageIndex = i;
                updateGallery();
            });
            thumbnailsContainer.appendChild(thumb);
        });
    } else {
        mainImg.src = 'https://via.placeholder.com/800x400?text=Ni+slike';
    }

    function updateGallery() {
        if (images.length === 0) return;
        mainImg.src = images[currentImageIndex];
        const thumbs = thumbnailsContainer.querySelectorAll('img');
        thumbs.forEach((t, i) => {
            t.className = i === currentImageIndex ? 'active' : '';
        });
    }

    document.getElementById('prev-btn')?.addEventListener('click', () => {
        if (images.length === 0) return;
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateGallery();
    });

    document.getElementById('next-btn')?.addEventListener('click', () => {
        if (images.length === 0) return;
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateGallery();
    });
}
