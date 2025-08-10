// js/dataService.js

let listings = [];
let brands = {};
let dataLoadedPromise = null;

// === KLJUČEN POPRAVEK TUKAJ ===
// Dinamično določimo osnovno pot. Če stran teče na github.io, dodamo ime repozitorija.
// V nasprotnem primeru (za lokalni razvoj) je pot prazna.
const basePath = window.location.hostname.includes('github.io') ? '/MojAvto' : '';

/**
 * Ustvari in vrne obljubo (Promise), ki se razreši, ko so vsi podatki naloženi.
 */
function fetchData() {
    return new Promise(async (resolve, reject) => {
        try {
            // Uporabimo posodobljeno 'basePath' za pravilne URL-je
            const [listingsResponse, brandsResponse] = await Promise.all([
                fetch(`${basePath}/json/listings.json`),
                fetch(`${basePath}/json/brands_models_global.json`)
            ]);

            if (!listingsResponse.ok || !brandsResponse.ok) {
                console.error('Listings Status:', listingsResponse.statusText);
                console.error('Brands Status:', brandsResponse.statusText);
                throw new Error('Napaka pri nalaganju osnovnih podatkov (listings ali brands). Preverite poti do datotek.');
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

// Funkcije za pridobivanje podatkov so sedaj asinhrone in počakajo na nalaganje
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