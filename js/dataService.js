// js/dataService.js

let listings = [];
let brands = {};

// === DODANO: Dinamično določanje osnovne poti za GitHub Pages ===
// Preveri, ali stran teče na github.io domeni in ustrezno prilagodi pot.
const basePath = window.location.hostname.includes('github.io') ? '/MojAvto' : '';

export async function initDataService() {
    try {
        // === POSODOBLJENO: Uporaba dinamične poti 'basePath' ===
        const [listingsResponse, brandsResponse] = await Promise.all([
            fetch(`${basePath}/json/listings.json`),
            fetch(`${basePath}/json/brands_models_global.json`)
        ]);

        if (!listingsResponse.ok || !brandsResponse.ok) {
            console.error('Listings Status:', listingsResponse.status);
            console.error('Brands Status:', brandsResponse.status);
            throw new Error('Napaka pri nalaganju osnovnih podatkov (listings ali brands).');
        }

        listings = await listingsResponse.json();
        brands = await brandsResponse.json();
        
        localStorage.setItem('mojavto_listings', JSON.stringify(listings));
        console.log('Data service inicializiran, podatki naloženi.');

    } catch (error) {
        console.error("Kritična napaka v dataService:", error);
        // Tukaj lahko kasneje dodate prikaz sporočila o napaki uporabniku
    }
}

export function getListings() {
    return listings;
}

export function getBrands() {
    return brands;
}

export function getListingById(id) {
    return listings.find(listing => String(listing.id) === String(id));
}