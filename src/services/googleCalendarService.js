// googleCalendarService.js — Google Calendar Integration — MojAvto.si
//
// Approach: URL-based "Add to Google Calendar" — no OAuth required.
// Opens Google Calendar in a new tab with the event pre-filled.
//
// For full Calendar API write-access (bidirectional sync, availability checks),
// replace with gapi OAuth flow and set GOOGLE_CLIENT_ID + GOOGLE_API_KEY in .env.

// ── Helpers ───────────────────────────────────────────────────

/**
 * Formats a date + time string to Google Calendar UTC datetime format.
 * @param {string} dateStr  — 'YYYY-MM-DD'
 * @param {string} timeStr  — 'HH:MM'
 * @param {number} durationMinutes
 * @returns {{ start: string, end: string }}  — 'YYYYMMDDTHHmmss'
 */
function toGCalDatetime(dateStr, timeStr, durationMinutes = 60) {
    const [y, m, d]  = dateStr.split('-').map(Number);
    const [hh, mm]   = timeStr.split(':').map(Number);

    const pad = n => String(n).padStart(2, '0');

    const startDt = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;

    // Calculate end time
    const endDate = new Date(y, m - 1, d, hh, mm + durationMinutes);
    const endDt = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    return { start: startDt, end: endDt };
}

/**
 * Builds a Slovenian-readable service summary.
 * @param {string[]} serviceIds
 * @returns {string}
 */
function buildServiceSummary(serviceIds) {
    const labels = {
        tyre_change:       'Menjava gum',
        tyre_storage:      'Hramba gum',
        tyre_repair:       'Popravilo gume',
        oil_change:        'Menjava olja',
        brake_service:     'Servis zavor',
        diagnostics:       'Diagnostika',
        inspection:        'Tehnični pregled',
        air_conditioning:  'Servis klime',
        wheel_alignment:   'Poravnava koles',
        wheel_balancing:   'Balansiranje koles',
        clutch_repair:     'Popravilo sklopke',
        body_repair:       'Popravi karoserije',
        electrical_repair: 'Električna napaka',
        battery_service:   'Servis baterije',
        software_update:   'Posodobitev programske opreme',
        hybrid_service:    'Servis hibrida',
        washing:           'Pranje vozila',
    };
    return serviceIds.map(id => labels[id] || id).join(', ');
}

// ── Main export ───────────────────────────────────────────────

/**
 * Builds a Google Calendar "Add Event" URL (no OAuth required).
 * Opens in a new tab with all booking details pre-filled.
 *
 * @param {Object} booking  — saved booking object from bookingService
 * @param {Object} business — business object from businessService
 * @returns {string}        — full Google Calendar URL
 */
export function buildGoogleCalendarUrl(booking, business) {
    const { start, end } = toGCalDatetime(booking.date, booking.time, 60);

    const serviceSummary = buildServiceSummary(booking.services || []);
    const title = `${serviceSummary} — ${business.name}`;

    const confirmLink = `${window.location.origin}/#/potrditev?id=${booking.id}`;
    const description = [
        `Rezervacija: ${booking.serviceNumber || booking.id}`,
        `Podjetje: ${business.name}`,
        `Storitve: ${serviceSummary}`,
        booking.vehicleLabel ? `Vozilo: ${booking.vehicleLabel}` : '',
        booking.totalPrice > 0 ? `Skupaj od: ${booking.totalPrice} €` : 'Cena po ogledu',
        booking.notes ? `Opomba: ${booking.notes}` : '',
        '',
        `Potrditev: ${confirmLink}`,
    ].filter(Boolean).join('\n');

    const location = [
        business.location?.address,
        business.location?.city,
        'Slovenija',
    ].filter(Boolean).join(', ');

    const params = new URLSearchParams({
        action:   'TEMPLATE',
        text:     title,
        dates:    `${start}/${end}`,
        details:  description,
        location: location,
        sf:       'true',
        output:   'xml',
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
}

// ── Future: Full Google Calendar API (OAuth2) ─────────────────
//
// To enable bidirectional sync and availability checking:
//
// 1. Create a Google Cloud project at console.cloud.google.com
// 2. Enable the Google Calendar API
// 3. Create OAuth 2.0 credentials (Web Application)
// 4. Add your domain to "Authorized JavaScript origins"
// 5. Set in your .env file:
//      VITE_GOOGLE_CLIENT_ID=your_client_id_here
//      VITE_GOOGLE_API_KEY=your_api_key_here
//
// Then use the following pattern:
//
// export async function addEventToGoogleCalendar(booking, business) {
//     await gapi.client.init({
//         apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
//         clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
//         scope: 'https://www.googleapis.com/auth/calendar.events',
//     });
//     await gapi.auth2.getAuthInstance().signIn();
//     const event = {
//         summary: title,
//         location: location,
//         description: description,
//         start: { dateTime: `${booking.date}T${booking.time}:00`, timeZone: 'Europe/Ljubljana' },
//         end:   { dateTime: endIso, timeZone: 'Europe/Ljubljana' },
//     };
//     return gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
// }
