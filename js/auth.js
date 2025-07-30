document.addEventListener("DOMContentLoaded", () => {

  // REGISTRATION LOGIC
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullname = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email").value.trim();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const termsAccepted = document.getElementById("terms").checked;

      if (password !== confirmPassword) {
        alert("Gesli se ne ujemata.");
        return;
      }

      if (!termsAccepted) {
        alert("Potrebno je sprejeti pogoje.");
        return;
      }

      const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];

      const userExists = users.find(u => u.username === username || u.email === email);
      if (userExists) {
        alert("Uporabnik s tem emailom ali imenom že obstaja.");
        return;
      }

      const newUser = {
        fullname,
        email,
        username,
        password // NOTE: In real apps, never store plain passwords!
      };

      users.push(newUser);
      localStorage.setItem("mojavto_users", JSON.stringify(users));
      alert("Uspešna registracija! Preusmerjanje na prijavo...");
      window.location.href = "login.html";
    });
  }

  // LOGIN LOGIC
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const usernameOrEmail = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      const users = JSON.parse(localStorage.getItem("mojavto_users")) || [];

      const user = users.find(u =>
        (u.username === usernameOrEmail || u.email === usernameOrEmail) &&
        u.password === password
      );

      if (!user) {
        alert("Nepravilni podatki. Poskusi znova.");
        return;
      }

      localStorage.setItem("mojavto_loggedUser", JSON.stringify(user));
      alert("Uspešna prijava! Preusmerjanje na domačo stran...");
      window.location.href = "index.html"; // Adjust if needed
    });
  }

});
