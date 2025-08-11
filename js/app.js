import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initGlobalUI } from './ui.js';
import { initUserMenu } from './userMenu.js';
// === SPREMEMBA: Odstranjen uvoz za dataService in dodan uvoz za stateManager ===
import { stateManager } from './stateManager.js';

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

    // === SPREMEMBA: 2. KORAK: Inicializiramo State Manager kot prvi korak po nalaganju komponent. ===
    // To zagotovi, da so vsi podatki na voljo, preden se karkoli drugega zažene.
    try {
        await stateManager.initialize();
    } catch (error) {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = "<h1>Oops! Nekaj je šlo narobe.</h1><p>Osnovnih podatkov ni bilo mogoče naložiti. Prosimo, osvežite stran.</p>";
        }
        return; // Ustavimo zagon aplikacije, če podatki niso na voljo.
    }

    // 3. KORAK: Inicializiramo sistem za prevajanje (i18n) in ostale UI elemente.
    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromStorage || 'sl');
    
    initGlobalUI(); 
    initUserMenu();

    // 4. KORAK: Šele ko so podatki in UI pripravljeni, zaženemo ruter.
    initRouter();
}

// Ko brskalnik zgradi osnovno HTML strukturo (DOM), zaženemo našo glavno funkcijo.
document.addEventListener('DOMContentLoaded', main);