document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');

    // Funkcija za nalaganje komponent (header, footer)
    const loadComponent = async (url, container) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Napaka pri nalaganju ${url}`);
            const html = await response.text();
            container.innerHTML = html;
        } catch (error) {
            console.error(error);
            container.innerHTML = `<p style="color:red; text-align:center;">${error.message}</p>`;
        }
    };

    // Funkcija za nalaganje pogleda (vsebine strani)
    const loadView = async (viewName) => {
        try {
            const response = await fetch(`./views/${viewName}.html`);
            if (!response.ok) {
                 // Če stran ne obstaja, naloži 404 stran
                const response404 = await fetch('./views/404.html');
                const html404 = await response404.text();
                appContainer.innerHTML = html404;
                return;
            }
            const html = await response.text();
            appContainer.innerHTML = html;
            // Po nalaganju vsebine lahko po potrebi zaženemo specifične skripte
            // Npr. initLoginPage(), initRegisterPage() itd.
        } catch (error) {
            console.error('Napaka pri nalaganju pogleda:', error);
            appContainer.innerHTML = `<p style="color:red; text-align:center;">Prišlo je do napake pri nalaganju vsebine.</p>`;
        }
    };

    // Ruter, ki se odziva na spremembe v URL-ju (#)
    const router = () => {
        const path = window.location.hash.slice(1) || '/'; // Odstrani # in dobi pot
        const route = path === '/' ? 'home' : path.split('/')[1];
        loadView(route);
    };

    // Poslušaj na spremembe hasha v URL-ju
    window.addEventListener('hashchange', router);

    // Začetno nalaganje
    const initApp = async () => {
        // Naloži statične komponente
        await Promise.all([
            loadComponent('./components/header.html', headerContainer),
            loadComponent('./components/footer.html', footerContainer)
        ]);
        // Naloži začetni pogled
        router();
    };

    initApp();
});