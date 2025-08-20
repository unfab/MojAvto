// Ime predpomnilnika (cache) - spremenite ga, ko posodobite datoteke
const CACHE_NAME = 'mojavto-v1';

// Seznam datotek, ki jih želimo shraniti v predpomnilnik za offline uporabo
const URLS_TO_CACHE = [
    '/',
    'index.html',
    'styles.css',
    'manifest.json',
    // Glavne JS datoteke
    'js/app.js',
    'js/router.js',
    'js/stateManager.js',
    'js/ui.js',
    'js/i18n.js',
    'js/components/modal.js',
    'js/notifications.js',
    'js/utils/listingManager.js',
    // Komponente
    'components/header.html',
    'components/sidebar.html',
    'components/footer.html',
    'components/modal.html',
    // Pogledi (Views)
    'views/home.html',
    'views/advanced-search.html',
    'views/search-results.html',
    'views/listing.html',
    'views/profile.html',
    'views/login.html',
    // Slike (ikone)
    'slike/icons/favicon.ico',
    'slike/icons/android-chrome-192x192.png',
    'slike/icons/android-chrome-512x512.png',
    // Podatki (JSON)
    'json/listings.json',
    'json/brands_models_global.json'
];

// Dogodek "install": Ko se service worker prvič namesti
self.addEventListener('install', (event) => {
    console.log('Service Worker: Nameščanje...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Predpomnjenje osnovnih datotek');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(error => {
                console.error('Service Worker: Napaka pri predpomnjenju:', error);
            })
    );
});

// Dogodek "fetch": Sproži se vsakič, ko stran zahteva vir (sliko, skripto, itd.)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        // Najprej poskusi najti odgovor v predpomnilniku
        caches.match(event.request)
            .then((response) => {
                // Če ga najde, ga vrne iz predpomnilnika.
                // Če ga ne najde, ga poskusi pridobiti iz omrežja.
                return response || fetch(event.request);
            })
    );
});