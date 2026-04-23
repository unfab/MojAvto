// Dashboard page — MojAvto.si
// Shows after login — user's listings, stats, quick actions
import QRCode from 'qrcode';
import { getUserListings, deleteListing } from '../services/listingService.js';
import {
    getBookingsForUser,
    formatBookingDate,
    getStatusInfo,
    cancelBooking,
} from '../services/bookingService.js';
import { serviceLabels } from '../data/businesses.js';

function isVerifiedBusiness(user) {
    if (!user) return false;
    const profile = window.__currentUserProfile || {};
    return profile.businessTier === 'verified' || profile.role === 'mechanic';
}

export async function initDashboardPage() {
  const container = document.getElementById('app-container');
  if (!container) return;

  const user = window.__currentUser;
  if (!user) {
    window.location.hash = '/prijava';
    return;
  }

  const userPhoto = user.photoURL
    ? "<img src='" + user.photoURL + "' style='width:56px;height:56px;border-radius:50%;object-fit:cover;' />"
    : "<div style='width:56px;height:56px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:1.5rem;'>👤</div>";

  // Initial render with loading state for listings
  container.innerHTML = `
    <div class="dashboard-page" style="max-width:900px;margin:2rem auto;padding:0 1rem;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        ${userPhoto}
        <div>
          <h1 style="margin:0;font-size:1.5rem;font-weight:700;">Pozdravljeni, ${user.displayName || 'Uporabnik'}!</h1>
          <p style="margin:0;color:#6b7280;font-size:0.9rem;">${user.email}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
        <a href="#/novi-oglas" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;text-decoration:none;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:var(--shadow-glass);" onmouseover="this.style.borderColor='var(--color-primary-start)';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.12)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)';this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow-glass)'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">➕</span>
          <span style="font-weight:700;color:#1e293b;">Objavi oglas</span>
          <span style="font-size:0.8rem;color:#64748b;margin-top:4px;">Dodaj novo vozilo</span>
        </a>
        <a href="#/garaža" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;text-decoration:none;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:var(--shadow-glass);" onmouseover="this.style.borderColor='#6366f1';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.12)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)';this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow-glass)'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">🏎️</span>
          <span style="font-weight:700;color:#1e293b;">Moja garaža</span>
          <span style="font-size:0.8rem;color:#64748b;margin-top:4px;">Upravljaj vozila</span>
        </a>
        <a href="#/primerjava" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;text-decoration:none;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:var(--shadow-glass);" onmouseover="this.style.borderColor='#2563eb';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.12)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)';this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow-glass)'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">⚖️</span>
          <span style="font-weight:700;color:#1e293b;">Primerjalni kotiček</span>
          <span style="font-size:0.8rem;color:#64748b;margin-top:4px;">Primerjaj svoja izbrana vozila</span>
        </a>
        <a href="#/profil" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;text-decoration:none;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:var(--shadow-glass);" onmouseover="this.style.borderColor='#22c55e';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.12)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)';this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow-glass)'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">👤</span>
          <span style="font-weight:700;color:#1e293b;">Moj profil</span>
          <span style="font-size:0.8rem;color:#64748b;margin-top:4px;">Uredi podatke</span>
        </a>
        ${isVerifiedBusiness(user) ? `
        <a href="#/servis/vnos" style="display:flex;flex-direction:column;align-items:flex-start;padding:1.5rem;background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;text-decoration:none;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:var(--shadow-glass);" onmouseover="this.style.borderColor='#16a34a';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.12)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)';this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow-glass)'">
          <span style="font-size:1.8rem;margin-bottom:0.5rem;">🔧</span>
          <span style="font-weight:700;color:#1e293b;">Servisni karton</span>
          <span style="font-size:0.8rem;color:#64748b;margin-top:4px;">Vnos servisnega zapisa</span>
        </a>` : ''}
      </div>

      <div style="background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;padding:1.5rem;box-shadow:var(--shadow-glass);margin-bottom:3rem;">
        <h2 style="margin:0 0 1.5rem;font-size:1.1rem;font-weight:800;color:#1e293b;">📋 Moji aktivni oglasi</h2>
        <div id="user-listings-container" style="min-height: 100px;">
          <div style="text-align:center;padding:2rem;color:#9ca3af;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:0.5rem;"></i>
            <p style="margin:0;font-size:0.9rem;">Nalagam oglase...</p>
          </div>
        </div>
      </div>

      <!-- Reservations section -->
      <div style="background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;padding:1.5rem;box-shadow:var(--shadow-glass);margin-bottom:3rem;" id="bookings-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <h2 style="margin:0;font-size:1rem;font-weight:700;color:#1e293b;">📅 Moje rezervacije</h2>
          <a href="#/zemljevid" style="font-size:0.85rem;font-weight:700;color:#2563eb;text-decoration:none;padding:8px 16px;background:rgba(37,99,235,0.1);border-radius:9999px;transition:all 0.2s;">+ Nova rezervacija</a>
        </div>
        <div id="bookings-container">
          <div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.85rem;">Nalagam rezervacije...</div>
        </div>
      </div>

      <!-- Service history section -->
      <div style="background:rgba(255,255,255,0.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5);border-radius:2rem;padding:1.5rem;box-shadow:var(--shadow-glass);" id="service-history-section">
        <h2 style="margin:0 0 1rem;font-size:1rem;font-weight:700;color:#1e293b;">🔧 Servisna knjiga</h2>
        <div id="service-history-container">
          <div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.85rem;">Nalagam servisno zgodovino...</div>
        </div>
      </div>

    </div>
  `;

  // Fetch and render listings
  const listingsContainer = document.getElementById('user-listings-container');
  try {
    const listings = await getUserListings(user.uid);

    if (listings.length === 0) {
      listingsContainer.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#9ca3af;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">📋</div>
          <p style="margin:0;font-size:0.9rem;">Še nimaš objavljenih oglasov.</p>
          <a href="#/novi-oglas" style="display:inline-block;margin-top:1rem;padding:12px 28px;background:linear-gradient(135deg, #f97316, #ea580c);color:#fff;border-radius:9999px;text-decoration:none;font-size:0.95rem;font-weight:700;box-shadow:0 10px 15px -3px rgba(249,115,22,0.3);transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 20px -3px rgba(249,115,22,0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 10px 15px -3px rgba(249,115,22,0.3)'">Objavi prvi oglas</a>
        </div>
      `;
    } else {
      let html = '<div style="display:flex;flex-direction:column;gap:1rem;">';
      listings.forEach(listing => {
        const imgUrl = listing.images?.exterior?.[0] || 'https://via.placeholder.com/150?text=Ni+slike';
        const price = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price);

        html += `
          <div style="display:flex;align-items:center;padding:1.25rem;background:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.4);border-radius:1.5rem;gap:1.25rem;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
              <img src="${imgUrl}" style="width:120px;height:80px;object-fit:cover;border-radius:6px;" alt="${listing.title}">
              <div style="flex:1;">
                  <h3 style="margin:0 0 0.5rem;font-size:1.1rem;color:#1f2937;">${listing.make} ${listing.model} ${listing.type}</h3>
                  <div style="display:flex;gap:1rem;font-size:0.85rem;color:#6b7280;">
                      <span>${listing.year}</span>
                      <span>${listing.mileage} km</span>
                      <span>${listing.fuel}</span>
                  </div>
              </div>
              <div style="text-align:right;">
                  <div style="font-weight:700;font-size:1.2rem;color:#f97316;margin-bottom:0.5rem;">${price}</div>
                  <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
                  <button class="btn btn-outline btn-sm print-listing-btn" data-id="${listing.id}" style="border-color:#3b82f6;color:#3b82f6;" title="Natisni prodajni list">🖨️ Natisni list</button>
                  <button class="btn btn-outline btn-sm delete-listing-btn" data-id="${listing.id}" data-title="${listing.make} ${listing.model}">Odstrani</button>
              </div>
              </div>
          </div>
        `;
      });
      html += '</div>';
      listingsContainer.innerHTML = html;

      // Bind delete functionality
      const deleteButtons = listingsContainer.querySelectorAll('.delete-listing-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const title = e.target.getAttribute('data-title') || 'ta oglas';
          showRemoveListingPopup(id, title);
        });
      });

      // Bind print functionality
      const printButtons = listingsContainer.querySelectorAll('.print-listing-btn');
      printButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const listing = listings.find(l => l.id === id);
          if (listing) printListing(listing);
        });
      });
    }
  } catch (err) {
    console.error("Error loading user listings:", err);
    listingsContainer.innerHTML = '<p style="color:red;text-align:center;">Napaka pri nalaganju oglasov.</p>';
  }

  // Render bookings and service history
  renderBookingsSection(user.uid);
  renderServiceHistorySection(user.uid);
}

// ── Print-to-Sell ─────────────────────────────────────────────
async function printListing(listing) {
  const imgUrl = listing.images?.exterior?.[0] || '';
  const price = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price);

  document.getElementById('print-title').textContent = `${listing.make} ${listing.model} ${listing.type || ''}`.trim();
  document.getElementById('print-price').textContent = price;
  document.getElementById('print-image').src = imgUrl;
  document.getElementById('print-year').textContent = listing.year || '—';
  document.getElementById('print-mileage').textContent = listing.mileage ? `${listing.mileage.toLocaleString('sl-SI')} km` : '—';
  document.getElementById('print-fuel').textContent = listing.fuel || '—';
  document.getElementById('print-transmission').textContent = listing.transmission || '—';
  document.getElementById('print-power').textContent = listing.power ? `${listing.power} KM` : '—';

  const qrUrl = `${window.location.origin}/#/oglas/${listing.id}?src=qr_print`;
  const canvas = document.getElementById('print-qr-canvas');
  try {
    await QRCode.toCanvas(canvas, qrUrl, { width: 200, margin: 1 });
  } catch (err) {
    console.error('QR generiranje ni uspelo:', err);
  }

  window.print();
}

// ── Remove / Sold popup ───────────────────────────────────────
function showRemoveListingPopup(listingId, listingTitle) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:1.5rem;';
    overlay.innerHTML = `
        <div style="background:white;border-radius:2rem;padding:2rem;max-width:380px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.18);text-align:center;animation:agCardIn 0.3s cubic-bezier(0.34,1.56,0.64,1);">
            <div style="font-size:2rem;margin-bottom:0.75rem;">🗑️</div>
            <h3 style="font-size:1.1rem;font-weight:800;color:#0f172a;margin:0 0 0.4rem;">Odstraniti oglas?</h3>
            <p style="font-size:0.875rem;color:#64748b;margin:0 0 1.5rem;">"${listingTitle}"</p>
            <p style="font-size:0.82rem;color:#475569;margin:0 0 1.5rem;font-weight:500;">Je bilo vozilo prodano ali samo odstranjujete oglas?</p>
            <div style="display:flex;flex-direction:column;gap:0.6rem;">
                <button id="removeSoldBtn" style="padding:0.75rem 1rem;border:none;border-radius:1rem;background:linear-gradient(135deg,#16a34a,#15803d);color:white;font-size:0.9rem;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.3);">
                    ✅ Da, vozilo je prodano
                </button>
                <button id="removeOnlyBtn" style="padding:0.75rem 1rem;border:2px solid #e2e8f0;border-radius:1rem;background:white;color:#334155;font-size:0.9rem;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;">
                    Samo odstrani oglas
                </button>
                <button id="removeCancelBtn" style="padding:0.6rem;border:none;background:none;color:#94a3b8;font-size:0.85rem;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;">
                    Prekliči
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closePopup = () => overlay.remove();

    overlay.querySelector('#removeCancelBtn').addEventListener('click', closePopup);
    overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });

    const doDelete = async (markAsSold) => {
        const btns = overlay.querySelectorAll('button');
        btns.forEach(b => { b.disabled = true; });
        try {
            await deleteListing(listingId, markAsSold ? 'sold' : 'removed');
            closePopup();
            initDashboardPage();
        } catch (err) {
            console.error('Delete failed:', err);
            btns.forEach(b => { b.disabled = false; });
        }
    };

    overlay.querySelector('#removeSoldBtn').addEventListener('click', () => doDelete(true));
    overlay.querySelector('#removeOnlyBtn').addEventListener('click', () => doDelete(false));
}

// ── Bookings section ──────────────────────────────────────────
function renderBookingsSection(userId) {
    const container = document.getElementById('bookings-container');
    if (!container) return;

    const bookings = getBookingsForUser(userId);

    if (bookings.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.85rem;">
                <div style="font-size:1.75rem;margin-bottom:0.5rem;">📅</div>
                Nimate še nobene rezervacije.
                <br><a href="#/zemljevid" style="color:#2563eb;font-weight:600;font-size:0.82rem;">Najdi servis ali vulkanizer →</a>
            </div>`;
        return;
    }

    // Sort: pending/confirmed first, then by date desc
    const sorted = [...bookings].sort((a, b) => {
        const order = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return b.date?.localeCompare(a.date);
    });

    container.innerHTML = sorted.map(b => {
        const { label, cls } = getStatusInfo(b.status);
        const services = b.services.map(s => serviceLabels[s] || s).join(' · ');
        const statusColors = {
            'status-pending':   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
            'status-confirmed': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
            'status-completed': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
            'status-cancelled': { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        };
        const sc = statusColors[cls] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };

        return `
        <div style="border:1.5px solid #e2e8f0;border-radius:1rem;padding:1rem 1.25rem;margin-bottom:0.65rem;background:rgba(255,255,255,0.8);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;flex-wrap:wrap;gap:0.5rem;">
                <span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.65rem;border-radius:9999px;background:${sc.bg};color:${sc.color};border:1px solid ${sc.border};">${label}</span>
                <span style="font-size:0.75rem;color:#94a3b8;font-weight:500;">${formatBookingDate(b.date)} ob ${b.time || ''}</span>
            </div>
            <div style="font-size:0.92rem;font-weight:800;color:#1e293b;margin-bottom:0.2rem;">${b.businessName || 'Neznano podjetje'}</div>
            <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.15rem;">${services}</div>
            <div style="font-size:0.75rem;color:#94a3b8;">${b.vehicleLabel || ''}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.65rem;flex-wrap:wrap;gap:0.5rem;">
                <span style="font-size:0.88rem;font-weight:900;color:#1e293b;">${b.totalPrice > 0 ? 'od ' + b.totalPrice + ' €' : 'Po ogledu'}</span>
                ${(b.status === 'pending' || b.status === 'confirmed')
                    ? `<button onclick="window._cancelBooking('${b.id}','${userId}')" style="font-size:0.75rem;padding:0.3rem 0.75rem;border-radius:9999px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;cursor:pointer;font-family:'Inter',sans-serif;font-weight:600;">Prekliči</button>`
                    : ''}
            </div>
        </div>`;
    }).join('');

    // Global cancel handler
    window._cancelBooking = (bookingId, uid) => {
        if (!confirm('Ali res želite preklicati to rezervacijo?')) return;
        cancelBooking(uid, bookingId);
        renderBookingsSection(uid);
        renderServiceHistorySection(uid);
    };
}

