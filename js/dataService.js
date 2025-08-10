// js/dataService.js

let listings = [];
let brands = {};
let dataLoadedPromise = null;

// Dinamično določimo osnovno pot za združljivost z GitHub Pages.
const basePath = window.location.hostname.includes('github.io') ? '/MojAvto' : '';

/**
 * Ustvari in vrne obljubo (Promise), ki se razreši, ko so vsi podatki naloženi.
 */
function fetchData() {
    return new Promise(async (resolve, reject) => {
        try {
            // === POPRAVEK TUKAJ: Ime datoteke je popravljeno v 'listing.json' ===
            const [listingsResponse, brandsResponse] = await Promise.all([
                fetch(`${basePath}/json/listing.json`),
                fetch(`${basePath}/json/brands_models_global.json`)
            ]);

            if (!listingsResponse.ok || !brandsResponse.ok) {
                console.error('Listings Status:', listingsResponse.status, listingsResponse.statusText);
                console.error('Brands Status:', brandsResponse.status, brandsResponse.statusText);
                throw new Error('Napaka pri nalaganju osnovnih podatkov (listings ali brands). Preverite, ali datoteke obstajajo v mapi /json/.');
            }

            listings = await listingsResponse.json();
            brands = await brandsResponse.json();
            
            localStorage.setItem('mojavto_listings', JSON.stringify(listings));
            console.log('Data service inicializiran, podatki naloženi.');
            resolve(); // Podatki so uspešno naloženi
        } catch (error) {
            console.error("Kritična napaka v dataService:", error);
            reject(error); // Javi napako naprej v app.js
        }
    });
}

/**
 * Glavna funkcija za inicializacijo. Zažene nalaganje podatkov.
 */
export function initDataService() {
    if (!dataLoadedPromise) {
        dataLoadedPromise = fetchData();
    }
    return dataLoadedPromise;
}

// Funkcije za pridobivanje podatkov ostanejo enake
export async function getListings() {
    await dataLoadedPromise;
    return listings;
}

export async function getBrands() {
    await dataLoadedPromise;
    return brands;
}

export async function getListingById(id) {
    await dataLoadedPromise;
    return listings.find(listing => String(listing.id) === String(id));
}
