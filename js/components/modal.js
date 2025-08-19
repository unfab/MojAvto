import { translate } from '../i18n.js';

let modalElement, titleElement, messageElement, confirmBtn, cancelBtn;
let resolvePromise;

/**
 * Poveže JavaScript spremenljivke z DOM elementi in nastavi poslušalce dogodkov.
 * To funkcijo je treba poklicati, ko je modal.html naložen.
 */
export function initializeModalListeners() {
    modalElement = document.getElementById('confirmation-modal');
    titleElement = document.getElementById('modal-title');
    messageElement = document.getElementById('modal-message');
    confirmBtn = document.getElementById('modal-confirm-btn');
    cancelBtn = document.getElementById('modal-cancel-btn');

    // Preprečimo crash, če elementi še niso na voljo
    if (!modalElement || !confirmBtn || !cancelBtn) {
        console.error("Modal elements not found. Could not initialize listeners.");
        return;
    }

    confirmBtn.addEventListener('click', () => closeModal(true));
    cancelBtn.addEventListener('click', () => closeModal(false));

    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            closeModal(false);
        }
    });
}

/**
 * Pokaže modalno okno za potrditev z dinamičnim naslovom in sporočilom.
 * Vrne Promise, ki se razreši v `true` (potrditev) ali `false` (preklic).
 * @param {string} titleKey - Ključ za prevod naslova.
 * @param {string} messageKey - Ključ za prevod sporočila.
 * @returns {Promise<boolean>}
 */
export function showModal(titleKey, messageKey) {
    // Preverimo, ali so elementi na voljo, preden jih uporabimo
    if (!modalElement || !titleElement || !messageElement) {
        console.error("Modal is not initialized correctly.");
        return Promise.resolve(false); // Varno vrnemo false
    }
    
    titleElement.textContent = translate(titleKey);
    messageElement.textContent = translate(messageKey);
    modalElement.style.display = 'flex';

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}

function closeModal(value) {
    if (modalElement) {
        modalElement.style.display = 'none';
    }
    if (resolvePromise) {
        resolvePromise(value);
    }
}