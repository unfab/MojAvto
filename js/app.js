import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initGlobalUI } from './ui.js';
import { initUserMenu } from './userMenu.js';
import { stateManager } from './stateManager.js';
// === NOVO: Uvozimo potrebne funkcije za obvestila in filtriranje ===
import { showNotification } from './notifications.js';
import { filterListings } from './utils/listingManager.js';


/**
 * Asinhrono naloži vsebino HTML komponente (npr. glava, noga) v določen vsebnik.
 * @param {string} url - Pot do HTML datoteke komponente.
 * @param {string} containerId - ID HTML elementa, v katerega se naloži vsebina.
 */
async function loadComponent(url, containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) return; 

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Komponenta na naslovu ${url} ni bila najdena.`);
        
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(`Napaka pri nalaganju komponente ${url}:`, error);
    }
}

// === NOVO: Funkcija za preverjanje obvestil za shranjena iskanja ===
async function checkSavedSearchNotifications() {
    const { loggedInUser } = stateManager.getState();
    // 1. Nadaljujemo samo, če je uporabnik prijavljen
    if (!loggedInUser) {
        return;
    }

    const savedSearches = stateManager.getSavedSearches();
    // 2. Nadaljujemo samo, če ima uporabnik shranjena iskanja
    if (!savedSearches || savedSearches.length === 0) {
        return;
    }

    const allListings = stateManager.getListings();
    const lastVisit = localStorage.getItem('mojavto_lastVisit');

    // Korak 1: Zabeležimo trenutni obisk za naslednjič
    // To naredimo takoj, da ne pošiljamo obvestil ob vsakem osveževanju strani
    const now = new Date().toISOString();
    localStorage.setItem('mojavto_lastVisit', now);

    if (!lastVisit) {
        console.log("Prvi obisk uporabnika, obvestila se ne preverjajo.");
        return;
    }
    
    // Korak 2: Poiščemo vse oglase, ki so bili dodani po zadnjem obisku
    const newListings = allListings.filter(listing => 
        listing.date_added && new Date(listing.date_added) > new Date(lastVisit)
    );

    if (newListings.length === 0) {
        console.log("Ni novih oglasov od zadnjega obiska.");
        return;
    }
    
    let totalNewMatches = 0;
    const matchedSearches = new Set(); // Da ne štejemo večkrat, če se oglas ujema z več iskanji

    // Korak 3: Primerjava novih oglasov z vsakim shranjenim iskanjem
    savedSearches.forEach(search => {
        const matches = filterListings(newListings, search.criteria);
        if (matches.length > 0) {
            matches.forEach(match => matchedSearches.add(match.id));
        }
    });

    totalNewMatches = matchedSearches.size;
    
    // Korak 4: Prikaz obvestila, če smo našli ujemanja
    if (totalNewMatches > 0) {
        const message = `Našli smo ${totalNewMatches} novih oglasov, ki ustrezajo vašim shranjenim iskanjem.`;
        // Pokažemo obvestilo za 8 sekund, ker je pomembno
        showNotification(message, 'info', 8000);
    }
}


/**
 * Glavna funkcija za zagon aplikacije.
 * Določa pravilen vrstni red nalaganja in inicializacije.
 */
async function main() {
    // 1. KORAK: Vzporedno naložimo osnovne statične komponente.
    await Promise.all([
        loadComponent('./components/header.html', 'header-container'),
        loadComponent('./components/sidebar.html', 'sidebar-container'),
        loadComponent('./components/footer.html', 'footer-container')
    ]);

    // 2. KORAK: Inicializiramo State Manager.
    try {
        await stateManager.initialize();
    } catch (error) {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = "<h1>Oops! Nekaj je šlo narobe.</h1><p>Osnovnih podatkov ni bilo mogoče naložiti. Prosimo, osvežite stran.</p>";
        }
        return;
    }

    // 3. KORAK: Inicializiramo sistem za prevajanje (i18n) in ostale UI elemente.
    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromStorage || 'sl');
    
    initGlobalUI(); 
    initUserMenu();

    // === NOVO: Poženemo preverjanje obvestil ===
    await checkSavedSearchNotifications();

    // 4. KORAK: Šele ko so podatki in UI pripravljeni, zaženemo ruter.
    initRouter();
}

// Ko brskalnik zgradi osnovno HTML strukturo (DOM), zaženemo našo glavno funkcijo.
document.addEventListener('DOMContentLoaded', main);