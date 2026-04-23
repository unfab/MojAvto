// ── Cost Calculator Utilities ─────────────────────────────────────────────────

export function calculateLeasing(price, downPayment, months, annualInterestRate = 6.5) {
    const P = price - downPayment;
    if (P <= 0 || months <= 0) return 0;
    const i = (annualInterestRate / 100) / 12;
    if (i === 0) return Math.round(P / months);
    const monthly = P * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
    return Math.round(monthly);
}

export function estimateRunningCosts(powerKw, fuelType) {
    let annualBase;
    if (powerKw < 60) annualBase = 400;
    else if (powerKw < 101) annualBase = 550;
    else if (powerKw < 151) annualBase = 750;
    else annualBase = 1000;

    if (fuelType === 'Električni' || fuelType === 'Elektrika') {
        annualBase = Math.round(annualBase * 0.7);
    }

    return Math.round(annualBase / 12);
}

export function estimateMaintenance(price) {
    return Math.round((price * 0.02) / 12);
}
