// js/utils/tcoCalculator.js

// Predpostavke za izračun - te vrednosti lahko prilagajaš
const AVG_YEARLY_MILEAGE = 15000; // km
const AVG_FUEL_PRICE = 1.5; // EUR/liter
const INSURANCE_BASE_RATE = 250; // Osnovna letna premija v EUR
const SERVICE_BASE_RATE = 200; // Osnovni letni strošek servisa v EUR

/**
 * Ocenjeni letni stroški lastništva vozila.
 * @param {object} listing - Objekt z vsemi podatki o oglasu.
 * @returns {object} - Objekt z ocenjenimi stroški.
 */
export function calculateTCO(listing) {
    // 1. Strošek goriva
    const fuelConsumption = listing.specs?.consumption?.combined || 7.0; // Privzeta poraba 7 l/100km
    const fuelCost = (AVG_YEARLY_MILEAGE / 100) * fuelConsumption * AVG_FUEL_PRICE;

    // 2. Strošek zavarovanja (poenostavljena formula)
    const powerKw = listing.power || 100;
    const insuranceCost = INSURANCE_BASE_RATE + (powerKw * 1.5); // Dražje za močnejša vozila

    // 3. Strošek servisa (poenostavljena formula)
    const serviceCost = SERVICE_BASE_RATE + (listing.year < 2015 ? 150 : 0); // Dražji servis za starejša vozila

    const totalYearly = fuelCost + insuranceCost + serviceCost;

    return {
        fuel: Math.round(fuelCost),
        insurance: Math.round(insuranceCost),
        service: Math.round(serviceCost),
        totalYearly: Math.round(totalYearly),
        totalMonthly: Math.round(totalYearly / 12)
    };
}