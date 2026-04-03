import { sampleCars } from '../data/sampleListings.js';
import { getListings } from '../services/listingService.js';

export async function initHomePage() {
    console.log('[HomePage] init');

    // Load dropdown options for the search
    setupSearchForm();

    // Setup rotating sponsored ads
    setupRotatingAds();

    // Fetch listings and populate sections
    try {
        const listings = await getListings();

        // Temporarily using the same listings for featured and popular until we have real stats
        renderListingsSection('featured-container', 'featured-section', listings.filter(l => l.isPremium), true);

        setupCarousels();
    } catch (err) {
        console.error("Error loading home page listings:", err);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function setupRotatingAds() {
    const track = document.getElementById('rotating-ads-container');
    const prevBtn = document.getElementById('rot-prev-btn');
    const nextBtn = document.getElementById('rot-next-btn');
    if (!track || !prevBtn || !nextBtn) return;

    const sponsored = [...sampleCars];
    if (sponsored.length === 0) return;

    function renderAdCard(car) {
        const img = car.images?.exterior?.[0] || 'https://via.placeholder.com/120x80?text=Ni+slike';
        const engine = car.engineCc ? `${(car.engineCc / 1000).toFixed(1)}L` : 'N/A';
        const fuel = car.fuel === 'Priključni hibrid' ? 'Priključni h.' : car.fuel;
        
        return `
            <div class="sponsored-mini-card-wrapper">
                <a href="#/oglas?id=${car.id}" class="sponsored-mini-card">
                    <img src="${img}" alt="${car.title}">
                    <h4 class="sponsored-title">${car.make} ${car.model}</h4>
                    <div class="sponsored-specs">
                        <span><i data-lucide="calendar"></i> ${car.year}</span>
                        <span><i data-lucide="gauge"></i> ${car.mileage}</span>
                        <span><i data-lucide="cog"></i> ${engine}</span>
                        <span><i data-lucide="fuel"></i> ${fuel}</span>
                        <span><i data-lucide="joystick"></i> ${car.transmission}</span>
                    </div>
                    <div class="sponsored-price">${car.price}</div>
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
    let animationId = null;

    function startAnimation() {
        if (!isPaused) {
            // Smoothly move targetScroll forward by auto-scroll step
            targetScroll += step;
            
            // Loop logic for targetScroll
            if (targetScroll >= track.scrollWidth / 2) {
                targetScroll = 0;
                scrollAmount = 0; // jump immediately to avoid visible glitch
            }
        }

        // Standard ease-out chase: move scrollAmount toward targetScroll
        // current += (target - current) * ease
        scrollAmount += (targetScroll - scrollAmount) * 0.1;
        
        track.style.transform = `translateX(-${scrollAmount}px)`;
        animationId = requestAnimationFrame(startAnimation);
    }

    // Start
    startAnimation();

    // Pause on hover
    track.addEventListener('mouseenter', () => { isPaused = true; });
    track.addEventListener('mouseleave', () => { isPaused = false; });

    // Buttons functionality with smooth chase
    const jumpSize = 400;
    nextBtn.addEventListener('click', () => {
        targetScroll += jumpSize;
    });

    prevBtn.addEventListener('click', () => {
        targetScroll -= jumpSize;
    });
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
            container.innerHTML = '<p style="padding: 2rem; color: #6b7280; text-align: center; width: 100%;">Trenutno ni oglasov v tej kategoriji.</p>';
        }
        return;
    }

    section.style.display = 'block';

    let html = '';
    listings.forEach(listing => {
        const imgUrl = listing.images?.exterior?.[0] || 'https://via.placeholder.com/300x200?text=Ni+slike';
        const price = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price);

        html += `
            <div class="carousel-item">
                <a href="#/oglas?id=${listing.id}" class="listing-card" style="text-decoration:none; color:inherit; display:block; height:100%;">
                    <div style="position:relative; padding-top:66%; overflow:hidden; border-radius:12px 12px 0 0;">
                        <img src="${imgUrl}" alt="${listing.title}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">
                        ${listing.isPremium ? '<span style="position:absolute; top:10px; left:10px; background:#f97316; color:white; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:bold;">Izpostavljeno</span>' : ''}
                    </div>
                    <div style="padding:15px;">
                        <h3 style="margin:0 0 10px 0; font-size:16px;">${listing.make} ${listing.model} ${listing.type || ''}</h3>
                        <div style="font-size:20px; font-weight:bold; color:#f97316; margin-bottom:15px;">${price}</div>
                        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px; font-size:13px; color:#6b7280;">
                            <li><i class="fas fa-calendar-alt"></i> ${listing.year}</li>
                            <li><i class="fas fa-road"></i> ${listing.mileage} km</li>
                            <li><i class="fas fa-gas-pump"></i> ${listing.fuel}</li>
                            <li><i class="fas fa-cogs"></i> ${listing.transmission}</li>
                        </ul>
                    </div>
                </a>
            </div>
        `;
    });

    container.innerHTML = html;
}

function setupCarousels() {
    const sections = ['featured', 'recently-viewed'];

    sections.forEach(section => {
        const track = document.getElementById(`${section}-container`);
        const prevBtn = document.getElementById(`${section}-prev-btn`);
        const nextBtn = document.getElementById(`${section}-next-btn`);

        if (!track || !prevBtn || !nextBtn) return;

        const scrollAmount = 300; // rough width of a card + gap

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    });
}

function setupSearchForm() {
    const brandSelect = document.getElementById("home-make");
    const modelSelect = document.getElementById("home-model");
    const yearSelect = document.getElementById("home-reg-from");

    if (!brandSelect || !modelSelect || !yearSelect) return;

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1980; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // Load brands and models
    fetch("/json/brands_models_global.json")
        .then(res => res.json())
        .then(brandModelData => {
            Object.keys(brandModelData).sort().forEach(brand => {
                const option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });

            // Initialize custom selects after options are added
            import('../utils/customSelect.js').then(m => {
                m.createCustomSelect(brandSelect);
                m.createCustomSelect(modelSelect);
                m.createCustomSelect(yearSelect);
                
                // Also fuel and mileage if they are on home page
                const fuelSelect = document.getElementById("home-fuel-type");
                if (fuelSelect) m.createCustomSelect(fuelSelect);
                
                const mileageSelect = document.getElementById("home-mileage-to");
                if (mileageSelect) m.createCustomSelect(mileageSelect);

                const priceSelect = document.getElementById("home-price-to");
                if (priceSelect) m.createCustomSelect(priceSelect);
            });

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
            });
        }).catch(err => console.warn("Could not load brands for home search.", err));

    // Simple search redirect
    const form = document.getElementById('homeSearchForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // In Phase 2 this should ideally navigate to advanced-search with query params
            window.location.hash = '/oglasi';
        });
    }

    // Connect Tab Buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const title = btn.getAttribute('title');
            const bodyTypeGroup = document.getElementById('group-home-bodyType');
            
            if (bodyTypeGroup) {
                if (title === 'Motorji' || title === 'Gospodarska vozila') {
                    bodyTypeGroup.style.display = 'none';
                    const btSelect = document.getElementById('home-bodyType');
                    if (btSelect) btSelect.value = "";
                } else {
                    bodyTypeGroup.style.display = 'flex';
                }
            }
        });
    });
}
