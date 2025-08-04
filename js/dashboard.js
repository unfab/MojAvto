import { translate } from './i18n.js';
// Pomembno: Ne pozabite v <head> vaše glavne index.html datoteke dodati:
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

export function initDashboardPage() {
    // --- VARNOSTNA KONTROLA ---
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser || !loggedUser.isAdmin) {
        alert(translate('admin_unauthorized_access'));
        window.location.hash = '#/'; // Preusmeritev na domačo stran
        return;
    }

    document.getElementById('welcome-message').textContent = `${translate('dashboard_welcome')}, ${loggedUser.fullname}!`;

    const allUsers = JSON.parse(localStorage.getItem('mojavto_users')) || [];
    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];

    // --- PRIKAZ OSNOVNE STATISTIKE ---
    document.getElementById('total-users').textContent = allUsers.length;
    document.getElementById('total-listings').textContent = allListings.length;

    // Štetje oglasov, objavljenih danes
    const today = new Date().toISOString().slice(0, 10);
    const newToday = allListings.filter(l => l.createdAt && l.createdAt.slice(0, 10) === today).length;
    document.getElementById('new-listings-today').textContent = newToday;

    // --- PRIPRAVA PODATKOV ZA GRAF ---
    const usersByRegion = allUsers.reduce((acc, user) => {
        const region = user.region || 'Neznano';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
    }, {});

    // --- IZRIS GRAFA Z UPORABO Chart.js ---
    const ctx = document.getElementById('regionChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(usersByRegion),
                datasets: [{
                    label: `# ${translate('admin_stat_users') || 'število uporabnikov'}`,
                    data: Object.values(usersByRegion),
                    backgroundColor: 'rgba(249, 115, 22, 0.6)',
                    borderColor: 'rgba(249, 115, 22, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1 // Prikaži samo cela števila na y-osi
                        }
                    }
                },
                maintainAspectRatio: false
            }
        });
    }
}