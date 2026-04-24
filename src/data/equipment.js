// ═══════════════════════════════════════════════════════════════════════════════
// Equipment data — MojAvto.si
// Single source of truth for equipment/features.
// Values MUST match `name="features"` checkboxes in advanced-search.html
// Used by: create-listing (step 4) + advanced-search filters
// ═══════════════════════════════════════════════════════════════════════════════

export const EQUIPMENT_GROUPS = [
    {
        id: 'varnost',
        label: 'Varnost',
        icon: 'shield-check',
        categories: ['avto'],
        items: [
            { value: 'ABS',       label: 'ABS', icon: 'shield' },
            { value: 'ESP',       label: 'ESP / stabilizacijski sistem', icon: 'activity' },
            { value: 'Alarm',     label: 'Alarmni sistem', icon: 'bell' },
            { value: 'BlindSpot', label: 'Asistenca mrtvega kota', icon: 'eye-off' },
            { value: 'RoadSign',  label: 'Prepoznavanje prometnih znakov', icon: 'signpost' },
            { value: 'LaneDep',   label: 'Opozorilnik zapustitve pasu', icon: 'split' },
            { value: 'LaneAssist',label: 'Asistenca ohranjanja pasu', icon: 'move-horizontal' },
            { value: 'AutoBrake', label: 'Avtomatsko zaviranje (AEB)', icon: 'octagon' },
            { value: 'CrossTraffic', label: 'Opozorilo na prečni promet', icon: 'arrow-left-right' },
            { value: 'Isofix',    label: 'Isofix sistem', icon: 'baby' },
        ],
    },
    {
        id: 'razsvetljava',
        label: 'Razsvetljava',
        icon: 'sun',
        categories: ['avto'],
        items: [
            { value: 'LED',    label: 'LED luči', icon: 'sun' },
            { value: 'Xenon',  label: 'Ksenonski žarometi', icon: 'sparkles' },
            { value: 'Matrix', label: 'Matrični / laserski žarometi', icon: 'lightbulb' },
            { value: 'DRL',    label: 'Dnevne luči (DRL)', icon: 'sun-dim' },
            { value: 'Fog',    label: 'Meglenke', icon: 'cloud-fog' },
            { value: 'AutoHighBeam', label: 'Avtomatske dolge luči', icon: 'sun-medium' },
            { value: 'AmbientLight', label: 'Ambientna osvetlitev', icon: 'sparkles' },
        ],
    },
    {
        id: 'udobje',
        label: 'Udobje',
        icon: 'sofa',
        categories: ['avto'],
        items: [
            { value: 'Climate',        label: 'Klimatska naprava', icon: 'thermometer-snowflake' },
            { value: 'Climate2Zone',   label: 'Dvoconska klima', icon: 'snowflake' },
            { value: 'ElectricSeats',  label: 'Električni sedeži', icon: 'armchair' },
            { value: 'HeatedSeats',    label: 'Ogrevanje sedežev (spredaj)', icon: 'flame' },
            { value: 'HeatedSeatsRear',label: 'Ogrevanje sedežev (zadaj)', icon: 'flame' },
            { value: 'MassageSeats',   label: 'Masažni sedeži', icon: 'waves' },
            { value: 'CooledSeats',    label: 'Hlajenje sedežev', icon: 'snowflake' },
            { value: 'Panorama',       label: 'Panoramska streha', icon: 'layers' },
            { value: 'Sibedah',        label: 'Šibedah / odprta streha', icon: 'maximize-2' },
            { value: 'ElecTrunk',      label: 'Električna prtljažna vrata', icon: 'package' },
            { value: 'HeatedWheel',    label: 'Ogrevani volan', icon: 'circle-dot' },
            { value: 'Keyless',        label: 'Keyless start / vstop', icon: 'key' },
            { value: 'MemorySeats',    label: 'Pomnilnik položaja sedežev', icon: 'save' },
            { value: 'AirSuspension',  label: 'Zračno vzmetenje', icon: 'arrow-up-down' },
            { value: 'Leather',        label: 'Usnje / usnjeno tapetništvo', icon: 'layers' },
            { value: 'Alcantara',      label: 'Alcantara tapetništvo', icon: 'layers' },
            { value: 'SoftClose',      label: 'Soft-close zapiranje vrat', icon: 'door-closed' },
        ],
    },
    {
        id: 'parkiranje',
        label: 'Parkiranje & kamera',
        icon: 'parking-square',
        categories: ['avto'],
        items: [
            { value: 'ParkSensorFront', label: 'Parkirni senzorji (spredaj)', icon: 'radar' },
            { value: 'ParkSensorRear',  label: 'Parkirni senzorji (zadaj)', icon: 'radar' },
            { value: 'RearCamera',      label: 'Vzvratna kamera', icon: 'video' },
            { value: 'Camera360',       label: '360° kamera', icon: 'aperture' },
            { value: 'AutoParking',     label: 'Avtopark / samodejno parkiranje', icon: 'parking-circle' },
        ],
    },
    {
        id: 'multimedija',
        label: 'Multimedija',
        icon: 'monitor-smartphone',
        categories: ['avto'],
        items: [
            { value: 'Navigation',     label: 'Navigacijski sistem', icon: 'map' },
            { value: 'Bluetooth',      label: 'Bluetooth', icon: 'bluetooth' },
            { value: 'Handsfree',      label: 'Prostoročno telefoniranje', icon: 'phone-call' },
            { value: 'CarPlay',        label: 'Apple CarPlay / Android Auto', icon: 'smartphone' },
            { value: 'HifiSound',      label: 'Premium ozvočenje (Bose/Burmester)', icon: 'speaker' },
            { value: 'DigitalCockpit', label: 'Digitalni števec (Virtual Cockpit)', icon: 'layout-dashboard' },
            { value: 'HUD',            label: 'Head-up display', icon: 'target' },
            { value: 'WiFi',           label: 'Vgrajen Wi-Fi / hotspot', icon: 'wifi' },
            { value: 'Wireless',       label: 'Brezžično polnjenje telefona', icon: 'zap' },
        ],
    },
    {
        id: 'asistenti',
        label: 'Asistenčni sistemi',
        icon: 'cpu',
        categories: ['avto'],
        items: [
            { value: 'CruiseControl',     label: 'Tempomat', icon: 'timer' },
            { value: 'AdaptiveCruise',    label: 'Adaptivni tempomat (ACC)', icon: 'timer-reset' },
            { value: 'TrafficJamAssist',  label: 'Asistenca v zastoju', icon: 'users' },
            { value: 'NightVision',       label: 'Nočni vid', icon: 'moon' },
            { value: 'FatigueAlert',      label: 'Opozorilnik utrujenosti', icon: 'coffee' },
            { value: 'TirePressure',      label: 'Senzor tlaka v pnevmatikah', icon: 'gauge' },
        ],
    },
    {
        id: 'prtljaga',
        label: 'Prtljaga & vleka',
        icon: 'package',
        categories: ['avto'],
        items: [
            { value: 'TowBar',       label: 'Kljuka za prikolico', icon: 'anchor' },
            { value: 'RoofRails',    label: 'Strešni nosilci', icon: 'square' },
            { value: 'FoldSeat',     label: 'Zložljivi zadnji sedeži', icon: 'chevron-down' },
        ],
    },
    {
        id: 'garancija',
        label: 'Garancija in servis',
        icon: 'badge-check',
        categories: ['all'],
        items: [
            { value: 'ServiceBook',  label: 'Potrjena servisna knjiga', icon: 'book-open' },
            { value: 'Warranty',     label: 'Z garancijo', icon: 'badge-check' },
            { value: 'NonSmoking',   label: 'Nekadilsko vozilo', icon: 'cigarette-off' },
        ],
    },
    {
        id: 'moto',
        label: 'Moto oprema',
        icon: 'bike',
        categories: ['moto'],
        items: [
            { value: 'MotoABS',        label: 'ABS zavore', icon: 'shield' },
            { value: 'MotoCruise',     label: 'Tempomat', icon: 'timer' },
            { value: 'ElecSuspension', label: 'El. nastavljivo vzmetenje', icon: 'arrow-up-down' },
            { value: 'MotoNavigation', label: 'Navigacija', icon: 'map' },
            { value: 'Panniers',       label: 'Kovček / stranske torbice', icon: 'package' },
            { value: 'SportExhaust',   label: 'Športni izpuh', icon: 'wind' },
            { value: 'TPMS',           label: 'TPMS (senzor tlaka)', icon: 'gauge' },
            { value: 'Quickshifter',   label: 'Quickshifter', icon: 'zap' },
            { value: 'HeatedGrips',    label: 'Ogrevanje ročic', icon: 'flame' },
            { value: 'TractionControl', label: 'Kontrola vleke (TC)', icon: 'activity' },
        ],
    },
    {
        id: 'drugo',
        label: 'Ostalo',
        icon: 'plus-circle',
        categories: ['all'],
        items: [
            { value: 'Kadilski',       label: 'Kadilsko vozilo', icon: 'cigarette' },
            { value: 'Taxi',           label: 'Taksi vozilo', icon: 'taxi' },
            { value: 'DrivingSchool',  label: 'Vozilo avtošole', icon: 'graduation-cap' },
        ],
    }
];

