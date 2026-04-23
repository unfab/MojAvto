import { getEquipmentLabel } from '../data/equipment.js';

// ── IQR outlier removal ───────────────────────────────────────────────────────
function removeOutliers(listings, factor = 1.5) {
    if (listings.length < 4) return listings;

    const prices = listings.map(l => l.priceEur || l.price || 0).sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];
    const iqr = q3 - q1;
    const lo = q1 - factor * iqr;
    const hi = q3 + factor * iqr;

    return listings.filter(l => {
        const p = l.priceEur || l.price || 0;
        return p >= lo && p <= hi;
    });
}

// ── Median helper ─────────────────────────────────────────────────────────────
function median(arr) {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

// ── Round to nearest 0.5 ──────────────────────────────────────────────────────
function roundHalf(n) {
    return Math.round(n * 2) / 2;
}

// ── 1. getComparables ─────────────────────────────────────────────────────────
export function getComparables(listings, targetListing, options = {}) {
    const yearTolerance = options.yearTolerance ?? 2;
    const targetYear = Number(targetListing.year) || 0;

    const filtered = listings.filter(l => {
        if (l.id === targetListing.id) return false;
        if (l.make !== targetListing.make) return false;
        if (l.model !== targetListing.model) return false;
        const ly = Number(l.year) || 0;
        return ly >= targetYear - yearTolerance && ly <= targetYear + yearTolerance;
    });

    return removeOutliers(filtered);
}

// ── 2. calcPriceScore ─────────────────────────────────────────────────────────
export function calcPriceScore(targetPrice, comparables) {
    if (comparables.length === 0) return null;

    const prices = comparables.map(l => l.priceEur || l.price || 0);
    const med = median(prices);

    const below = prices.filter(p => p < targetPrice).length;
    const percentile = (below / prices.length) * 100;

    const delta = targetPrice - med;
    const deltaPercent = med > 0 ? ((targetPrice - med) / med) * 100 : 0;

    return { median: med, percentile, delta, deltaPercent };
}

// ── 3. calcEquipmentScore ─────────────────────────────────────────────────────
export function calcEquipmentScore(targetEquipment, comparables) {
    if (!targetEquipment || targetEquipment.length === 0) {
        return { rawScore: 0, normalizedScore: 0, rareItems: [], commonItems: [] };
    }

    const eq = targetEquipment;

    // Collect all unique equipment items across comparables
    const allItems = new Set();
    comparables.forEach(l => (l.equipment || []).forEach(i => allItems.add(i)));

    // Frequency map: how many comparables have each item
    const frequency = {};
    allItems.forEach(item => {
        const count = comparables.filter(l => (l.equipment || []).includes(item)).length;
        frequency[item] = comparables.length > 0 ? count / comparables.length : 0;
    });

    // Score for target: sum of (1 - frequency) for each equipment item it has
    let rawScore = 0;
    eq.forEach(item => {
        const freq = frequency[item] ?? 0; // item never seen in comparables → very rare
        rawScore += (1 - freq);
    });

    // Max possible score: if target had every item with frequency 0
    // Use all items seen in comparables + target's own items
    const universe = new Set([...allItems, ...eq]);
    const maxScore = universe.size; // worst case: every item has frequency 0

    const normalizedScore = maxScore > 0 ? Math.min(100, (rawScore / maxScore) * 100) : 0;

    const rareItems = eq.filter(item => (frequency[item] ?? 0) < 0.3);
    const commonItems = eq.filter(item => (frequency[item] ?? 0) > 0.7);

    return { rawScore, normalizedScore, rareItems, commonItems };
}

// ── 4. calcFinalRating ────────────────────────────────────────────────────────
export function calcFinalRating(priceScore, equipmentScore) {
    const { percentile, deltaPercent } = priceScore;
    const { normalizedScore, rareItems } = equipmentScore;

    // Base from price position
    let base;
    if (deltaPercent < -10) {
        base = 5;
    } else if (deltaPercent > 15) {
        base = 2;
    } else if (percentile < 25) {
        base = 4.5;
    } else if (percentile < 50) {
        base = 4.0;
    } else if (percentile < 70) {
        base = 3.5;
    } else {
        base = 3.0;
    }

    // Equipment adjustment
    let adjustment = 0;
    if (normalizedScore > 85) {
        adjustment = 1.0;
    } else if (normalizedScore > 70) {
        adjustment = 0.5;
    } else if (normalizedScore < 30) {
        adjustment = -0.5;
    }

    const raw = base + adjustment;
    const stars = Math.min(5, Math.max(1, roundHalf(raw)));

    // Label
    const labels = { 5: 'Odlična vrednost', 4.5: 'Odlična vrednost', 4: 'Dobra vrednost', 3.5: 'Poštena cena', 3: 'Poštena cena', 2.5: 'Nad povprečjem', 2: 'Nad povprečjem', 1.5: 'Predrago', 1: 'Predrago' };
    const label = labels[stars] || 'Poštena cena';

    // priceSignal
    const absPct = Math.abs(deltaPercent).toFixed(0);
    const priceSignal = deltaPercent < 0
        ? `${absPct} % pod tržno mediano`
        : deltaPercent > 0
            ? `${absPct} % nad tržno mediano`
            : 'Na ravni tržne mediane';

    // equipmentSignal — max 3 rare items, Slovenian labels
    let equipmentSignal = '';
    if (rareItems.length > 0) {
        const labels3 = rareItems.slice(0, 3).map(slug => getEquipmentLabel(slug));
        equipmentSignal = labels3.join(', ') + ' — redko pri tem modelu';
    }

    return { stars, label, priceSignal, equipmentSignal };
}

// ── 5. getVehicleRating ───────────────────────────────────────────────────────
export function getVehicleRating(targetListing, allListings) {
    const targetPrice = targetListing.priceEur || targetListing.price || 0;
    const targetEquipment = targetListing.equipment || [];

    const comparables = getComparables(allListings, targetListing);
    const comparablesCount = comparables.length;

    if (comparablesCount === 0) return null;

    const priceScore = calcPriceScore(targetPrice, comparables);
    if (!priceScore) return null;

    const equipmentScore = calcEquipmentScore(targetEquipment, comparables);
    const { stars, label, priceSignal, equipmentSignal } = calcFinalRating(priceScore, equipmentScore);

    const confidence = comparablesCount >= 10 ? 'high' : comparablesCount >= 4 ? 'medium' : 'low';

    const warning = (priceScore.deltaPercent < -20 && comparablesCount >= 3)
        ? 'Preveri zgodovino vozila'
        : null;

    return {
        stars,
        label,
        priceSignal,
        equipmentSignal,
        median: priceScore.median,
        deltaPercent: priceScore.deltaPercent,
        comparablesCount,
        confidence,
        warning,
    };
}
