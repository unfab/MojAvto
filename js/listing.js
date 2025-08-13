import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';
import { calculateTCO } from './utils/tcoCalculator.js';
import { forecastDepreciation } from './utils/depreciationForecaster.js';
import { initCarousel } from './components/Carousel.js';

const detailCategories = {
    "Osnovni podatki": {
        icon: "fas fa-info-circle",
        keys: [
            { key: "year", label: "Letnik", unit: "" },
            { key: "mileage", label: "Prevoženi km", unit: "km" },
            { key: "condition", label: "Stanje", unit: "" },
            { key: "transmission", label: "Menjalnik", unit: "" },
            { key: "owners", label: "Št. lastnikov", unit: "" }
        ]
    },
    "Pogon in motor": {
        icon: "fas fa-cogs",
        keys: [
            { key: "power", label: "Moč motorja", unit: "kW" },
            { key: "fuel", label: "Gorivo", unit: "" },
            { key: "specs.consumption.combined", label: "Komb. poraba", unit: "l/100km" },
            { key: "specs.euro_norm", label: "EURO norma", unit: "" },
            { key: "specs.co2_emissions", label: "CO2 Emisije", unit: "g/km" },
            { key: "specs.particulate_filter", label: "Filter trdih delcev", unit: "" },
            { key: "specs.range", label: "Domet (elektro)", unit: "km" },
            { key: "specs.battery", label: "Baterija (elektro)", unit: "kWh" },
        ]
    },
    "Varnost": {
        icon: "fas fa-shield-alt",
        equipment: ["Alarmna naprava", "Nadzor zračnega tlaka (TPMS)", "ISOFIX pritrdišča", "Meglenke", "Sistem za klic v sili (eCall)", "Zračne zavese"]
    },
    "Asistenčni sistemi": {
        icon: "fas fa-robot",
        equipment: ["Aktivni tempomat", "Sistem za ohranjanje voznega pasu", "Opozarjanje na mrtvi kot", "Samodejno zaviranje v sili", "Prepoznavanje prometnih znakov", "Parkirni senzorji", "Parkirna kamera (360°)", "Sistem za samodejno parkiranje", "Head-up zaslon", "Night Vision"]
    },
    "Udobje & Notranjost": {
        icon: "fas fa-couch",
        equipment: ["Avtomatska klimatska naprava", "Ogrevani sedeži", "Prezračevani/hlajeni sedeži", "Masažni sedeži", "Gretje volana", "Električni sedeži s spominom", "Keyless Go", "Ambientalna osvetlitev", "Senzor za dež", "Električno poklopna ogledala", "Digitalni števci", "Hlajen predal", "Webasto", "Usnjeni sedeži", "Alcantara sedeži", "Delno usnje"]
    },
    "Videz & Zunanjost": {
        icon: "fas fa-car-battery",
        equipment: ["LED / Matrix žarometi", "Aluminijasta platišča", "Vlečna kljuka", "Panoramska streha", "Športni paket", "Zatemnjena stekla", "Strešne sani", "Električni prtljažnik", "Ogrevano prednje steklo"]
    },
    "Multimedija & Povezljivost": {
        icon: "fas fa-satellite-dish",
        equipment: ["Navigacijski sistem", "Apple CarPlay / Android Auto", "Bluetooth", "Digitalni radio (DAB+)", "Brezžično polnjenje telefona", "Premium ozvočenje", "Upravljanje z gestami", "Wi-Fi Hotspot"]
    },
    "Podvozje & Pogon": {
        icon: "fas fa-cogs",
        equipment: ["Športno podvozje", "Zračno vzmetenje", "Štirikolesni pogon", "Zapora diferenciala", "Prilagodljivo vzmetenje", "Štirikolesno krmiljenje"]
    }
};

