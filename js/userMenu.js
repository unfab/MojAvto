function initUserMenu() {
  const user = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
  const userMenu = document.getElementById("userMenu");
  const loginLink = document.getElementById("loginLink");
  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user && user.fullname) {
    userMenu.style.display = "inline-block";
    loginLink.style.display = "none";
    userDropdownBtn.textContent = `Moj račun ▼ (${user.fullname})`;
  } else {
    userMenu.style.display = "none";
    loginLink.style.display = "inline-block";
  }

  userDropdownBtn?.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent triggering document click immediately
    userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!userDropdown.contains(e.target) && e.target !== userDropdownBtn) {
      userDropdown.style.display = "none";
    }
  });

  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("mojavto_loggedUser");
    alert("Odjava uspešna.");
    window.location.href = "login.html";
  });
}

// Burger menu toggle
document.getElementById("burgerBtn")?.addEventListener("click", () => {
  const nav = document.getElementById("navLinks");
  nav.classList.toggle("open");
});

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", initUserMenu);
