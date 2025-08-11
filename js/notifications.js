// js/notifications.js

/**
 * Napredna funkcija za prikaz kratkih obvestil (toast) v kotu zaslona.
 * Ohranjen je originalen način prikaza, dodane so nove funkcionalnosti:
 *  - close gumb (×) za ročno zapiranje
 *  - pause-on-hover (ustavi timer med premorom miške nad obvestilom)
 *  - možnost persistent obvestil (ne izginejo sami)
 *  - de-dupe (prepreči ponavljanje istega sporočila)
 *  - queue (omeji št. hkratnih toastov, ostali čakajo)
 *
 * @param {string} message - Sporočilo za prikaz.
 * @param {string} type - Tip obvestila ('success', 'info', 'error'), ki določa barvo in ikono.
 * @param {number} duration - Čas prikaza v milisekundah (privzeto 3000).
 * @param {object} options - Dodatne opcije: { persistent: boolean }
 */

const notificationQueue = [];
let activeNotifications = [];
const MAX_ACTIVE = 3;
let lastMessage = null;

export function showNotification(message, type = 'success', duration = 3000, options = {}) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    // Prepreči prikaz istega sporočila zaporedoma
    if (lastMessage === message) {
        return;
    }
    lastMessage = message;

    const task = () => {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;

        let iconClass = 'fas fa-check-circle'; // Privzeta ikona za uspeh
        if (type === 'info') {
            iconClass = 'fas fa-info-circle';
        } else if (type === 'error') {
            iconClass = 'fas fa-exclamation-triangle';
        }

        // Dodamo close gumb
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Zapri obvestilo');

        // Sestavimo HTML toast-a
        toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
        toast.appendChild(closeBtn);

        container.appendChild(toast);
        activeNotifications.push(toast);

        let removeTimeout;
        const removeToast = () => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
                activeNotifications = activeNotifications.filter(t => t !== toast);
                processQueue();
            });
        };

        // Close button klik
        closeBtn.addEventListener('click', () => {
            clearTimeout(removeTimeout);
            removeToast();
        });

        // Pause-on-hover
        toast.addEventListener('mouseenter', () => {
            clearTimeout(removeTimeout);
        });
        toast.addEventListener('mouseleave', () => {
            if (!options.persistent) {
                removeTimeout = setTimeout(removeToast, duration);
            }
        });

        // Samodejno odstranjevanje, če ni persistent
        if (!options.persistent) {
            removeTimeout = setTimeout(removeToast, duration);
        }
    };

    if (activeNotifications.length >= MAX_ACTIVE) {
        notificationQueue.push(task);
    } else {
        task();
    }
}

function processQueue() {
    if (notificationQueue.length > 0 && activeNotifications.length < MAX_ACTIVE) {
        const next = notificationQueue.shift();
        if (typeof next === 'function') {
            next();
        }
    }
}
