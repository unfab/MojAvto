// Pomožna funkcija za nalaganje pogleda (view) in zagon skript
async function loadView(view) {
    const appContainer = document.getElementById('app-container');
    try {
        const response = await fetch(`views/${view}.html`);
        const html = await response.text();
        appContainer.innerHTML = html;

        // Počakamo, da se vsebina naloži, nato zaženemo prevajanje zanjo
        if (typeof setLanguage === 'function') {
            await setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        }
        
        // Zaženemo specifično skripto za ta pogled, če obstaja
        if (view === 'home') {
            initHomePage(); // Predpostavimo, da je logika iz main.js v tej funkciji
        } else if (view === 'contact') {
            initContactPage(); // To funkcijo bomo ustvarili v naslednjem koraku
        }
        // ... dodajte pogoje za ostale strani (login, register, itd.) ...

    } catch (error) {
        appContainer.innerHTML = `<h1>Stran ni bila najdena.</h1><p>Vsebine za '${view}' ni bilo mogoče naložiti.</p>`;
    }
}

// Definicija poti (routes)
const routes = {
    '/': 'home',
    '/about': 'about',
    '/contact': 'contact',
    '/faq': 'faq',
    '/login': 'login',
    '/register': 'register',
    '/dashboard': 'dashboard',
    '/admin': 'admin',
    '/create-listing': 'create-listing',
    '/listing/:id': 'listing' 
};

function router() {
    const path = window.location.hash.slice(1) || '/';
    const view = routes[path] || '404'; // 404 je datoteka views/404.html za prikaz napake
    loadView(view);
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    // Počakamo, da se naložijo glava/noga, preden zaženemo prvi ruter
    setTimeout(router, 100); 
});