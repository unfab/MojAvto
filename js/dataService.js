// Ta datoteka deluje kot centralna shramba za podatke aplikacije.
// Podatke naloži samo enkrat, nato pa jih ponudi ostalim delom aplikacije.

let listings = [];
let brands = {};

/**
 * Glavna funkcija, ki se zažene ob zagonu aplikacije.
 * Naloži vse potrebne podatke in jih shrani v "cache".
 */
export async function initDataService() {
    try {
        // Uporabimo Promise.all za sočasno nalaganje obeh datotek za večjo hitrost.
        const [listingsResponse, brandsResponse] = await Promise.all([
            fetch('./json/listings.json'),
            fetch('./json/brands_models_global.json')
        ]);

        if (!listingsResponse.ok || !brandsResponse.ok) {
            throw new Error('Napaka pri nalaganju osnovnih podatkov.');
        }

        listings = await listingsResponse.json();
        brands = await brandsResponse.json();
        
        // Shranimo oglase tudi v localStorage za uporabo na drugih straneh (npr. compare.js)
        localStorage.setItem('mojavto_listings', JSON.stringify(listings));
        
        console.log('Data service inicializiran, podatki naloženi.');

    } catch (error) {
        console.error("Napaka v dataService:", error);
        // Tukaj bi lahko prikazali sporočilo o napaki za celotno stran
    }
}

/**
 * Vrne vse naložene oglase.
 * @returns {Array} Seznam vseh oglasov.
 */
export function getListings() {
    return listings;
}

/**
 * Vrne podatke o znamkah in modelih.
 * @returns {object} Objekt z znamkami in modeli.
 */
export function getBrands() {
    return brands;
}

/**
 * Poišče in vrne en oglas glede na njegov ID.
 * @param {string} id - ID iskanega oglasa.
 * @returns {object|undefined} Objekt oglasa ali undefined, če ni najden.
 */
export function getListingById(id) {
    return listings.find(listing => listing.id === id);
}