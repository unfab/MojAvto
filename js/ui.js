export function initGlobalUI() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const pageContainer = document.querySelector('.page-container');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // Pokažemo gumb za sidebar samo, če sidebar obstaja
    if (document.getElementById('sidebar')) {
        if (sidebarToggle) sidebarToggle.style.display = 'block';
    }

    // Funkcionalnost za odpiranje/zapiranje stranske vrstice
    if (sidebarToggle && pageContainer) {
        sidebarToggle.addEventListener('click', function() {
            pageContainer.classList.toggle('sidebar-collapsed');
        });
    }

    // Funkcionalnost za temni/svetli način
    const applyStoredTheme = () => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            let theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
        });
    }

    applyStoredTheme();
}