// ── Service history section ───────────────────────────────────
function renderServiceHistorySection(userId) {
    const container = document.getElementById('service-history-container');
    if (!container) return;

    const completed = getBookingsForUser(userId).filter(b => b.status === 'completed');

    if (completed.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.85rem;">
                <div style="font-size:1.75rem;margin-bottom:0.5rem;">🔧</div>
                Servisna knjiga je prazna — po vsakem opravljenem servisu se tukaj shrani zapis.
            </div>`;
        return;
    }

    const sorted = [...completed].sort((a, b) => b.date?.localeCompare(a.date));

    container.innerHTML = sorted.map(b => {
        const services = b.services.map(s => serviceLabels[s] || s).join(' · ');
        return `
        <div style="border:1.5px solid #e2e8f0;border-radius:1rem;padding:1rem 1.25rem;margin-bottom:0.65rem;background:rgba(255,255,255,0.8);display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
            <div style="width:40px;height:40px;border-radius:0.75rem;background:linear-gradient(135deg,#16a34a,#15803d);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">✓</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.92rem;font-weight:800;color:#1e293b;margin-bottom:0.15rem;">${b.businessName || 'Neznano podjetje'}</div>
                <div style="font-size:0.78rem;color:#64748b;">${services}</div>
                <div style="font-size:0.72rem;color:#94a3b8;margin-top:0.1rem;">${b.vehicleLabel || ''} · ${formatBookingDate(b.date)}</div>
            </div>
            <div style="font-size:0.9rem;font-weight:800;color:#16a34a;flex-shrink:0;">${b.totalPrice > 0 ? b.totalPrice + ' €' : 'Po ogledu'}</div>
        </div>`;
    }).join('');
}
