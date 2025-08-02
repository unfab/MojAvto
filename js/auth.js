document.addEventListener("DOMContentLoaded", () => {
    // DODATEK: Dinamično nalaganje glave za doslednost
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        const headerDiv = document.getElementById("header");
        if(headerDiv) headerDiv.innerHTML = data;
        
        // Ta del poskrbi, da se po nalaganju glave zažene tudi i18n in userMenu
        // (Opomba: i18n.js to že počne, a ta zapis je dodaten varnostni mehanizem)
        if (typeof setLanguage === "function") setLanguage(localStorage.getItem('mojavto_lang') || 'sl');
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });
    
    // --- LOGIKA ZA REGISTRACIJO ---
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const passwordInput = document.getElementById("password");
        const strengthBar = document.getElementById("strength-bar");
        const errorMessage = document.getElementById("error-message");

        // DODATEK: Polna koda za preverjanje moči gesla
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

        // Oddaja obrazca
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
                fullname: data.fullname, email: data.email, username: data.username,
                password: data.password, region: data.region
            };

            users.push(newUser);
            localStorage.setItem("mojavto_users", JSON.stringify(users));
            alert(translate('registration_successful'));
            window.location.href = "login.html";
        });
    }

    // --- LOGIKA ZA PRIJAVO ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const usernameOrEmail = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];
            const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

            if (!user) {
                alert(translate('error_wrong_credentials'));
                return;
            }

            localStorage.setItem("mojavto_loggedUser", JSON.stringify(user));
            alert(translate('login_successful'));
            window.location.href = "index.html";
        });
    }
});