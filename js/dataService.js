// js/dataService.js

let listings = [];
let brands = {};
let dataLoadedPromise = null;

const basePath = window.location.hostname.includes('github.io') ? '/MojAvto' : '';

function fetchData() {
    return new Promise(async (resolve, reject) => {
        try {
            // === POPRAVEK: Kličemo pravilno ime datoteke 'listings.json' ===
            const [listingsResponse, brandsResponse] = await Promise.all([
                fetch(`${basePath}/json/listings.json`),
                fetch(`${basePath}/json/brands_models_global.json`)
            ]);

            if (!listingsResponse.ok || !brandsResponse.ok) {
                console.error('Listings Status:', listingsResponse.status, listingsResponse.statusText);
                console.error('Brands Status:', brandsResponse.status, brandsResponse.statusText);
                throw new Error('Napaka pri nalaganju osnovnih podatkov.');
            }

            listings = await listingsResponse.json();
            brands = await brandsResponse.json();
            
            localStorage.setItem('mojavto_listings', JSON.stringify(listings));
            console.log('Data service inicializiran, podatki naloženi.');
            resolve();
        } catch (error) {
            console.error("Kritična napaka v dataService:", error);
            reject(error);
        }
    });
}

export function initDataService() {
    if (!dataLoadedPromise) {
        dataLoadedPromise = fetchData();
    }
    return dataLoadedPromise;
}

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