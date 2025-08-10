import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initGlobalUI } from './ui.js';
import { initUserMenu } from './userMenu.js';
// === DODANO: Uvozimo nov servis za podatke ===
import { initDataService } from './dataService.js';

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

    // 2. KORAK: Inicializiramo sistem za prevajanje (i18n).
    const langFromUrl = new URLSearchParams(window.location.search).get('lang');
    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromUrl || langFromStorage || 'sl');
    
    // 3. KORAK: Ko so komponente naložene, inicializiramo njihove interaktivne dele.
    initGlobalUI(); 
    initUserMenu();

    // === DODANO: 4. KORAK - Centralno nalaganje podatkov ===
    // Počakamo, da se vsi oglasi in znamke naložijo, PREDEN zaženemo ruter.
    // To zagotovi, da imajo vse strani takojšen dostop do podatkov.
    await initDataService();

    // === POSODOBLJENO: 5. KORAK (prej 4.) ===
    // Na koncu zaženemo ruter, ki bo naložil dinamično vsebino strani.
    initRouter();
}

// Ko brskalnik zgradi osnovno HTML strukturo (DOM), zaženemo našo glavno funkcijo.
document.addEventListener('DOMContentLoaded', main);