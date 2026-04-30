import { sampleCars } from '../data/sampleListings.js';
import { getListings } from '../services/listingService.js';
import { 
    getFuelPill, 
    getPowerPill, 
    getConsumptionPill, 
    getTransmissionPill,
    getYearPill,
    getKmPill
} from '../utils/listingUtils.js';

let allListings = [];

export async function initHomePage() {
    console.log('[HomePage] init');

    // Setup rotating sponsored ads
    setupRotatingAds();

    // Fetch listings and populate sections
    try {
        allListings = await getListings();
        
        // Initial render (cars)
        updateHomeCategory('Avtomobili');
    } catch (err) {
        console.error("Error loading home page listings:", err);
    }

    setupSearchForm();
    setupCarousels();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Updates the homepage content based on selected category tab
 * @param {string} title - Tab title (Avtomobili, Motorji, Gospodarska vozila)
 */
function updateHomeCategory(title) {
    let category = 'avto';
    if (title === 'Motorji') category = 'motor';
    if (title === 'Gospodarska vozila') category = 'gospodarska';

    // Filter featured listings for this category
    const categoryListings = allListings.filter(l => l.category === category);
    const featured = categoryListings.filter(l => l.isPremium);
    
    renderListingsSection('featured-container', 'featured-section', featured, false);
    
    // Reload brands for the search form
    reloadBrands(category);
}

function setupRotatingAds() {
    const track = document.getElementById('rotating-ads-container');
    const prevBtn = document.getElementById('rot-prev-btn');
    const nextBtn = document.getElementById('rot-next-btn');
    if (!track || !prevBtn || !nextBtn) return;

    // Filter for rotating ads (usually premium/sponsored across all categories)
    const sponsored = allListings.length > 0 ? allListings.filter(l => l.isPremium) : [...sampleCars];
    if (sponsored.length === 0) return;

    function renderAdCard(car) {
        const img = car.images?.exterior?.[0] || 'https://via.placeholder.com/120x80?text=Ni+slike';
        
        return `
            <div class="sponsored-mini-card-wrapper">
                <a href="#/oglas?id=${car.id}" class="sponsored-mini-card">
                    <img src="${img}" alt="${car.title}">
                    <h4 class="sponsored-title">${car.make} ${car.model}</h4>
                    <div class="sponsored-specs centered">
                        <div class="spec-row centered">
                            ${getYearPill(car.year)}
                            ${getKmPill(car.mileage)}
                        </div>
                        <div class="spec-row centered">
                            ${getFuelPill(car.fuel)}
                            ${getTransmissionPill(car.transmission)}
                        </div>
                        <div class="spec-row centered">
                            ${getConsumptionPill(car)}
                        </div>
                    </div>
                    <div class="sponsored-price">${typeof car.price === 'number' ? new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price) : car.price}</div>
                </a>
            </div>
        `;
    }

    // Render twice for loop
    track.innerHTML = [...sponsored, ...sponsored].map(car => renderAdCard(car)).join('');
    if (window.lucide) window.lucide.createIcons();

    let scrollAmount = 0;
    let targetScroll = 0;
    let step = 0.8; // Speed of auto-scroll
    let isPaused = false;

    function startAnimation() {
        if (!isPaused) {
            targetScroll += step;
            if (targetScroll >= track.scrollWidth / 2) {
                targetScroll = 0;
                scrollAmount = 0;
            }
        }
        scrollAmount += (targetScroll - scrollAmount) * 0.1;
        track.style.transform = `translateX(-${scrollAmount}px)`;
        requestAnimationFrame(startAnimation);
    }

    startAnimation();

    track.addEventListener('mouseenter', () => { isPaused = true; });
    track.addEventListener('mouseleave', () => { isPaused = false; });

    const jumpSize = 400;
    nextBtn.addEventListener('click', () => { targetScroll += jumpSize; });
    prevBtn.addEventListener('click', () => { targetScroll -= jumpSize; });
}

function renderListingsSection(containerId, sectionId, listings, hideIfEmpty = false) {
    const container = document.getElementById(containerId);
    const section = document.getElementById(sectionId);
    if (!container || !section) return;

    if (!listings || listings.length === 0) {
        if (hideIfEmpty) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            container.innerHTML = '<p style="padding: 2rem; color: #6b7280; text-align: center; width: 100%;">Trenutno ni izpostavljenih oglasov v tej kategoriji.</p>';
        }
        return;
    }

    section.style.display = 'block';

    let html = '';
    listings.forEach(listing => {
        const imgUrl = listing.images?.exterior?.[0] || 'https://via.placeholder.com/300x200?text=Ni+slike';
        const price = typeof listing.price === 'number' ? 
            new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price) : 
            listing.price;

        html += `
            <div class="carousel-item">
                <a href="#/oglas?id=${listing.id}" class="listing-card">
                    <div class="listing-card-img">
                        <img src="${imgUrl}" alt="${listing.title}">
                        ${listing.isPremium ? '<span class="premium-badge">Izpostavljeno</span>' : ''}
                    </div>
                    <div class="listing-card-content">
                        <h3 class="listing-card-title">${listing.make} ${listing.model}</h3>
                        <div class="listing-card-specs centered">
                            <div class="spec-row centered">
                                ${getYearPill(listing.year)}
                                ${getKmPill(listing.mileage)}
                                <div class="spec-pill"><i data-lucide="cog"></i> ${(listing.engineCc / 1000).toFixed(1)}L</div>
                            </div>
                            <div class="spec-row centered">
                                ${getFuelPill(listing.fuel)}
                                ${getTransmissionPill(listing.transmission)}
                                ${getConsumptionPill(listing)}
                            </div>
                        </div>
                        <div class="listing-card-price">${price}</div>
                    </div>
                </a>
            </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}


function setupCarousels() {
    const sections = ['featured', 'recently-viewed'];

    sections.forEach(section => {
        const track = document.getElementById(`${section}-container`);
        const prevBtn = document.getElementById(`${section}-prev-btn`);
        const nextBtn = document.getElementById(`${section}-next-btn`);

        if (!track || !prevBtn || !nextBtn) return;

        const scrollAmount = 300; 

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    });
}

function reloadBrands(category) {
    const brandSelect = document.getElementById("home-make");
    const modelSelect = document.getElementById("home-model");
    if (!brandSelect || !modelSelect) return;

    let jsonFile = "/json/brands_models_global.json";
    if (category === 'motor') jsonFile = "/json/brands_models_moto.json";
    if (category === 'gospodarska') jsonFile = "/json/brands_models_gospodarska.json";

    fetch(jsonFile)
        .then(res => res.json())
        .then(brandModelData => {
            // Clear current options
            brandSelect.innerHTML = '<option value="">Vse znamke</option>';
            modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
            modelSelect.disabled = true;

            Object.keys(brandModelData).sort().forEach(brand => {
                const option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });

            // Update custom selects
            import('../utils/customSelect.js').then(m => {
                m.createCustomSelect(brandSelect);
                m.createCustomSelect(modelSelect);
            });

            // Model change listener
            brandSelect.addEventListener("change", function () {
                const selectedMake = brandSelect.value;
                modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
                modelSelect.disabled = true;

                if (selectedMake && brandModelData[selectedMake]) {
                    const models = brandModelData[selectedMake];
                    const modelKeys = Array.isArray(models) ? models : Object.keys(models);
                    modelKeys.forEach(model => {
                        const option = document.createElement("option");
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.disabled = false;
                }
                
                import('../utils/customSelect.js').then(m => {
                    m.createCustomSelect(modelSelect);
                });
            });
        });
}

function setupSearchForm() {
    const yearSelect = document.getElementById("home-reg-from");
    if (!yearSelect) return;

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    import('../utils/customSelect.js').then(m => {
        m.createCustomSelect(yearSelect);
        
        const fuelSelect = document.getElementById("home-fuel-type");
        if (fuelSelect) m.createCustomSelect(fuelSelect);
        
        const mileageSelect = document.getElementById("home-mileage-to");
        if (mileageSelect) m.createCustomSelect(mileageSelect);

        const priceSelect = document.getElementById("home-price-to");
        if (priceSelect) m.createCustomSelect(priceSelect);
    });

    // Simple search redirect
    const form = document.getElementById('homeSearchForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.hash = '/iskanje';
        });
    }

    // Connect Tab Buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const title = btn.getAttribute('title');
            updateHomeCategory(title);

            const bodyTypeGroup = document.getElementById('group-home-bodyType');
            if (bodyTypeGroup) {
                if (title === 'Motorji' || title === 'Gospodarska vozila') {
                    bodyTypeGroup.style.display = 'none';
                } else {
                    bodyTypeGroup.style.display = 'flex';
                }
            }
        });
    });
}
