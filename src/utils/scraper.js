// URL scraper — fetches raw listing HTML via AllOrigins CORS proxy
// Returns cleaned body text (max 5000 chars) safe to send to Gemini

const PROXY = 'https://api.allorigins.win/get?url=';
const MAX_CHARS = 5000;

export async function fetchRawListingData(url) {
    const proxyUrl = PROXY + encodeURIComponent(url);

    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`Proxy napaka: ${res.status}`);

    const json = await res.json();
    const html = json?.contents;
    if (!html) throw new Error('Proxy ni vrnil vsebine.');

    return extractBodyText(html);
}

function extractBodyText(html) {
    // Parse into a detached document — never renders, safe from XSS
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Remove noise elements
    for (const sel of ['script', 'style', 'noscript', 'nav', 'footer', 'header', 'iframe', 'svg']) {
        doc.querySelectorAll(sel).forEach(el => el.remove());
    }

    // Prefer main content containers found on most car listing sites
    const candidates = [
        doc.querySelector('main'),
        doc.querySelector('[class*="detail"]'),
        doc.querySelector('[class*="listing"]'),
        doc.querySelector('[class*="vehicle"]'),
        doc.querySelector('[class*="article"]'),
        doc.body,
    ];
    const target = candidates.find(Boolean) ?? doc.body;

    const text = (target?.innerText || target?.textContent || '')
        .replace(/\s{3,}/g, '\n')   // collapse whitespace
        .replace(/\n{4,}/g, '\n\n') // collapse blank lines
        .trim();

    return text.slice(0, MAX_CHARS);
}
