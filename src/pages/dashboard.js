// Dashboard page — MojAvto.si
// Shows after login — user's listings, stats, quick actions
export function initDashboardPage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const user = window.__currentUser;
    if (!user) {
        window.location.hash = '/prijava';
        return;
    }

    container.innerHTML = `
    <div class="dashboard-page" style="max-width:900px;margin:2rem auto;padding:0 1rem;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        ${user.photoURL
            ? `<img src="${user.photoURL}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;" />`
            : `<div style="width:56px;height:56px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👤</div>`
        }
        <div>
          <h1 style="margin:0;font-size:1.5rem;font-weight:700;">Pozdravljeni, ${user.displayName || 'Uporabnik'}!</h1>
          <p style="margin:0;color:#6b7280;font-size:0.9rem;">${user.email}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
        <a href="#/novi-oglas" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.borderColor='#f97316';this.style.boxShadow='0 4px 16px rgba(249,115,22,0.15)'" onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">➕</span>
          <span style="font-weight:600;color:#1f2937;">Objavi oglas</span>
          <span style="font-size:0.8rem;color:#9ca3af;margin-top:4px;">Dodaj novo vozilo</span>
        </a>
        <a href="#/garaža" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.borderColor='#6366f1';this.style.boxShadow='0 4px 16px rgba(99,102,241,0.15)'" onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">🏎️</span>
          <span style="font-weight:600;color:#1f2937;">Moja garaža</span>
          <span style="font-size:0.8rem;color:#9ca3af;margin-top:4px;">Upravljaj vozila</span>
        </a>
        <a href="#/profil" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.borderColor='#22c55e';this.style.boxShadow='0 4px 16px rgba(34,197,94,0.15)'" onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">👤</span>
          <span style="font-weight:600;color:#1f2937;">Moj profil</span>
          <span style="font-size:0.8rem;color:#9ca3af;margin-top:4px;">Uredi podatke</span>
        </a>
      </div>

      <div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:1.5rem;">
        <h2 style="margin:0 0 1rem;font-size:1rem;font-weight:600;color:#374151;">Moji aktivni oglasi</h2>
        <div style="text-align:center;padding:2rem;color:#9ca3af;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">📋</div>
          <p style="margin:0;font-size:0.9rem;">Še nimaš objavljenih oglasov.</p>
          <a href="#/novi-oglas" style="display:inline-block;margin-top:1rem;padding:8px 20px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:600;">Objavi prvi oglas</a>
        </div>
      </div>
    </div>
  `;
}
