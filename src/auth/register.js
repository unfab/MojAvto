// Register page logic — MojAvto.si
import { registerWithEmail, loginWithGoogle } from '../auth/auth.js';

export function initRegisterPage() {
    const form = document.getElementById('registerForm');
    const errorEl = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const googleBtn = document.getElementById('googleRegisterBtn');

    // ── Password strength ─────────────────────────────────────────────────────
    passwordInput?.addEventListener('input', () => {
        const pass = passwordInput.value;
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
        if (pass.match(/\d/)) strength++;
        if (pass.match(/[^a-zA-Z\d]/)) strength++;
        strengthBar.style.width = (strength * 25) + '%';
        const colours = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'];
        strengthBar.style.backgroundColor = colours[strength];
    });

    // ── Google ────────────────────────────────────────────────────────────────
    googleBtn?.addEventListener('click', async () => {
        try {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Registriram...';
            await loginWithGoogle();
            window.location.hash = '/dashboard';
        } catch (err) {
            errorEl.textContent = err.message;
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Registracija z Google';
        }
    });

    // ── Email / Password ─────────────────────────────────────────────────────
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.textContent = '';

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const region = document.getElementById('region').value;

        if (password !== confirmPassword) {
            errorEl.textContent = 'Gesli se ne ujemata.';
            return;
        }
        if (password.length < 6) {
            errorEl.textContent = 'Geslo mora imeti vsaj 6 znakov.';
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registriram...';

        try {
            await registerWithEmail({ fullname, email, password, region });
            window.location.hash = '/dashboard';
        } catch (err) {
            const msgs = {
                'auth/email-already-in-use': 'Ta e-mail je že v uporabi.',
                'auth/weak-password': 'Geslo je prešibko.',
                'auth/invalid-email': 'Neveljaven e-mail naslov.',
            };
            errorEl.textContent = msgs[err.code] || err.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registracija';
        }
    });
}