export function initListingPage({ id: listingId }) {
    const listing = stateManager.getListingById(listingId);
    const { users, loggedInUser } = stateManager.getState();

    if (listing) {
        let recentlyViewed = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
        recentlyViewed = recentlyViewed.filter(id => String(id) !== String(listing.id));
        recentlyViewed.unshift(listing.id);
        localStorage.setItem('mojavto_recentlyViewed', JSON.stringify(recentlyViewed.slice(0, 10)));
    }

    if (!listing) {
        document.querySelector('.listing-container').innerHTML = `<h1 data-i18n-key="listing_not_found">Oglas ni bil najden.</h1>`;
        return;
    }

    // --- DOM ELEMENTI ---
    const titleEl = document.getElementById('listing-title');
    const priceEl = document.getElementById('price');
    const priceEvaluationEl = document.getElementById('price-evaluation');
    const accordionContainer = document.getElementById('vehicle-specs-accordion');
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
    
    if (accordionContainer) {
        accordionContainer.innerHTML = '';
        accordionContainer.className = 'specs-accordion';

        for (const categoryName in detailCategories) {
            const category = detailCategories[categoryName];
            let contentHTML = '';
            
            const availableEquipment = category.equipment?.filter(item => listing.equipment?.includes(item)) || [];
            
            const availableSpecs = [];
            if (category.keys) {
                category.keys.forEach(spec => {
                    const value = spec.key.split('.').reduce((o, i) => o?.[i], listing);
                    if (value !== undefined && value !== null && value !== false) {
                        let displayValue = value;
                        if(typeof value === 'boolean') displayValue = "Da";
                        if(typeof value === 'number') displayValue = value.toLocaleString('sl-SI');
                        availableSpecs.push({ label: spec.label, value: `${displayValue} ${spec.unit || ''}`.trim() });
                    }
                });
            }

            if (availableEquipment.length > 0 || availableSpecs.length > 0) {
                const specsContent = availableSpecs.map(item => `
                    <div class="spec-item">
                        <span><strong>${item.label}:</strong> ${item.value}</span>
                    </div>`).join('');

                const equipmentContent = availableEquipment.map(item => `
                    <div class="spec-item">
                        <i class="fas fa-check" style="color: #22c55e;"></i>
                        <span>${item}</span>
                    </div>`).join('');
                
                contentHTML = `<div class="specs-grid">${specsContent}${equipmentContent}</div>`;

                const detailsElement = document.createElement('details');
                if (categoryName === "Osnovni podatki") {
                    detailsElement.open = true;
                }

                detailsElement.innerHTML = `
                    <summary>
                        <span><i class="${category.icon || 'fas fa-info-circle'}"></i> ${categoryName}</span>
                    </summary>
                    <div class="accordion-content">
                        ${contentHTML}
                    </div>
                `;
                accordionContainer.appendChild(detailsElement);
            }
        }
    }

    // --- LOGIKA ZA PRO FUNKCIJE ---
    if (loggedInUser && loggedInUser.isPro) {
        proFeaturesContainer.style.display = 'block';
        upgradeBanner.style.display = 'none';
        const detailedPriceEl = document.getElementById('detailed-price-analysis');
        if (listing.priceEvaluation) {
            const diff = listing.price - listing.priceEvaluation.expectedPrice;
            const diffText = diff > 0 ? `+${diff.toLocaleString()} €` : `${diff.toLocaleString()} €`;
            detailedPriceEl.innerHTML = `<p>Naša ocena pričakovane cene za to vozilo je <strong>${listing.priceEvaluation.expectedPrice.toLocaleString()} €</strong>.</p><p>Cena tega oglasa je <strong>${diffText}</strong> glede na pričakovanja.</p><small>Ocena temelji na primerjavi s podobnimi vozili, prilagojena za kilometre in opremo.</small>`;
        }
        const tcoEl = document.getElementById('tco-analysis');
        const tcoData = calculateTCO(listing);
        tcoEl.innerHTML = `<p>Predvideni letni stroški: <strong>${tcoData.totalYearly.toLocaleString()} €</strong> (~${tcoData.totalMonthly.toLocaleString()} € / mesec)</p><ul><li>Gorivo: ~${tcoData.fuel.toLocaleString()} €</li><li>Zavarovanje: ~${tcoData.insurance.toLocaleString()} €</li><li>Servis: ~${tcoData.service.toLocaleString()} €</li></ul>`;
        const depreciationEl = document.getElementById('depreciation-analysis');
        const depData = forecastDepreciation(listing);
        depreciationEl.innerHTML = `<p>Predvidena vrednost vozila v prihodnosti:</p><ul><li>Po 1 letu: ~${depData[0].toLocaleString()} €</li><li>Po 2 letih: ~${depData[1].toLocaleString()} €</li><li>Po 3 letih: ~${depData[2].toLocaleString()} €</li></ul>`;
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
            const result = stateManager.toggleFavorite(String(listing.id));
            if (result.success) {
                showNotification(result.added ? 'Dodano med priljubljene!' : 'Odstranjeno iz priljubljenih', 'info');
                updateFavoriteButtonUI();
            }
        });
        updateFavoriteButtonUI();
    }

    // --- "PAMETNI" PREDLOGI PODOBNIH OGLASOV ---
    const allListings = stateManager.getListings();

    function calculateSimilarity(current, other) {
        let score = 0;
        if (current.body_type && current.body_type === other.body_type) score += 3;
        if (current.fuel === other.fuel) score += 2;
        if (Math.abs(current.price - other.price) / current.price < 0.20) score += 2;
        if (Math.abs(current.year - other.year) <= 2) score += 1;
        if (current.power && other.power && Math.abs(current.power - other.power) / current.power < 0.20) score += 1;
        return score;
    }

    const similarListings = allListings
        .filter(l => l.id !== listing.id)
        .map(l => ({ ...l, similarityScore: calculateSimilarity(listing, l) }))
        .filter(l => l.similarityScore > 2)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 10);

    initCarousel({
        trackId: 'similar-vehicles-container',
        prevBtnId: 'similar-prev-btn',
        nextBtnId: 'similar-next-btn',
        listings: similarListings
    });
}