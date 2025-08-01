document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    const userMenu = document.getElementById("userMenu");
    const loginLink = document.getElementById("loginLink");
    const userDropdownBtn = document.getElementById("userDropdownBtn");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");
    const adminLink = document.getElementById("adminLink"); // Nov element

    if (user && user.fullname) {
        // Prijavljen uporabnik
        userMenu.style.display = "inline-block";
        loginLink.style.display = "none";
        userDropdownBtn.textContent = `Moj račun ▼ (${user.fullname})`;

        // Pokaži admin povezavo, če je uporabnik admin
        if (user.isAdmin && adminLink) {
            adminLink.style.display = "block";
        }

    } else {
        // Neprijavljen uporabnik
        userMenu.style.display = "none";
        loginLink.style.display = "inline";
    }

    // Delovanje spustnega menija
    userDropdownBtn?.addEventListener("click", () => {
        if (userDropdown) {
            userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
        }
    });

    // Zapiranje menija ob kliku izven njega
    document.addEventListener("click", (e) => {
        if (userMenu && !userMenu.contains(e.target) && userDropdown) {
            userDropdown.style.display = "none";
        }
    });

    // Delovanje gumba za odjavo
    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("mojavto_loggedUser");
        alert("Odjava uspešna.");
        window.location.href = "login.html";
    });
});