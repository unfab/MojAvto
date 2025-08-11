import { translate } from './i18n.js';
// === NOVO: Uvozimo stateManager ===
import { stateManager } from './stateManager.js';

export function initAuthPage() {

    // --- LOGIKA ZA REGISTRACIJO ---
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const passwordInput = document.getElementById("password");
        const strengthBar = document.getElementById("strength-bar");
        const errorMessage = document.getElementById("error-message");

        passwordInput?.addEventListener('input', () => {
            const pass = passwordInput.value;
            let strength = 0;
            if (pass.length >= 8) strength++;
            if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
            if (pass.match(/\d/)) strength++;
            if (pass.match(/[^a-zA-Z\d]/)) strength++;
            
            strengthBar.style.width = (strength * 25) + '%';
            if (strength <= 2) strengthBar.style.backgroundColor = '#ef4444';
            else if (strength === 3) strengthBar.style.backgroundColor = '#f59e0b';
            else strengthBar.style.backgroundColor = '#22c55e';
        });

        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            errorMessage.textContent = '';
            
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.confirmPassword) {
                errorMessage.textContent = translate('passwords_do_not_match');
                return;
            }

            // === SPREMEMBA: Uporabimo stateManager za preverjanje uporabnikov ===
            const { users } = stateManager.getState();
            const userExists = users.find(u => u.username === data.username || u.email === data.email);
            if (userExists) {
                errorMessage.textContent = translate('user_exists_error');
                return;
            }

            const newUser = {
                fullname: data.fullname,
                email: data.email,
                username: data.username,
                password: data.password,
                region: data.region,
                isAdmin: false
            };
            
            // === SPREMEMBA: Dodamo novega uporabnika preko stateManagerja ===
            stateManager.addUser(newUser);
            alert(translate('registration_successful'));
            
            window.location.hash = "#/login";
        });
    }

    // --- LOGIKA ZA PRIJAVO ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        const errorMessage = document.getElementById("error-message");
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            errorMessage.textContent = '';
            
            const usernameOrEmail = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            
            // === SPREMEMBA: Uporabimo stateManager za iskanje uporabnika ===
            const { users } = stateManager.getState();
            const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

            if (!user) {
                errorMessage.textContent = translate('error_wrong_credentials');
                return;
            }

            // === SPREMEMBA: Prijavimo uporabnika preko stateManagerja ===
            stateManager.setLoggedInUser(user);
            alert(translate('login_successful'));

            window.location.hash = "#/";
        });
    }
}