// js/components/modal.js
import { translate } from '../i18n.js';

const modalElement = document.getElementById('confirmation-modal');
const titleElement = document.getElementById('modal-title');
const messageElement = document.getElementById('modal-message');
const confirmBtn = document.getElementById('modal-confirm-btn');
const cancelBtn = document.getElementById('modal-cancel-btn');

let resolvePromise;

/**
 * Pokaže modalno okno za potrditev z dinamičnim naslovom in sporočilom.
 * Vrne Promise, ki se razreši v `true` (potrditev) ali `false` (preklic).
 * @param {string} titleKey - Ključ za prevod naslova.
 * @param {string} messageKey - Ključ za prevod sporočila.
 * @returns {Promise<boolean>}
 */
export function showModal(titleKey, messageKey) {
    titleElement.textContent = translate(titleKey);
    messageElement.textContent = translate(messageKey);
    modalElement.style.display = 'flex';

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}

function closeModal(value) {
    modalElement.style.display = 'none';
    if (resolvePromise) {
        resolvePromise(value);
    }
}

confirmBtn.addEventListener('click', () => closeModal(true));
cancelBtn.addEventListener('click', () => closeModal(false));

// Omogoči zapiranje s klikom na ozadje
modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) {
        closeModal(false);
    }
});