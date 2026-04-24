// Register page logic — MojAvto.si
import { registerWithEmail, loginWithGoogle } from '../auth/auth.js';

export function initRegisterPage() {
    // ── Private form elements ─────────────────────────────────────────────────
    const form = document.getElementById('registerForm');
    const errorEl = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const googleBtn = document.getElementById('googleRegisterBtn');

    // ── Tab switching ─────────────────────────────────────────────────────────
    const tabs = document.querySelectorAll('.auth-tab');
    const panelPrivate = document.getElementById('panel-private');
    const panelBusiness = document.getElementById('panel-business');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            if (tab.dataset.type === 'business') {
                panelPrivate.hidden = true;
                panelBusiness.hidden = false;
            } else {
                panelPrivate.hidden = false;
                panelBusiness.hidden = true;
            }
        });
    });

    // ── Private: Password strength ────────────────────────────────────────────
    passwordInput?.addEventListener('input', () => updateStrength(passwordInput.value, strengthBar));

    // ── Private: Google ───────────────────────────────────────────────────────
    googleBtn?.addEventListener('click', async () => {
        try {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Registriram...';
            await loginWithGoogle();
            window.location.hash = '/dashboard';
        } catch (err) {
            errorEl.textContent = err.message;
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg> Registracija z Google';
        }
    });

    // ── Private: Email submit ─────────────────────────────────────────────────
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.textContent = '';

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const region = document.getElementById('region').value;

        if (password !== confirmPassword) { errorEl.textContent = 'Gesli se ne ujemata.'; return; }
        if (password.length < 6) { errorEl.textContent = 'Geslo mora imeti vsaj 6 znakov.'; return; }

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

    // ── Business wizard state ─────────────────────────────────────────────────
    let bizStep = 1;

    const bizProgressBar = document.getElementById('wizardProgressBar');
    const bizStepLabel = document.getElementById('wizardStepLabel');
    const bizSteps = [
        document.getElementById('biz-step-1'),
        document.getElementById('biz-step-2'),
        document.getElementById('biz-step-3'),
    ];

    const bizPasswordInput = document.getElementById('biz-password');
    const bizStrengthBar = document.getElementById('biz-strength-bar');
    bizPasswordInput?.addEventListener('input', () => updateStrength(bizPasswordInput.value, bizStrengthBar));

    // Toggle-pw buttons inside wizard
    document.querySelectorAll('#panel-business .toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.closest('.password-wrapper').querySelector('input');
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    });

    // Private form toggle-pw
    document.querySelector('#panel-private .toggle-pw')?.addEventListener('click', function () {
        const input = this.closest('.password-wrapper').querySelector('input');
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        this.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    function setWizardStep(step) {
        bizStep = step;
        bizSteps.forEach((el, i) => { el.hidden = i !== step - 1; });
        const pct = step === 3 ? 100 : step === 2 ? 66 : 33;
        bizProgressBar.style.width = pct + '%';
        bizStepLabel.textContent = step < 3 ? `Korak ${step} od 3` : 'Registracija zaključena';
    }

    // Step 1 → 2
    document.getElementById('bizNext1')?.addEventListener('click', () => {
        const err = document.getElementById('biz-error-1');
        err.textContent = '';

        const fullname = document.getElementById('biz-fullname').value.trim();
        const email = document.getElementById('biz-email').value.trim();
        const password = document.getElementById('biz-password').value;
        const confirm = document.getElementById('biz-confirm-password').value;
        const companyName = document.getElementById('biz-company-name').value.trim();
        const taxId = document.getElementById('biz-tax-id').value.trim();
        const address = document.getElementById('biz-address').value.trim();

        if (!fullname) { err.textContent = 'Vnesite ime in priimek.'; return; }
        if (!email || !email.includes('@')) { err.textContent = 'Vnesite veljaven e-mail.'; return; }
        if (password.length < 6) { err.textContent = 'Geslo mora imeti vsaj 6 znakov.'; return; }
        if (password !== confirm) { err.textContent = 'Gesli se ne ujemata.'; return; }
        if (!companyName) { err.textContent = 'Vnesite ime podjetja.'; return; }
        if (!taxId) { err.textContent = 'Vnesite davčno številko.'; return; }
        if (!address) { err.textContent = 'Vnesite naslov podjetja.'; return; }

        setWizardStep(2);
    });

    // Step 2 → 1
    document.getElementById('bizBack2')?.addEventListener('click', () => setWizardStep(1));

    // Step 2 → submit → Step 3
    document.getElementById('bizSubmit')?.addEventListener('click', async () => {
        const err = document.getElementById('biz-error-2');
        err.textContent = '';

        const selectedRoles = [...document.querySelectorAll('.role-checkbox:checked')].map(cb => cb.value);
        if (selectedRoles.length === 0) {
            err.textContent = 'Izberite vsaj eno dejavnost.';
            return;
        }

        const submitBtn = document.getElementById('bizSubmit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i> Registriram...';

        const payload = {
            fullname: document.getElementById('biz-fullname').value.trim(),
            email: document.getElementById('biz-email').value.trim(),
            password: document.getElementById('biz-password').value,
            companyName: document.getElementById('biz-company-name').value.trim(),
            taxId: document.getElementById('biz-tax-id').value.trim(),
            address: document.getElementById('biz-address').value.trim(),
            roles: selectedRoles,
            isBusiness: true,
        };

        try {
            await registerWithEmail(payload);
            renderUnlockedFeatures(selectedRoles);
            setWizardStep(3);
        } catch (e) {
            const msgs = {
                'auth/email-already-in-use': 'Ta e-mail je že v uporabi.',
                'auth/weak-password': 'Geslo je prešibko.',
                'auth/invalid-email': 'Neveljaven e-mail naslov.',
            };
            err.textContent = msgs[e.code] || e.message;
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Zaključi registracijo <i class="fas fa-check" style="margin-left:6px"></i>';
        }
    });

    function renderUnlockedFeatures(roles) {
        const featureMap = {
            dealer: { icon: 'fa-tags', label: 'Neomejena objava avtomobilskih oglasov' },
            mechanic: { icon: 'fa-book', label: 'Dostop do Digitalne servisne knjižice' },
            vulcanizer: { icon: 'fa-circle', label: 'Upravljanje pnevmatičnih storitev in terminov' },
        };
        const container = document.getElementById('unlockedFeatures');
        container.innerHTML = '<p class="unlocked-title"><i class="fas fa-unlock-alt"></i> Odklenjene funkcije:</p>' +
            roles.map(r => featureMap[r] ? `<div class="unlocked-item"><i class="fas ${featureMap[r].icon}"></i><span>${featureMap[r].label}</span></div>` : '').join('');
    }
}

function updateStrength(pass, bar) {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/\d/)) strength++;
    if (pass.match(/[^a-zA-Z\d]/)) strength++;
    bar.style.width = (strength * 25) + '%';
    const colours = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'];
    bar.style.backgroundColor = colours[strength];
}
