document.addEventListener("DOMContentLoaded", () => {
    // Dinamično nalaganje glave
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        const headerDiv = document.getElementById("header");
        if(headerDiv) headerDiv.innerHTML = data;
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

        // Preverjanje moči gesla
        passwordInput.addEventListener('input', () => {
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
            errorMessage.textContent = ''; // Počisti napake
            
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.confirmPassword) {
                errorMessage.textContent = "Gesli se ne ujemata.";
                return;
            }

            const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];
            const userExists = users.find(u => u.username === data.username || u.email === data.email);
            if (userExists) {
                errorMessage.textContent = "Uporabnik s tem emailom ali imenom že obstaja.";
                return;
            }

            const newUser = {
                fullname: data.fullname,
                email: data.email,
                username: data.username,
                password: data.password,
                region: data.region
            };

            users.push(newUser);
            localStorage.setItem("mojavto_users", JSON.stringify(users));
            alert("Uspešna registracija! Preusmerjanje na prijavo...");
            window.location.href = "login.html";
        });
    }

    // --- LOGIKA ZA PRIJAVO (ostane enaka) ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const usernameOrEmail = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];
            const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

            if (!user) {
                alert("Nepravilni podatki. Poskusi znova.");
                return;
            }

            localStorage.setItem("mojavto_loggedUser", JSON.stringify(user));
            alert("Uspešna prijava! Preusmerjanje na domačo stran...");
            window.location.href = "index.html";
        });
    }
});