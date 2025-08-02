let translations = {};
let currentLang = 'sl'; // Privzeta vrednost

// Globalna funkcija za prevajanje dinamičnih JS sporočil
function translate(key, replacements = {}) {
    let translation = translations[key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return translation;
}

// Glavna funkcija za prevajanje strani
async function setLanguage(lang) {
    const validLangs = ['sl', 'en'];
    currentLang = validLangs.includes(lang) ? lang : 'sl';
    localStorage.setItem('mojavto_lang', currentLang);
    document.documentElement.lang = currentLang;

    try {
        const response = await fetch(`lang/${currentLang}.json`);
        translations = await response.json();
    } catch (error) {
        console.error(`Could not load language file: ${currentLang}.json`, error);
        return;
    }

    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
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

// Dinamično nalaganje glave in noge ter ponovno prevajanje
document.addEventListener("DOMContentLoaded", () => {
    const headerPlaceholder = document.getElementById("header");
    const footerPlaceholder = document.getElementById("footer");

    if (headerPlaceholder) {
        fetch("header.html")
          .then(res => res.text())
          .then(async data => {
            headerPlaceholder.innerHTML = data;
            await setLanguage(currentLang);
            const userMenuScript = document.createElement('script');
            userMenuScript.src = 'js/userMenu.js';
            document.body.appendChild(userMenuScript);
          });
    }

    if (footerPlaceholder) {
        fetch("footer.html")
          .then(res => res.text())
          .then(async data => {
            footerPlaceholder.innerHTML = data;
            await setLanguage(currentLang);
          });
    }
});