// ── Attribute Icons ───────────────────────────────────────────────────────────
// Icons for common vehicle attributes (fuel, transmission, etc.)
export const ATTRIBUTE_ICONS = {
    // Fuel
    'Bencin': 'fuel',
    'Dizel':  'fuel',
    'Hibrid': 'battery-charging',
    'Elektrika': 'zap',
    'LPG': 'flame',
    'CNG': 'flame',
    'Vodik': 'droplets',
    
    // Transmission
    'Ročni': 'settings-2',
    'Avtomatski': 'box',
    'Sekvenčni': 'move-up',
    'Polavtomatski': 'workflow',
    
    // Drive
    'Spredaj': 'car-front',
    'Zadaj': 'car-front',
    'Štirikolesni (4x4)': 'navigation',
    'FWD (sprednji)': 'arrow-up',
    'RWD (zadnji)': 'arrow-down',
    'AWD / 4x4': 'move',
    '4x4': 'move',
    '4WD': 'move',
    
    // Condition
    'Novo': 'sparkles',
    'Rabljeno': 'history',
    'Testno': 'test-tube-2',
    'Poškodovano': 'alert-triangle',
    'V okvari': 'wrench',
    'Starodobnik': 'calendar',
    'Razstavno vozilo': 'eye',
    'Za dele': 'wrench',
    
    // Color
    'Bela': 'palette',
    'Črna': 'palette',
    'Srebrna': 'palette',
    'Siva': 'palette',
    'Modra': 'palette',
    'Rdeča': 'palette',
    'Zelena': 'palette',
    'Rumena': 'palette',
    'Rjava': 'palette',
    'Oranžna': 'palette',
    'Vijolična': 'palette',
    'Zlata': 'palette',
    'Bronasta': 'palette',
    'Druga': 'palette',

    // Color Type
    'solid': 'palette',
    'metallic': 'sparkles',
    'matte': 'droplet',
    'pearl': 'circle',
    
    // Body types
    'Limuzina': 'car',
    'SUV / Terensko': 'mountain',
    'Karavan': 'layout-template',
    'Kombilimuzina': 'car',
    'Kabriolet': 'sun',
    'Coupe': 'zap',
    'Enoprostorec': 'users',
    'Pick-up': 'truck',
    'Oldtimer': 'history',

    // Euro class
    'Euro 4': 'leaf',
    'Euro 5': 'leaf',
    'Euro 6': 'leaf',
    'Euro 6d': 'leaf',
    'Euro 6d-temp': 'leaf',

    // Owners
    '1. lastnik': 'user-check',
    '2. lastnik': 'user-check',
    '3. lastnik': 'user-check',
    '4. lastnik': 'user-check',
    '5 ali več': 'users',

    // Hybrid Types
    'BencinHibrid': 'battery-charging',
    'DizelHibrid': 'battery-charging',
    'PlugIn': 'plug-zap',
    'MildHibrid': 'zap',

    // Months
    '01': 'calendar', '02': 'calendar', '03': 'calendar', '04': 'calendar',
    '05': 'calendar', '06': 'calendar', '07': 'calendar', '08': 'calendar',
    '09': 'calendar', '10': 'calendar', '11': 'calendar', '12': 'calendar',
    
    // Numbers (Doors, Seats)
    '2': 'door-closed', '3': 'door-closed', '4': 'door-closed', '5': 'door-closed', '6': 'door-closed',
    '2 ': 'armchair', '3 ': 'armchair', '4 ': 'armchair', '5 ': 'armchair', '6 ': 'armchair', '7 ': 'armchair', '8 ': 'armchair', '9 ': 'armchair',
    
    // Misc
    'firstRegistration': 'calendar',
    'mileage': 'gauge',
    'power': 'zap',
    'seats': 'armchair',
    'doors': 'door-closed',
    'co2': 'cloud',
    'emission': 'leaf',
    'vin': 'fingerprint',
    'price': 'banknote',
    'brand': 'car-front',
    'model': 'car',
    'variant': 'file-text',
    'year': 'calendar',
    'engine': 'cpu',
    'cc': 'pipette',
    'transmission': 'settings-2',
    'drive': 'navigation',
    'color': 'palette',
    'registeredUntil': 'calendar-check',
    'towing': 'anchor',
    'battery': 'battery',
    'range': 'map-pin',
    'abs': 'shield',
    'esp': 'activity',
    'airbag': 'user-check',
    'tempomat': 'timer',
    'kamera': 'video',
    'usnje': 'layers',
    'klima': 'thermometer-snowflake',
    'luči': 'sun',
    'nekadilski': 'cigarette-off',
    'kadilski': 'cigarette',
    'servis': 'book-open',
    'garancija': 'badge-check',
    'navigacija': 'map',
};

