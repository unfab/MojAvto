import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';

export function initUpgradeProPage() {
    const upgradeBtn = document.getElementById('upgrade-pro-btn');
    const feedbackEl = document.getElementById('upgrade-feedback');

    if (!upgradeBtn) return;

    const { loggedInUser } = stateManager.getState();
    if (!loggedInUser) {
        window.location.hash = '#/login';
        return;
    }
    
    // Če je uporabnik že PRO, to tudi prikažemo
    if (loggedInUser.isPro) {
        upgradeBtn.textContent = 'Vaš račun je že PRO';
        upgradeBtn.disabled = true;
        feedbackEl.textContent = 'Hvala za zaupanje!';
        feedbackEl.style.display = 'block';
    }

    upgradeBtn.addEventListener('click', () => {
        const success = stateManager.upgradeUserToPro(loggedInUser.username);
        if (success) {
            upgradeBtn.textContent = 'Nadgradnja Uspešna!';
            upgradeBtn.disabled = true;
            feedbackEl.textContent = 'Vaš račun je bil uspešno nadgrajen na PRO.';
            feedbackEl.style.display = 'block';
            showNotification('Čestitamo! Postali ste PRO uporabnik.', 'success');
            
            // Počakamo malo in preusmerimo na profil
            setTimeout(() => {
                window.location.hash = '#/profile';
                location.reload(); // Osvežimo, da se povsod prikaže PRO status
            }, 2000);
        }
    });
}