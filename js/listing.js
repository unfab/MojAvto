import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';
import { calculateTCO } from './utils/tcoCalculator.js';
import { forecastDepreciation } from './utils/depreciationForecaster.js';

export function initListingPage({ id: listingId }) {
    const listing = stateManager.getListingById(listingId);
    const { users, loggedInUser } = stateManager.getState();

    if (listing) {
        let recentlyViewed = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        recentlyViewed = recentlyViewed.filter(id => String(id) !== String(listing.id));
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
    const priceEvaluationEl = document.getElementById('price-evaluation');
    const keyDetailsEl = document.getElementById('key-details');
    const descriptionEl = document.getElementById('description');
    const sellerNameEl = document.getElementById('seller-name');
    const sellerLocationEl = document.getElementById('seller-location');
    const contactEmailBtn = document.getElementById('contact-email-btn');
    const showPhoneBtn = document.getElementById('show-phone-btn');
    const favBtnDetails = document.getElementById('fav-btn-details');
    const shareBtnDetails = document.getElementById('share-btn-details');
    const proFeaturesContainer = document.getElementById('pro-features-container');
    const upgradeBanner = document.getElementById('upgrade-pro-banner');

    // --- PRIKAZ PODATKOV O OGLASU ---
    titleEl.textContent = listing.title;
    document.title = `${listing.title} - MojAvto.si`;
    priceEl.textContent = `${listing.price.toLocaleString()} €`;
    descriptionEl.textContent = listing.description || translate('no_description_provided');
    sellerNameEl.textContent = listing.author || translate('unknown_seller');
    
    if (listing.priceEvaluation && priceEvaluationEl) {
        priceEvaluationEl.className = `price-badge-details ${listing.priceEvaluation.score}`;
        priceEvaluationEl.textContent = listing.priceEvaluation.text;
        priceEvaluationEl.style.display = 'inline-block';
    }
    
    const seller = users.find(user => user.username === listing.author);
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

    // --- LOGIKA ZA PRO FUNKCIJE ---
    if (loggedInUser && loggedInUser.isPro) {
        proFeaturesContainer.style.display = 'block';
        upgradeBanner.style.display = 'none';

        const detailedPriceEl = document.getElementById('detailed-price-analysis');
        if (listing.priceEvaluation) {
            const diff = listing.price - listing.priceEvaluation.expectedPrice;
            const diffText = diff > 0 ? `+${diff.toLocaleString()} €` : `${diff.toLocaleString()} €`;
            detailedPriceEl.innerHTML = `
                <p>Naša ocena pričakovane cene za to vozilo je <strong>${listing.priceEvaluation.expectedPrice.toLocaleString()} €</strong>.</p>
                <p>Cena tega oglasa je <strong>${diffText}</strong> glede na pričakovanja.</p>
                <small>Ocena temelji na primerjavi s podobnimi vozili, prilagojena za kilometre in opremo.</small>
            `;
        }

        const tcoEl = document.getElementById('tco-analysis');
        const tcoData = calculateTCO(listing);
        tcoEl.innerHTML = `
            <p>Predvideni letni stroški: <strong>${tcoData.totalYearly.toLocaleString()} €</strong> (~${tcoData.totalMonthly.toLocaleString()} € / mesec)</p>
            <ul>
                <li>Gorivo: ~${tcoData.fuel.toLocaleString()} €</li>
                <li>Zavarovanje: ~${tcoData.insurance.toLocaleString()} €</li>
                <li>Servis: ~${tcoData.service.toLocaleString()} €</li>
            </ul>
        `;

        const depreciationEl = document.getElementById('depreciation-analysis');
        const depData = forecastDepreciation(listing);
        depreciationEl.innerHTML = `
            <p>Predvidena vrednost vozila v prihodnosti:</p>
            <ul>
                <li>Po 1 letu: ~${depData[0].toLocaleString()} €</li>
                <li>Po 2 letih: ~${depData[1].toLocaleString()} €</li>
                <li>Po 3 letih: ~${depData[2].toLocaleString()} €</li>
            </ul>
        `;
    } else {
        proFeaturesContainer.style.display = 'none';
        upgradeBanner.style.display = 'block';
    }

    // --- LOGIKA ZA GUMB "DELI" ---
    if (shareBtnDetails) {
        shareBtnDetails.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('Povezava do oglasa je skopirana!', 'success');
            }).catch(err => {
                console.error('Napaka pri kopiranju povezave: ', err);
                showNotification('Povezave ni bilo mogoče skopirati.', 'error');
            });
        });
    }

    // --- LOGIKA ZA KONTAKTNE GUMBE ---
    if (contactEmailBtn && seller) {
        contactEmailBtn.addEventListener('click', () => {
            window.location.href = `mailto:${seller.email}?subject=Zanimanje za oglas: ${listing.title}`;
        });
    }

    if (showPhoneBtn && seller && seller.phone) {
        showPhoneBtn.style.display = 'inline-flex';
        showPhoneBtn.addEventListener('click', () => {
            showPhoneBtn.innerHTML = `<i class="fas fa-phone"></i> ${seller.phone}`;
        }, { once: true });
    }
    
    // --- LOGIKA ZA GALERIJO ---
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const allImages = [...(listing.images?.exterior || []), ...(listing.images?.interior || [])];

    if (mainImage && thumbnailContainer && allImages.length > 0) {
        mainImage.src = allImages[0];
        thumbnailContainer.innerHTML = '';
        allImages.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.alt = `Slika ${index + 1}`;
            thumb.className = 'thumbnail-img';
            if (index === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => {
                mainImage.src = imgSrc;
                document.querySelectorAll('.thumbnail-img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailContainer.appendChild(thumb);
        });
    }
    
    // --- LOGIKA ZA GUMB "PRILJUBLJENI" ---
    function updateFavoriteButtonUI() {
        if (!favBtnDetails) return;
        const { favorites } = stateManager.getState();
        const isFavorited = favorites.includes(String(listing.id));
        
        favBtnDetails.classList.toggle('favorited', isFavorited);
        favBtnDetails.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        favBtnDetails.querySelector('span').textContent = isFavorited ? translate('remove_from_favorites') : translate('add_to_favorites');
    }

    if (favBtnDetails) {
        favBtnDetails.addEventListener('click', () => {
            if (!loggedInUser) {
                showNotification(translate('must_be_logged_in_to_favorite'), 'error');
                return;
            }
            const added = stateManager.toggleFavorite(String(listing.id));
            showNotification(added ? 'Dodano med priljubljene!' : 'Odstranjeno iz priljubljenih', 'info');
            updateFavoriteButtonUI();
        });
        
        updateFavoriteButtonUI();
    }
}