/**
 * Robust icon lookup for any attribute or equipment item.
 * Searches in ATTRIBUTE_ICONS first, then falls back to EQUIPMENT_GROUPS.
 */
export function getAttributeIcon(key, value) {
    const v = String(value || '').trim();
    const k = String(key || '').trim();

    // 1. Direct match in attribute icons (by value)
    if (ATTRIBUTE_ICONS[v]) return ATTRIBUTE_ICONS[v];
    
    // 2. Direct match in attribute icons (by key)
    if (ATTRIBUTE_ICONS[k]) return ATTRIBUTE_ICONS[k];

    // 3. Search in Equipment Groups (by value or label)
    for (const group of EQUIPMENT_GROUPS) {
        const item = group.items.find(i => 
            i.value === v || 
            i.label === v || 
            i.value === k || 
            i.label === k ||
            i.value.toLowerCase() === v.toLowerCase() ||
            i.label.toLowerCase() === v.toLowerCase()
        );
        if (item && item.icon) return item.icon;
    }

    // 4. Heuristic fallbacks (Slovenian keywords)
    const lowerV = v.toLowerCase();
    const lowerK = k.toLowerCase();

    if (lowerV.includes('km') || lowerK.includes('mileage')) return 'gauge';
    if (lowerV.includes('kw') || lowerV.includes('km (moč)') || lowerK.includes('power')) return 'zap';
    if (lowerV.includes('€') || lowerK.includes('price')) return 'banknote';
    if (lowerV.includes('kamera')) return 'video';
    if (lowerV.includes('tempomat')) return 'timer';
    if (lowerV.includes('usnje')) return 'layers';
    if (lowerV.includes('luči') || lowerV.includes('žarometi')) return 'sun';
    if (lowerV.includes('abs')) return 'shield';
    if (lowerV.includes('esp')) return 'activity';
    if (lowerV.includes('klima')) return 'thermometer-snowflake';
    if (lowerV.includes('nekadilsk')) return 'cigarette-off';
    if (lowerV.includes('kadilsk')) return 'cigarette';
    if (lowerV.includes('servis')) return 'book-open';
    if (lowerV.includes('garancija')) return 'badge-check';
    if (lowerV.includes('navigacija')) return 'map';
    if (lowerV.includes('sedež')) return 'armchair';
    if (lowerV.includes('volan')) return 'circle-dot';
    if (lowerV.includes('vrat')) return 'door-closed';
    if (lowerV.includes('motor')) return 'cpu';
    if (lowerV.includes('radio') || lowerV.includes('avdio') || lowerV.includes('zvok')) return 'speaker';
    if (lowerV.includes('parkirn') || lowerV.includes('senz')) return 'radar';
    if (lowerV.includes('bluetooth')) return 'bluetooth';
    if (lowerV.includes('paket')) return 'package';
    if (lowerV.includes('streha') || lowerV.includes('okno')) return 'layout';

    return 'check';
}


// Get equipment items for a specific category (avto/moto/etc.)
export function getEquipmentForCategory(category) {
    const cat = (category || 'avto').toLowerCase();
    return EQUIPMENT_GROUPS.filter(g =>
        g.categories.includes(cat) || g.categories.includes('all')
    );
}

// Flat list of all values (for search filtering)
export const ALL_EQUIPMENT_VALUES = EQUIPMENT_GROUPS.flatMap(g => g.items.map(i => i.value));

// Lookup: value → label
export function getEquipmentLabel(value) {
    for (const group of EQUIPMENT_GROUPS) {
        const item = group.items.find(i => i.value === value);
        if (item) return item.label;
    }
    return value;
}

// Lookup: value → icon
export function getEquipmentIcon(value) {
    for (const group of EQUIPMENT_GROUPS) {
        const item = group.items.find(i => i.value === value);
        if (item) return item.icon;
    }
    return 'check';
}
