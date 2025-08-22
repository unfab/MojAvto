import { stateManager } from './stateManager.js';

/**
 * Posodobi ikono za primerjavo v glavi (prikaže/skrije in nastavi število).
 */
export function updateCompareIcon() {
    const compareLink = document.getElementById('compare-link');
    const compareCount = document.getElementById('compare-count');
    if (!compareLink || !compareCount) return;

    const { compareItems } = stateManager.getState();
    
    if (compareItems && compareItems.length > 0) {
        compareLink.style.display = 'flex';
        compareCount.textContent = compareItems.length;
    } else {
        compareLink.style.display = 'none';
    }
}

/**
 * Inicializira globalne elemente uporabniškega vmesnika, kot so stranska vrstica in temni način.
 */
export function initGlobalUI() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const pageContainer = document.querySelector('.page-container');
    const sidebar = document.getElementById('sidebar'); // Potrebujemo referenco na sidebar
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // Pokažemo gumb za odpiranje/zapiranje sidebara, če sidebar obstaja
    if (sidebar && sidebarToggle) {
        sidebarToggle.style.display = 'block';
    }

    // Obstoječa logika za odpiranje/zapiranje s klikom na gumb
    if (sidebarToggle && pageContainer) {
        sidebarToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Preprečimo, da bi se dogodek takoj prenesel na dokument
            pageContainer.classList.toggle('sidebar-collapsed');
        });
    }

    // === DODANA NOVA LOGIKA: Zapiranje sidebara ob kliku izven njega ===
    document.addEventListener('click', (e) => {
        // Preverimo, ali je sidebar odprt in ali klik ni bil znotraj sidebara ali na gumb za odpiranje
        if (
            pageContainer &&
            sidebar &&
            pageContainer.classList.contains('sidebar-collapsed') &&
            !sidebar.contains(e.target) &&
            !sidebarToggle.contains(e.target)
        ) {
            pageContainer.classList.remove('sidebar-collapsed');
        }
    });

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
    updateCompareIcon(); 
}