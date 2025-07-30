document.addEventListener("DOMContentLoaded", () => {
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
    loginLink.style.display = "inline";
  }

  userDropdownBtn?.addEventListener("click", () => {
    if (userDropdown.style.display === "block") {
      userDropdown.style.display = "none";
    } else {
      userDropdown.style.display = "block";
    }
  });

  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdown.style.display = "none";
    }
  });

  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("mojavto_loggedUser");
    alert("Odjava uspešna.");
    window.location.href = "login.html";
  });
});
