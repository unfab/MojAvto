import { stateManager } from './stateManager.js';
import { translate } from './i18n.js';
import { initCarousel } from './components/Carousel.js';

const SLOVENIAN_REGIONS = [
    "Osrednjeslovenska", "Gorenjska", "Goriška", "Obalno-kraška",
    "Notranjsko-kraška", "Jugovzhodna Slovenija", "Posavska", "Zasavska",
    "Savinjska", "Koroška", "Podravska", "Pomurska"
];

export async function initHomePage() {
    // === DOM Elementi ===
    const searchForm = document.getElementById('homeSearchForm');
    const makeSelect = document.getElementById('home-make');
    const modelSelect = document.getElementById('home-model');
    const regFromSelect = document.getElementById('home-reg-from');
    const regionSelect = document.getElementById('home-region');
    const quickLinkNew = document.getElementById('quick-link-new');
    const quickLinkVerified = document.getElementById('quick-link-verified');
    const quickLinkFamily = document.getElementById('quick-link-family');
    const brandsGrid = document.querySelector('.brands-grid');
    const newsGrid = document.querySelector('.news-grid');

    if (!searchForm || !makeSelect || !regionSelect) {
        console.error("Manjka ključen element na domači strani (formular).");
        return;
    }

    // === Podatki ===
    const allListings = stateManager.getListings();
    const { allFavorites } = stateManager.getState();
    const brandModelData = stateManager.getBrands();

    if (!brandModelData || Object.keys(brandModelData).length === 0) {
        console.error("Podatki o znamkah niso na voljo v stateManagerju.");
        return;
    }

    // === Polnjenje iskalnega obrazca ===
    const sortedBrands = Object.keys(brandModelData).sort();
    sortedBrands.forEach(brand => makeSelect.add(new Option(brand, brand)));
    
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        regFromSelect.add(new Option(y, y));
    }
    SLOVENIAN_REGIONS.forEach(region => {
        regionSelect.add(new Option(region, region));
    });

    makeSelect.addEventListener('change', function() {
        modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
        modelSelect.disabled = true;
        if (this.value && brandModelData[this.value]) {
            Object.keys(brandModelData[this.value]).sort().forEach(model => {
                modelSelect.add(new Option(model, model));
            });
            modelSelect.disabled = false;
        }
    });
    
    // === Event Listeners ===
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(searchForm);
        const criteria = Object.fromEntries(formData.entries());
        sessionStorage.setItem('searchCriteria', JSON.stringify(criteria));
        window.location.hash = '#/search-results';
    });

    if (quickLinkNew) {
        quickLinkNew.addEventListener('click', (e) => {
            e.preventDefault();
            const criteria = { "condition": "Novo" };
            sessionStorage.setItem('searchCriteria', JSON.stringify(criteria));
            window.location.hash = '#/search-results';
        });
    }

    if (quickLinkVerified) {
        quickLinkVerified.addEventListener('click', (e) => {
            e.preventDefault();
            const criteria = { "service_history": "true", "undamaged": "true" };
            sessionStorage.setItem('searchCriteria', JSON.stringify(criteria));
            window.location.hash = '#/search-results';
        });
    }
    
    if (quickLinkFamily) {
        quickLinkFamily.addEventListener('click', (e) => {
            e.preventDefault();
            const criteria = { "body_type": ["Karavan", "Enoprostorec", "SUV"] };
            sessionStorage.setItem('searchCriteria', JSON.stringify(criteria));
            window.location.hash = '#/search-results';
        });
    }

    if (brandsGrid) {
        brandsGrid.addEventListener('click', (e) => {
            const brandCard = e.target.closest('.brand-card');
            if (brandCard) {
                e.preventDefault();
                const brandName = brandCard.dataset.brand;
                if (brandName) {
                    const criteria = { make: brandName };
                    sessionStorage.setItem('searchCriteria', JSON.stringify(criteria));
                    window.location.hash = '#/search-results';
                }
            }
        });
    }

    // === Dinamično nalaganje novic ===
    if (newsGrid) {
        const articles = stateManager.getArticles().slice(0, 3); // Prikažemo zadnje 3
        newsGrid.innerHTML = ''; // Počistimo morebitno statično vsebino
        if (articles.length > 0) {
            articles.forEach(article => {
                const articleCard = document.createElement('a');
                articleCard.className = 'news-card';
                articleCard.href = `#/article/${article.id}`; 
                
                const snippet = article.content.substring(0, 100).replace(/<[^>]*>?/gm, '');

                articleCard.innerHTML = `
                    <img src="${article.imageUrl}" alt="${article.title}">
                    <div class="news-card-content">
                        <h3>${article.title}</h3>
                        <p>${snippet}...</p>
                        <span class="read-more-btn">Preberi več <i class="fas fa-arrow-right"></i></span>
                    </div>
                `;
                newsGrid.appendChild(articleCard);
            });
        } else {
            // === IZBOLJŠAVA: Če ni člankov, skrijemo celotno sekcijo z novicami ===
            const newsSection = newsGrid.closest('.news-section');
            if(newsSection) {
                newsSection.style.display = 'none';
            }
        }
    }
    
    // === Inicializacija vseh drsnikov (Carousel) ===
    const featuredSection = document.getElementById('featured-section');
    if (featuredSection) {
        const featuredListings = allListings.filter(listing => listing.isFeatured === true);
        if (featuredListings.length > 0) {
            featuredSection.style.display = 'block';
            initCarousel({
                trackId: 'featured-container',
                prevBtnId: 'featured-prev-btn',
                nextBtnId: 'featured-next-btn',
                listings: featuredListings
            });
        }
    }

    const recentlyViewedIds = JSON.parse(localStorage.getItem('mojavto_recentlyViewed')) || [];
    const recentSection = document.getElementById('recently-viewed-section');
    if (recentSection && recentlyViewedIds.length > 0) {
        const recentlyViewedListings = recentlyViewedIds
            .map(id => allListings.find(l => String(l.id) === String(id)))
            .filter(Boolean);
        if (recentlyViewedListings.length > 0) {
            recentSection.style.display = 'block';
            initCarousel({
                trackId: 'recently-viewed-container',
                prevBtnId: 'recent-prev-btn',
                nextBtnId: 'recent-next-btn',
                listings: recentlyViewedListings
            });
        }
    }
    
    const popularSection = document.getElementById('popular-section');
    if (popularSection && allFavorites) {
        const favoriteCounts = {};
        Object.values(allFavorites).forEach(favArray => {
            favArray.forEach(listingId => {
                favoriteCounts[listingId] = (favoriteCounts[listingId] || 0) + 1;
            });
        });
        const popularListings = Object.entries(favoriteCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10)
            .map(([listingId]) => allListings.find(l => String(l.id) === listingId))
            .filter(Boolean);
        if (popularListings.length > 0) {
            popularSection.style.display = 'block';
            initCarousel({
                trackId: 'popular-container',
                prevBtnId: 'popular-prev-btn',
                nextBtnId: 'popular-next-btn',
                listings: popularListings
            });
        }
    }

    const newestSection = document.getElementById('newest-section');
    if (newestSection) {
        const newestListings = [...allListings]
            .sort((a, b) => new Date(b.date_added) - new Date(a.date_added))
            .slice(0, 10);
        if (newestListings.length > 0) {
            newestSection.style.display = 'block';
            initCarousel({
                trackId: 'newest-container',
                prevBtnId: 'newest-prev-btn',
                nextBtnId: 'newest-next-btn',
                listings: newestListings
            });
        }
    }
}