/**
 * Algoritem za ocenjevanje cene vozila v primerjavi s podobnimi vozili.
 * @param {object} listingToEvaluate - Oglas, ki ga ocenjujemo.
 * @param {Array} allListings - Seznam vseh oglasov za primerjavo.
 * @returns {object|null} - Objekt z oceno ali null, če primerjava ni mogoča.
 */
export function evaluatePrice(listingToEvaluate, allListings) {
    // Poiščemo primerljiva vozila (ista znamka, isti model, letnik +/- 1 leto)
    const comparableListings = allListings.filter(l =>
        l.id !== listingToEvaluate.id &&
        l.make === listingToEvaluate.make &&
        l.model === listingToEvaluate.model &&
        Math.abs(l.year - listingToEvaluate.year) <= 1
    );

    // Če ni dovolj podatkov za primerjavo, ne vrnemo ocene
    if (comparableListings.length < 3) {
        return null;
    }

    // Izračunamo povprečja za primerljivo skupino
    const avgPrice = comparableListings.reduce((sum, l) => sum + l.price, 0) / comparableListings.length;
    const avgMileage = comparableListings.reduce((sum, l) => sum + l.mileage, 0) / comparableListings.length;

    // Prilagodimo pričakovano ceno glede na kilometre
    const mileageDifference = avgMileage - listingToEvaluate.mileage;
    const mileageAdjustment = (mileageDifference / 10000) * 0.01; // 1% na 10k km
    let expectedPrice = avgPrice * (1 + mileageAdjustment);
    
    // Prilagoditev za "premium" opremo
    const premiumEquipment = ['Panoramska streha', 'Zračno vzmetenje', 'Aktivni tempomat', 'Head-up zaslon'];
    const listingPremiumCount = listingToEvaluate.equipment?.filter(e => premiumEquipment.includes(e)).length || 0;
    
    expectedPrice *= (1 + (listingPremiumCount * 0.015));

    // Primerjamo dejansko ceno s pričakovano ceno
    const priceRatio = listingToEvaluate.price / expectedPrice;

    // === SPREMEMBA: Vračamo celoten objekt z več podatki ===
    const evaluation = {
        avgPrice: Math.round(avgPrice),
        expectedPrice: Math.round(expectedPrice),
        mileageDiff: Math.round(mileageDifference),
    };

    if (priceRatio < 0.90) return { ...evaluation, score: 'very_good', text: 'Zelo dobra cena' };
    if (priceRatio < 0.95) return { ...evaluation, score: 'good', text: 'Dobra cena' };
    if (priceRatio <= 1.05) return { ...evaluation, score: 'fair', text: 'Poštena cena' };
    
    return { ...evaluation, score: 'high', text: 'Višja cena' };
}