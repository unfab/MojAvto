let translations = {};
// Globalna funkcija za prevajanje dinamičnih JS sporočil
function translate(key) {
    return translations[key] || key;
}

// Glavna funkcija za prevajanje strani
async function setLanguage(lang) {
    // Varnostni mehanizem za jezik
    const validLangs = ['sl', 'en'];
    currentLang = validLangs.includes(lang) ? lang : 'sl';
    localStorage.setItem('mojavto_lang', currentLang);
    document.documentElement.lang = currentLang; // Posodobi 'lang' atribut na <html>

    // Naloži ustrezno prevodno datoteko
    try {
        const response = await fetch(`lang/${currentLang}.json`);
        translations = await response.json();
    } catch (error) {
        console.error(`Could not load language file: ${currentLang}.json`, error);
        return;
    }

    // Prevedi vse elemente z 'data-i18n-key'
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
            // Določi, ali prevajamo vsebino, placeholder ali naslov
            const target = element.getAttribute('data-i18n-target') || 'innerHTML';
            if (target === 'innerHTML') {
                element.innerHTML = translations[key];
            } else {
                element.setAttribute(target, translations[key]);
            }
        }
    });
}

// Zaznaj jezik ob nalaganju strani
const urlParams = new URLSearchParams(window.location.search);
const langFromUrl = urlParams.get('lang');
const langFromStorage = localStorage.getItem('mojavto_lang');
setLanguage(langFromUrl || langFromStorage || 'sl');

// Dinamično nalaganje glave in noge
document.addEventListener("DOMContentLoaded", () => {
    const headerPlaceholder = document.getElementById("header");
    const footerPlaceholder = document.getElementById("footer");

    if (headerPlaceholder) {
        fetch("header.html")
          .then(res => res.text())
          .then(data => {
            headerPlaceholder.innerHTML = data;
            // Po nalaganju glave ponovno zaženemo prevajanje in inicializiramo meni
            setLanguage(currentLang); 
            const userMenuScript = document.createElement('script');
            userMenuScript.src = 'js/userMenu.js';
            document.body.appendChild(userMenuScript);
          });
    }

    if (footerPlaceholder) {
        fetch("footer.html")
          .then(res => res.text())
          .then(data => {
            footerPlaceholder.innerHTML = data;
            setLanguage(currentLang); // Ponovno zaženemo prevajanje
          });
    }
});