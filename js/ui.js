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
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    if (document.getElementById('sidebar')) {
        if (sidebarToggle) sidebarToggle.style.display = 'block';
    }

    if (sidebarToggle && pageContainer) {
        sidebarToggle.addEventListener('click', function() {
            pageContainer.classList.toggle('sidebar-collapsed');
        });
    }

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