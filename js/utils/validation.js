import { translate } from './i18n.js';
import { stateManager } from './stateManager.js';
// === NOVO: Uvozimo funkcije za validacijo ===
import { validateRequired, validateEmail, validateUsername, validatePassword, validatePasswordMatch } from './utils/validation.js';

export function initAuthPage() {

    // --- LOGIKA ZA REGISTRACIJO ---
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const passwordInput = document.getElementById("password");
        const strengthBar = document.getElementById("strength-bar");
        const errorMessage = document.getElementById("form-error-message"); // Pravilen ID za splošne napake
        
        // Pridobimo vse vnosne elemente za validacijo
        const fullnameInput = document.getElementById("fullname");
        const emailInput = document.getElementById("email");
        const usernameInput = document.getElementById("username");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const termsCheckbox = document.getElementById("terms");

        // === NOVO: Sprožimo validacijo ob izgubi fokusa ('blur') ===
        fullnameInput.addEventListener('blur', () => validateRequired(fullnameInput));
        emailInput.addEventListener('blur', () => validateEmail(emailInput));
        usernameInput.addEventListener('blur', () => validateUsername(usernameInput));
        passwordInput.addEventListener('blur', () => validatePassword(passwordInput));
        confirmPasswordInput.addEventListener('blur', () => validatePasswordMatch(passwordInput, confirmPasswordInput));
        termsCheckbox.addEventListener('change', () => validateRequired(termsCheckbox));


        // Obstoječa koda za prikaz moči gesla ostane nespremenjena
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
            if (errorMessage) errorMessage.textContent = '';
            
            // === SPREMEMBA: Validacija vseh polj pred pošiljanjem ===
            const isFullnameValid = validateRequired(fullnameInput);
            const isEmailValid = validateEmail(emailInput);
            const isUsernameValid = validateUsername(usernameInput);
            const isPasswordValid = validatePassword(passwordInput);
            const doPasswordsMatch = validatePasswordMatch(passwordInput, confirmPasswordInput);
            const areTermsAccepted = validateRequired(termsCheckbox);

            if (!isFullnameValid || !isEmailValid || !isUsernameValid || !isPasswordValid || !doPasswordsMatch || !areTermsAccepted) {
                if (errorMessage) errorMessage.textContent = translate('error_fill_all_fields');
                return; // Ustavi pošiljanje, če karkoli ni veljavno
            }
            
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            const { users } = stateManager.getState();
            const userExists = users.find(u => u.username === data.username || u.email === data.email);
            if (userExists) {
                if (errorMessage) errorMessage.textContent = translate('user_exists_error');
                return;
            }

            const newUser = {
                fullname: data.fullname,
                email: data.email,
                username: data.username,
                password: data.password,
                region: data.region,
                isAdmin: false,
                isPro: false // Dodamo novo lastnost
            };
            
            stateManager.addUser(newUser);
            alert(translate('registration_successful'));
            
            window.location.hash = "#/login";
        });
    }

    // --- LOGIKA ZA PRIJAVO (ostane nespremenjena) ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        const errorMessage = document.getElementById("error-message"); // ID za napake pri prijavi
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if(errorMessage) errorMessage.textContent = '';
            
            const usernameOrEmail = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            
            const { users } = stateManager.getState();
            const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

            if (!user) {
                if(errorMessage) errorMessage.textContent = translate('error_wrong_credentials');
                return;
            }

            stateManager.setLoggedInUser(user);
            // Po prijavi osvežimo stran, da se header pravilno posodobi
            window.location.hash = "#/";
            location.reload(); 
        });
    }
}