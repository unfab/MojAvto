import { translate } from './i18n.js';
// Uvozimo samo "init" funkcije iz drugih, specializiranih modulov.
// Vsak modul skrbi za svoje področje.
import { setLanguage } from './i18n.js';
import { initRouter } from './router.js';
import { initUserMenu } from './userMenu.js';

/**
 * Asinhrono naloži vsebino HTML komponente (npr. glava, noga) v določen vsebnik.
 * @param {string} url - Pot do HTML datoteke komponente.
 * @param {string} containerId - ID HTML elementa, v katerega se naloži vsebina.
 */
async function loadComponent(url, containerId) {
    try {
        const container = document.getElementById(containerId);
        // Če vsebnik na strani ne obstaja, tiho končamo.
        if (!container) return;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Komponenta na naslovu ${url} ni bila najdena.`);
        
        container.innerHTML = await response.text();
    } catch (error) {
        // V primeru napake izpišemo v konzolo, da ne zrušimo celotne aplikacije.
        console.error(`Napaka pri nalaganju komponente ${url}:`, error);
    }
}

/**
 * Glavna funkcija za zagon aplikacije.
 * Določa pravilen vrstni red nalaganja in inicializacije.
 */
async function main() {
    // 1. Vzporedno naložimo osnovne statične komponente (glavo in nogo).
    // Uporabimo relativne poti ('./'), da bo delovalo tudi na GitHub Pages.
    await Promise.all([
        loadComponent('./components/header.html', 'header-container'),
        loadComponent('./components/footer.html', 'footer-container')
    ]);

    // 2. Inicializiramo sistem za prevajanje (i18n).
    // To bo poskrbelo, da se tudi pravkar naložena glava in noga pravilno prevedeta.
    const langFromUrl = new URLSearchParams(window.location.search).get('lang');
    const langFromStorage = localStorage.getItem('mojavto_lang');
    await setLanguage(langFromUrl || langFromStorage || 'sl');
    
    // 3. Ko sta glava in prevod pripravljena, inicializiramo logiko za uporabniški meni.
    initUserMenu();

    // 4. Na koncu zaženemo ruter, ki bo poskrbel za nalaganje dinamične vsebine strani.
    initRouter();
}

// Ko brskalnik zgradi osnovno HTML strukturo (DOM), zaženemo našo glavno funkcijo.
document.addEventListener('DOMContentLoaded', main);