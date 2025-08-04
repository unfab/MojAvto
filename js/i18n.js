let translations = {};

// SPREMEMBA: Dodana ključna beseda "export", da lahko drugi moduli uporabljajo to funkcijo.
export function translate(key, replacements = {}) {
    let translation = translations[key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return translation;
}

export async function setLanguage(lang) {
    const validLangs = ['sl', 'en'];
    const currentLang = validLangs.includes(lang) ? lang : 'sl';
    localStorage.setItem('mojavto_lang', currentLang);
    document.documentElement.lang = currentLang;

    try {
        const response = await fetch(`./lang/${currentLang}.json`);
        if (!response.ok) throw new Error(`Jezikovna datoteka ni bila najdena.`);
        
        translations = await response.json();
    } catch (error) {
        console.error(`Could not load language file: ${currentLang}.json`, error);
        return;
    }

    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        const targetAttr = element.getAttribute('data-i18n-target');
        
        if (translations[key]) {
            if (targetAttr) {
                element.setAttribute(targetAttr, translations[key]);
            } else {
                element.innerHTML = translations[key];
            }
        }
    });
}