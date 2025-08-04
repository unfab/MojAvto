// Izvozimo eno glavno funkcijo, ki jo bo poklical ruter
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

            const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];
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

            users.push(newUser);
            localStorage.setItem("mojavto_users", JSON.stringify(users));
            alert(translate('registration_successful'));
            
            // SPREMEMBA: Uporabimo hash za preusmeritev
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
            const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];
            const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

            if (!user) {
                errorMessage.textContent = translate('error_wrong_credentials');
                return;
            }

            localStorage.setItem("mojavto_loggedUser", JSON.stringify(user));
            alert(translate('login_successful'));

            // SPREMEMBA: Uporabimo hash za preusmeritev
            window.location.hash = "#/";
        });
    }
}