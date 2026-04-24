// Shared utilities for vehicle listing cards

export const FUEL_MAP = {
    'bencin':            { code: 'B',   cls: 'fuel-pill-B',  icon: 'fuel',     title: 'Bencin' },
    'benzin':            { code: 'B',   cls: 'fuel-pill-B',  icon: 'fuel',     title: 'Bencin' },
    'diesel':            { code: 'D',   cls: 'fuel-pill-D',  icon: 'fuel',     title: 'Dizel' },
    'dizel':             { code: 'D',   cls: 'fuel-pill-D',  icon: 'fuel',     title: 'Dizel' },
    'hibrid':            { code: 'H',   cls: 'fuel-pill-H',  icon: 'zap',      title: 'Hibrid' },
    'priključni hibrid': { code: 'HB',  cls: 'fuel-pill-HB', icon: 'plug-zap', title: 'Priključni hibrid' },
    'elektrika':         { code: 'E',   cls: 'fuel-pill-E',  icon: 'zap',      title: 'Električno vozilo' },
    'električno':        { code: 'E',   cls: 'fuel-pill-E',  icon: 'zap',      title: 'Električno vozilo' },
    'lpg':               { code: 'LPG', cls: 'fuel-pill-LPG',icon: 'flame',    title: 'LPG' },
};

export function getFuelPill(fuelStr) {
    const key = (fuelStr || '').toLowerCase().trim();
    const f = FUEL_MAP[key];
    if (!f) {
        return `<div class="spec-pill"><i data-lucide="fuel"></i> ${fuelStr}</div>`;
    }
    return `<div class="spec-pill fuel-coded ${f.cls}" title="${f.title}">
        <i data-lucide="${f.icon}"></i>
        <strong>${f.code}</strong>
    </div>`;
}

export function getPowerPill(powerKw) {
    if (!powerKw) return '';
    const km = Math.round(powerKw * 1.3596);
    return `<div class="spec-pill power-pill" data-kw="${powerKw}" data-km="${km}">
        <i data-lucide="zap"></i>
        <span class="power-val">${powerKw} kW</span>
    </div>`;
}

export function getConsumptionPill(car) {
    const fuelKey = (car.fuel || '').toLowerCase().trim();
    
    if (fuelKey === 'elektrika' || fuelKey === 'električno') {
        if (!car.electricRangeKm) return '';
        const range = car.electricRangeKm;
        let statusCls = 'status-low'; // Good = Green for EVs with long range (> 400)
        if (range <= 250) statusCls = 'status-high'; // Bad = Red for short range
        else if (range <= 400) statusCls = 'status-medium'; // Mid = Blue/Amber
        
        return `<div class="spec-pill consumption-pill ${statusCls}" title="Domet WLTP">
            <i data-lucide="battery-charging"></i>
            ${range} km
        </div>`;
    }

    const cons = parseFloat(car.fuelL100kmCombined || car.fuelL100km);
    if (!cons && !car.electricRangeKm) return '';

    let statusCls = 'status-medium';
    if (cons <= 5.0) statusCls = 'status-low'; // Green (Efficient)
    else if (cons > 7.0) statusCls = 'status-high'; // Red (High consumption)

    if (car.electricRangeKm && cons) {
        return `<div class="spec-pill consumption-pill ${statusCls}" title="Poraba / električni domet">
            <i data-lucide="droplets"></i>
            ${cons} l · ${car.electricRangeKm} km E
        </div>`;
    }

    return `<div class="spec-pill consumption-pill ${statusCls}" title="Poraba goriva">
        <i data-lucide="droplets"></i>
        ${cons} l/100km
    </div>`;
}

export function getTransmissionPill(transStr) {
    const t = (transStr || '').toLowerCase().trim();
    let code = 'A';
    let label = 'Avtomatski';
    let typeCls = 'type-auto';

    if (t.includes('roč') || t.includes('manual')) { 
        code = 'R'; 
        label = 'Ročni'; 
        typeCls = 'type-manual';
    }
    else if (t.includes('sekven')) { 
        code = 'S'; 
        label = 'Sekvenčni'; 
        typeCls = 'type-auto';
    }
    
    return `<div class="spec-pill transmission-pill ${typeCls}" title="Menjalnik: ${label}">
        <i data-lucide="settings"></i>
        <strong>${code}</strong>
    </div>`;
}

export function getYearPill(year) {
    if (!year) return '';
    return `<div class="spec-pill year-pill">
        <i data-lucide="calendar"></i>
        <span>${year}</span>
    </div>`;
}

export function getKmPill(km) {
    if (km === undefined || km === null) return '';
    const formattedKm = typeof km === 'number' ? new Intl.NumberFormat('sl-SI').format(km) + ' km' : km;
    return `<div class="spec-pill km-pill">
        <i data-lucide="gauge"></i>
        <span>${formattedKm}</span>
    </div>`;
}
