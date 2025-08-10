// js/notifications.js

/**
 * Prikaže kratko obvestilo (toast) v kotu zaslona.
 * @param {string} message - Sporočilo za prikaz.
 * @param {string} type - Tip obvestila ('success', 'info', 'error'), ki določa barvo in ikono.
 * @param {number} duration - Čas prikaza v milisekundah.
 */
export function showNotification(message, type = 'success', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;

    let iconClass = 'fas fa-check-circle'; // Privzeta ikona za uspeh
    if (type === 'info') {
        iconClass = 'fas fa-info-circle';
    } else if (type === 'error') {
        iconClass = 'fas fa-exclamation-triangle';
    }

    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    
    container.appendChild(toast);

    // Po določenem času dodamo class za animacijo izginjanja
    setTimeout(() => {
        toast.classList.add('fade-out');
        // Po koncu animacije odstranimo element iz DOM-a
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, duration);
}