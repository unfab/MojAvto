// Profile page — MojAvto.si
export function initProfilePage() {
    console.log('[ProfilePage] init — coming in Phase 3');
    const container = document.getElementById('app-container');
    if (container) {
        container.innerHTML = `<div style="max-width:600px;margin:3rem auto;text-align:center;padding:2rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">🚧</div>
      <h1 style="font-size:1.5rem;font-weight:700;">Profil — kmalu dostopen</h1>
      <p style="color:#6b7280;">Stran se gradi v naslednji fazi razvoja.</p>
      <a href="#/dashboard" style="display:inline-block;margin-top:1rem;padding:9px 22px;background:#f97316;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">← Dashboard</a>
    </div>`;
    }
}
