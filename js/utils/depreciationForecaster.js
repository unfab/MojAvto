// js/utils/depreciationForecaster.js

// Predpostavke za izračun
const DEPRECIATION_RATES = [0.18, 0.15, 0.12]; // Padec v %, za leto 1, 2, in 3

/**
 * Oceni padec vrednosti vozila za naslednja 3 leta.
 * @param {object} listing - Objekt z vsemi podatki o oglasu.
 * @returns {Array} - Seznam z vrednostmi za naslednja 3 leta.
 */
export function forecastDepreciation(listing) {
    let currentValue = listing.price;
    const forecast = [];

    DEPRECIATION_RATES.forEach(rate => {
        currentValue *= (1 - rate);
        forecast.push(Math.round(currentValue));
    });

    return forecast;
}