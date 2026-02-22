// Login page logic — MojAvto.si
import { loginWithEmail, loginWithGoogle } from '../auth/auth.js';

export function initLoginPage() {
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('error-message');
    const googleBtn = document.getElementById('googleLoginBtn');

    // ── Google ────────────────────────────────────────────────────────────────
    googleBtn?.addEventListener('click', async () => {
        try {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Prijavljam...';
            await loginWithGoogle();
            window.location.hash = '/dashboard';
        } catch (err) {
            errorEl.textContent = err.message;
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Prijava z Google';
        }
    });

    // ── Email / Password ─────────────────────────────────────────────────────
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.textContent = '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Prijavljam...';

        try {
            await loginWithEmail(email, password);
            window.location.hash = '/dashboard';
        } catch (err) {
            const msgs = {
                'auth/user-not-found': 'Uporabnik s tem e-mailom ne obstaja.',
                'auth/wrong-password': 'Napačno geslo.',
                'auth/invalid-credential': 'Napačen e-mail ali geslo.',
                'auth/too-many-requests': 'Preveč poskusov. Počakajte in poskusite znova.',
            };
            errorEl.textContent = msgs[err.code] || err.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Prijava';
        }
    });
}
