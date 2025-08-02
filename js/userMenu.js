document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    const userMenu = document.getElementById("userMenu");
    const loginLink = document.getElementById("loginLink");
    const userDropdownBtn = document.getElementById("userDropdownBtn");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    // Novi elementi za ločevanje vlog
    const adminLink = document.getElementById("adminLink");
    const profileLink = document.getElementById("profileLink");
    const dashboardLink = document.getElementById("dashboardLink");

    if (user && user.fullname) {
        userMenu.style.display = "inline-block";
        loginLink.style.display = "none";
        userDropdownBtn.innerHTML = `${translate('my_account')} ▼ (${user.fullname})`;

        // SPREMEMBA: Ločevanje med adminom in navadnim uporabnikom
        if (user.isAdmin) {
            // Pokaži povezave za admina, skrij za navadnega uporabnika
            if (adminLink) adminLink.style.display = "block";
            if (dashboardLink) dashboardLink.style.display = "block";
            if (profileLink) profileLink.style.display = "none";
        } else {
            // Pusti vidno samo povezavo za navadnega uporabnika
            if (profileLink) profileLink.style.display = "block";
            if (adminLink) adminLink.style.display = "none";
            if (dashboardLink) dashboardLink.style.display = "none";
        }

    } else {
        userMenu.style.display = "none";
        loginLink.style.display = "inline";
    }

    // Delovanje spustnega menija (ostane enako)
    userDropdownBtn?.addEventListener("click", () => {
        if (userDropdown) {
            userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
        }
    });

    // Zapiranje menija ob kliku izven njega (ostane enako)
    document.addEventListener("click", (e) => {
        if (userMenu && !userMenu.contains(e.target) && userDropdown) {
            userDropdown.style.display = "none";
        }
    });

    // Delovanje gumba za odjavo (ostane enako)
    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("mojavto_loggedUser");
        alert(translate('logout_successful'));
        window.location.href = "login.html";
    });
});