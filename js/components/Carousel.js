// js/components/Carousel.js

/**
 * Ustvari in inicializira komponento drsnika (carousel).
 * @param {object} config - Konfiguracijski objekt.
 * @param {string} config.trackId - ID elementa, ki vsebuje kartice (trak).
 * @param {string} config.prevBtnId - ID gumba za premik nazaj.
 * @param {string} config.nextBtnId - ID gumba za premik naprej.
 * @param {Array} config.listings - Seznam oglasov za prikaz v drsniku.
 */
export function initCarousel({ trackId, prevBtnId, nextBtnId, listings }) {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const trackContainer = track?.parentElement;

    if (!track || !prevBtn || !nextBtn || !trackContainer) {
        console.error("Carousel init failed: One of the required elements is missing.");
        return;
    }

    if (!listings || listings.length === 0) {
        // Če ni oglasov, skrijemo celoten drsnik
        const wrapper = track.closest('.carousel-section');
        if (wrapper) {
            wrapper.style.display = 'none';
        }
        return;
    }

    // Počistimo morebitno staro vsebino in napolnimo drsnik s karticami
    track.innerHTML = '';
    listings.forEach(l => {
        const card = document.createElement('div');
        card.className = 'carousel-card';
        card.dataset.id = l.id;
        card.innerHTML = `
            <img src="${l.images?.exterior[0] || 'https://via.placeholder.com/280x180?text=MojAvto.si'}" alt="${l.title}">
            <div class="carousel-card-content">
                <h4 class="carousel-card-title">${l.title}</h4>
                <p class="carousel-card-price">${l.price.toLocaleString('sl-SI')} €</p>
            </div>
        `;
        card.addEventListener('click', () => window.location.hash = `#/listing/${l.id}`);
        track.appendChild(card);
    });

    // Logika za upravljanje drsnika
    const cardWidth = 280 + 16; // Širina kartice (280px) + razmik (1rem = 16px)
    let currentIndex = 0;

    // Preverimo, ali so gumbi sploh potrebni (če je vsebina manjša od vsebnika)
    const updateButtonVisibility = () => {
        const trackWidth = track.scrollWidth;
        const containerWidth = trackContainer.clientWidth;
        
        const isOverflowing = trackWidth > containerWidth;
        
        prevBtn.style.display = isOverflowing ? 'block' : 'none';
        nextBtn.style.display = isOverflowing ? 'block' : 'none';
    };
    
    const updateCarousel = () => {
        // Izračunamo maksimalni premik, da drsnik ne gre "v prazno"
        const maxTranslateX = Math.max(0, track.scrollWidth - trackContainer.clientWidth);
        let translateX = currentIndex * cardWidth;
        
        // Zagotovimo, da ne gremo predaleč
        if (translateX > maxTranslateX) {
            translateX = maxTranslateX;
        }
        track.style.transform = `translateX(-${translateX}px)`;
    };

    nextBtn.addEventListener('click', () => {
        const itemsInView = Math.floor(trackContainer.clientWidth / cardWidth);
        const maxPossibleIndex = track.children.length - itemsInView;
        
        if (currentIndex < maxPossibleIndex) {
            currentIndex++;
            updateCarousel();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    // Posodobimo vidnost gumbov ob nalaganju in ob spremembi velikosti okna
    updateButtonVisibility();
    window.addEventListener('resize', updateButtonVisibility);
}