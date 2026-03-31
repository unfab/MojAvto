// Home page — MojAvto.si
import { getListings } from '../services/listingService.js';

export async function initHomePage() {
    console.log('[HomePage] init');

    // Load dropdown options for the search
    setupSearchForm();

    // Fetch listings and populate sections
    try {
        const listings = await getListings();
        renderListingsSection('newest-container', 'newest-section', listings);

        // Temporarily using the same listings for featured and popular until we have real stats
        renderListingsSection('featured-container', 'featured-section', listings.filter(l => l.isPremium), true);
        renderListingsSection('popular-container', 'popular-section', [...listings].sort(() => 0.5 - Math.random()).slice(0, 5));

        setupCarousels();
    } catch (err) {
        console.error("Error loading home page listings:", err);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
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
    const sections = ['featured', 'recently-viewed', 'popular', 'newest'];

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
            const bodyTypeGroup = document.getElementById('group-home-bodyType');
            
            if (bodyTypeGroup) {
                if (title === 'Motorji' || title === 'Gospodarska vozila') {
                    bodyTypeGroup.style.display = 'none';
                    if (document.getElementById('home-bodyType')) document.getElementById('home-bodyType').value = "";
                } else {
                    bodyTypeGroup.style.display = 'flex';
                }
            }
        });
    });
}
