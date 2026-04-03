// ═══════════════════════════════════════════════════════════════════════════════
// VIN Service — MojAvto.si
// Decodes VIN numbers and returns vehicle history data.
// Phase 1: Mock data for known VINs + plausible generation for unknown.
// Phase 2: Real API (CARFAX / EuVIN / NHTSA) — replace decodeVinFromApi().
// ═══════════════════════════════════════════════════════════════════════════════

// VIN must be 17 chars, no I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

// ── Mock database ─────────────────────────────────────────────────────────────
const MOCK_DATABASE = {
    'WBA3A5C50CF256651': {
        make: 'BMW', model: '3 Series 320d', year: 2012,
        engineType: 'Dizel', engineCc: 1995, powerKw: 105,
        countryOfOrigin: 'Nemčija', previousOwners: 2,
        accidentCount: 1, accidentSeverity: 'minor',
        hasOpenRecalls: false, recallDetails: [],
        serviceHistory: true,
    },
    'WVWZZZ1KZ9W012345': {
        make: 'Volkswagen', model: 'Golf 1.6 TDI', year: 2019,
        engineType: 'Dizel', engineCc: 1598, powerKw: 85,
        countryOfOrigin: 'Nemčija', previousOwners: 1,
        accidentCount: 0, accidentSeverity: null,
        hasOpenRecalls: false, recallDetails: [],
        serviceHistory: true,
    },
    'WAUZZZ8K9BA012345': {
        make: 'Audi', model: 'A4 2.0 TDI', year: 2021,
        engineType: 'Dizel', engineCc: 1968, powerKw: 110,
        countryOfOrigin: 'Nemčija', previousOwners: 1,
        accidentCount: 0, accidentSeverity: null,
        hasOpenRecalls: true, recallDetails: ['Odpoklic varnostnih pasov — serijska številka V2024-088'],
        serviceHistory: true,
    },
    'ZARFAEAM0F2057132': {
        make: 'Alfa Romeo', model: 'Giulia 2.0 Turbo', year: 2015,
        engineType: 'Bencin', engineCc: 1995, powerKw: 147,
        countryOfOrigin: 'Italija', previousOwners: 3,
        accidentCount: 2, accidentSeverity: 'major',
        hasOpenRecalls: false, recallDetails: [],
        serviceHistory: false,
    },
};

// ── Format validators ─────────────────────────────────────────────────────────
export function validateVinFormat(vin) {
    if (!vin) return { valid: false, message: 'VIN je obvezen.' };
    const clean = vin.trim().toUpperCase();
    if (clean.length !== 17) {
        return {
            valid: false,
            message: `VIN mora vsebovati točno 17 znakov. Trenutno: ${clean.length}.`,
        };
    }
    if (!VIN_REGEX.test(clean)) {
        return {
            valid: false,
            message: 'VIN vsebuje neveljavne znake (I, O, Q niso dovoljeni).',
        };
    }
    return { valid: true, message: null };
}

// ── Main decode function ──────────────────────────────────────────────────────
/**
 * Decodes a VIN and returns vehicle data.
 * Returns: { success: true, vin, data: VinData } | { success: false, code, message }
 */
export async function decodeVin(vin) {
    const clean = vin.trim().toUpperCase();

    // Simulate network delay (800ms–2000ms) for trust-building UX
    await delay(800 + Math.random() * 1200);

    // 1. Check mock database
    if (MOCK_DATABASE[clean]) {
        return { success: true, vin: clean, data: MOCK_DATABASE[clean] };
    }

    // 2. For unknown VINs: generate plausible data based on WMI (first 3 chars)
    const generated = generateFromWmi(clean);
    if (generated) {
        return { success: true, vin: clean, data: generated };
    }

    // 3. Unknown manufacturer / truly unresolvable
    return {
        success: false,
        code: 'NOT_FOUND',
        message: 'Vozila s to šasijsko številko ni bilo mogoče najti v naši bazi.',
    };
}

// ── WMI lookup table (World Manufacturer Identifier — first 3 chars of VIN) ──
const WMI_MAP = {
    // Germany
    WBA: { make: 'BMW',        country: 'Nemčija' },
    WBS: { make: 'BMW M',      country: 'Nemčija' },
    WDD: { make: 'Mercedes-Benz', country: 'Nemčija' },
    WDB: { make: 'Mercedes-Benz', country: 'Nemčija' },
    WDC: { make: 'Mercedes-Benz', country: 'Nemčija' },
    WAU: { make: 'Audi',       country: 'Nemčija' },
    WVW: { make: 'Volkswagen', country: 'Nemčija' },
    WV1: { make: 'Volkswagen', country: 'Nemčija' },
    WV2: { make: 'Volkswagen', country: 'Nemčija' },
    WF0: { make: 'Ford',       country: 'Nemčija' },
    SAJ: { make: 'Jaguar',     country: 'Velika Britanija' },
    SAL: { make: 'Land Rover', country: 'Velika Britanija' },
    // France
    VF1: { make: 'Renault',    country: 'Francija' },
    VF3: { make: 'Peugeot',    country: 'Francija' },
    VF7: { make: 'Citroën',    country: 'Francija' },
    // Italy
    ZAR: { make: 'Alfa Romeo', country: 'Italija' },
    ZFF: { make: 'Ferrari',    country: 'Italija' },
    ZCG: { make: 'Maserati',   country: 'Italija' },
    // Sweden
    YV1: { make: 'Volvo',      country: 'Švedska' },
    YS3: { make: 'Saab',       country: 'Švedska' },
    // Japan
    JHM: { make: 'Honda',      country: 'Japonska' },
    JN1: { make: 'Nissan',     country: 'Japonska' },
    JT2: { make: 'Toyota',     country: 'Japonska' },
    JTD: { make: 'Toyota',     country: 'Japonska' },
    JMB: { make: 'Mitsubishi', country: 'Japonska' },
    // Korea
    KMH: { make: 'Hyundai',    country: 'Koreja' },
    KNA: { make: 'Kia',        country: 'Koreja' },
    // USA
    '1HG': { make: 'Honda',    country: 'ZDA' },
    '1FA': { make: 'Ford',     country: 'ZDA' },
    // Czech / Slovakia
    TMB: { make: 'Škoda',      country: 'Češka' },
    // Spain
    VSS: { make: 'SEAT',       country: 'Španija' },
};

function generateFromWmi(vin) {
    const wmi = vin.substring(0, 3);
    const mfr = WMI_MAP[wmi];
    if (!mfr) return null;

    // Extract model year from position 9 (VIN standard)
    const yearChar = vin[9];
    const year = yearCharToYear(yearChar);

    return {
        make: mfr.make,
        model: '(model ni znan)',
        year: year || new Date().getFullYear() - 2,
        engineType: 'Ni podatka',
        engineCc: null,
        powerKw: null,
        countryOfOrigin: mfr.country,
        previousOwners: null,   // -1 = unknown
        accidentCount: null,
        accidentSeverity: null,
        hasOpenRecalls: false,
        recallDetails: [],
        serviceHistory: null,
        partial: true,          // flag: some fields missing
    };
}

// VIN model year encoding (position 9)
function yearCharToYear(ch) {
    const map = {
        A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986,
        H: 1987, J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993,
        R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000,
        '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006,
        '7': 2007, '8': 2008, '9': 2009, A2: 2010, B2: 2011, C2: 2012,
        D2: 2013, E2: 2014, F2: 2015, G2: 2016, H2: 2017, J2: 2018,
        K2: 2019, L2: 2020, M2: 2021, N2: 2022, P2: 2023, R2: 2024,
    };
    return map[ch?.toUpperCase()] || null;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
