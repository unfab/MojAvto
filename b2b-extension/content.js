// content.js — Mobile.de data extractor (injected by popup.js)
// Returns structured data or { error: string }

(function extractMobileDe() {
  try {
    // ── 1. JSON-LD (schema.org/Vehicle) ──────────────────────────────────────
    const ldScripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );

    let vehicle = null;
    for (const s of ldScripts) {
      try {
        const parsed = JSON.parse(s.textContent);
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        const found = candidates.find(
          o => o['@type'] === 'Vehicle' || o['@type'] === 'Car'
        );
        if (found) { vehicle = found; break; }
      } catch { /* skip malformed scripts */ }
    }

    // ── 2. Fallback: Open Graph / meta tags for price ────────────────────────
    function getMeta(prop) {
      return (
        document.querySelector(`meta[property="${prop}"]`)?.content ||
        document.querySelector(`meta[name="${prop}"]`)?.content ||
        null
      );
    }

    // ── 3. Build result from JSON-LD ─────────────────────────────────────────
    const data = {
      source: 'mobile.de',
      url: window.location.href,
      brand:        vehicle?.brand?.name          ?? vehicle?.manufacturer ?? null,
      model:        vehicle?.model                ?? null,
      price:        vehicle?.offers?.price        ?? vehicle?.price        ?? null,
      currency:     vehicle?.offers?.priceCurrency ?? 'EUR',
      mileage:      vehicle?.mileageFromOdometer?.value ?? null,
      year:         extractYear(vehicle?.productionDate ?? vehicle?.vehicleModelDate),
      fuelType:     vehicle?.fuelType             ?? null,
      transmission: vehicle?.vehicleTransmission  ?? null,
      color:        vehicle?.color                ?? null,
      rawEquipment: extractEquipmentText(),
    };

    // If no JSON-LD found at all, try a best-effort DOM scrape
    if (!vehicle) {
      data.brand = data.brand || scrapeText('[data-testid="make-model"] span:first-child, .make-model-type h1');
      data.price = data.price || scrapePrice();
    }

    if (!data.brand && !data.price) {
      return { error: 'Podatkov ni bilo mogoče prebrati. Poskusite na strani posameznega oglasa.' };
    }

    return data;

  } catch (err) {
    return { error: err.message };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function extractYear(dateStr) {
    if (!dateStr) return null;
    const m = String(dateStr).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : null;
  }

  function extractEquipmentText() {
    // Mobile.de renders equipment in a section labelled "Ausstattung"
    const selectors = [
      '[data-testid="features-section"]',
      '.vehicle-features',
      '.feature-list',
      'section.features',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el.innerText.trim();
    }

    // Fallback: find heading containing "Ausstattung" then grab sibling/parent text
    const headings = Array.from(document.querySelectorAll('h2, h3, h4, strong, span'));
    for (const h of headings) {
      if (/ausstattung/i.test(h.textContent)) {
        const container = h.closest('section, div[class*="feature"], div[class*="equip"]');
        if (container) return container.innerText.replace(h.textContent, '').trim();
      }
    }
    return null;
  }

  function scrapeText(selector) {
    const el = document.querySelector(selector);
    return el?.textContent?.trim() || null;
  }

  function scrapePrice() {
    const el = document.querySelector('[data-testid="price-section"] .price, .price-block .price, h2.price');
    if (!el) return null;
    const raw = el.textContent.replace(/[^0-9]/g, '');
    return raw ? parseInt(raw, 10) : null;
  }
})();
