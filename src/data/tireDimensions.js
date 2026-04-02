// ═══════════════════════════════════════════════════════════════════════════════
// Tire Dimensions Reference Data — MojAvto.si
// All valid tire dimension values and related specifications
// ═══════════════════════════════════════════════════════════════════════════════

export const TIRE_WIDTHS = [125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335, 345, 355];

export const TIRE_HEIGHTS = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];

export const TIRE_DIAMETERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const SPEED_RATINGS = [
    { code: 'N', maxSpeed: 140, label: 'N (140 km/h)' },
    { code: 'P', maxSpeed: 150, label: 'P (150 km/h)' },
    { code: 'Q', maxSpeed: 160, label: 'Q (160 km/h)' },
    { code: 'R', maxSpeed: 170, label: 'R (170 km/h)' },
    { code: 'S', maxSpeed: 180, label: 'S (180 km/h)' },
    { code: 'T', maxSpeed: 190, label: 'T (190 km/h)' },
    { code: 'H', maxSpeed: 210, label: 'H (210 km/h)' },
    { code: 'V', maxSpeed: 240, label: 'V (240 km/h)' },
    { code: 'W', maxSpeed: 270, label: 'W (270 km/h)' },
    { code: 'Y', maxSpeed: 300, label: 'Y (300 km/h)' },
    { code: 'ZR', maxSpeed: 300, label: 'ZR (300+ km/h)' },
];

// Selected common load indices
export const LOAD_INDICES = [
    { index: 71, maxKg: 345 },
    { index: 75, maxKg: 387 },
    { index: 80, maxKg: 450 },
    { index: 82, maxKg: 475 },
    { index: 84, maxKg: 500 },
    { index: 86, maxKg: 530 },
    { index: 88, maxKg: 560 },
    { index: 91, maxKg: 615 },
    { index: 94, maxKg: 670 },
    { index: 95, maxKg: 690 },
    { index: 97, maxKg: 730 },
    { index: 98, maxKg: 750 },
    { index: 100, maxKg: 800 },
    { index: 102, maxKg: 850 },
    { index: 104, maxKg: 900 },
    { index: 107, maxKg: 975 },
    { index: 109, maxKg: 1030 },
    { index: 112, maxKg: 1120 },
];

export const SEASONS = [
    { value: 'letna', label: 'Letne', icon: 'sun' },
    { value: 'zimska', label: 'Zimske', icon: 'snowflake' },
    { value: 'celoletna', label: 'Celoletne', icon: 'cloud-sun' },
];

export const EU_RATINGS = ['A', 'B', 'C', 'D', 'E'];

export const TIRE_BRANDS = [
    'Michelin', 'Continental', 'Bridgestone', 'Goodyear', 'Pirelli',
    'Dunlop', 'Hankook', 'Yokohama', 'Falken', 'Toyo',
    'Kumho', 'Nexen', 'Maxxis', 'Uniroyal', 'BFGoodrich',
    'Firestone', 'Nokian', 'Vredestein', 'Semperit', 'Kleber',
];

// Popular dimensions for quick-select suggestions
export const POPULAR_DIMENSIONS = [
    { width: 195, height: 65, diameter: 15, label: '195/65 R15' },
    { width: 205, height: 55, diameter: 16, label: '205/55 R16' },
    { width: 205, height: 60, diameter: 16, label: '205/60 R16' },
    { width: 215, height: 55, diameter: 17, label: '215/55 R17' },
    { width: 215, height: 65, diameter: 16, label: '215/65 R16' },
    { width: 225, height: 45, diameter: 17, label: '225/45 R17' },
    { width: 225, height: 50, diameter: 17, label: '225/50 R17' },
    { width: 235, height: 45, diameter: 18, label: '235/45 R18' },
    { width: 245, height: 40, diameter: 18, label: '245/40 R18' },
    { width: 255, height: 35, diameter: 19, label: '255/35 R19' },
];

// Build a normalized dimension string for search/matching
export function buildDimensionString(width, height, diameter) {
    return `${width}/${height}R${diameter}`;
}

// Parse dimension string like "205/55R16" or "205-55-r16"
export function parseDimensionString(str) {
    if (!str) return null;
    // Support both 205/55R16 and 205-55-r16 formats
    const normalized = str.toUpperCase().replace(/-/g, '/').replace('/R', 'R');
    const match = normalized.match(/^(\d{3})\/(\d{2,3})R(\d{2})$/);
    if (!match) return null;
    return {
        width: parseInt(match[1]),
        height: parseInt(match[2]),
        diameter: parseInt(match[3]),
    };
}

// Format dimension for URL (205/55R16 → 205-55-r16)
export function dimensionToSlug(width, height, diameter) {
    return `${width}-${height}-r${diameter}`;
}
